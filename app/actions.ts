"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { generateCaptions } from "@/lib/ai";
import { photoUrl } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { VOICE_KEYS, type VoiceKey } from "@/lib/voices";

export type ActionResult = { ok: boolean; message: string } | null;

const MAX_CAPTION = 300;

function isVoice(value: unknown): value is VoiceKey {
  return typeof value === "string" && (VOICE_KEYS as string[]).includes(value);
}

function cleanContent(value: FormDataEntryValue | null) {
  const text = value?.toString().trim() ?? "";
  if (!text) return { error: "The caption can't be empty." };
  if (text.length > MAX_CAPTION) return { error: `Keep it under ${MAX_CAPTION} characters.` };
  return { text };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** UPDATE: edit a caption's text. */
export async function updateCaption(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const content = cleanContent(formData.get("content"));
  if (!Number.isInteger(id)) return { ok: false, message: "Invalid caption." };
  if (content.error) return { ok: false, message: content.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("captions")
    .update({ content: content.text, model: "edited by admin" })
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, message: error.message };
  if (!data?.length) return { ok: false, message: "Not saved: the database did not allow this edit." };

  revalidatePath("/captions");
  return { ok: true, message: "Saved." };
}

/** DELETE: remove a caption (its votes go with it). */
export async function deleteCaption(id: number): Promise<ActionResult> {
  await requireAdmin();
  if (!Number.isInteger(id)) return { ok: false, message: "Invalid caption." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("captions").delete().eq("id", id).select("id");
  if (error) return { ok: false, message: error.message };
  if (!data?.length) return { ok: false, message: "Not deleted: the database did not allow it." };

  revalidatePath("/captions");
  revalidatePath("/");
  return { ok: true, message: "Deleted." };
}

/** CREATE (by hand): write a caption for a voice the post is missing. */
export async function createCaption(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const postId = Number(formData.get("post_id"));
  const voice = formData.get("voice");
  const content = cleanContent(formData.get("content"));
  if (!Number.isInteger(postId) || !isVoice(voice)) return { ok: false, message: "Pick a post and a voice." };
  if (content.error) return { ok: false, message: content.error };

  const supabase = await createClient();
  const { error } = await supabase.from("captions").insert({
    post_id: postId,
    voice,
    content: content.text,
    prompt: "Written by an admin in the admin area.",
    model: "written by admin",
  });
  if (error) {
    return {
      ok: false,
      message: error.code === "23505" ? "This post already has a caption in that voice." : error.message,
    };
  }

  revalidatePath("/captions");
  return { ok: true, message: "Caption added." };
}

/** CREATE (with AI): ask the model to caption the photo, keep the requested voice. */
export async function generateCaption(postId: number, voice: string): Promise<ActionResult> {
  await requireAdmin();
  if (!Number.isInteger(postId) || !isVoice(voice)) return { ok: false, message: "Pick a post and a voice." };

  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("id, image_path, note")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return { ok: false, message: "That post no longer exists." };

  // The photos bucket is public, so the server can fetch the image directly.
  const response = await fetch(photoUrl(post.image_path));
  if (!response.ok) return { ok: false, message: "Could not load the photo." };
  const image = {
    base64: Buffer.from(await response.arrayBuffer()).toString("base64"),
    mimeType: response.headers.get("content-type") ?? "image/jpeg",
  };

  const generation = await generateCaptions(image, post.note);
  if (!generation.ok) return { ok: false, message: generation.message };

  const { error } = await supabase.from("captions").insert({
    post_id: postId,
    voice,
    content: generation.captions[voice].slice(0, MAX_CAPTION),
    prompt: generation.prompt,
    model: generation.model,
  });
  if (error) {
    return {
      ok: false,
      message: error.code === "23505" ? "This post already has a caption in that voice." : error.message,
    };
  }

  revalidatePath("/captions");
  return { ok: true, message: "AI caption added." };
}
