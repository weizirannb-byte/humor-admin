import { personName } from "@/lib/admin";
import { formatTime, getJokeVotes, getPosts, getProfiles, getVotes } from "@/lib/data";

export const metadata = { title: "Users | Three Takes Admin" };

/** READ users/profiles: everyone who has signed in, with their activity. */
export default async function UsersPage({ searchParams }: PageProps<"/users">) {
  const q = (await searchParams).q;
  const query = typeof q === "string" ? q.trim().toLowerCase() : "";

  const [profiles, posts, votes, jokeVotes] = await Promise.all([getProfiles(), getPosts(), getVotes(), getJokeVotes()]);
  const count = (ids: string[]) => ids.reduce((m, id) => m.set(id, (m.get(id) ?? 0) + 1), new Map<string, number>());
  const postsBy = count(posts.data.map((p) => p.user_id));
  const votesBy = count([...votes.data, ...jokeVotes.data].map((v) => v.user_id));

  const people = profiles.data.filter(
    (p) => !query || `${personName(p)} ${p.email ?? ""}`.toLowerCase().includes(query),
  );

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Users · read only</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Profiles</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {profiles.data.length} {profiles.data.length === 1 ? "person has" : "people have"} signed in to Three Takes.
          </p>
        </div>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search name or email"
            className="w-56 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm placeholder:text-[var(--muted)] focus:border-white/40 focus:outline-none"
          />
          <button className="cursor-pointer rounded-lg border border-white/15 px-3 py-2 text-sm hover:border-white/40">Search</button>
        </form>
      </header>

      {profiles.error && <p role="alert" className="text-sm text-red-300">Could not load profiles: {profiles.error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[var(--surface)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 text-right font-medium">Photos</th>
              <th className="px-4 py-3 text-right font-medium">Votes cast</th>
              <th className="px-4 py-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                <td className="px-4 py-3 font-medium">{personName(p)}</td>
                <td className="px-4 py-3 text-[var(--muted)]">{p.email ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--muted)]">{p.created_at ? formatTime(p.created_at) : "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums">{postsBy.get(p.id) ?? 0}</td>
                <td className="px-4 py-3 text-right tabular-nums">{votesBy.get(p.id) ?? 0}</td>
                <td className="px-4 py-3">
                  {p.is_superadmin ? (
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-black">Admin</span>
                  ) : (
                    <span className="text-xs text-[var(--muted)]">Member</span>
                  )}
                </td>
              </tr>
            ))}
            {people.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--muted)]">No one matches “{query}”.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[var(--muted)]">
        Admin rights can&apos;t be changed here on purpose: only the project owner can set{" "}
        <code className="font-mono">profiles.is_superadmin</code>, in the Supabase SQL Editor.
      </p>
    </div>
  );
}
