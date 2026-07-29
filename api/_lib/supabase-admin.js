import { createClient } from "@supabase/supabase-js";
import { HttpError } from "./http.js";

let client;

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new HttpError(503, "Supabase server credentials are not configured");
  client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export async function assertAdmin(request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "Authentication required");
  const supabase = getSupabaseAdmin();
  const { data: auth, error: authError } = await supabase.auth.getUser(token);
  if (authError || !auth.user) throw new HttpError(401, "Invalid session");
  const { data: profile, error } = await supabase.from("profiles").select("id, role, status").eq("id", auth.user.id).single();
  if (error || profile?.role !== "admin" || profile.status !== "active") throw new HttpError(403, "Admin access required");
  return profile;
}
