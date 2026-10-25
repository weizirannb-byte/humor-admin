import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Google sends the user back here (via Supabase) with a one-time `code`.
 * We trade it for a session and go to the dashboard; the admin gate there
 * decides whether this account may actually see anything.
 */
export async function GET(request: NextRequest) {
  const to = (path: string) => NextResponse.redirect(new URL(path, request.url));

  const code = request.nextUrl.searchParams.get("code");
  if (!code) return to("/login?error=cancelled");

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return to("/login?error=exchange");

  return to("/");
}
