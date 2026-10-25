import { redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import { getViewer } from "@/lib/admin";

export const metadata = { title: "No access | Three Takes Admin" };

/** Signed in, but the profile is not marked is_superadmin. */
export default async function DeniedPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (viewer.profile?.is_superadmin) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[var(--surface)] p-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--down)]">403 · Not an admin</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">You don&apos;t have access</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          You&apos;re signed in as <span className="text-[var(--foreground)]">{viewer.user.email}</span>, but this
          account is not an admin. Admin access is granted by the project owner in the database
          (<code className="font-mono text-xs">profiles.is_superadmin</code>); it can&apos;t be requested here.
        </p>
        <form action={signOut} className="mt-6">
          <button type="submit" className="cursor-pointer rounded-full border border-white/20 px-4 py-2 text-sm font-semibold hover:border-white/45">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
