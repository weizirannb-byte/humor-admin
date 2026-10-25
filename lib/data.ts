import { createClient } from "@/lib/supabase/server";

/*
 * Every query here runs as the signed-in admin. The database's RLS policies
 * ("Admins can read all ...") are what let these return other people's rows;
 * for anyone else the same queries would return only their own.
 */

export type ProfileRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  is_superadmin: boolean;
  created_at: string | null;
};
export type PostRow = {
  id: number;
  user_id: string;
  author_name: string;
  image_path: string;
  note: string | null;
  ai_location: string | null;
  created_at: string;
};
export type CaptionRow = {
  id: number;
  post_id: number;
  user_id: string;
  voice: string;
  content: string;
  model: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
};
export type VoteRow = { id: number; caption_id: number; user_id: string; vote: number; created_at: string };
export type JokeRow = { id: number; setup: string; punchline: string; upvotes: number; downvotes: number };
export type JokeVoteRow = { id: number; joke_id: number; user_id: string; vote: number; created_at: string };

const LIMIT = 5000; // far above today's data; keeps one page from loading forever

async function rows<T>(
  table: string,
  columns: string,
  order: string,
  ascending = false,
): Promise<{ data: T[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from(table).select(columns).order(order, { ascending }).limit(LIMIT);
  return { data: (data ?? []) as T[], error: error?.message ?? null };
}

export const getProfiles = () =>
  rows<ProfileRow>("profiles", "id, email, first_name, last_name, is_superadmin, created_at", "created_at");
export const getPosts = () =>
  rows<PostRow>("posts", "id, user_id, author_name, image_path, note, ai_location, created_at", "created_at");
export const getCaptions = () =>
  rows<CaptionRow>("captions", "id, post_id, user_id, voice, content, model, upvotes, downvotes, created_at", "id");
export const getVotes = () =>
  rows<VoteRow>("caption_votes", "id, caption_id, user_id, vote, created_at", "created_at");
export const getJokes = () => rows<JokeRow>("jokes", "id, setup, punchline, upvotes, downvotes", "id", true);
export const getJokeVotes = () =>
  rows<JokeVoteRow>("joke_votes", "id, joke_id, user_id, vote, created_at", "created_at");

export function photoUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${path}`;
}

/** "Oct 24, 3:05 PM" in New York time. */
export function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
}
