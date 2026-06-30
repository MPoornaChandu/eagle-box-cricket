import { getSupabaseClient, isSupabaseConfigured } from "./client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BallEvent, BallEventType, BattingLine, BowlingLine, Innings, LeagueSnapshot, LiveMatchState, Match, Player, Team } from "@/lib/leagueTypes";

type JsonRecord = Record<string, unknown>;

type SupabaseErrorShape = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

type TeamMirrorRow = {
  id?: string;
  app_id?: string;
  name: string;
  short_code: string;
  captain: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
};

type PlayerMirrorRow = {
  id?: string;
  app_id?: string;
  team_id: string | null;
  name: string;
  role: string | null;
  batting_style: string | null;
  bowling_style: string | null;
  jersey_number: number | null;
  photo_url: string | null;
  bio: string | null;
};

type FixtureMirrorRow = {
  id?: string;
  app_id?: string;
  match_id: string;
  team_a_id: string | null;
  team_b_id: string | null;
  date: string | null;
  time: string | null;
  venue: string;
  match_type: string;
  status: string;
  toss_winner_id: string | null;
  elected_to: string | null;
};

export interface SupabaseLiveMatchRow {
  id: string;
  fixture_id: string | null;
  fixture_app_id: string | null;
  status: string | null;
  batting_team_id: string | null;
  bowling_team_id: string | null;
  striker_id: string | null;
  non_striker_id: string | null;
  bowler_id: string | null;
  runs: number | null;
  wickets: number | null;
  balls: number | null;
  target: number | null;
  current_run_rate: number | null;
  required_run_rate: number | null;
  partnership_runs: number | null;
  partnership_balls: number | null;
  last_wicket: string | null;
  last_six_balls: unknown;
  fall_of_wickets: unknown;
  batsmen_stats: unknown;
  bowler_stats: unknown;
  updated_at: string | null;
}

export interface SupabaseBallEventRow {
  id: string;
  app_id: string | null;
  live_match_id: string | null;
  fixture_id: string | null;
  over_number: number | null;
  ball_number: number | null;
  legal_ball: boolean | null;
  runs: number | null;
  extra_type: string | null;
  extra_runs: number | null;
  is_wicket: boolean | null;
  wicket_type: string | null;
  batsman_id: string | null;
  bowler_id: string | null;
  commentary: string | null;
  payload: unknown;
  created_at: string | null;
}

interface LiveScoreMirrorIds {
  fixtureId: string | null;
  teamIds: Map<string, string>;
  playerIds: Map<string, string>;
}

interface LiveScoreReferences {
  fixtureId: string | null;
  battingTeamId: string | null;
  bowlingTeamId: string | null;
  strikerId: string | null;
  nonStrikerId: string | null;
  bowlerId: string | null;
}

type LiveMatchWriteRow = {
  fixture_id: string | null;
  fixture_app_id: string;
  status: "live";
  batting_team_id: string | null;
  bowling_team_id: string | null;
  striker_id: string | null;
  non_striker_id: string | null;
  bowler_id: string | null;
  runs: number;
  wickets: number;
  balls: number;
  target: number | null;
  current_run_rate: number;
  required_run_rate: number | null;
  partnership_runs: number;
  partnership_balls: number;
  last_wicket: string | null;
  last_six_balls: string[];
  fall_of_wickets: string[];
  batsmen_stats: Record<string, unknown>;
  bowler_stats: Record<string, unknown>;
  updated_at: string;
};

type BallEventInsertRow = {
  app_id: string;
  live_match_id: string;
  fixture_id: string | null;
  over_number: number;
  ball_number: number;
  legal_ball: boolean;
  runs: number;
  extra_type: string | null;
  extra_runs: number;
  is_wicket: boolean;
  wicket_type: string | null;
  batsman_id: string | null;
  bowler_id: string | null;
  commentary: string;
  payload: BallEvent;
  created_at: string;
};

interface LiveAppMeta {
  matchId: string;
  matchNumber: string;
  battingTeamId: string;
  bowlingTeamId: string;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  inningsNumber: number;
}

export interface StartSupabaseLiveMatchPayload {
  match: Match;
  teams: Team[];
  players: Player[];
}

export interface ApplySupabaseBallUpdateParams {
  match: Match;
  event?: BallEvent;
  currentLiveMatch?: SupabaseLiveMatchRow | null;
}

function requireSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  return supabase;
}

export function formatSupabaseError(error: unknown) {
  if (!error) return "Unknown Supabase error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;

  const maybe = error as SupabaseErrorShape;
  const formatted = [
    maybe.message,
    maybe.details,
    maybe.hint,
    maybe.code ? `Code: ${maybe.code}` : undefined
  ].filter(Boolean).join(" | ");

  if (formatted) return formatted;

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown Supabase error";
  }
}

function handleSupabaseError(scope: string, error: unknown): never {
  const formatted = formatSupabaseError(error);
  console.error("Supabase live score error:", formatted, error);
  throw new Error(`Could not update Supabase live score: ${scope}: ${formatted}`);
}

function mirrorSupabaseError(scope: string, error: unknown) {
  return new Error(`${scope}: ${formatSupabaseError(error)}`);
}

function warnMirrorError(scope: string, error: unknown) {
  console.warn("Mirror rows failed but live scoring will continue", `${scope}: ${formatSupabaseError(error)}`, error);
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function appMeta(match: Match): LiveAppMeta {
  const live = match.live;
  if (!live) throw new Error("Match is not live.");
  return {
    matchId: match.id,
    matchNumber: match.matchNumber,
    battingTeamId: live.battingTeamId,
    bowlingTeamId: live.bowlingTeamId,
    strikerId: live.strikerId,
    nonStrikerId: live.nonStrikerId,
    bowlerId: live.bowlerId,
    inningsNumber: live.inningsNumber
  };
}

function extractAppMeta(row: SupabaseLiveMatchRow): LiveAppMeta | undefined {
  const candidates = [row.batsmen_stats, row.bowler_stats];
  for (const candidate of candidates) {
    if (!isRecord(candidate) || !isRecord(candidate.__app)) continue;
    const meta = candidate.__app;
    if (
      typeof meta.matchId === "string" &&
      typeof meta.matchNumber === "string" &&
      typeof meta.battingTeamId === "string" &&
      typeof meta.bowlingTeamId === "string" &&
      typeof meta.strikerId === "string" &&
      typeof meta.nonStrikerId === "string" &&
      typeof meta.bowlerId === "string"
    ) {
      return {
        matchId: meta.matchId,
        matchNumber: meta.matchNumber,
        battingTeamId: meta.battingTeamId,
        bowlingTeamId: meta.bowlingTeamId,
        strikerId: meta.strikerId,
        nonStrikerId: meta.nonStrikerId,
        bowlerId: meta.bowlerId,
        inningsNumber: typeof meta.inningsNumber === "number" ? meta.inningsNumber : 1
      };
    }
  }
  return undefined;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isMissingColumnError(error: unknown, columnName?: string) {
  const formatted = formatSupabaseError(error).toLowerCase();
  const missingColumn = formatted.includes("column") && (formatted.includes("does not exist") || formatted.includes("could not find") || formatted.includes("schema cache"));
  return missingColumn && (!columnName || formatted.includes(columnName.toLowerCase()));
}

function initials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function fallbackShortCode(name: string) {
  return initials(name) || name.trim().slice(0, 3).toUpperCase() || "EB";
}

function field<T>(source: unknown, camelName: string, snakeName: string, fallback: T): T {
  if (!isRecord(source)) return fallback;
  const camel = source[camelName];
  if (camel !== undefined && camel !== null) return camel as T;
  const snake = source[snakeName];
  if (snake !== undefined && snake !== null) return snake as T;
  return fallback;
}

function stripOptionalTeamColumns(row: TeamMirrorRow): TeamMirrorRow {
  const { logo_url: _logoUrl, primary_color: _primaryColor, ...core } = row;
  return core;
}

async function assertAdminAccess(supabase: SupabaseClient) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) handleSupabaseError("Could not verify admin session", userError);
  const user = userData.user;
  if (!user) throw new Error("Admin session expired. Please log in again.");

  const { data: adminRow, error: adminError } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (adminError) handleSupabaseError("Could not verify admin authorization", adminError);
  if (!adminRow) throw new Error("You are signed in but not authorized as admin.");
}

async function safeReferenceId(supabase: SupabaseClient, tableName: "fixtures" | "teams" | "players", id?: string | null) {
  if (!id || !isUuid(id)) return null;
  const { data, error } = await supabase.from(tableName).select("id").eq("id", id).maybeSingle();
  if (error || !data) {
    if (error) {
      console.warn("Supabase live score mirror warning:", formatSupabaseError(error), error);
    }
    return null;
  }
  return (data as { id: string }).id;
}

function toDateParts(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: null, time: null, matchDate: null };
  return {
    date: date.toISOString().slice(0, 10),
    time: date.toISOString().slice(11, 16),
    matchDate: date.toISOString()
  };
}

function calculateRunRate(runs: number, balls: number) {
  return balls > 0 ? Number((runs / (balls / 6)).toFixed(2)) : 0;
}

function calculateStrikeRate(runs: number, balls: number) {
  return balls > 0 ? Number(((runs / balls) * 100).toFixed(2)) : 0;
}

function calculateEconomy(runs: number, balls: number) {
  return balls > 0 ? Number((runs / (balls / 6)).toFixed(2)) : 0;
}

function calculateRequiredRunRate(live: LiveMatchState, maxOvers = 20) {
  if (!live.target || live.inningsNumber < 2) return null;
  const runsRequired = Math.max(live.target - live.runs, 0);
  const ballsRemaining = Math.max(maxOvers * 6 - live.balls, 0);
  if (ballsRemaining <= 0) return runsRequired > 0 ? null : 0;
  return Number((runsRequired / (ballsRemaining / 6)).toFixed(2));
}

function ballsToOvers(balls: number) {
  const safeBalls = Math.max(0, Number(balls) || 0);
  return `${Math.floor(safeBalls / 6)}.${safeBalls % 6}`;
}

function idMap(rows: Array<{ id: string; app_id?: string | null }>) {
  const map = new Map<string, string>();
  rows.forEach((row) => {
    if (row.app_id) map.set(row.app_id, row.id);
  });
  return map;
}

function toSupabaseTeam(team: Team, useUuidId: boolean): TeamMirrorRow {
  const row: TeamMirrorRow = {
    name: team.name,
    short_code: field<string>(team, "shortCode", "short_code", fallbackShortCode(team.name)),
    captain: field<string | null>(team, "captain", "captain", null),
    logo_url: field<string | null>(team, "logoUrl", "logo_url", team.logo ?? null),
    primary_color: field<string | null>(team, "primaryColor", "primary_color", null)
  };

  if (useUuidId) row.id = team.id;
  else row.app_id = team.id;

  return row;
}

function toSupabasePlayer(player: Player, teamId: string | null, useUuidId: boolean): PlayerMirrorRow {
  const row: PlayerMirrorRow = {
    team_id: teamId,
    name: player.name,
    role: field<string | null>(player, "role", "role", null),
    batting_style: field<string | null>(player, "battingStyle", "batting_style", null),
    bowling_style: field<string | null>(player, "bowlingStyle", "bowling_style", null),
    jersey_number: field<number | null>(player, "jerseyNumber", "jersey_number", null),
    photo_url: field<string | null>(player, "photoUrl", "photo_url", player.image ?? null),
    bio: field<string | null>(player, "bio", "bio", null)
  };

  if (useUuidId) row.id = player.id;
  else row.app_id = player.id;

  return row;
}

function toSupabaseFixture(match: Match, teamIds: Map<string, string>, useUuidId: boolean): FixtureMirrorRow {
  const dateParts = toDateParts(match.dateTime);
  const row: FixtureMirrorRow = {
    match_id: match.matchNumber,
    team_a_id: teamIds.get(match.teamAId) ?? null,
    team_b_id: teamIds.get(match.teamBId) ?? null,
    date: dateParts.date,
    time: dateParts.time,
    venue: match.venue,
    match_type: match.matchType,
    status: match.status,
    toss_winner_id: match.tossWinnerId ? teamIds.get(match.tossWinnerId) ?? null : null,
    elected_to: match.tossDecision ?? null
  };

  if (useUuidId) row.id = match.id;
  else row.app_id = match.id;

  return row;
}

async function mirrorTeamsByName(supabase: SupabaseClient, teams: Team[]) {
  const teamIds = new Map<string, string>();

  for (const team of teams) {
    const row = stripOptionalTeamColumns(toSupabaseTeam(team, false));
    const { data: existingByName, error: nameError } = await supabase
      .from("teams")
      .select("id")
      .eq("name", row.name)
      .limit(1)
      .maybeSingle();
    if (nameError) {
      warnMirrorError("Could not find mirrored team by name", nameError);
      continue;
    }

    const existing = existingByName as { id: string } | null;
    if (existing?.id) {
      teamIds.set(team.id, existing.id);
      continue;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("teams")
      .insert(row)
      .select("id")
      .single();
    if (insertError) {
      warnMirrorError("Could not insert mirrored team", insertError);
      continue;
    }
    teamIds.set(team.id, (inserted as { id: string }).id);
  }

  return teamIds;
}

async function mirrorPlayersByName(supabase: SupabaseClient, players: Player[], teamIds: Map<string, string>) {
  const playerIds = new Map<string, string>();

  for (const player of players) {
    const row = toSupabasePlayer(player, teamIds.get(player.teamId) ?? null, false);
    delete row.app_id;

    let query = supabase.from("players").select("id").eq("name", row.name);
    if (row.team_id) query = query.eq("team_id", row.team_id);
    const { data: existingByName, error: nameError } = await query.limit(1).maybeSingle();
    if (nameError) {
      warnMirrorError("Could not find mirrored player by name", nameError);
      continue;
    }

    const existing = existingByName as { id: string } | null;
    if (existing?.id) {
      playerIds.set(player.id, existing.id);
      continue;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("players")
      .insert(row)
      .select("id")
      .single();
    if (insertError) {
      warnMirrorError("Could not insert mirrored player", insertError);
      continue;
    }
    playerIds.set(player.id, (inserted as { id: string }).id);
  }

  return playerIds;
}

async function ensureMirrorRows(match: Match, teams: Team[], players: Player[]): Promise<LiveScoreMirrorIds> {
  const supabase = requireSupabase();
  const useUuidTeamIds = teams.every((team) => isUuid(team.id));
  const useUuidPlayerIds = players.every((player) => isUuid(player.id));
  const useUuidMatchId = isUuid(match.id);

  const teamRows = teams.map((team) => toSupabaseTeam(team, useUuidTeamIds));
  const teamConflict = useUuidTeamIds ? "id" : "app_id";
  let { data: savedTeams, error: teamError } = await supabase
    .from("teams")
    .upsert(teamRows, { onConflict: teamConflict })
    .select(useUuidTeamIds ? "id" : "id,app_id");

  if (teamError && (isMissingColumnError(teamError, "logo_url") || isMissingColumnError(teamError, "primary_color"))) {
    const fallbackTeamRows = teamRows.map(stripOptionalTeamColumns);
    const fallback = await supabase
      .from("teams")
      .upsert(fallbackTeamRows, { onConflict: teamConflict })
      .select(useUuidTeamIds ? "id" : "id,app_id");
    savedTeams = fallback.data;
    teamError = fallback.error;
  }

  if (teamError && !useUuidTeamIds && isMissingColumnError(teamError, "app_id")) {
    const teamIds = await mirrorTeamsByName(supabase, teams);
    return ensurePlayersAndFixture(supabase, match, players, teamIds, useUuidPlayerIds, useUuidMatchId);
  }

  if (teamError) throw mirrorSupabaseError("Could not sync teams to Supabase", teamError);

  const teamIds = useUuidTeamIds
    ? new Map(teams.map((team) => [team.id, team.id]))
    : idMap((savedTeams ?? []) as unknown as Array<{ id: string; app_id: string | null }>);

  return ensurePlayersAndFixture(supabase, match, players, teamIds, useUuidPlayerIds, useUuidMatchId);
}

async function ensurePlayersAndFixture(
  supabase: SupabaseClient,
  match: Match,
  players: Player[],
  teamIds: Map<string, string>,
  useUuidPlayerIds: boolean,
  useUuidMatchId: boolean
): Promise<LiveScoreMirrorIds> {
  const playerRows = players.map((player) => toSupabasePlayer(player, teamIds.get(player.teamId) ?? null, useUuidPlayerIds));
  const playerConflict = useUuidPlayerIds ? "id" : "app_id";
  const { data: savedPlayers, error: playerError } = await supabase
    .from("players")
    .upsert(playerRows, { onConflict: playerConflict })
    .select(useUuidPlayerIds ? "id" : "id,app_id");

  if (playerError && !useUuidPlayerIds && isMissingColumnError(playerError, "app_id")) {
    const playerIds = await mirrorPlayersByName(supabase, players, teamIds);
    const fixtureId = await ensureFixtureRow(supabase, match, teamIds, useUuidMatchId);
    return { fixtureId, teamIds, playerIds };
  }

  if (playerError) throw mirrorSupabaseError("Could not sync players to Supabase", playerError);

  const playerIds = useUuidPlayerIds
    ? new Map(players.map((player) => [player.id, player.id]))
    : idMap((savedPlayers ?? []) as unknown as Array<{ id: string; app_id: string | null }>);
  const fixtureId = await ensureFixtureRow(supabase, match, teamIds, useUuidMatchId);

  return {
    fixtureId,
    teamIds,
    playerIds
  };
}

async function ensureFixtureRow(supabase: SupabaseClient, match: Match, teamIds: Map<string, string>, useUuidMatchId: boolean) {
  const fixtureRow = toSupabaseFixture(match, teamIds, useUuidMatchId);
  const fixtureConflict = useUuidMatchId ? "id" : "app_id";
  const { data: savedFixture, error: fixtureError } = await supabase
    .from("fixtures")
    .upsert(fixtureRow, { onConflict: fixtureConflict })
    .select("id")
    .single();
  if (fixtureError) throw mirrorSupabaseError("Could not sync fixture to Supabase", fixtureError);
  return (savedFixture as { id: string }).id;
}

async function bestEffortMirrorRows(match: Match, teams: Team[], players: Player[]): Promise<LiveScoreMirrorIds> {
  try {
    return await ensureMirrorRows(match, teams, players);
  } catch (error) {
    console.warn("Mirror rows failed but live scoring will continue", formatSupabaseError(error), error);
    return {
      fixtureId: null,
      teamIds: new Map(),
      playerIds: new Map()
    };
  }
}

async function resolveLiveReferences(
  supabase: SupabaseClient,
  match: Match,
  ids: LiveScoreMirrorIds
): Promise<LiveScoreReferences> {
  const live = match.live;
  if (!live) throw new Error("Match is not live.");

  return {
    fixtureId: ids.fixtureId ?? await safeReferenceId(supabase, "fixtures", match.id),
    battingTeamId: ids.teamIds.get(live.battingTeamId) ?? await safeReferenceId(supabase, "teams", live.battingTeamId),
    bowlingTeamId: ids.teamIds.get(live.bowlingTeamId) ?? await safeReferenceId(supabase, "teams", live.bowlingTeamId),
    strikerId: ids.playerIds.get(live.strikerId) ?? await safeReferenceId(supabase, "players", live.strikerId),
    nonStrikerId: ids.playerIds.get(live.nonStrikerId) ?? await safeReferenceId(supabase, "players", live.nonStrikerId),
    bowlerId: ids.playerIds.get(live.bowlerId) ?? await safeReferenceId(supabase, "players", live.bowlerId)
  };
}

function buildBatsmenStats(match: Match, playerIds: Map<string, string>) {
  const live = match.live;
  if (!live) return {};
  const innings = match.innings.find((item) => item.teamId === live.battingTeamId);
  return {
    __app: appMeta(match),
    ...Object.fromEntries(
      (innings?.batting ?? []).map((line) => [
        playerIds.get(line.playerId) ?? line.playerId,
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
    )
  };
}

function buildBowlerStats(match: Match, playerIds: Map<string, string>) {
  const live = match.live;
  if (!live) return {};
  const innings = match.innings.find((item) => item.teamId === live.battingTeamId);
  return {
    __app: appMeta(match),
    ...Object.fromEntries(
      (innings?.bowling ?? []).map((line) => [
        playerIds.get(line.playerId) ?? line.playerId,
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
    )
  };
}

function liveMatchPatch(match: Match, refs: LiveScoreReferences, playerIds: Map<string, string>): LiveMatchWriteRow {
  const live = match.live;
  if (!live) throw new Error("Match is not live.");
  const innings = match.innings.find((item) => item.teamId === live.battingTeamId);

  return {
    fixture_id: refs.fixtureId,
    fixture_app_id: match.id,
    status: "live",
    batting_team_id: refs.battingTeamId,
    bowling_team_id: refs.bowlingTeamId,
    striker_id: refs.strikerId,
    non_striker_id: refs.nonStrikerId,
    bowler_id: refs.bowlerId,
    runs: live.runs,
    wickets: live.wickets,
    balls: live.balls,
    target: live.target ?? null,
    current_run_rate: calculateRunRate(live.runs, live.balls),
    required_run_rate: calculateRequiredRunRate(live),
    partnership_runs: live.partnershipRuns,
    partnership_balls: live.partnershipBalls,
    last_wicket: live.lastWicket ?? null,
    last_six_balls: live.lastSix,
    fall_of_wickets: innings?.fallOfWickets ?? [],
    batsmen_stats: buildBatsmenStats(match, playerIds),
    bowler_stats: buildBowlerStats(match, playerIds),
    updated_at: new Date().toISOString()
  };
}

function ballEventRow(event: BallEvent, liveMatchId: string, refs: LiveScoreReferences): BallEventInsertRow {
  return {
    app_id: event.id,
    live_match_id: liveMatchId,
    fixture_id: refs.fixtureId,
    over_number: event.over,
    ball_number: event.ball,
    legal_ball: event.type !== "wide" && event.type !== "no-ball",
    runs: event.runs,
    extra_type: event.extras ? event.type : null,
    extra_runs: event.extras,
    is_wicket: event.wicket,
    wicket_type: event.wicket ? event.type : null,
    batsman_id: refs.strikerId,
    bowler_id: refs.bowlerId,
    commentary: event.commentary,
    payload: event,
    created_at: event.createdAt
  };
}

function liveRowMatchesAppMatch(row: SupabaseLiveMatchRow | null | undefined, match: Match) {
  if (!row) return false;
  const meta = extractAppMeta(row);
  return row.fixture_app_id === match.id || row.fixture_id === match.id || meta?.matchId === match.id;
}

function knownReferenceMaps(row: SupabaseLiveMatchRow) {
  const meta = extractAppMeta(row);
  const teamIds = new Map<string, string>();
  const playerIds = new Map<string, string>();

  if (meta?.battingTeamId && row.batting_team_id) teamIds.set(meta.battingTeamId, row.batting_team_id);
  if (meta?.bowlingTeamId && row.bowling_team_id) teamIds.set(meta.bowlingTeamId, row.bowling_team_id);
  if (meta?.strikerId && row.striker_id) playerIds.set(meta.strikerId, row.striker_id);
  if (meta?.nonStrikerId && row.non_striker_id) playerIds.set(meta.nonStrikerId, row.non_striker_id);
  if (meta?.bowlerId && row.bowler_id) playerIds.set(meta.bowlerId, row.bowler_id);

  return { teamIds, playerIds };
}

function referencesFromLiveRow(row: SupabaseLiveMatchRow, match: Match, ids: Pick<LiveScoreMirrorIds, "teamIds" | "playerIds">): LiveScoreReferences {
  const live = match.live;
  if (!live) throw new Error("Match is not live.");
  return {
    fixtureId: row.fixture_id,
    battingTeamId: ids.teamIds.get(live.battingTeamId) ?? row.batting_team_id,
    bowlingTeamId: ids.teamIds.get(live.bowlingTeamId) ?? row.bowling_team_id,
    strikerId: ids.playerIds.get(live.strikerId) ?? row.striker_id,
    nonStrikerId: ids.playerIds.get(live.nonStrikerId) ?? row.non_striker_id,
    bowlerId: ids.playerIds.get(live.bowlerId) ?? row.bowler_id
  };
}

function referencesFromBallEvent(row: SupabaseLiveMatchRow, event: BallEvent, liveRefs: LiveScoreReferences, ids: Pick<LiveScoreMirrorIds, "playerIds">): LiveScoreReferences {
  return {
    ...liveRefs,
    strikerId: ids.playerIds.get(event.strikerId) ?? liveRefs.strikerId ?? row.striker_id,
    nonStrikerId: ids.playerIds.get(event.nonStrikerId) ?? liveRefs.nonStrikerId ?? row.non_striker_id,
    bowlerId: ids.playerIds.get(event.bowlerId) ?? liveRefs.bowlerId ?? row.bowler_id
  };
}

function emptyLiveReferences(): LiveScoreReferences {
  return {
    fixtureId: null,
    battingTeamId: null,
    bowlingTeamId: null,
    strikerId: null,
    nonStrikerId: null,
    bowlerId: null
  };
}

export async function getActiveLiveMatch(): Promise<SupabaseLiveMatchRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("live_matches")
    .select("*")
    .eq("status", "live")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) handleSupabaseError("Fetch active live match", error);
  return (data ?? null) as SupabaseLiveMatchRow | null;
}

export async function getLiveMatchByFixture(fixtureId: string): Promise<SupabaseLiveMatchRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = requireSupabase();
  const query = supabase.from("live_matches").select("*");
  const { data, error } = isUuid(fixtureId)
    ? await query.eq("fixture_id", fixtureId).order("updated_at", { ascending: false }).limit(1).maybeSingle()
    : await query.eq("fixture_app_id", fixtureId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (error) handleSupabaseError("Fetch live match by fixture", error);
  return (data ?? await getActiveLiveMatch()) as SupabaseLiveMatchRow | null;
}

async function saveActiveLiveMatch(supabase: SupabaseClient, row: LiveMatchWriteRow): Promise<SupabaseLiveMatchRow> {
  const { data: existing, error: existingError } = await supabase
    .from("live_matches")
    .select("*")
    .eq("status", "live")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingError) handleSupabaseError("Fetch active live match before write", existingError);

  if (existing?.id) {
    const { data, error } = await supabase
      .from("live_matches")
      .update(row)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) handleSupabaseError("Update active live match", error);
    console.log("Live match saved to Supabase", data);
    return data as SupabaseLiveMatchRow;
  }

  const { data, error } = await supabase
    .from("live_matches")
    .insert(row)
    .select("*")
    .single();
  if (error) handleSupabaseError("Insert active live match", error);
  console.log("Live match saved to Supabase", data);
  return data as SupabaseLiveMatchRow;
}

export async function startSupabaseLiveMatch(payload: StartSupabaseLiveMatchPayload): Promise<SupabaseLiveMatchRow> {
  const supabase = requireSupabase();
  await assertAdminAccess(supabase);
  const ids = await bestEffortMirrorRows(payload.match, payload.teams, payload.players);
  const refs = await resolveLiveReferences(supabase, payload.match, ids);
  const row = liveMatchPatch(payload.match, refs, ids.playerIds);
  console.log("Starting Supabase live match", row);

  return saveActiveLiveMatch(supabase, row);
}

export async function updateSupabaseLiveMatch(liveMatchId: string, patch: Partial<SupabaseLiveMatchRow>): Promise<SupabaseLiveMatchRow> {
  const supabase = requireSupabase();
  await assertAdminAccess(supabase);
  const { data, error } = await supabase
    .from("live_matches")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", liveMatchId)
    .select("*")
    .single();
  if (error) handleSupabaseError("Update live_matches", error);
  console.log("Updated live_matches", data);
  return data as SupabaseLiveMatchRow;
}

export async function insertSupabaseBallEvent(event: BallEventInsertRow): Promise<SupabaseBallEventRow> {
  const supabase = requireSupabase();
  await assertAdminAccess(supabase);
  console.log("Inserted ball event", event);
  const { data, error } = await supabase
    .from("ball_events")
    .insert(event)
    .select("*")
    .single();
  if (error) handleSupabaseError("Insert ball event", error);
  return data as SupabaseBallEventRow;
}

export async function applySupabaseBallUpdate(params: ApplySupabaseBallUpdateParams): Promise<{ liveMatch: SupabaseLiveMatchRow; ballEvent?: SupabaseBallEventRow }> {
  const supabase = requireSupabase();
  const existingLiveMatch = liveRowMatchesAppMatch(params.currentLiveMatch, params.match)
    ? params.currentLiveMatch
    : await getLiveMatchByFixture(params.match.id);

  if (!existingLiveMatch) {
    const refs = emptyLiveReferences();
    const { data: liveMatch, error: liveMatchError } = await supabase
      .from("live_matches")
      .insert(liveMatchPatch(params.match, refs, new Map()))
      .select("*")
      .single();
    if (liveMatchError) handleSupabaseError("Insert live_matches for ball update", liveMatchError);

    const insertedLiveMatch = liveMatch as SupabaseLiveMatchRow;
    const { data: insertedEvent, error: ballEventError } = params.event
      ? await supabase
          .from("ball_events")
          .insert(ballEventRow(params.event, insertedLiveMatch.id, refs))
          .select("*")
          .single()
      : { data: undefined, error: null };
    if (ballEventError) handleSupabaseError("Insert ball_events for new live match", ballEventError);
    return { liveMatch: insertedLiveMatch, ballEvent: insertedEvent };
  }

  const ids = knownReferenceMaps(existingLiveMatch);
  const liveRefs = referencesFromLiveRow(existingLiveMatch, params.match, ids);
  const liveMatchWrite = supabase
    .from("live_matches")
    .update(liveMatchPatch(params.match, liveRefs, ids.playerIds))
    .eq("id", existingLiveMatch.id)
    .select("*")
    .single();
  const ballEventWrite = params.event
    ? supabase
        .from("ball_events")
        .insert(ballEventRow(params.event, existingLiveMatch.id, referencesFromBallEvent(existingLiveMatch, params.event, liveRefs, ids)))
        .select("*")
        .single()
    : Promise.resolve({ data: undefined, error: null });

  const [liveMatchResult, ballEventResult] = await Promise.all([liveMatchWrite, ballEventWrite]);
  if (liveMatchResult.error) handleSupabaseError("Update live_matches for ball update", liveMatchResult.error);
  if (ballEventResult.error) handleSupabaseError("Insert ball_events for ball update", ballEventResult.error);

  console.log("Fast Supabase ball update saved", { liveMatch: liveMatchResult.data, ballEvent: ballEventResult.data });
  return {
    liveMatch: liveMatchResult.data as SupabaseLiveMatchRow,
    ballEvent: ballEventResult.data as SupabaseBallEventRow | undefined
  };
}

export async function fetchRecentBallEvents(liveMatchId: string): Promise<SupabaseBallEventRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("ball_events")
    .select("*")
    .eq("live_match_id", liveMatchId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) handleSupabaseError("Fetch recent ball events", error);
  return (data ?? []) as SupabaseBallEventRow[];
}

function battingLinesFromStats(stats: unknown, fallback: BattingLine[]) {
  if (!isRecord(stats)) return fallback;
  const lines = Object.entries(stats)
    .filter(([key, value]) => key !== "__app" && isRecord(value) && typeof value.appPlayerId === "string")
    .map(([, value]) => value as JsonRecord)
    .map<BattingLine>((value) => ({
      playerId: String(value.appPlayerId),
      runs: typeof value.runs === "number" ? value.runs : 0,
      balls: typeof value.balls === "number" ? value.balls : 0,
      fours: typeof value.fours === "number" ? value.fours : 0,
      sixes: typeof value.sixes === "number" ? value.sixes : 0,
      out: Boolean(value.out),
      dismissal: typeof value.dismissal === "string" ? value.dismissal : undefined
    }));
  return lines.length ? lines : fallback;
}

function bowlingLinesFromStats(stats: unknown, fallback: BowlingLine[]) {
  if (!isRecord(stats)) return fallback;
  const lines = Object.entries(stats)
    .filter(([key, value]) => key !== "__app" && isRecord(value) && typeof value.appPlayerId === "string")
    .map(([, value]) => value as JsonRecord)
    .map<BowlingLine>((value) => ({
      playerId: String(value.appPlayerId),
      balls: typeof value.balls === "number" ? value.balls : 0,
      maidens: typeof value.maidens === "number" ? value.maidens : 0,
      runs: typeof value.runs === "number" ? value.runs : 0,
      wickets: typeof value.wickets === "number" ? value.wickets : 0
    }));
  return lines.length ? lines : fallback;
}

function eventTypeFromRow(row: SupabaseBallEventRow): BallEventType {
  if (row.is_wicket) return "wicket";
  if (row.extra_type === "wide" || row.extra_type === "no-ball" || row.extra_type === "bye" || row.extra_type === "leg-bye") return row.extra_type;
  if (row.runs === 4) return "four";
  if (row.runs === 6) return "six";
  return "run";
}

function ballLabel(type: BallEventType, runs: number, extras: number) {
  if (type === "wicket") return "W";
  if (type === "wide") return "Wd";
  if (type === "no-ball") return "Nb";
  if (type === "bye") return `${extras}B`;
  if (type === "leg-bye") return `${extras}LB`;
  return String(runs);
}

function rowToBallEvent(row: SupabaseBallEventRow, live: LiveMatchState): BallEvent {
  if (isRecord(row.payload) && typeof row.payload.id === "string") {
    return row.payload as unknown as BallEvent;
  }
  const type = eventTypeFromRow(row);
  const runs = row.runs ?? 0;
  const extras = row.extra_runs ?? 0;
  return {
    id: row.app_id ?? row.id,
    matchId: live.matchId,
    inningsNumber: live.inningsNumber,
    over: row.over_number ?? Math.floor(live.balls / 6),
    ball: row.ball_number ?? live.balls % 6,
    battingTeamId: live.battingTeamId,
    bowlingTeamId: live.bowlingTeamId,
    strikerId: live.strikerId,
    nonStrikerId: live.nonStrikerId,
    bowlerId: live.bowlerId,
    type,
    runs,
    extras,
    wicket: Boolean(row.is_wicket),
    label: ballLabel(type, runs, extras),
    commentary: row.commentary ?? "Live ball update.",
    createdAt: row.created_at ?? new Date().toISOString()
  };
}

export function applySupabaseLiveToSnapshot(
  snapshot: LeagueSnapshot,
  row?: SupabaseLiveMatchRow | null,
  ballRows: SupabaseBallEventRow[] = []
): LeagueSnapshot {
  if (!row || row.status !== "live") return snapshot;
  const meta = extractAppMeta(row);
  const matchId = row.fixture_app_id ?? meta?.matchId;
  if (!matchId) return snapshot;
  const match = snapshot.matches.find((item) => item.id === matchId);
  if (!match) return snapshot;

  const previousLive = match.live;
  const live: LiveMatchState = {
    matchId,
    inningsNumber: meta?.inningsNumber ?? previousLive?.inningsNumber ?? 1,
    battingTeamId: meta?.battingTeamId ?? previousLive?.battingTeamId ?? match.teamAId,
    bowlingTeamId: meta?.bowlingTeamId ?? previousLive?.bowlingTeamId ?? match.teamBId,
    strikerId: meta?.strikerId ?? previousLive?.strikerId ?? "",
    nonStrikerId: meta?.nonStrikerId ?? previousLive?.nonStrikerId ?? "",
    bowlerId: meta?.bowlerId ?? previousLive?.bowlerId ?? "",
    runs: row.runs ?? 0,
    wickets: row.wickets ?? 0,
    balls: row.balls ?? 0,
    target: row.target ?? undefined,
    partnershipRuns: row.partnership_runs ?? 0,
    partnershipBalls: row.partnership_balls ?? 0,
    lastWicket: row.last_wicket ?? undefined,
    lastSix: stringArray(row.last_six_balls),
    commentary: []
  };
  live.commentary = ballRows.map((ballRow) => rowToBallEvent(ballRow, live));

  const previousInnings = match.innings.find((innings) => innings.teamId === live.battingTeamId);
  const currentInnings: Innings = {
    teamId: live.battingTeamId,
    runs: live.runs,
    wickets: live.wickets,
    balls: live.balls,
    extras: previousInnings?.extras ?? 0,
    batting: battingLinesFromStats(row.batsmen_stats, previousInnings?.batting ?? []),
    bowling: bowlingLinesFromStats(row.bowler_stats, previousInnings?.bowling ?? []),
    fallOfWickets: stringArray(row.fall_of_wickets)
  };
  const innings = match.innings.some((item) => item.teamId === live.battingTeamId)
    ? match.innings.map((item) => (item.teamId === live.battingTeamId ? currentInnings : item))
    : [...match.innings, currentInnings];
  const liveMatch: Match = { ...match, status: "live", live, innings };
  const matches = snapshot.matches.map((item) =>
    item.id === match.id
      ? liveMatch
      : item.status === "live"
        ? { ...item, status: "upcoming" as const, live: undefined }
        : item
  );

  return { ...snapshot, matches, liveMatch };
}
