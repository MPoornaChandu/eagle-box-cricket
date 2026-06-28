"use client";

import { useCallback, useEffect, useState } from "react";
import type { LeagueSnapshot } from "@/lib/leagueTypes";
import {
  calculatePointsTable,
  getLiveMatch,
  getMatches,
  getPlayers,
  getResults,
  getTeams,
  hydrateLeagueSnapshotFromSupabase,
  subscribeLeagueUpdates
} from "@/lib/leagueStorage";

export function readLeagueSnapshot(): LeagueSnapshot {
  const teams = getTeams();
  const players = getPlayers();
  const matches = getMatches();
  return {
    teams,
    players,
    matches,
    results: getResults(),
    pointsTable: calculatePointsTable(teams, matches),
    liveMatch: getLiveMatch()
  };
}

export function useLeagueData(pollMs = 5000) {
  const [snapshot, setSnapshot] = useState<LeagueSnapshot>({
    teams: [],
    players: [],
    matches: [],
    results: [],
    pointsTable: []
  });

  const refresh = useCallback(() => {
    setSnapshot(readLeagueSnapshot());
  }, []);

  useEffect(() => {
    refresh();
    void hydrateLeagueSnapshotFromSupabase().then((loaded) => {
      if (loaded) refresh();
    });
    const unsubscribe = subscribeLeagueUpdates(refresh);
    const timer = window.setInterval(refresh, pollMs);
    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [pollMs, refresh]);

  return { ...snapshot, refresh };
}
