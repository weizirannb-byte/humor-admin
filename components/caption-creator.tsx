"use client";

import { useActionState, useState, useTransition } from "react";
import { createCaption, generateCaption, type ActionResult } from "@/app/actions";

/** CREATE a caption for a voice this photo is missing: with AI, or by hand. */
export function CaptionCreator({ postId, voice, voiceLabel }: { postId: number; voice: string; voiceLabel: string }) {
  const [writing, setWriting] = useState(false);
  const [aiState, setAiState] = useState<ActionResult>(null);
  const [generating, startGenerate] = useTransition();
  const [state, formAction, saving] = useActionState(createCaption, null);

  if (writing) {
    return (
      <form action={formAction} className="flex flex-col gap-2">
        <input type="hidden" name="post_id" value={postId} />
        <input type="hidden" name="voice" value={voice} />
        <label className="sr-only" htmlFor={`new-${postId}-${voice}`}>New {voiceLabel} caption</label>
        <textarea
          id={`new-${postId}-${voice}`}
          name="content"
          maxLength={300}
          rows={3}
          autoFocus
          placeholder={`Write a ${voiceLabel} caption…`}
          className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm placeholder:text-[var(--muted)] focus:border-white/50 focus:outline-none"
        />
        <div className="flex items-center gap-2">
          <button disabled={saving} className="cursor-pointer rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-black disabled:opacity-50">
            {saving ? "Adding…" : "Add caption"}
          </button>
          <button type="button" onClick={() => setWriting(false)} className="cursor-pointer px-2 text-xs text-[var(--muted)] hover:text-white">
            Cancel
          </button>
          {state && !state.ok && <span role="alert" className="text-xs text-red-300">{state.message}</span>}
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-[var(--muted)]">No caption in this voice.</span>
      <button
        disabled={generating}
        onClick={() => startGenerate(async () => setAiState(await generateCaption(postId, voice)))}
        className="cursor-pointer rounded-full bg-white px-3 py-1.5 font-semibold text-black disabled:cursor-wait disabled:opacity-60"
      >
        {generating ? "AI is writing…" : "✨ Generate with AI"}
      </button>
      <button onClick={() => setWriting(true)} className="cursor-pointer rounded-full border border-white/20 px-3 py-1.5 hover:border-white/45">
        Write it myself
      </button>
      {aiState && !aiState.ok && <span role="alert" className="text-red-300">{aiState.message}</span>}
    </div>
  );
}
