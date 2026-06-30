import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase/client";
import type {
  BallEvent,
  BallEventType,
  BattingLine,
  BowlingLine,
  Innings,
  LiveMatchState,
  Match,
  MatchStatus,
  Player,
  PlayerCareerStats,
  PlayerMatchPerformance,
  PlayerRole,
  PlayoffFixture,
  PointsTableRow,
  Result,
  ResultType,
  Team
} from "./leagueTypes";

const TEAMS_KEY = "ebc_ipl_teams";
const PLAYERS_KEY = "ebc_ipl_players";
const MATCHES_KEY = "ebc_ipl_matches";
const RESULTS_KEY = "ebc_ipl_results";
const LIVE_KEY = "ebc_ipl_live_match";
const HISTORY_KEY = "ebc_ipl_match_history";
const PLAYER_STATS_KEY = "ebc_ipl_player_stats";
const SEEDED_KEY = "ebc_ipl_seeded";
const DATA_VERSION_KEY = "ebc_ipl_data_version";
const UPDATE_KEY = "ebc_ipl_updated_at";
const ADMIN_KEY = "ebc_ipl_admin_logged_in";
const ADMIN_SESSION_KEY = "ebc_ipl_admin_session";
const LEAGUE_SNAPSHOT_ID = "default";
const DATA_VERSION = "2026-06-28-v2";
const DEFAULT_MAX_OVERS = 20;

const teamPalette = ["#0f9f6e", "#d9a441", "#e04f4f", "#316ce8", "#f47b20", "#7d5fff"];
const nationalities = ["Indian", "Australian", "South African", "New Zealander", "Sri Lankan", "English"];

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function emitLeagueUpdate() {
  if (!canUseStorage()) return;
  window.localStorage.setItem(UPDATE_KEY, String(Date.now()));
  window.dispatchEvent(new Event("ebc-league-updated"));
  queueSupabaseSnapshotSync();
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T, notify = true) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
  if (notify) emitLeagueUpdate();
}

interface LeagueSnapshotPayload {
  teams: Team[];
  players: Player[];
  matches: Match[];
  results: Result[];
  liveMatch?: Match;
  updatedAt?: string;
}

type LeagueSnapshotRow = {
  id: string;
  teams: Team[] | null;
  players: Player[] | null;
  matches: Match[] | null;
  results: Result[] | null;
  live_match: Match | null;
  updated_at: string | null;
};

let suppressSnapshotSync = false;
let snapshotSyncTimer: number | undefined;

function logLeagueSyncError(scope: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[League sync] ${scope}`, error);
  }
}

function readLocalLeagueSnapshot(): LeagueSnapshotPayload {
  return {
    teams: readJson<Team[]>(TEAMS_KEY, []),
    players: readJson<Player[]>(PLAYERS_KEY, []).map(hydratePlayer),
    matches: readJson<Match[]>(MATCHES_KEY, []),
    results: readJson<Result[]>(RESULTS_KEY, []),
    liveMatch: readJson<Match | undefined>(LIVE_KEY, undefined),
    updatedAt: new Date().toISOString()
  };
}

function applyLeagueSnapshot(snapshot: LeagueSnapshotPayload, notify = true) {
  if (!canUseStorage()) return;
  const previousSuppress = suppressSnapshotSync;
  suppressSnapshotSync = true;
  try {
    writeJson(TEAMS_KEY, snapshot.teams, false);
    writeJson(PLAYERS_KEY, snapshot.players.map(hydratePlayer), false);
    writeJson(MATCHES_KEY, snapshot.matches, false);
    writeJson(RESULTS_KEY, snapshot.results, false);
    if (snapshot.liveMatch?.status === "live") {
      writeJson(LIVE_KEY, snapshot.liveMatch, false);
    } else {
      window.localStorage.removeItem(LIVE_KEY);
    }
    window.localStorage.setItem(SEEDED_KEY, "true");
    window.localStorage.setItem(DATA_VERSION_KEY, DATA_VERSION);
    if (notify) emitLeagueUpdate();
  } finally {
    suppressSnapshotSync = previousSuppress;
  }
}

function rowToSnapshot(row: LeagueSnapshotRow): LeagueSnapshotPayload {
  return {
    teams: Array.isArray(row.teams) ? row.teams : [],
    players: Array.isArray(row.players) ? row.players.map(hydratePlayer) : [],
    matches: Array.isArray(row.matches) ? row.matches : [],
    results: Array.isArray(row.results) ? row.results : [],
    liveMatch: row.live_match ?? undefined,
    updatedAt: row.updated_at ?? undefined
  };
}

function queueSupabaseSnapshotSync() {
  if (!canUseStorage() || suppressSnapshotSync || !isSupabaseConfigured() || !isAdminLoggedIn()) return;
  if (snapshotSyncTimer) window.clearTimeout(snapshotSyncTimer);
  snapshotSyncTimer = window.setTimeout(() => {
    void publishLeagueSnapshot();
  }, 320);
}

type SupabaseIdMap = {
  teamIds: Map<string, string>;
  playerIds: Map<string, string>;
  fixtureIds: Map<string, string>;
  liveMatchId?: string;
};

function isoDateOnly(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function resultModeToText(mode?: ResultType) {
  if (mode === "team-a" || mode === "team-b") return "normal";
  if (mode === "no-result") return "no-result";
  if (mode === "tie") return "tie";
  return null;
}

async function syncLiveRows(supabase: SupabaseClient, snapshot: LeagueSnapshotPayload, idMap: SupabaseIdMap, updatedAt: string) {
  const liveMatch = snapshot.liveMatch;
  if (!liveMatch?.live) return;
  const live = liveMatch.live;
  const fixtureId = idMap.fixtureIds.get(liveMatch.id);
  if (!fixtureId) return;
  const battingTeamId = idMap.teamIds.get(live.battingTeamId) ?? null;
  const bowlingTeamId = idMap.teamIds.get(live.bowlingTeamId) ?? null;
  const strikerId = idMap.playerIds.get(live.strikerId) ?? null;
  const nonStrikerId = idMap.playerIds.get(live.nonStrikerId) ?? null;
  const bowlerId = idMap.playerIds.get(live.bowlerId) ?? null;
  const currentRunRate = calculateRunRate(live.runs, live.balls);
  const requiredRunRate = calculateRequiredRunRate(live) ?? null;
  const currentInnings = liveMatch.innings.find((innings) => innings.teamId === live.battingTeamId);

  const batsmenStats = Object.fromEntries(
    (currentInnings?.batting ?? []).map((line) => [
      idMap.playerIds.get(line.playerId) ?? line.playerId,
      {
        appPlayerId: line.playerId,
        runs: line.runs,
        balls: line.balls,
        fours: line.fours,
        sixes: line.sixes,
        strikeRate: calculateStrikeRate(line.runs, line.balls),
        out: line.out,
        dismissal: line.dismissal ?? null
      }
    ])
  );

  const bowlerStats = Object.fromEntries(
    (currentInnings?.bowling ?? []).map((line) => [
      idMap.playerIds.get(line.playerId) ?? line.playerId,
      {
        appPlayerId: line.playerId,
        balls: line.balls,
        overs: ballsToOvers(line.balls),
        maidens: line.maidens,
        runs: line.runs,
        wickets: line.wickets,
        economy: calculateEconomy(line.runs, line.balls)
      }
    ])
  );

  const { data: liveRow, error: scoreError } = await supabase.from("live_matches").upsert(
    {
      fixture_id: fixtureId,
      fixture_app_id: liveMatch.id,
      status: liveMatch.status,
      batting_team_id: battingTeamId,
      bowling_team_id: bowlingTeamId,
      striker_id: strikerId,
      non_striker_id: nonStrikerId,
      bowler_id: bowlerId,
      runs: live.runs,
      wickets: live.wickets,
      balls: live.balls,
      target: live.target ?? null,
      current_run_rate: currentRunRate,
      required_run_rate: requiredRunRate,
      partnership_runs: live.partnershipRuns,
      partnership_balls: live.partnershipBalls,
      last_wicket: live.lastWicket ?? null,
      last_six_balls: live.lastSix,
      fall_of_wickets: currentInnings?.fallOfWickets ?? [],
      batsmen_stats: batsmenStats,
      bowler_stats: bowlerStats,
      updated_at: updatedAt
    },
    { onConflict: "fixture_id" }
  ).select("id").single();
  if (scoreError) {
    logLeagueSyncError("live match upsert", scoreError);
    return;
  }
  idMap.liveMatchId = liveRow?.id;

  const events = liveMatch.live.commentary.slice(0, 20).map((event) => ({
    app_id: event.id,
    live_match_id: liveRow?.id,
    fixture_id: idMap.fixtureIds.get(event.matchId) ?? fixtureId,
    over_number: event.over,
    ball_number: event.ball,
    legal_ball: event.type !== "wide" && event.type !== "no-ball",
    runs: event.runs,
    extra_type: event.extras ? event.type : null,
    extra_runs: event.extras,
    is_wicket: event.wicket,
    wicket_type: event.wicket ? event.type : null,
    batsman_id: idMap.playerIds.get(event.strikerId) ?? null,
    bowler_id: idMap.playerIds.get(event.bowlerId) ?? null,
    commentary: event.commentary,
    payload: event,
    created_at: event.createdAt
  }));

  if (!events.length) return;
  const { error: eventError } = await supabase.from("ball_events").upsert(events, { onConflict: "app_id" });
  if (eventError) {
    logLeagueSyncError("ball events upsert", eventError);
  }
}

async function syncMirrorRows(supabase: SupabaseClient, snapshot: LeagueSnapshotPayload, updatedAt: string): Promise<SupabaseIdMap> {
  const teamIds = new Map<string, string>();
  const playerIds = new Map<string, string>();
  const fixtureIds = new Map<string, string>();

  if (snapshot.teams.length) {
    const { data, error } = await supabase.from("teams").upsert(
      snapshot.teams.map((team) => ({
        app_id: team.id,
        name: team.name,
        short_code: team.shortCode,
        captain: team.captain,
        logo_url: team.logo,
        primary_color: team.primaryColor,
        payload: team,
        updated_at: updatedAt
      })),
      { onConflict: "app_id" }
    ).select("id, app_id");
    if (error) logLeagueSyncError("teams mirror upsert", error);
    (data ?? []).forEach((row: { id: string; app_id: string | null }) => {
      if (row.app_id) teamIds.set(row.app_id, row.id);
    });
  }

  if (snapshot.players.length) {
    const { data, error } = await supabase.from("players").upsert(
      snapshot.players.map((player) => ({
        app_id: player.id,
        team_id: teamIds.get(player.teamId) ?? null,
        name: player.name,
        dob: isoDateOnly(player.dateOfBirth),
        nationality: player.nationality ?? null,
        role: player.role,
        batting_style: player.battingStyle,
        bowling_style: player.bowlingStyle,
        jersey_number: player.jerseyNumber,
        photo_url: player.image,
        bio: player.bio ?? null,
        payload: player,
        updated_at: updatedAt
      })),
      { onConflict: "app_id" }
    ).select("id, app_id");
    if (error) logLeagueSyncError("players mirror upsert", error);
    (data ?? []).forEach((row: { id: string; app_id: string | null }) => {
      if (row.app_id) playerIds.set(row.app_id, row.id);
    });
  }

  if (snapshot.matches.length) {
    const { data, error } = await supabase.from("fixtures").upsert(
      snapshot.matches.map((match) => ({
        app_id: match.id,
        match_number: match.matchNumber,
        team_a_id: teamIds.get(match.teamAId) ?? null,
        team_b_id: teamIds.get(match.teamBId) ?? null,
        match_date: match.dateTime,
        date: match.dateTime.slice(0, 10),
        time: new Date(match.dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
        venue: match.venue,
        match_type: match.matchType,
        status: match.status,
        toss_winner_id: match.tossWinnerId ? teamIds.get(match.tossWinnerId) ?? null : null,
        toss_decision: match.tossDecision ?? null,
        elected_to: match.tossDecision ?? null,
        notes: match.umpires ?? null,
        payload: match,
        updated_at: updatedAt
      })),
      { onConflict: "app_id" }
    ).select("id, app_id");
    if (error) logLeagueSyncError("matches mirror upsert", error);
    (data ?? []).forEach((row: { id: string; app_id: string | null }) => {
      if (row.app_id) fixtureIds.set(row.app_id, row.id);
    });
  }

  if (snapshot.results.length) {
    const resultRows = snapshot.results
      .map((result) => {
        const fixture = snapshot.matches.find((match) => match.id === result.matchId);
        const fixtureId = fixtureIds.get(result.matchId);
        if (!fixture || !fixtureId) return null;
        return {
          app_id: result.id,
          fixture_id: fixtureId,
          team_a_runs: result.teamARuns,
          team_a_wickets: result.teamAWickets,
          team_a_balls: result.teamABalls,
          team_b_runs: result.teamBRuns,
          team_b_wickets: result.teamBWickets,
          team_b_balls: result.teamBBalls,
          winner_team_id: result.winnerTeamId ? teamIds.get(result.winnerTeamId) ?? null : null,
          result_type: resultModeToText(result.resultType),
          player_of_match_id: result.playerOfMatch ? playerIds.get(result.playerOfMatch) ?? null : null,
          payload: result,
          created_at: result.completedAt
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (!resultRows.length) return { teamIds, playerIds, fixtureIds };

    const { error } = await supabase.from("results").upsert(
      resultRows,
      { onConflict: "fixture_id" }
    );
    if (error) logLeagueSyncError("results mirror upsert", error);
  }

  return { teamIds, playerIds, fixtureIds };
}

export async function publishLeagueSnapshot() {
  if (!isSupabaseConfigured() || suppressSnapshotSync || !isAdminLoggedIn()) return false;
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const snapshot = readLocalLeagueSnapshot();
  const updatedAt = new Date().toISOString();
  const { error } = await supabase.from("league_snapshots").upsert(
    {
      id: LEAGUE_SNAPSHOT_ID,
      teams: snapshot.teams,
      players: snapshot.players,
      matches: snapshot.matches,
      results: snapshot.results,
      live_match: snapshot.liveMatch ?? null,
      updated_at: updatedAt
    },
    { onConflict: "id" }
  );

  if (error) {
    logLeagueSyncError("snapshot upsert", error);
    return false;
  }

  const idMap = await syncMirrorRows(supabase, snapshot, updatedAt);
  await syncLiveRows(supabase, snapshot, idMap, updatedAt);
  return true;
}

export async function hydrateLeagueSnapshotFromSupabase() {
  if (!isSupabaseConfigured()) return false;
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("league_snapshots")
    .select("*")
    .eq("id", LEAGUE_SNAPSHOT_ID)
    .maybeSingle();

  if (error) {
    logLeagueSyncError("snapshot fetch", error);
    return false;
  }

  if (!data) {
    if (isAdminLoggedIn()) void publishLeagueSnapshot();
    return false;
  }

  applyLeagueSnapshot(rowToSnapshot(data as LeagueSnapshotRow));
  return true;
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function dateOffset(days: number, hour = 19, minute = 30) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function ballsToOvers(balls: number) {
  const safeBalls = Math.max(0, Number(balls) || 0);
  return `${Math.floor(safeBalls / 6)}.${safeBalls % 6}`;
}

export function oversToBalls(overs: string | number) {
  const value = String(overs || "0").trim();
  const [whole, part = "0"] = value.split(".");
  const ballPart = Number(part || 0);
  if (ballPart > 5) throw new Error("Cricket overs can only have 0 to 5 balls after the decimal.");
  const balls = Number(whole || 0) * 6 + ballPart;
  return Number.isFinite(balls) ? balls : 0;
}

export function calculateRunRate(runs: number, balls: number) {
  return balls > 0 ? Number((runs / (balls / 6)).toFixed(2)) : 0;
}

export function calculateStrikeRate(runs: number, balls: number) {
  return balls > 0 ? Number(((runs / balls) * 100).toFixed(2)) : 0;
}

export function calculateEconomy(runs: number, balls: number) {
  return balls > 0 ? Number((runs / (balls / 6)).toFixed(2)) : 0;
}

export function scoreText(runs = 0, wickets = 0, balls = 0) {
  return `${runs}/${wickets} (${ballsToOvers(balls)})`;
}

export function initials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function getAge(dateOfBirth?: string) {
  if (!dateOfBirth) return 0;
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

function emptyCareerStats(): PlayerCareerStats {
  return {
    battingMatches: 0,
    battingInnings: 0,
    runs: 0,
    highestScore: 0,
    battingAverage: 0,
    strikeRate: 0,
    fifties: 0,
    hundreds: 0,
    ducks: 0,
    fours: 0,
    sixes: 0,
    bowlingMatches: 0,
    bowlingInnings: 0,
    wickets: 0,
    bestBowling: "0/0",
    bowlingAverage: 0,
    economy: 0,
    bowlingStrikeRate: 0,
    fiveWicketHauls: 0,
    catches: 0,
    runOuts: 0,
    stumpings: 0,
    playerOfMatchAwards: 0
  };
}

function makeTeam(id: string, name: string, shortCode: string, captain: string, logo: string, primaryColor: string): Team {
  return {
    id,
    name,
    shortCode,
    captain,
    logo,
    primaryColor,
    matches: 0,
    wins: 0,
    createdAt: new Date().toISOString()
  };
}

function makePlayer(
  id: string,
  name: string,
  teamId: string,
  role: PlayerRole,
  jerseyNumber: number,
  runs: number,
  wickets: number,
  strikeRate: number,
  economy: number,
  recentScores: string[],
  teamIndex: number,
  playerIndex: number
): Player {
  const birthYear = 1992 + ((teamIndex + playerIndex) % 12);
  const birthMonth = String(((playerIndex + 2) % 12) + 1).padStart(2, "0");
  const birthDay = String(((teamIndex * 3 + playerIndex * 2) % 26) + 1).padStart(2, "0");
  const battingStyle = playerIndex % 3 === 0 ? "Left hand" : "Right hand";
  const bowlingStyle =
    role === "Bowler" || role === "All-rounder"
      ? playerIndex % 2 === 0
        ? "Right arm pace"
        : "Left arm spin"
      : "Occasional off spin";
  const stats: PlayerCareerStats = {
    ...emptyCareerStats(),
    battingMatches: 8 + (playerIndex % 5),
    battingInnings: 7 + (playerIndex % 4),
    runs,
    highestScore: Math.max(18, Math.min(118, Math.floor(runs / 3) + playerIndex * 3)),
    battingAverage: Number((runs / Math.max(1, 5 + (playerIndex % 5))).toFixed(2)),
    strikeRate,
    fifties: Math.floor(runs / 180),
    hundreds: runs > 430 ? 1 : 0,
    ducks: playerIndex % 6 === 0 ? 1 : 0,
    fours: Math.floor(runs / 11),
    sixes: Math.floor(runs / 28),
    bowlingMatches: role === "Batter" || role === "Wicketkeeper" ? 2 : 8 + (playerIndex % 4),
    bowlingInnings: role === "Batter" || role === "Wicketkeeper" ? 1 : 7 + (playerIndex % 4),
    wickets,
    bestBowling: wickets > 0 ? `${Math.min(5, Math.max(1, Math.floor(wickets / 3)))}/${18 + playerIndex * 3}` : "0/0",
    bowlingAverage: wickets > 0 ? Number(((wickets * 19 + playerIndex * 7) / wickets).toFixed(2)) : 0,
    economy,
    bowlingStrikeRate: wickets > 0 ? Number(((wickets * 13 + playerIndex * 5) / wickets).toFixed(2)) : 0,
    fiveWicketHauls: wickets > 17 ? 1 : 0,
    catches: 3 + ((teamIndex + playerIndex) % 9),
    runOuts: playerIndex % 4,
    stumpings: role === "Wicketkeeper" ? 4 + (teamIndex % 3) : 0,
    playerOfMatchAwards: Math.floor((runs + wickets * 18) / 260)
  };

  return {
    id,
    name,
    teamId,
    role,
    battingStyle,
    bowlingStyle,
    jerseyNumber,
    image: initials(name),
    dateOfBirth: `${birthYear}-${birthMonth}-${birthDay}`,
    nationality: nationalities[(teamIndex + playerIndex) % nationalities.length],
    bio: `${name} is a ${role.toLowerCase()} known for composed tournament cricket and high-energy fielding for Eagle Box match nights.`,
    matches: stats.battingMatches,
    runs,
    wickets,
    strikeRate,
    economy,
    recentScores,
    careerStats: stats,
    matchPerformances: [],
    createdAt: new Date().toISOString()
  };
}

function emptyInnings(teamId: string): Innings {
  return {
    teamId,
    runs: 0,
    wickets: 0,
    balls: 0,
    extras: 0,
    batting: [],
    bowling: [],
    fallOfWickets: []
  };
}

function getOrCreateBatter(innings: Innings, playerId: string): BattingLine {
  let line = innings.batting.find((item) => item.playerId === playerId);
  if (!line) {
    line = { playerId, runs: 0, balls: 0, fours: 0, sixes: 0, out: false };
    innings.batting.push(line);
  }
  return line;
}

function getOrCreateBowler(innings: Innings, playerId: string): BowlingLine {
  let line = innings.bowling.find((item) => item.playerId === playerId);
  if (!line) {
    line = { playerId, balls: 0, maidens: 0, runs: 0, wickets: 0 };
    innings.bowling.push(line);
  }
  return line;
}

function hydratePlayer(raw: Player): Player {
  const image = raw.image || initials(raw.name);
  const careerStats = raw.careerStats ?? {
    ...emptyCareerStats(),
    battingMatches: raw.matches ?? 0,
    battingInnings: raw.matches ?? 0,
    runs: raw.runs ?? 0,
    highestScore: raw.runs ? Math.min(99, Math.max(0, Math.floor(raw.runs / 4))) : 0,
    strikeRate: raw.strikeRate ?? 0,
    wickets: raw.wickets ?? 0,
    economy: raw.economy ?? 0
  };

  return {
    ...raw,
    image,
    dateOfBirth: raw.dateOfBirth ?? "1998-01-01",
    nationality: raw.nationality ?? "Indian",
    bio: raw.bio ?? `${raw.name} is part of the Eagle Box Cricket League squad.`,
    careerStats,
    matchPerformances: raw.matchPerformances ?? [],
    recentScores: raw.recentScores ?? []
  };
}

function buildResult(
  match: Pick<Match, "id" | "teamAId" | "teamBId">,
  resultType: ResultType,
  teamAScore: [number, number, number],
  teamBScore: [number, number, number],
  playerOfMatch?: string,
  notes?: string
): Result {
  const [teamARuns, teamAWickets, teamABalls] = teamAScore;
  const [teamBRuns, teamBWickets, teamBBalls] = teamBScore;
  const winnerTeamId =
    resultType === "team-a"
      ? match.teamAId
      : resultType === "team-b"
        ? match.teamBId
        : undefined;

  return {
    id: createId("result"),
    matchId: match.id,
    resultType,
    winnerTeamId,
    teamAScore: scoreText(teamARuns, teamAWickets, teamABalls),
    teamBScore: scoreText(teamBRuns, teamBWickets, teamBBalls),
    teamARuns,
    teamBRuns,
    teamABalls,
    teamBBalls,
    teamAWickets,
    teamBWickets,
    playerOfMatch,
    notes,
    completedAt: new Date().toISOString()
  };
}

function seedTeams(): Team[] {
  return [
    makeTeam("team-strikers", "Eagle Strikers", "ES", "Arjun Mehta", "ES", teamPalette[0]),
    makeTeam("team-royals", "Golden Royals", "GR", "Rohan Verma", "GR", teamPalette[1]),
    makeTeam("team-titans", "City Titans", "CT", "Kabir Shah", "CT", teamPalette[2]),
    makeTeam("team-chargers", "Coastal Chargers", "CC", "Dev Nair", "CC", teamPalette[3]),
    makeTeam("team-kings", "Thunder Kings", "TK", "Manav Rao", "TK", teamPalette[4]),
    makeTeam("team-mavericks", "Metro Mavericks", "MM", "Ishan Kapoor", "MM", teamPalette[5])
  ];
}

function seedPlayers(teams: Team[]): Player[] {
  const names = [
    ["Arjun Mehta", "Nikhil Rao", "Vivaan Sethi", "Reyansh Jain", "Samar Gill", "Karan Bedi", "Harsh Malik", "Omkar Kale", "Adit Sinha"],
    ["Rohan Verma", "Ayaan Khanna", "Yash Patel", "Pranav Dutt", "Neel Batra", "Om Saxena", "Aditya Sen", "Milan Arora", "Rudransh Vyas"],
    ["Kabir Shah", "Dhruv Arora", "Krish Menon", "Laksh Suri", "Tanish Goel", "Rudra Das", "Aryan Paul", "Harit Joshi", "Nirvaan Gill"],
    ["Dev Nair", "Rishi Kulkarni", "Atharv Joshi", "Veer Chawla", "Shaurya Bose", "Parth Iyer", "Mihir Roy", "Vedant Kapoor", "Eshan Murthy"],
    ["Manav Rao", "Aarav Singh", "Ishaan Dey", "Naman Puri", "Ronit Khosla", "Tejas Rana", "Varun Sood", "Aniket Das", "Raghav Nanda"],
    ["Ishan Kapoor", "Anay Gupta", "Sahil Mir", "Jay Narang", "Abeer Walia", "Daksh Grover", "Neil Mathur", "Vihaan Oberoi", "Zoravar Sidhu"]
  ];
  const roles: PlayerRole[] = ["Batter", "Bowler", "All-rounder", "Wicketkeeper", "Batter", "Bowler", "All-rounder", "Batter", "Bowler"];

  return teams.flatMap((team, teamIndex) =>
    names[teamIndex].map((name, index) =>
      makePlayer(
        `player-${team.shortCode.toLowerCase()}-${index + 1}`,
        name,
        team.id,
        roles[index],
        (teamIndex + 1) * 10 + index + 1,
        92 + teamIndex * 21 + index * 29,
        roles[index] === "Batter" || roles[index] === "Wicketkeeper" ? index % 4 : 5 + index + teamIndex,
        116 + index * 7 + teamIndex,
        roles[index] === "Batter" || roles[index] === "Wicketkeeper" ? 9.2 : 5.7 + index * 0.21,
        [`${22 + index * 4}`, `${index % 3 === 0 ? "DNB" : 12 + index * 7}`, `${38 + teamIndex + index}`, `${index % 4 === 0 ? "0" : 17 + index}`],
        teamIndex,
        index
      )
    )
  );
}

function buildInnings(teamId: string, battingLines: BattingLine[], bowlingLines: BowlingLine[], extras: number, fallOfWickets: string[]): Innings {
  const runs = battingLines.reduce((total, line) => total + line.runs, 0) + extras;
  const wickets = battingLines.filter((line) => line.out).length;
  const balls = Math.min(120, battingLines.reduce((total, line) => total + line.balls, 0));
  return {
    teamId,
    runs,
    wickets,
    balls,
    extras,
    batting: battingLines,
    bowling: bowlingLines,
    fallOfWickets
  };
}

function battingLine(playerId: string, runs: number, balls: number, fours: number, sixes: number, out = true, dismissal?: string): BattingLine {
  return { playerId, runs, balls, fours, sixes, out, dismissal };
}

function bowlingLine(playerId: string, balls: number, runs: number, wickets: number, maidens = 0): BowlingLine {
  return { playerId, balls, maidens, runs, wickets };
}

function seedMatches(teams: Team[], players: Player[]): Match[] {
  const player = (teamId: string, index: number) => players.filter((item) => item.teamId === teamId)[index]?.id ?? "";

  const completed: Match[] = [
    {
      id: "match-001",
      matchNumber: "EBC-001",
      teamAId: teams[0].id,
      teamBId: teams[1].id,
      dateTime: dateOffset(-8),
      venue: "Eagle Box Stadium",
      matchType: "League",
      status: "completed",
      tossWinnerId: teams[1].id,
      tossDecision: "Field",
      umpires: "S. Menon, P. Kulkarni",
      innings: [
        buildInnings(
          teams[0].id,
          [
            battingLine(player(teams[0].id, 0), 74, 46, 8, 3, false),
            battingLine(player(teams[0].id, 2), 41, 28, 4, 2),
            battingLine(player(teams[0].id, 4), 33, 21, 3, 1),
            battingLine(player(teams[0].id, 6), 19, 12, 1, 1)
          ],
          [bowlingLine(player(teams[1].id, 1), 24, 34, 2), bowlingLine(player(teams[1].id, 5), 24, 42, 1), bowlingLine(player(teams[1].id, 8), 18, 29, 1)],
          17,
          ["49/1", "109/2", "158/3", "184/4"]
        ),
        buildInnings(
          teams[1].id,
          [
            battingLine(player(teams[1].id, 0), 48, 37, 5, 1),
            battingLine(player(teams[1].id, 3), 31, 24, 2, 1),
            battingLine(player(teams[1].id, 4), 42, 29, 4, 2),
            battingLine(player(teams[1].id, 6), 28, 19, 2, 1)
          ],
          [bowlingLine(player(teams[0].id, 1), 24, 28, 2), bowlingLine(player(teams[0].id, 5), 24, 36, 2), bowlingLine(player(teams[0].id, 8), 24, 40, 1)],
          22,
          ["61/1", "96/2", "139/3", "171/4"]
        )
      ],
      createdAt: dateOffset(-10)
    },
    {
      id: "match-002",
      matchNumber: "EBC-002",
      teamAId: teams[2].id,
      teamBId: teams[3].id,
      dateTime: dateOffset(-6),
      venue: "Night Arena",
      matchType: "League",
      status: "completed",
      tossWinnerId: teams[3].id,
      tossDecision: "Field",
      umpires: "A. Shetty, R. Thomas",
      innings: [
        buildInnings(
          teams[2].id,
          [battingLine(player(teams[2].id, 0), 52, 39, 6, 1), battingLine(player(teams[2].id, 2), 38, 27, 3, 2), battingLine(player(teams[2].id, 4), 29, 20, 2, 1), battingLine(player(teams[2].id, 7), 25, 19, 2, 0)],
          [bowlingLine(player(teams[3].id, 1), 24, 31, 2), bowlingLine(player(teams[3].id, 5), 24, 38, 2), bowlingLine(player(teams[3].id, 8), 18, 27, 1)],
          14,
          ["58/1", "101/2", "134/3", "158/4"]
        ),
        buildInnings(
          teams[3].id,
          [battingLine(player(teams[3].id, 0), 67, 44, 7, 2, false), battingLine(player(teams[3].id, 3), 34, 27, 3, 1), battingLine(player(teams[3].id, 6), 31, 21, 2, 2, false), battingLine(player(teams[3].id, 4), 19, 15, 1, 0)],
          [bowlingLine(player(teams[2].id, 1), 24, 39, 1), bowlingLine(player(teams[2].id, 5), 24, 35, 2), bowlingLine(player(teams[2].id, 8), 18, 30, 1)],
          11,
          ["72/1", "118/2", "151/3"]
        )
      ],
      createdAt: dateOffset(-8)
    },
    {
      id: "match-003",
      matchNumber: "EBC-003",
      teamAId: teams[4].id,
      teamBId: teams[5].id,
      dateTime: dateOffset(-4),
      venue: "Metro Cricket Park",
      matchType: "League",
      status: "completed",
      tossWinnerId: teams[4].id,
      tossDecision: "Bat",
      umpires: "V. Prasad, K. Iyer",
      innings: [
        buildInnings(
          teams[4].id,
          [battingLine(player(teams[4].id, 0), 58, 36, 5, 3), battingLine(player(teams[4].id, 2), 47, 32, 4, 2), battingLine(player(teams[4].id, 4), 30, 18, 2, 2), battingLine(player(teams[4].id, 7), 22, 16, 2, 0, false)],
          [bowlingLine(player(teams[5].id, 1), 24, 41, 1), bowlingLine(player(teams[5].id, 5), 24, 36, 2), bowlingLine(player(teams[5].id, 8), 18, 33, 1)],
          13,
          ["66/1", "121/2", "159/3"]
        ),
        buildInnings(
          teams[5].id,
          [battingLine(player(teams[5].id, 0), 44, 32, 4, 1), battingLine(player(teams[5].id, 2), 36, 27, 2, 2), battingLine(player(teams[5].id, 4), 35, 24, 3, 1), battingLine(player(teams[5].id, 6), 30, 19, 1, 2)],
          [bowlingLine(player(teams[4].id, 1), 24, 30, 2), bowlingLine(player(teams[4].id, 5), 24, 37, 1), bowlingLine(player(teams[4].id, 8), 24, 42, 2)],
          10,
          ["52/1", "96/2", "137/3", "155/4"]
        )
      ],
      createdAt: dateOffset(-6)
    },
    {
      id: "match-004",
      matchNumber: "EBC-004",
      teamAId: teams[1].id,
      teamBId: teams[2].id,
      dateTime: dateOffset(-2),
      venue: "Coastal Dome",
      matchType: "League",
      status: "completed",
      tossWinnerId: teams[2].id,
      tossDecision: "Bat",
      umpires: "R. Fernandes, N. Balan",
      innings: [
        buildInnings(
          teams[1].id,
          [battingLine(player(teams[1].id, 0), 39, 31, 4, 1), battingLine(player(teams[1].id, 2), 50, 34, 5, 2), battingLine(player(teams[1].id, 4), 26, 19, 2, 1), battingLine(player(teams[1].id, 7), 18, 16, 1, 0)],
          [bowlingLine(player(teams[2].id, 1), 24, 27, 2), bowlingLine(player(teams[2].id, 5), 24, 32, 1), bowlingLine(player(teams[2].id, 8), 18, 28, 2)],
          15,
          ["43/1", "102/2", "132/3", "148/4"]
        ),
        buildInnings(
          teams[2].id,
          [battingLine(player(teams[2].id, 0), 61, 41, 7, 1, false), battingLine(player(teams[2].id, 3), 37, 29, 3, 1), battingLine(player(teams[2].id, 6), 31, 22, 2, 2, false), battingLine(player(teams[2].id, 4), 16, 12, 1, 0)],
          [bowlingLine(player(teams[1].id, 1), 24, 36, 1), bowlingLine(player(teams[1].id, 5), 24, 39, 1), bowlingLine(player(teams[1].id, 8), 18, 26, 1)],
          9,
          ["74/1", "123/2"]
        )
      ],
      createdAt: dateOffset(-4)
    }
  ];

  completed.forEach((match, index) => {
    const first = match.innings[0];
    const second = match.innings[1];
    const resultType: ResultType =
      first.runs === second.runs ? "tie" : first.runs > second.runs ? "team-a" : "team-b";
    match.result = buildResult(
      match,
      resultType,
      [first.runs, first.wickets, first.balls],
      [second.runs, second.wickets, second.balls],
      player(resultType === "team-b" ? match.teamBId : match.teamAId, index % 4),
      resultType === "tie" ? "Match tied." : `${resultType === "team-a" ? "Team A" : "Team B"} won.`
    );
  });

  const liveState: LiveMatchState = {
    matchId: "match-005",
    inningsNumber: 1,
    battingTeamId: teams[0].id,
    bowlingTeamId: teams[3].id,
    strikerId: player(teams[0].id, 0),
    nonStrikerId: player(teams[0].id, 2),
    bowlerId: player(teams[3].id, 1),
    runs: 145,
    wickets: 4,
    balls: 98,
    partnershipRuns: 42,
    partnershipBalls: 29,
    lastWicket: "Samar Gill c Veer Chawla b Rishi Kulkarni 18",
    lastSix: ["1", "4", "0", "W", "2", "6"],
    commentary: [
      "Manav Rao clears long-on with a clean swing.",
      "Short ball pulled hard through midwicket.",
      "Dot ball. Tight line outside off.",
      "Wicket. Excellent slower ball into the pitch.",
      "Two more into the leg side.",
      "Single to deep cover keeps strike moving."
    ].map<BallEvent>((commentary, index) => ({
      id: `ball-live-${index + 1}`,
      matchId: "match-005",
      inningsNumber: 1,
      over: 15 + Math.floor(index / 6),
      ball: (index % 6) + 1,
      battingTeamId: teams[0].id,
      bowlingTeamId: teams[3].id,
      strikerId: player(teams[0].id, 0),
      nonStrikerId: player(teams[0].id, 2),
      bowlerId: player(teams[3].id, 1),
      type: index === 3 ? "wicket" : index === 5 ? "six" : "run",
      runs: index === 5 ? 6 : index === 1 ? 4 : index === 3 ? 0 : 1,
      extras: 0,
      wicket: index === 3,
      label: ["1", "4", "0", "W", "2", "6"][index],
      commentary,
      createdAt: new Date(Date.now() - index * 45000).toISOString()
    }))
  };

  const liveMatch: Match = {
    id: "match-005",
    matchNumber: "EBC-005",
    teamAId: teams[0].id,
    teamBId: teams[3].id,
    dateTime: dateOffset(0),
    venue: "Eagle Box Stadium",
    matchType: "League",
    status: "live",
    tossWinnerId: teams[0].id,
    tossDecision: "Bat",
    umpires: "M. Shah, T. Kapoor",
    innings: [
      {
        ...emptyInnings(teams[0].id),
        runs: liveState.runs,
        wickets: liveState.wickets,
        balls: liveState.balls,
        extras: 8,
        batting: [
          battingLine(player(teams[0].id, 0), 63, 39, 5, 3, false),
          battingLine(player(teams[0].id, 2), 24, 16, 2, 1, false),
          battingLine(player(teams[0].id, 4), 18, 15, 1, 1),
          battingLine(player(teams[0].id, 6), 21, 17, 2, 0)
        ],
        bowling: [bowlingLine(player(teams[3].id, 1), 20, 31, 1), bowlingLine(player(teams[3].id, 5), 24, 39, 2)],
        fallOfWickets: ["32/1", "76/2", "99/3", "103/4"]
      }
    ],
    live: liveState,
    createdAt: dateOffset(-1)
  };

  return [
    ...completed,
    liveMatch,
    {
      id: "match-006",
      matchNumber: "EBC-006",
      teamAId: teams[4].id,
      teamBId: teams[5].id,
      dateTime: dateOffset(2),
      venue: "Metro Cricket Park",
      matchType: "League",
      status: "upcoming",
      innings: [],
      createdAt: dateOffset(-1)
    },
    {
      id: "match-007",
      matchNumber: "EBC-007",
      teamAId: teams[0].id,
      teamBId: teams[2].id,
      dateTime: dateOffset(4),
      venue: "Coastal Dome",
      matchType: "League",
      status: "upcoming",
      innings: [],
      createdAt: dateOffset(-1)
    },
    {
      id: "match-008",
      matchNumber: "EBC-008",
      teamAId: teams[1].id,
      teamBId: teams[4].id,
      dateTime: dateOffset(6),
      venue: "Eagle Box Stadium",
      matchType: "League",
      status: "upcoming",
      innings: [],
      createdAt: dateOffset(-1)
    },
    {
      id: "match-009",
      matchNumber: "EBC-009",
      teamAId: teams[3].id,
      teamBId: teams[5].id,
      dateTime: dateOffset(8),
      venue: "Night Arena",
      matchType: "League",
      status: "upcoming",
      innings: [],
      createdAt: dateOffset(-1)
    },
    {
      id: "match-010",
      matchNumber: "EBC-010",
      teamAId: teams[2].id,
      teamBId: teams[4].id,
      dateTime: dateOffset(10),
      venue: "Eagle Box Stadium",
      matchType: "League",
      status: "upcoming",
      innings: [],
      createdAt: dateOffset(-1)
    }
  ];
}

function updateTeamSummaries(teams: Team[], matches: Match[]) {
  return teams.map((team) => {
    const completed = matches.filter(
      (match) => match.status === "completed" && match.result && (match.teamAId === team.id || match.teamBId === team.id)
    );
    return {
      ...team,
      matches: completed.length,
      wins: completed.filter((match) => match.result?.winnerTeamId === team.id).length
    };
  });
}

function addPerformanceToPlayers(players: Player[], matches: Match[], teams: Team[]) {
  return players.map((player) => {
    const performances = calculatePlayerPerformances(player.id, matches, players, teams);
    const stats = calculatePlayerCareerStats(player.id, matches, player, teams);
    return {
      ...player,
      matches: Math.max(player.matches, stats.battingMatches, stats.bowlingMatches),
      runs: Math.max(player.runs, stats.runs),
      wickets: Math.max(player.wickets, stats.wickets),
      strikeRate: stats.strikeRate || player.strikeRate,
      economy: stats.economy || player.economy,
      careerStats: stats.runs || stats.wickets ? stats : player.careerStats,
      matchPerformances: performances.length ? performances : player.matchPerformances
    };
  });
}

export function getTeams(): Team[] {
  ensureLeagueData();
  return readJson<Team[]>(TEAMS_KEY, []);
}

export function saveTeams(teams: Team[]) {
  writeJson(TEAMS_KEY, teams);
}

export function getPlayers(): Player[] {
  ensureLeagueData();
  return readJson<Player[]>(PLAYERS_KEY, []).map(hydratePlayer);
}

export function savePlayers(players: Player[]) {
  writeJson(PLAYERS_KEY, players.map(hydratePlayer));
}

export function calculateRequiredRunRate(live?: Pick<LiveMatchState, "inningsNumber" | "target" | "runs" | "balls">, maxOvers = DEFAULT_MAX_OVERS) {
  if (!live?.target || live.inningsNumber < 2) return undefined;
  const runsRequired = Math.max(live.target - live.runs, 0);
  const ballsRemaining = Math.max(maxOvers * 6 - live.balls, 0);
  if (ballsRemaining <= 0) return runsRequired > 0 ? Infinity : 0;
  const oversRemaining = ballsRemaining / 6;
  return Number((runsRequired / oversRemaining).toFixed(2));
}

export function getMatches(): Match[] {
  ensureLeagueData();
  return readJson<Match[]>(MATCHES_KEY, []);
}

export const getFixtures = getMatches;

export function saveMatches(matches: Match[]) {
  writeJson(MATCHES_KEY, matches, false);
  const live = matches.find((match) => match.status === "live");
  if (live) saveLiveMatch(live, false);
  else saveLiveMatch(undefined, false);
  saveResults(matches.filter((match) => match.result).map((match) => match.result as Result), false);
  saveTeams(updateTeamSummaries(readJson<Team[]>(TEAMS_KEY, []), matches));
  emitLeagueUpdate();
}

export const saveFixtures = saveMatches;

export function getLiveMatch(): Match | undefined {
  ensureLeagueData();
  const fromKey = readJson<Match | undefined>(LIVE_KEY, undefined);
  if (fromKey?.status === "live") return fromKey;
  return getMatches().find((match) => match.status === "live");
}

export function saveLiveMatch(match?: Match, notify = true) {
  if (!canUseStorage()) return;
  if (!match) {
    window.localStorage.removeItem(LIVE_KEY);
    if (notify) emitLeagueUpdate();
    return;
  }
  writeJson(LIVE_KEY, match, notify);
}

export function getResults(): Result[] {
  ensureLeagueData();
  const stored = readJson<Result[]>(RESULTS_KEY, []);
  if (stored.length) return stored;
  return getMatches().filter((match) => match.result).map((match) => match.result as Result);
}

export function saveResults(results: Result[], notify = true) {
  writeJson(RESULTS_KEY, results, notify);
}

export function getPlayerStats(): Record<string, PlayerCareerStats> {
  ensureLeagueData();
  const stored = readJson<Record<string, PlayerCareerStats>>(PLAYER_STATS_KEY, {});
  if (Object.keys(stored).length) return stored;
  const matches = getMatches();
  const players = getPlayers();
  return Object.fromEntries(players.map((player) => [player.id, calculatePlayerCareerStats(player.id, matches, player)]));
}

export function savePlayerStats(stats: Record<string, PlayerCareerStats>) {
  writeJson(PLAYER_STATS_KEY, stats);
}

export function calculatePointsTable(teams = getTeams(), matches = getMatches()): PointsTableRow[] {
  const rows = teams.map<PointsTableRow>((team) => ({
    teamId: team.id,
    played: 0,
    won: 0,
    lost: 0,
    noResult: 0,
    points: 0,
    runsFor: 0,
    oversFaced: 0,
    runsAgainst: 0,
    oversBowled: 0,
    nrr: 0,
    qualification: "In Race"
  }));

  const findRow = (teamId: string) => rows.find((row) => row.teamId === teamId);

  matches.filter((match) => match.status === "completed" && match.result).forEach((match) => {
    const result = match.result as Result;
    const a = findRow(match.teamAId);
    const b = findRow(match.teamBId);
    if (!a || !b) return;

    a.played += 1;
    b.played += 1;

    if (result.resultType !== "no-result") {
      a.runsFor += result.teamARuns;
      a.oversFaced += result.teamABalls;
      a.runsAgainst += result.teamBRuns;
      a.oversBowled += result.teamBBalls;
      b.runsFor += result.teamBRuns;
      b.oversFaced += result.teamBBalls;
      b.runsAgainst += result.teamARuns;
      b.oversBowled += result.teamABalls;
    }

    if (result.resultType === "team-a") {
      a.won += 1;
      a.points += 2;
      b.lost += 1;
    } else if (result.resultType === "team-b") {
      b.won += 1;
      b.points += 2;
      a.lost += 1;
    } else if (result.resultType === "no-result" || result.resultType === "tie") {
      a.noResult += 1;
      b.noResult += 1;
      a.points += 1;
      b.points += 1;
    }
  });

  rows.forEach((row) => {
    row.nrr = calculateNRR(row.runsFor, row.oversFaced, row.runsAgainst, row.oversBowled);
  });

  const sorted = rows.sort((a, b) => b.points - a.points || b.nrr - a.nrr || b.won - a.won);
  sorted.forEach((row, index) => {
    if (index <= 1) row.qualification = "Qualifier 1";
    else if (index <= 3) row.qualification = "Eliminator";
    else if (row.points >= (sorted[3]?.points ?? 0) - 2) row.qualification = "Needs Win";
    else row.qualification = "Eliminated";
  });
  return sorted;
}

export function calculateNRR(runsFor: number, ballsFaced: number, runsAgainst: number, ballsBowled: number) {
  const forRate = ballsFaced > 0 ? runsFor / (ballsFaced / 6) : 0;
  const againstRate = ballsBowled > 0 ? runsAgainst / (ballsBowled / 6) : 0;
  return Number((forRate - againstRate).toFixed(3));
}

export function calculatePlayoffBracket(rows = calculatePointsTable(), teams = getTeams()): PlayoffFixture[] {
  const ranked = rows.slice(0, 4).map((row) => getTeam(row.teamId, teams));
  const [rank1, rank2, rank3, rank4] = ranked;
  return [
    { id: "qualifier-1", title: "Qualifier 1", teamA: rank1, teamB: rank2, detail: "Rank 1 vs Rank 2" },
    { id: "eliminator", title: "Eliminator", teamA: rank3, teamB: rank4, detail: "Rank 3 vs Rank 4" },
    { id: "qualifier-2", title: "Qualifier 2", detail: "Loser of Qualifier 1 vs Winner of Eliminator" },
    { id: "final", title: "Final", detail: "Winner of Qualifier 1 vs Winner of Qualifier 2" }
  ];
}

export function calculatePlayerPerformances(
  playerId: string,
  matches = getMatches(),
  players = getPlayers(),
  teams = getTeams()
): PlayerMatchPerformance[] {
  return matches
    .filter((match) => match.status === "completed" || match.status === "live")
    .map((match) => {
      const batting = match.innings.flatMap((innings) => innings.batting).find((line) => line.playerId === playerId);
      const bowling = match.innings.flatMap((innings) => innings.bowling).find((line) => line.playerId === playerId);
      const player = getPlayer(playerId, players);
      const teamId = player?.teamId ?? "";
      const opponentId = match.teamAId === teamId ? match.teamBId : match.teamAId;
      return {
        id: `${playerId}-${match.id}`,
        matchId: match.id,
        date: match.dateTime,
        opponent: getTeam(opponentId, teams)?.shortCode ?? "TBA",
        runs: batting?.runs ?? 0,
        balls: batting?.balls ?? 0,
        wickets: bowling?.wickets ?? 0,
        bowlingRuns: bowling?.runs ?? 0,
        bowlingBalls: bowling?.balls ?? 0,
        catches: 0,
        note: match.status === "live" ? "Live" : match.result?.winnerTeamId === teamId ? "Won" : "Played"
      };
    })
    .filter((performance) => performance.runs || performance.balls || performance.wickets || performance.bowlingBalls);
}

export function calculatePlayerCareerStats(playerId: string, matches = getMatches(), fallback?: Player, teams = getTeams()): PlayerCareerStats {
  const stats = { ...(fallback?.careerStats ?? emptyCareerStats()) };
  const performances = calculatePlayerPerformances(playerId, matches, fallback ? [fallback] : getPlayers(), teams);
  if (!performances.length) return stats;

  const battingLines = matches.flatMap((match) => match.innings.flatMap((innings) => innings.batting.filter((line) => line.playerId === playerId)));
  const bowlingLines = matches.flatMap((match) => match.innings.flatMap((innings) => innings.bowling.filter((line) => line.playerId === playerId)));
  const outs = battingLines.filter((line) => line.out).length;
  const bowlingRuns = bowlingLines.reduce((total, line) => total + line.runs, 0);
  const bowlingBalls = bowlingLines.reduce((total, line) => total + line.balls, 0);
  const wickets = bowlingLines.reduce((total, line) => total + line.wickets, 0);
  const best = [...bowlingLines].sort((a, b) => b.wickets - a.wickets || a.runs - b.runs)[0];
  const runs = battingLines.reduce((total, line) => total + line.runs, 0);
  const balls = battingLines.reduce((total, line) => total + line.balls, 0);

  return {
    ...stats,
    battingMatches: new Set(performances.map((item) => item.matchId)).size,
    battingInnings: battingLines.length,
    runs,
    highestScore: battingLines.reduce((bestScore, line) => Math.max(bestScore, line.runs), 0),
    battingAverage: outs > 0 ? Number((runs / outs).toFixed(2)) : runs,
    strikeRate: calculateStrikeRate(runs, balls),
    fifties: battingLines.filter((line) => line.runs >= 50 && line.runs < 100).length,
    hundreds: battingLines.filter((line) => line.runs >= 100).length,
    ducks: battingLines.filter((line) => line.runs === 0 && line.balls > 0).length,
    fours: battingLines.reduce((total, line) => total + line.fours, 0),
    sixes: battingLines.reduce((total, line) => total + line.sixes, 0),
    bowlingMatches: bowlingLines.length ? new Set(performances.filter((item) => item.bowlingBalls > 0).map((item) => item.matchId)).size : stats.bowlingMatches,
    bowlingInnings: bowlingLines.length,
    wickets,
    bestBowling: best ? `${best.wickets}/${best.runs}` : stats.bestBowling,
    bowlingAverage: wickets > 0 ? Number((bowlingRuns / wickets).toFixed(2)) : 0,
    economy: calculateEconomy(bowlingRuns, bowlingBalls),
    bowlingStrikeRate: wickets > 0 ? Number((bowlingBalls / wickets).toFixed(2)) : 0,
    fiveWicketHauls: bowlingLines.filter((line) => line.wickets >= 5).length,
    playerOfMatchAwards: matches.filter((match) => match.result?.playerOfMatch === playerId).length,
    catches: stats.catches,
    runOuts: stats.runOuts,
    stumpings: stats.stumpings
  };
}

export function seedDemoData() {
  const teams = seedTeams();
  const players = seedPlayers(teams);
  const matches = seedMatches(teams, players);
  const summarizedTeams = updateTeamSummaries(teams, matches);
  const enrichedPlayers = addPerformanceToPlayers(players, matches, summarizedTeams);
  const playerStats = Object.fromEntries(enrichedPlayers.map((player) => [player.id, calculatePlayerCareerStats(player.id, matches, player, summarizedTeams)]));

  writeJson(TEAMS_KEY, summarizedTeams, false);
  writeJson(PLAYERS_KEY, enrichedPlayers, false);
  writeJson(MATCHES_KEY, matches, false);
  writeJson(RESULTS_KEY, matches.filter((match) => match.result).map((match) => match.result as Result), false);
  writeJson(PLAYER_STATS_KEY, playerStats, false);
  saveLiveMatch(matches.find((match) => match.status === "live"), false);
  if (canUseStorage()) {
    window.localStorage.setItem(SEEDED_KEY, "true");
    window.localStorage.setItem(DATA_VERSION_KEY, DATA_VERSION);
  }
  emitLeagueUpdate();
  return { teams: summarizedTeams, players: enrichedPlayers, matches };
}

export function resetTournamentData() {
  if (canUseStorage()) {
    [TEAMS_KEY, PLAYERS_KEY, MATCHES_KEY, RESULTS_KEY, LIVE_KEY, HISTORY_KEY, PLAYER_STATS_KEY, SEEDED_KEY, DATA_VERSION_KEY].forEach((key) =>
      window.localStorage.removeItem(key)
    );
  }
  return seedDemoData();
}

export function ensureLeagueData() {
  if (!canUseStorage()) return;
  const version = window.localStorage.getItem(DATA_VERSION_KEY);
  const players = readJson<Player[]>(PLAYERS_KEY, []);
  const matches = readJson<Match[]>(MATCHES_KEY, []);
  const hasCoreData = window.localStorage.getItem(TEAMS_KEY) && players.length && matches.length;
  if (!hasCoreData || version !== DATA_VERSION || players.length < 50 || matches.length < 10) seedDemoData();
}

export function getTeam(teamId: string, teams = getTeams()) {
  return teams.find((team) => team.id === teamId);
}

export function getPlayer(playerId: string, players = getPlayers()) {
  return players.find((player) => player.id === playerId);
}

export function playersForTeam(teamId: string, players = getPlayers()) {
  return players.filter((player) => player.teamId === teamId);
}

export function getMatchTeams(match: Match, teams = getTeams()) {
  return {
    teamA: getTeam(match.teamAId, teams),
    teamB: getTeam(match.teamBId, teams)
  };
}

export function topPlayers(players = getPlayers()) {
  return {
    runs: [...players].sort((a, b) => b.runs - a.runs)[0],
    wickets: [...players].sort((a, b) => b.wickets - a.wickets)[0],
    strikeRate: [...players].sort((a, b) => b.strikeRate - a.strikeRate)[0],
    economy: [...players].filter((player) => player.wickets > 0).sort((a, b) => a.economy - b.economy)[0]
  };
}

export function addTeam(input: Omit<Team, "id" | "matches" | "wins" | "createdAt">) {
  const team: Team = {
    ...input,
    id: createId("team"),
    logo: input.logo || initials(input.name),
    shortCode: input.shortCode.toUpperCase(),
    matches: 0,
    wins: 0,
    createdAt: new Date().toISOString()
  };
  saveTeams([...getTeams(), team]);
  return team;
}

export function updateTeam(teamId: string, input: Omit<Team, "id" | "matches" | "wins" | "createdAt">) {
  const teams = getTeams().map((team) =>
    team.id === teamId
      ? { ...team, ...input, shortCode: input.shortCode.toUpperCase(), logo: input.logo || initials(input.name) }
      : team
  );
  saveTeams(teams);
  return teams;
}

export function deleteTeam(teamId: string) {
  const teams = getTeams().filter((team) => team.id !== teamId);
  const players = getPlayers().filter((player) => player.teamId !== teamId);
  const matches = getMatches().filter((match) => match.teamAId !== teamId && match.teamBId !== teamId);
  saveTeams(teams);
  savePlayers(players);
  saveMatches(matches);
  return teams;
}

export function addPlayer(input: Omit<Player, "id" | "matches" | "runs" | "wickets" | "strikeRate" | "economy" | "recentScores" | "createdAt">) {
  const stats = input.careerStats ?? emptyCareerStats();
  const player: Player = hydratePlayer({
    ...input,
    id: createId("player"),
    image: input.image || initials(input.name),
    matches: 0,
    runs: stats.runs,
    wickets: stats.wickets,
    strikeRate: stats.strikeRate,
    economy: stats.economy,
    recentScores: [],
    createdAt: new Date().toISOString()
  });
  savePlayers([...getPlayers(), player]);
  return player;
}

export function updatePlayer(playerId: string, input: Omit<Player, "id" | "matches" | "runs" | "wickets" | "strikeRate" | "economy" | "recentScores" | "createdAt">) {
  const players = getPlayers().map((player) => (player.id === playerId ? hydratePlayer({ ...player, ...input, image: input.image || initials(input.name) }) : player));
  savePlayers(players);
  return players;
}

export function deletePlayer(playerId: string) {
  const players = getPlayers().filter((player) => player.id !== playerId);
  savePlayers(players);
  return players;
}

export function addMatch(input: Omit<Match, "id" | "matchNumber" | "innings" | "createdAt">) {
  if (input.teamAId === input.teamBId) throw new Error("Team A and Team B must be different.");
  if (!input.teamAId || !input.teamBId) throw new Error("Both teams are required.");
  if (!input.dateTime) throw new Error("Date/time is required.");
  if (!input.venue.trim()) throw new Error("Venue is required.");
  const matches = getMatches();
  const match: Match = {
    ...input,
    id: createId("match"),
    matchNumber: `EBC-${String(matches.length + 1).padStart(3, "0")}`,
    innings: [],
    createdAt: new Date().toISOString()
  };
  saveMatches([...matches, match]);
  return match;
}

export function updateMatch(matchId: string, input: Partial<Match>) {
  const matches = getMatches().map((match) => (match.id === matchId ? { ...match, ...input } : match));
  saveMatches(matches);
  return matches;
}

export function deleteMatch(matchId: string) {
  const matches = getMatches().filter((match) => match.id !== matchId);
  saveMatches(matches);
  return matches;
}

function pushMatchHistory(matches: Match[]) {
  const history = readJson<Match[][]>(HISTORY_KEY, []);
  writeJson(HISTORY_KEY, [matches, ...history].slice(0, 12), false);
}

export function startLiveMatch(matchId: string, battingTeamId: string, strikerId: string, nonStrikerId: string, bowlerId: string) {
  const matches = getMatches();
  const target = matches.find((match) => match.id === matchId);
  if (!target) throw new Error("Match not found.");
  if (!strikerId || !nonStrikerId || !bowlerId) throw new Error("Striker, non-striker, and bowler are required.");
  const bowlingTeamId = target.teamAId === battingTeamId ? target.teamBId : target.teamAId;
  const previousInnings = target.innings.find((innings) => innings.teamId === battingTeamId);
  const live: LiveMatchState = {
    matchId,
    inningsNumber: target.innings.length > 1 ? 2 : 1,
    battingTeamId,
    bowlingTeamId,
    strikerId,
    nonStrikerId,
    bowlerId,
    runs: previousInnings?.runs ?? 0,
    wickets: previousInnings?.wickets ?? 0,
    balls: previousInnings?.balls ?? 0,
    target: target.innings.length > 0 && previousInnings?.teamId !== target.innings[0]?.teamId ? target.innings[0].runs + 1 : undefined,
    partnershipRuns: 0,
    partnershipBalls: 0,
    lastSix: [],
    commentary: []
  };
  const nextMatches = matches.map((match) =>
    match.id === matchId
      ? {
          ...match,
          status: "live" as MatchStatus,
          live,
          innings: match.innings.some((innings) => innings.teamId === battingTeamId) ? match.innings : [...match.innings, emptyInnings(battingTeamId)]
        }
      : match.status === "live"
        ? { ...match, status: "upcoming" as MatchStatus, live: undefined }
        : match
  );
  saveMatches(nextMatches);
  const liveMatch = nextMatches.find((match) => match.id === matchId);
  saveLiveMatch(liveMatch);
  return liveMatch;
}

function eventLabel(type: BallEventType, runs: number) {
  if (type === "wicket") return "W";
  if (type === "wide") return "Wd";
  if (type === "no-ball") return "Nb";
  if (type === "bye") return `${runs}B`;
  if (type === "leg-bye") return `${runs}LB`;
  return String(runs);
}

function eventCommentary(label: string, type: BallEventType, striker?: Player, bowler?: Player) {
  const batter = striker?.name ?? "Batter";
  const bowlerName = bowler?.name ?? "Bowler";
  if (type === "wicket") return `${bowlerName} strikes. ${batter} is out.`;
  if (type === "four") return `${batter} finds the rope for four.`;
  if (type === "six") return `${batter} sends it over the boundary.`;
  if (type === "wide") return `${bowlerName} misses the line. Wide called.`;
  if (type === "no-ball") return `${bowlerName} oversteps. No-ball called.`;
  if (type === "bye" || type === "leg-bye") return `${label} added in extras.`;
  return `${batter} takes ${label} run${label === "1" ? "" : "s"}.`;
}

interface RecordBallEventOptions {
  syncSnapshot?: boolean;
  wicketDetails?: BallEvent["wicketDetails"];
}

export function recordBallEvent(matchId: string, type: BallEventType, value = 0, options?: RecordBallEventOptions) {
  const players = getPlayers();
  const matches = getMatches();
  const matchIndex = matches.findIndex((match) => match.id === matchId);
  if (matchIndex < 0) throw new Error("Match not found.");
  const match = matches[matchIndex];
  if (!match.live) throw new Error("Start the match before adding ball events.");
  pushMatchHistory(matches);

  const live = { ...match.live, lastSix: [...match.live.lastSix], commentary: [...match.live.commentary] };
  const innings = { ...(match.innings.find((item) => item.teamId === live.battingTeamId) ?? emptyInnings(live.battingTeamId)) };
  innings.batting = [...innings.batting];
  innings.bowling = [...innings.bowling];
  innings.fallOfWickets = [...innings.fallOfWickets];

  const legalDelivery = type !== "wide" && type !== "no-ball";
  const wicket = type === "wicket";
  const batRuns = type === "run" || type === "four" || type === "six" ? value : 0;
  const extras = type === "wide" || type === "no-ball" ? 1 : type === "bye" || type === "leg-bye" ? value : 0;
  const totalRuns = batRuns + extras;
  const nextBalls = live.balls + (legalDelivery ? 1 : 0);
  const label = eventLabel(type, value);
  const over = Math.floor(live.balls / 6);
  const ball = (live.balls % 6) + (legalDelivery ? 1 : 0);
  const striker = getPlayer(live.strikerId, players);
  const bowler = getPlayer(live.bowlerId, players);
  const fielder = options?.wicketDetails?.fielderId ? getPlayer(options.wicketDetails.fielderId, players) : undefined;
  const wicketCommentary = options?.wicketDetails?.dismissalType
    ? `${bowler?.name ?? "Bowler"} strikes. ${striker?.name ?? "Batter"} is out ${options.wicketDetails.dismissalType.toLowerCase()}${fielder ? ` by ${fielder.name}` : ""}.`
    : eventCommentary(label, type, striker, bowler);
  const event: BallEvent = {
    id: createId("ball"),
    matchId,
    inningsNumber: live.inningsNumber,
    over,
    ball,
    battingTeamId: live.battingTeamId,
    bowlingTeamId: live.bowlingTeamId,
    strikerId: live.strikerId,
    nonStrikerId: live.nonStrikerId,
    bowlerId: live.bowlerId,
    type,
    runs: batRuns,
    extras,
    wicket,
    wicketDetails: wicket ? options?.wicketDetails : undefined,
    label,
    commentary: wicketCommentary,
    createdAt: new Date().toISOString()
  };

  const battingLine = getOrCreateBatter(innings, live.strikerId);
  const bowlingLine = getOrCreateBowler(innings, live.bowlerId);

  battingLine.runs += batRuns;
  if (legalDelivery) battingLine.balls += 1;
  if (type === "four") battingLine.fours += 1;
  if (type === "six") battingLine.sixes += 1;
  if (wicket) {
    battingLine.out = true;
    battingLine.dismissal = options?.wicketDetails?.dismissalType
      ? `${options.wicketDetails.dismissalType}${fielder ? ` ${fielder.name}` : ""}`
      : `b ${bowler?.name ?? "Bowler"}`;
  }

  if (legalDelivery) bowlingLine.balls += 1;
  bowlingLine.runs += totalRuns;
  if (wicket) bowlingLine.wickets += 1;

  innings.runs += totalRuns;
  innings.extras += extras;
  innings.balls = nextBalls;
  if (wicket) {
    innings.wickets += 1;
    innings.fallOfWickets.push(`${innings.runs}/${innings.wickets}`);
    live.lastWicket = `${striker?.name ?? "Batter"} ${battingLine.runs} (${battingLine.balls})`;
  }

  live.runs = innings.runs;
  live.wickets = innings.wickets;
  live.balls = innings.balls;
  live.partnershipRuns += totalRuns;
  if (legalDelivery) live.partnershipBalls += 1;
  live.lastSix = [...live.lastSix, label].slice(-6);
  live.commentary = [event, ...live.commentary].slice(0, 80);

  const strikeChanges = legalDelivery && (batRuns % 2 === 1 || nextBalls % 6 === 0);
  if (strikeChanges) {
    const current = live.strikerId;
    live.strikerId = live.nonStrikerId;
    live.nonStrikerId = current;
  }

  if (wicket && options?.wicketDetails?.newBatsmanId) {
    const newBatsmanId = options.wicketDetails.newBatsmanId;
    if (live.nonStrikerId === newBatsmanId) live.nonStrikerId = live.strikerId;
    live.strikerId = newBatsmanId;
    getOrCreateBatter(innings, newBatsmanId);
  }

  const nextInnings = match.innings.some((item) => item.teamId === live.battingTeamId)
    ? match.innings.map((item) => (item.teamId === live.battingTeamId ? innings : item))
    : [...match.innings, innings];
  const nextMatch: Match = { ...match, status: "live", live, innings: nextInnings };
  const nextMatches = matches.map((item, index) => (index === matchIndex ? nextMatch : item));
  const previousSuppress = suppressSnapshotSync;
  if (options?.syncSnapshot === false) suppressSnapshotSync = true;
  try {
    saveMatches(nextMatches);
    saveLiveMatch(nextMatch);
  } finally {
    suppressSnapshotSync = previousSuppress;
  }
  return nextMatch;
}

export function undoLastBall() {
  const history = readJson<Match[][]>(HISTORY_KEY, []);
  const previous = history[0];
  if (!previous) return undefined;
  writeJson(HISTORY_KEY, history.slice(1), false);
  saveMatches(previous);
  return previous.find((match) => match.status === "live");
}

export function manualLiveCorrection(matchId: string, patch: Partial<Pick<LiveMatchState, "runs" | "wickets" | "balls">>) {
  const matches = getMatches().map((match) => {
    if (match.id !== matchId || !match.live) return match;
    const live = { ...match.live, ...patch };
    const innings = match.innings.map((item) =>
      item.teamId === live.battingTeamId
        ? { ...item, runs: live.runs, wickets: live.wickets, balls: live.balls }
        : item
    );
    return { ...match, live, innings };
  });
  saveMatches(matches);
  return matches.find((match) => match.id === matchId);
}

export function endCurrentInnings(matchId: string) {
  const players = getPlayers();
  const matches = getMatches();
  const match = matches.find((item) => item.id === matchId);
  if (!match?.live) return match;
  if (match.live.inningsNumber >= 2) return match;
  const nextBattingTeamId = match.live.bowlingTeamId;
  const nextBowlingTeamId = match.live.battingTeamId;
  const battingPlayers = playersForTeam(nextBattingTeamId, players);
  const bowlingPlayers = playersForTeam(nextBowlingTeamId, players);
  const live: LiveMatchState = {
    matchId,
    inningsNumber: 2,
    battingTeamId: nextBattingTeamId,
    bowlingTeamId: nextBowlingTeamId,
    strikerId: battingPlayers[0]?.id ?? "",
    nonStrikerId: battingPlayers[1]?.id ?? "",
    bowlerId: bowlingPlayers.find((player) => player.role === "Bowler" || player.role === "All-rounder")?.id ?? bowlingPlayers[0]?.id ?? "",
    runs: 0,
    wickets: 0,
    balls: 0,
    target: match.live.runs + 1,
    partnershipRuns: 0,
    partnershipBalls: 0,
    lastSix: [],
    commentary: []
  };
  const nextMatches = matches.map((item) =>
    item.id === matchId
      ? {
          ...item,
          live,
          innings: item.innings.some((innings) => innings.teamId === nextBattingTeamId)
            ? item.innings
            : [...item.innings, emptyInnings(nextBattingTeamId)]
        }
      : item
  );
  saveMatches(nextMatches);
  return nextMatches.find((item) => item.id === matchId);
}

function normalizeResultMode(match: Match, mode: ResultType | string | undefined, teamAScore: [number, number, number], teamBScore: [number, number, number]): ResultType {
  if (mode === "team-a" || mode === "team-b" || mode === "no-result" || mode === "tie") return mode;
  if (mode === match.teamAId) return "team-a";
  if (mode === match.teamBId) return "team-b";
  if (teamAScore[0] === teamBScore[0]) return "tie";
  return teamAScore[0] > teamBScore[0] ? "team-a" : "team-b";
}

export function completeMatch(
  matchId: string,
  resultMode: ResultType | string | undefined,
  teamAScore: [number, number, number],
  teamBScore: [number, number, number],
  playerOfMatch?: string,
  notes?: string
) {
  const matches = getMatches();
  const nextMatches = matches.map((match) => {
    if (match.id !== matchId) return match;
    const resultType = normalizeResultMode(match, resultMode, teamAScore, teamBScore);
    const result = buildResult(match, resultType, teamAScore, teamBScore, playerOfMatch, notes);
    return {
      ...match,
      status: "completed" as MatchStatus,
      live: undefined,
      result,
      innings:
        resultType === "no-result"
          ? match.innings
          : [
              { ...(match.innings.find((innings) => innings.teamId === match.teamAId) ?? emptyInnings(match.teamAId)), teamId: match.teamAId, runs: teamAScore[0], wickets: teamAScore[1], balls: teamAScore[2] },
              { ...(match.innings.find((innings) => innings.teamId === match.teamBId) ?? emptyInnings(match.teamBId)), teamId: match.teamBId, runs: teamBScore[0], wickets: teamBScore[1], balls: teamBScore[2] }
            ]
    };
  });
  saveMatches(nextMatches);
  saveLiveMatch(nextMatches.find((match) => match.status === "live"));
  return nextMatches;
}

export function completeLiveMatch(matchId: string) {
  const match = getMatches().find((item) => item.id === matchId);
  if (!match) return [];
  const inningsA = match.innings.find((innings) => innings.teamId === match.teamAId) ?? emptyInnings(match.teamAId);
  const inningsB = match.innings.find((innings) => innings.teamId === match.teamBId) ?? emptyInnings(match.teamBId);
  return completeMatch(
    matchId,
    inningsA.runs === inningsB.runs ? "tie" : inningsA.runs > inningsB.runs ? "team-a" : "team-b",
    [inningsA.runs, inningsA.wickets, inningsA.balls],
    [inningsB.runs, inningsB.wickets, inningsB.balls],
    undefined,
    "Completed from live scoring."
  );
}

export function getLeagueReport() {
  const teams = getTeams();
  const players = getPlayers();
  const matches = getMatches();
  const points = calculatePointsTable(teams, matches);
  const top = topPlayers(players);
  return {
    generatedAt: new Date().toISOString(),
    totalTeams: teams.length,
    totalPlayers: players.length,
    totalFixtures: matches.length,
    completedMatches: matches.filter((match) => match.status === "completed").length,
    liveMatch: matches.find((match) => match.status === "live")?.matchNumber ?? "None",
    pendingMatches: matches.filter((match) => match.status === "upcoming").length,
    topTeam: points[0] ? getTeam(points[0].teamId, teams)?.name : "TBA",
    topRunScorer: top.runs?.name ?? "TBA",
    topWicketTaker: top.wickets?.name ?? "TBA",
    playerOfTournamentCandidate: [...players].sort((a, b) => b.runs + b.wickets * 18 - (a.runs + a.wickets * 18))[0]?.name ?? "TBA",
    pointsTable: points,
    playoffBracket: calculatePlayoffBracket(points, teams)
  };
}

export function subscribeLeagueUpdates(callback: () => void) {
  if (!canUseStorage()) return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if ([TEAMS_KEY, PLAYERS_KEY, MATCHES_KEY, RESULTS_KEY, LIVE_KEY, UPDATE_KEY].includes(event.key ?? "")) callback();
  };
  const onLocal = () => callback();
  window.addEventListener("storage", onStorage);
  window.addEventListener("ebc-league-updated", onLocal);

  let channel: RealtimeChannel | null = null;
  const supabase = isSupabaseConfigured() ? getSupabaseClient() : null;
  if (supabase) {
    channel = supabase
      .channel("ebc-league-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "league_snapshots", filter: `id=eq.${LEAGUE_SNAPSHOT_ID}` },
        (payload) => {
          if (!payload.new) return;
          applyLeagueSnapshot(rowToSnapshot(payload.new as LeagueSnapshotRow), false);
          callback();
        }
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "live_matches" }, () => {
        void hydrateLeagueSnapshotFromSupabase().then(() => callback());
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "ball_events" }, () => {
        void hydrateLeagueSnapshotFromSupabase().then(() => callback());
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "fixtures" }, () => {
        void hydrateLeagueSnapshotFromSupabase().then(() => callback());
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "results" }, () => {
        void hydrateLeagueSnapshotFromSupabase().then(() => callback());
      })
      .subscribe();
  }

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("ebc-league-updated", onLocal);
    if (channel && supabase) {
      void supabase.removeChannel(channel);
    }
  };
}

type AdminAuthProvider = "supabase" | "local";

interface AdminSession {
  email: string;
  userId?: string;
  provider: AdminAuthProvider;
  loggedInAt: string;
  expiresAt: number;
}

function adminEmails() {
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@eaglebox.com";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function canAdmin(email?: string | null) {
  if (!email) return false;
  return adminEmails().includes(email.trim().toLowerCase());
}

function fallbackAdminEmail() {
  return adminEmails()[0] ?? "admin@eaglebox.com";
}

function fallbackAdminPassword() {
  return process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";
}

async function isSupabaseUserAdmin(userId?: string | null) {
  if (!userId) return false;
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { data, error } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    logLeagueSyncError("admin authorization check", error);
    return false;
  }
  return Boolean(data);
}

function writeAdminSession(email: string, provider: AdminAuthProvider, userId?: string) {
  if (!canUseStorage()) return;
  const session: AdminSession = {
    email: email.trim().toLowerCase(),
    userId,
    provider,
    loggedInAt: new Date().toISOString(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 8
  };
  window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  window.localStorage.setItem(ADMIN_KEY, "true");
}

function readAdminSession(): AdminSession | null {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(ADMIN_SESSION_KEY);
  if (raw) {
    try {
      const session = JSON.parse(raw) as AdminSession;
      if (session.email && session.expiresAt > Date.now() && (session.provider === "supabase" || canAdmin(session.email))) return session;
    } catch {
      return null;
    }
  }

  if (window.localStorage.getItem(ADMIN_KEY) === "true") {
    return {
      email: fallbackAdminEmail(),
      provider: "local",
      loggedInAt: new Date().toISOString(),
      expiresAt: Date.now() + 1000 * 60 * 60
    };
  }

  return null;
}

export async function adminLogin(email: string, password: string): Promise<{ ok: boolean; error?: string; provider?: AdminAuthProvider }> {
  const normalizedEmail = email.trim().toLowerCase();
  const supabase = isSupabaseConfigured() ? getSupabaseClient() : null;
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error || !data.session?.user.email) {
      return { ok: false, error: error?.message ?? "Unable to sign in." };
    }
    const allowed = await isSupabaseUserAdmin(data.session.user.id);
    if (!allowed) {
      await supabase.auth.signOut();
      return { ok: false, error: "You are not authorized as admin." };
    }
    writeAdminSession(data.session.user.email, "supabase", data.session.user.id);
    return { ok: true, provider: "supabase" };
  }

  if (!canAdmin(normalizedEmail)) {
    return { ok: false, error: "This email is not allowed to access admin." };
  }

  if (normalizedEmail === fallbackAdminEmail() && password === fallbackAdminPassword()) {
    writeAdminSession(normalizedEmail, "local");
    return { ok: true, provider: "local" };
  }

  return { ok: false, error: "Invalid email or password." };
}

export async function adminLogout() {
  const supabase = isSupabaseConfigured() ? getSupabaseClient() : null;
  if (supabase) {
    await supabase.auth.signOut();
  }
  if (!canUseStorage()) return;
  window.localStorage.removeItem(ADMIN_SESSION_KEY);
  window.localStorage.removeItem(ADMIN_KEY);
}

export function isAdminLoggedIn() {
  return Boolean(readAdminSession());
}

export function getCurrentAdminSession() {
  return readAdminSession();
}

export async function isAdminSessionActive() {
  const supabase = isSupabaseConfigured() ? getSupabaseClient() : null;
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (user?.email && await isSupabaseUserAdmin(user.id)) {
      writeAdminSession(user.email, "supabase", user.id);
      return true;
    }
    if (user) await supabase.auth.signOut();
    if (canUseStorage()) {
      window.localStorage.removeItem(ADMIN_SESSION_KEY);
      window.localStorage.removeItem(ADMIN_KEY);
    }
    return false;
  }
  return isAdminLoggedIn();
}
