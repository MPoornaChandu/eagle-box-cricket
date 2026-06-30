"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ChevronDown, RotateCcw, Save, SquareCheckBig } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AdminShell } from "@/components/league/AdminShell";
import { LiveScorePanel } from "@/components/league/LeagueCards";
import { useToast } from "@/components/ToastProvider";
import type { BallEvent, BallEventType, Match, Player, Team } from "@/lib/leagueTypes";
import {
  ballsToOvers,
  completeLiveMatch,
  endCurrentInnings,
  getLiveMatch,
  getMatches,
  getPlayers,
  getTeam,
  getTeams,
  manualLiveCorrection,
  playersForTeam,
  recordBallEvent,
  startLiveMatch,
  undoLastBall
} from "@/lib/leagueStorage";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  applySupabaseBallUpdate,
  formatSupabaseError,
  getLiveMatchByFixture,
  startSupabaseLiveMatch,
  type SupabaseLiveMatchRow,
  updateSupabaseLiveMatch
} from "@/lib/supabase/liveScore";

const eventButtons: Array<{ label: string; type: BallEventType; value: number }> = [
  { label: "0", type: "run", value: 0 },
  { label: "1", type: "run", value: 1 },
  { label: "2", type: "run", value: 2 },
  { label: "3", type: "run", value: 3 },
  { label: "4", type: "four", value: 4 },
  { label: "6", type: "six", value: 6 },
  { label: "Wicket", type: "wicket", value: 0 },
  { label: "Wide", type: "wide", value: 0 },
  { label: "No ball", type: "no-ball", value: 0 },
  { label: "Bye", type: "bye", value: 1 },
  { label: "Leg bye", type: "leg-bye", value: 1 }
];

const SYNC_TIMEOUT_MS = 6000;
const SLOW_SYNC_MESSAGE = "Score saved locally, Supabase is taking longer than expected. Check connection.";
const dismissalTypes = ["Bowled", "Caught", "LBW", "Run Out", "Stumped", "Hit Wicket", "Retired"];
const fielderDismissals = new Set(["Caught", "Run Out", "Stumped"]);

export default function AdminLiveScorePage() {
  const { showToast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [battingTeamId, setBattingTeamId] = useState("");
  const [strikerId, setStrikerId] = useState("");
  const [nonStrikerId, setNonStrikerId] = useState("");
  const [bowlerId, setBowlerId] = useState("");
  const [manual, setManual] = useState({ runs: 0, wickets: 0, balls: 0 });
  const [syncError, setSyncError] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const [supabaseSummary, setSupabaseSummary] = useState("");
  const [supabaseLiveMatch, setSupabaseLiveMatch] = useState<SupabaseLiveMatchRow | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [wicketOpen, setWicketOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [wicketForm, setWicketForm] = useState({ dismissalType: "Bowled", fielderId: "", newBatsmanId: "" });

  const load = () => {
    const nextTeams = getTeams();
    const nextPlayers = getPlayers();
    const nextMatches = getMatches();
    const live = getLiveMatch();
    setTeams(nextTeams);
    setPlayers(nextPlayers);
    setMatches(nextMatches);
    const defaultMatch = live ?? nextMatches.find((match) => match.status !== "completed") ?? nextMatches[0];
    setSelectedMatchId((current) => current || defaultMatch?.id || "");
    setBattingTeamId((current) => current || defaultMatch?.live?.battingTeamId || defaultMatch?.teamAId || "");
    setStrikerId((current) => current || defaultMatch?.live?.strikerId || "");
    setNonStrikerId((current) => current || defaultMatch?.live?.nonStrikerId || "");
    setBowlerId((current) => current || defaultMatch?.live?.bowlerId || "");
    if (defaultMatch?.live) setManual({ runs: defaultMatch.live.runs, wickets: defaultMatch.live.wickets, balls: defaultMatch.live.balls });
  };
  useEffect(load, []);

  const selectedMatch = matches.find((match) => match.id === selectedMatchId);
  const battingPlayers = battingTeamId ? playersForTeam(battingTeamId, players) : [];
  const bowlingTeamId = selectedMatch ? (selectedMatch.teamAId === battingTeamId ? selectedMatch.teamBId : selectedMatch.teamAId) : "";
  const bowlingPlayers = bowlingTeamId ? playersForTeam(bowlingTeamId, players) : [];
  const liveMatch = getLiveMatch();
  const liveState = selectedMatch?.live;
  const currentInnings = selectedMatch?.innings.find((innings) => innings.teamId === liveState?.battingTeamId);
  const availableNewBatsmen = battingPlayers.filter((player) => {
    if (player.id === liveState?.strikerId || player.id === liveState?.nonStrikerId) return false;
    return !currentInnings?.batting.find((line) => line.playerId === player.id && line.out);
  });
  const showFielderInput = fielderDismissals.has(wicketForm.dismissalType);

  useEffect(() => {
    if (!strikerId && battingPlayers[0]) setStrikerId(battingPlayers[0].id);
    if (!nonStrikerId && battingPlayers[1]) setNonStrikerId(battingPlayers[1].id);
    if (!bowlerId && bowlingPlayers[1]) setBowlerId(bowlingPlayers[1].id);
  }, [battingPlayers, bowlingPlayers, bowlerId, nonStrikerId, strikerId]);

  const errorMessage = (error: unknown) => formatSupabaseError(error);

  const updateSupabaseSummary = (row?: SupabaseLiveMatchRow | null) => {
    if (!row) return;
    setSupabaseLiveMatch(row);
    setSupabaseSummary(`${row.runs ?? 0}/${row.wickets ?? 0} in ${ballsToOvers(row.balls ?? 0)}`);
  };

  const showScoringToast = (type: BallEventType, value: number) => {
    if (type === "wicket") {
      showToast({ type: "error", title: "Wicket recorded" });
      return;
    }
    if (type === "wide" || type === "no-ball" || type === "bye" || type === "leg-bye") {
      showToast({ type: "warning", title: `${type === "no-ball" ? "No-ball" : type.replace("-", " ")} added` });
      return;
    }
    const runs = type === "four" ? 4 : type === "six" ? 6 : value;
    showToast({ type: "success", title: `${runs} run${runs === 1 ? "" : "s"} added` });
  };

  async function runSupabaseRequest<T>(operation: () => Promise<T>) {
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      setSyncing(false);
      setSyncMessage(SLOW_SYNC_MESSAGE);
    }, SYNC_TIMEOUT_MS);

    try {
      const data = await operation();
      return { data, timedOut };
    } finally {
      window.clearTimeout(timeoutId);
      setSyncing(false);
    }
  }

  const applyLocalMatch = (match?: Match) => {
    if (!match?.live) return;
    setMatches((current) => current.map((item) => (item.id === match.id ? match : item)));
    setManual({ runs: match.live.runs, wickets: match.live.wickets, balls: match.live.balls });
  };

  const syncLiveMatch = async (match?: Match) => {
    if (!match?.live) throw new Error("No active live match to sync.");
    const data = await startSupabaseLiveMatch({ match, teams, players });
    updateSupabaseSummary(data);
    return data;
  };

  const start = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSyncError("");
    setSyncMessage("");
    try {
      const match = startLiveMatch(selectedMatchId, battingTeamId, strikerId, nonStrikerId, bowlerId);
      load();
      if (isSupabaseConfigured()) {
        setSyncing(true);
        const { timedOut } = await runSupabaseRequest(() => syncLiveMatch(match));
        if (!timedOut) setSyncMessage("Started match and created/updated Supabase live_matches.");
      } else {
        setSyncMessage("Supabase is not configured, so live score is saved locally.");
      }
    } catch (error) {
      console.error("Supabase live score error:", formatSupabaseError(error), error);
      setSyncError(errorMessage(error));
    } finally {
      setSyncing(false);
      load();
    }
  };

  const addEvent = async (type: BallEventType, value: number, wicketDetails?: BallEvent["wicketDetails"]) => {
    setSyncError("");
    setSyncMessage("");
    try {
      const match = recordBallEvent(selectedMatchId, type, value, { syncSnapshot: false, wicketDetails });
      const event = match.live?.commentary[0];
      applyLocalMatch(match);
      showScoringToast(type, value);
      if (isSupabaseConfigured()) {
        setSyncing(true);
        const { data: result, timedOut } = await runSupabaseRequest(() =>
          applySupabaseBallUpdate({ match, event, currentLiveMatch: supabaseLiveMatch })
        );
        updateSupabaseSummary(result.liveMatch);
        if (!timedOut) setSyncMessage("Inserted ball_events row and updated Supabase live_matches.");
      } else {
        setSyncMessage("Supabase is not configured, so ball event is saved locally.");
      }
    } catch (error) {
      console.error("Supabase live score error:", formatSupabaseError(error), error);
      setSyncError(errorMessage(error));
    } finally {
      setSyncing(false);
    }
  };

  const applyManual = async () => {
    setSyncError("");
    setSyncMessage("");
    try {
      const match = manualLiveCorrection(selectedMatchId, manual);
      load();
      if (isSupabaseConfigured()) {
        if (!match?.live) throw new Error("No active live match to sync.");
        setSyncing(true);
        const { data: result, timedOut } = await runSupabaseRequest(() =>
          applySupabaseBallUpdate({ match, currentLiveMatch: supabaseLiveMatch })
        );
        updateSupabaseSummary(result.liveMatch);
        if (!timedOut) setSyncMessage("Manual correction updated Supabase live_matches.");
      } else {
        setSyncMessage("Supabase is not configured, so live score is saved locally.");
      }
    } catch (error) {
      console.error("Supabase live score error:", formatSupabaseError(error), error);
      setSyncError(errorMessage(error));
    } finally {
      setSyncing(false);
      load();
    }
  };

  const undo = async () => {
    setSyncError("");
    setSyncMessage("");
    try {
      const match = undoLastBall();
      load();
      if (isSupabaseConfigured()) {
        if (!match?.live) throw new Error("No active live match to sync.");
        setSyncing(true);
        const { data: result, timedOut } = await runSupabaseRequest(() =>
          applySupabaseBallUpdate({ match, currentLiveMatch: supabaseLiveMatch })
        );
        updateSupabaseSummary(result.liveMatch);
        if (!timedOut) setSyncMessage("Undo updated Supabase live_matches.");
      } else {
        setSyncMessage("Supabase is not configured, so live score is saved locally.");
      }
    } catch (error) {
      console.error("Supabase live score error:", formatSupabaseError(error), error);
      setSyncError(errorMessage(error));
    } finally {
      setSyncing(false);
      load();
    }
  };

  const endInnings = async () => {
    setSyncError("");
    setSyncMessage("");
    try {
      const match = endCurrentInnings(selectedMatchId);
      load();
      if (isSupabaseConfigured()) {
        if (!match?.live) throw new Error("No active live match to sync.");
        setSyncing(true);
        const { data: result, timedOut } = await runSupabaseRequest(() =>
          applySupabaseBallUpdate({ match, currentLiveMatch: supabaseLiveMatch })
        );
        updateSupabaseSummary(result.liveMatch);
        if (!timedOut) setSyncMessage("New innings updated Supabase live_matches.");
      } else {
        setSyncMessage("Supabase is not configured, so live score is saved locally.");
      }
    } catch (error) {
      console.error("Supabase live score error:", formatSupabaseError(error), error);
      setSyncError(errorMessage(error));
    } finally {
      setSyncing(false);
      load();
    }
  };

  const complete = async () => {
    setSyncError("");
    setSyncMessage("");
    try {
      completeLiveMatch(selectedMatchId);
      load();
      if (isSupabaseConfigured()) {
        setSyncing(true);
        const { data: liveRow, timedOut } = await runSupabaseRequest(async () => {
          const currentLiveRow = await getLiveMatchByFixture(selectedMatchId);
          return currentLiveRow ? updateSupabaseLiveMatch(currentLiveRow.id, { status: "completed" }) : null;
        });
        updateSupabaseSummary(liveRow);
        if (!timedOut) setSyncMessage("Match completed.");
      } else {
        setSyncMessage("Match completed.");
      }
    } catch (error) {
      console.error("Supabase live score error:", formatSupabaseError(error), error);
      setSyncError(errorMessage(error));
    } finally {
      setSyncing(false);
      load();
    }
  };

  const submitWicket = async () => {
    if (!wicketForm.newBatsmanId && availableNewBatsmen.length) {
      setSyncError("Select the new batsman before recording the wicket.");
      return;
    }
    setWicketOpen(false);
    await addEvent("wicket", 0, {
      dismissalType: wicketForm.dismissalType,
      fielderId: showFielderInput ? wicketForm.fielderId || undefined : undefined,
      newBatsmanId: wicketForm.newBatsmanId || undefined
    });
    setWicketForm({ dismissalType: "Bowled", fielderId: "", newBatsmanId: "" });
  };

  const liveSummary = useMemo(() => {
    const live = getLiveMatch()?.live;
    return live ? `${live.runs}/${live.wickets} in ${ballsToOvers(live.balls)}` : "No live score";
  }, [matches]);

  return (
    <AdminShell>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-red-200">Ball-by-ball</p>
      <h1 className="mt-2 text-4xl font-black text-white">Live Scoring</h1>
      <section className="mt-6 grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
        <div className="grid gap-6">
          <form onSubmit={start} className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
            <h2 className="text-2xl font-black text-white">Start match</h2>
            <div className="mt-4 grid gap-4">
              <label className="field-label">Select match<select value={selectedMatchId} onChange={(event) => setSelectedMatchId(event.target.value)}>{matches.map((match) => <option key={match.id} value={match.id}>{match.matchNumber} - {getTeam(match.teamAId, teams)?.shortCode} vs {getTeam(match.teamBId, teams)?.shortCode}</option>)}</select></label>
              <label className="field-label">Batting team<select value={battingTeamId} onChange={(event) => { setBattingTeamId(event.target.value); setStrikerId(""); setNonStrikerId(""); setBowlerId(""); }}>{selectedMatch ? [selectedMatch.teamAId, selectedMatch.teamBId].map((teamId) => <option key={teamId} value={teamId}>{getTeam(teamId, teams)?.name}</option>) : null}</select></label>
              <label className="field-label">Striker<select value={strikerId} onChange={(event) => setStrikerId(event.target.value)}>{battingPlayers.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select></label>
              <label className="field-label">Non-striker<select value={nonStrikerId} onChange={(event) => setNonStrikerId(event.target.value)}>{battingPlayers.map((player) => <option key={player.id} value={player.id} disabled={player.id === strikerId}>{player.name}</option>)}</select></label>
              <label className="field-label">Bowler<select value={bowlerId} onChange={(event) => setBowlerId(event.target.value)}>{bowlingPlayers.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select></label>
            </div>
            <button type="submit" className="premium-button mt-5 px-4 py-3 text-sm">Start Match</button>
          </form>
          <section className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
            <h2 className="text-2xl font-black text-white">Add ball event</h2>
            <p className="mt-1 text-sm font-bold text-slate-400">{liveSummary}</p>
            {syncing ? <p className="mt-3 text-sm font-bold text-emerald-200">Syncing...</p> : null}
            {syncMessage ? <p className="mt-3 text-sm font-bold text-emerald-200">{syncMessage}</p> : null}
            {supabaseSummary ? <p className="mt-2 text-sm font-bold text-slate-300">Supabase saved score: {supabaseSummary}</p> : null}
            {syncError ? <p className="mt-3 rounded-lg border border-red-300/30 bg-red-500/10 p-3 text-sm font-bold text-red-200">{syncError}</p> : null}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {eventButtons.map((event) => (
                <button
                  key={event.label}
                  type="button"
                  disabled={syncing}
                  onClick={() => event.type === "wicket" ? setWicketOpen(true) : void addEvent(event.type, event.value)}
                  className={event.type === "wicket" ? "danger-button px-3 py-3 text-sm font-black" : "secondary-button px-3 py-3 text-sm font-black"}
                >
                  {event.label}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <button type="button" onClick={undo} className="secondary-button inline-flex items-center justify-center gap-2 px-3 py-3 text-sm font-black"><RotateCcw className="h-4 w-4" />Undo Last Ball</button>
              <button type="button" onClick={endInnings} className="secondary-button px-3 py-3 text-sm font-black">End Innings</button>
              <button type="button" onClick={() => setCompleteOpen(true)} className="premium-button inline-flex items-center justify-center gap-2 px-3 py-3 text-sm"><SquareCheckBig className="h-4 w-4" />Complete Match</button>
            </div>
          </section>
          <section className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
            <button type="button" onClick={() => setManualOpen((current) => !current)} className="flex w-full items-center justify-between gap-3 text-left">
              <span>
                <span className="block text-2xl font-black text-white">Manual Correction (Use with caution)</span>
                <span className="mt-1 block text-sm text-slate-400">Only use this to fix scoring errors. Changes are applied immediately to the live scorecard.</span>
              </span>
              <ChevronDown className={manualOpen ? "h-5 w-5 rotate-180 text-emerald-200 transition" : "h-5 w-5 text-emerald-200 transition"} />
            </button>
            {manualOpen ? (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <label className="field-label">Runs<input type="number" value={manual.runs} onChange={(event) => setManual({ ...manual, runs: Number(event.target.value) })} /></label>
                  <label className="field-label">Wickets<input type="number" value={manual.wickets} onChange={(event) => setManual({ ...manual, wickets: Number(event.target.value) })} /></label>
                  <label className="field-label">Balls<input type="number" value={manual.balls} onChange={(event) => setManual({ ...manual, balls: Number(event.target.value) })} /></label>
                </div>
                <button type="button" onClick={applyManual} className="secondary-button mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-black"><Save className="h-4 w-4" />Apply</button>
              </>
            ) : null}
          </section>
        </div>
        <LiveScorePanel match={liveMatch} teams={teams} players={players} />
      </section>
      {wicketOpen ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/78 p-4 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg rounded-lg p-5">
            <h2 className="text-2xl font-black text-white">Record wicket</h2>
            <div className="mt-4 grid gap-4">
              <label className="field-label">
                Dismissal type
                <select
                  value={wicketForm.dismissalType}
                  onChange={(event) => setWicketForm({ ...wicketForm, dismissalType: event.target.value, fielderId: "" })}
                >
                  {dismissalTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
              {showFielderInput ? (
                <label className="field-label">
                  Fielder involved
                  <select value={wicketForm.fielderId} onChange={(event) => setWicketForm({ ...wicketForm, fielderId: event.target.value })}>
                    <option value="">Select fielder</option>
                    {bowlingPlayers.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
                  </select>
                </label>
              ) : null}
              <label className="field-label">
                New batsman
                <select value={wicketForm.newBatsmanId} onChange={(event) => setWicketForm({ ...wicketForm, newBatsmanId: event.target.value })}>
                  <option value="">Select new batsman</option>
                  {availableNewBatsmen.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setWicketOpen(false)} className="secondary-button px-4 py-2">Cancel</button>
              <button type="button" onClick={() => void submitWicket()} className="danger-button px-4 py-2">Submit Wicket</button>
            </div>
          </div>
        </div>
      ) : null}
      <ConfirmDialog
        open={completeOpen}
        title="Complete match?"
        description="Are you sure you want to complete this match? This action cannot be undone."
        confirmText="Confirm Complete Match"
        tone="danger"
        onClose={() => setCompleteOpen(false)}
        onConfirm={() => {
          setCompleteOpen(false);
          void complete();
        }}
      />
    </AdminShell>
  );
}
