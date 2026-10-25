import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { getViewer } from "@/lib/admin";

export const metadata = { title: "Sign in | Three Takes Admin" };

const ERRORS: Record<string, string> = {
  cancelled: "Sign-in was cancelled or the link expired. Please try again.",
  exchange: "Google sign-in could not be completed. Please try again.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getViewer()) redirect("/");
  const { error } = await searchParams;
  const message = typeof error === "string" ? ERRORS[error] : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[var(--surface)] p-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Restricted</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Three Takes Admin</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Sign in with Google. Only accounts marked as admins in the database can get in.
        </p>
        {message && (
          <p role="alert" className="mt-5 rounded-lg border border-red-400/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-200">
            {message}
          </p>
        )}
        <div className="mt-6">
          <GoogleSignInButton />
        </div>
      </div>
    </main>
  );
}
