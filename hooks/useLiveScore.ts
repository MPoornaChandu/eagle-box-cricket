"use client";

import { useCallback, useEffect, useState } from "react";
import type { LeagueSnapshot } from "@/lib/leagueTypes";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  applySupabaseLiveToSnapshot,
  fetchRecentBallEvents,
  formatSupabaseError,
  getActiveLiveMatch,
  type SupabaseBallEventRow,
  type SupabaseLiveMatchRow
} from "@/lib/supabase/liveScore";

export function useLiveScore(pollMs = 5000) {
  const [liveMatch, setLiveMatch] = useState<SupabaseLiveMatchRow | null>(null);
  const [ballEvents, setBallEvents] = useState<SupabaseBallEventRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const refetchLiveScore = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setLoading(true);
    setError("");
    try {
      const activeLiveMatch = await getActiveLiveMatch();
      setLiveMatch(activeLiveMatch);
      if (activeLiveMatch?.id) {
        setBallEvents(await fetchRecentBallEvents(activeLiveMatch.id));
      } else {
        setBallEvents([]);
      }
    } catch (liveScoreError) {
      console.error("Supabase live score error:", formatSupabaseError(liveScoreError), liveScoreError);
      setError(formatSupabaseError(liveScoreError));
    } finally {
      setLoading(false);
    }
  }, []);

  const refetchRecentBallEvents = useCallback(async () => {
    if (!isSupabaseConfigured() || !liveMatch?.id) return;
    try {
      setBallEvents(await fetchRecentBallEvents(liveMatch.id));
    } catch (liveScoreError) {
      console.error("Supabase live score error:", formatSupabaseError(liveScoreError), liveScoreError);
      setError(formatSupabaseError(liveScoreError));
    }
  }, [liveMatch?.id]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    void refetchLiveScore();

    const channel = supabase
      .channel("live-score")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_matches" },
        (payload) => {
          console.log("Realtime live_matches payload", payload);
          void refetchLiveScore();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ball_events" },
        (payload) => {
          console.log("Realtime ball_events payload", payload);
          void refetchRecentBallEvents();
        }
      )
      .subscribe((status) => console.log("Realtime status", status));

    const timer = window.setInterval(() => void refetchLiveScore(), pollMs);

    return () => {
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [pollMs, refetchLiveScore, refetchRecentBallEvents]);

  return {
    liveMatch,
    ballEvents,
    error,
    loading,
    refetchLiveScore
  };
}

export function applyLiveScoreToLeagueSnapshot(
  snapshot: LeagueSnapshot,
  liveMatch?: SupabaseLiveMatchRow | null,
  ballEvents: SupabaseBallEventRow[] = []
) {
  return applySupabaseLiveToSnapshot(snapshot, liveMatch, ballEvents);
}
