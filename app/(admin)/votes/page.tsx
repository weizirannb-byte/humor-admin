import Link from "next/link";
import { VoiceTag } from "@/components/voice-tag";
import { personName } from "@/lib/admin";
import { formatTime, getCaptions, getJokes, getJokeVotes, getProfiles, getVotes } from "@/lib/data";

export const metadata = { title: "Votes | Three Takes Admin" };

const TABS = [
  { key: "captions", label: "Caption votes" },
  { key: "jokes", label: "Joke votes" },
] as const;
const FILTERS = [
  { key: "all", label: "All" },
  { key: "up", label: "▲ Up" },
  { key: "down", label: "▼ Down" },
] as const;

function VoteBadge({ vote }: { vote: number }) {
  return vote > 0 ? (
    <span className="whitespace-nowrap font-semibold text-[var(--up)]">▲ Up</span>
  ) : (
    <span className="whitespace-nowrap font-semibold text-[var(--down)]">▼ Down</span>
  );
}

/** READ upvotes/downvotes: every vote, newest first. */
export default async function VotesPage({ searchParams }: PageProps<"/votes">) {
  const params = await searchParams;
  const tab = params.tab === "jokes" ? "jokes" : "captions";
  const filter = params.filter === "up" || params.filter === "down" ? params.filter : "all";
  const keep = (vote: number) => filter === "all" || (filter === "up" ? vote > 0 : vote < 0);

  const [profiles, votes, captions, jokeVotes, jokes] = await Promise.all([
    getProfiles(),
    getVotes(),
    getCaptions(),
    getJokeVotes(),
    getJokes(),
  ]);
  const people = new Map(profiles.data.map((p) => [p.id, personName(p)]));
  const captionById = new Map(captions.data.map((c) => [c.id, c]));
  const jokeById = new Map(jokes.data.map((j) => [j.id, j]));

  const list = tab === "captions" ? votes.data : jokeVotes.data;
  const shown = list.filter((v) => keep(v.vote));
  const ups = list.filter((v) => v.vote > 0).length;
  const error = (tab === "captions" ? votes.error : jokeVotes.error) ?? profiles.error;
  const href = (next: { tab?: string; filter?: string }) =>
    `/votes?tab=${next.tab ?? tab}&filter=${next.filter ?? filter}`;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Votes · read only</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Upvotes &amp; downvotes</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {list.length} {tab === "captions" ? "caption" : "joke"} votes: {ups} up, {list.length - ups} down.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={href({ tab: t.key })}
            aria-current={tab === t.key ? "page" : undefined}
            className={`rounded-full border px-3.5 py-1.5 text-sm ${tab === t.key ? "border-white bg-white font-semibold text-black" : "border-white/15 text-[var(--muted)] hover:text-white"}`}
          >
            {t.label}
          </Link>
        ))}
        <span className="mx-2 h-5 w-px bg-white/15" aria-hidden />
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={href({ filter: f.key })}
            aria-current={filter === f.key ? "true" : undefined}
            className={`rounded-full px-3 py-1.5 text-sm ${filter === f.key ? "bg-white/15 text-white" : "text-[var(--muted)] hover:text-white"}`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {error && <p role="alert" className="text-sm text-red-300">Could not load votes: {error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[var(--surface)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Voter</th>
              <th className="px-4 py-3 font-medium">Vote</th>
              <th className="px-4 py-3 font-medium">{tab === "captions" ? "Caption" : "Joke"}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((v) => {
              const caption = "caption_id" in v ? captionById.get(v.caption_id) : undefined;
              const joke = "joke_id" in v ? jokeById.get(v.joke_id) : undefined;
              return (
                <tr key={v.id} className="border-b border-white/5 align-top last:border-0 hover:bg-white/[0.03]">
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--muted)]">{formatTime(v.created_at)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{people.get(v.user_id) ?? "Unknown"}</td>
                  <td className="px-4 py-3"><VoteBadge vote={v.vote} /></td>
                  <td className="max-w-md px-4 py-3">
                    {caption ? (
                      <>
                        <p className="line-clamp-2">{caption.content}</p>
                        <div className="mt-1 flex items-center gap-3">
                          <VoiceTag voice={caption.voice} />
                          <Link href={`/captions?post=${caption.post_id}`} className="text-xs text-[var(--muted)] hover:text-white">
                            Photo #{caption.post_id} →
                          </Link>
                        </div>
                      </>
                    ) : joke ? (
                      <p className="line-clamp-2">{joke.setup} <span className="text-[var(--muted)]">{joke.punchline}</span></p>
                    ) : (
                      <span className="text-[var(--muted)]">Deleted</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {shown.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[var(--muted)]">No votes here yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
