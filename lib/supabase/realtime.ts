import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient } from "./client";

const realtimeTables = ["live_matches", "ball_events", "fixtures", "results"] as const;

export function subscribeToCricketRealtime(onChange: () => void): () => void {
  const supabase = getSupabaseClient();
  if (!supabase) return () => undefined;

  const channel = realtimeTables.reduce<RealtimeChannel>(
    (nextChannel, table) =>
      nextChannel.on("postgres_changes", { event: "*", schema: "public", table }, onChange),
    supabase.channel("eagle-box-cricket-realtime")
  );

  channel.subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
