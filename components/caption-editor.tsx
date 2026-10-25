"use client";

import { useActionState, useState, useTransition } from "react";
import { deleteCaption, updateCaption, type ActionResult } from "@/app/actions";

/** UPDATE + DELETE for one caption. */
export function CaptionEditor({ id, content }: { id: number; content: string }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, saving] = useActionState(
    async (prev: ActionResult, formData: FormData) => {
      const result = await updateCaption(prev, formData);
      if (result?.ok) setEditing(false);
      return result;
    },
    null,
  );
  const [deleteState, setDeleteState] = useState<ActionResult>(null);
  const [deleting, startDelete] = useTransition();

  if (editing) {
    return (
      <form action={formAction} className="flex flex-col gap-2">
        <input type="hidden" name="id" value={id} />
        <label className="sr-only" htmlFor={`caption-${id}`}>Caption text</label>
        <textarea
          id={`caption-${id}`}
          name="content"
          defaultValue={content}
          maxLength={300}
          rows={3}
          autoFocus
          className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm focus:border-white/50 focus:outline-none"
        />
        <div className="flex items-center gap-2">
          <button disabled={saving} className="cursor-pointer rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-black disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => setEditing(false)} className="cursor-pointer px-2 text-xs text-[var(--muted)] hover:text-white">
            Cancel
          </button>
          {state && !state.ok && <span role="alert" className="text-xs text-red-300">{state.message}</span>}
        </div>
      </form>
    );
  }

  return (
    <div>
      <p className="text-[15px] leading-snug">{content}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
        <button onClick={() => { setEditing(true); setConfirming(false); }} className="cursor-pointer text-[var(--muted)] hover:text-white">
          Edit
        </button>
        {confirming ? (
          <>
            <button
              disabled={deleting}
              onClick={() => startDelete(async () => setDeleteState(await deleteCaption(id)))}
              className="cursor-pointer rounded-full bg-[var(--down)] px-2.5 py-1 font-semibold text-black disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Yes, delete it and its votes"}
            </button>
            <button onClick={() => setConfirming(false)} className="cursor-pointer text-[var(--muted)] hover:text-white">Keep</button>
          </>
        ) : (
          <button onClick={() => setConfirming(true)} className="cursor-pointer text-[var(--muted)] hover:text-[var(--down)]">
            Delete
          </button>
        )}
        {state?.ok && <span role="status" className="text-[var(--muted)]">Saved.</span>}
        {deleteState && !deleteState.ok && <span role="alert" className="text-red-300">{deleteState.message}</span>}
      </div>
    </div>
  );
}
