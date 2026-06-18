import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type StorageMode = "supabase" | "localStorage";

export interface DataSourceStatus {
  mode: StorageMode;
  label: string;
  description: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let browserClient: SupabaseClient | null = null;

export function getStorageMode(): StorageMode {
  return supabaseUrl && supabaseKey ? "supabase" : "localStorage";
}

export function isSupabaseConfigured(): boolean {
  return getStorageMode() === "supabase";
}

export function createBrowserSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseKey) return null;

  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseKey);
  }

  return browserClient;
}

export const getSupabaseClient = createBrowserSupabaseClient;

export function getDataSourceStatus(): DataSourceStatus {
  if (isSupabaseConfigured()) {
    return {
      mode: "supabase",
      label: "Database: Supabase",
      description: "Supabase PostgreSQL sync is enabled with local demo fallback."
    };
  }

  return {
    mode: "localStorage",
    label: "Database: Local demo storage",
    description: "Supabase keys are missing, so the app uses browser localStorage."
  };
}
