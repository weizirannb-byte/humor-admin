import { redirect } from "next/navigation";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type AdminProfile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  is_superadmin: boolean;
};

export type Viewer = { user: User; profile: AdminProfile | null };

/** Who is signed in, and their profile row (once per request). */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, is_superadmin")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile: (data as AdminProfile | null) ?? null };
});

/**
 * The admin gate. Signed out -> /login. Signed in but not an admin -> /denied.
 * Every admin page (through the layout) and every server action calls this.
 */
export async function requireAdmin(): Promise<{ user: User; profile: AdminProfile }> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (!viewer.profile?.is_superadmin) redirect("/denied");
  return { user: viewer.user, profile: viewer.profile };
}

export function personName(p: { first_name: string | null; last_name: string | null; email?: string | null }) {
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
  return name || p.email || "Unnamed";
}
