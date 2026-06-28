import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "./client";

export async function getCurrentSupabaseUser(): Promise<User | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = getSupabaseClient();
  const user = await getCurrentSupabaseUser();
  if (!supabase || !user) return false;

  const { data, error } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return !error && Boolean(data);
}
