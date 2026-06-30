export type MatchStatus = "upcoming" | "live" | "completed";

export type PlayerRole = "Batter" | "Bowler" | "All-rounder" | "Wicketkeeper";

export type BallEventType =
  | "run"
  | "four"
  | "six"
  | "wicket"
  | "wide"
  | "no-ball"
  | "bye"
  | "leg-bye";

export type ResultType = "team-a" | "team-b" | "no-result" | "tie";

export interface Team {
  id: string;
  name: string;
  shortCode: string;
  captain: string;
  logo: string;
  primaryColor: string;
  matches: number;
  wins: number;
  createdAt: string;
}

export interface PlayerCareerStats {
  battingMatches: number;
  battingInnings: number;
  runs: number;
  highestScore: number;
  battingAverage: number;
  strikeRate: number;
  fifties: number;
  hundreds: number;
  ducks: number;
  fours: number;
  sixes: number;
  bowlingMatches: number;
  bowlingInnings: number;
  wickets: number;
  bestBowling: string;
  bowlingAverage: number;
  economy: number;
  bowlingStrikeRate: number;
  fiveWicketHauls: number;
  catches: number;
  runOuts: number;
  stumpings: number;
  playerOfMatchAwards: number;
}

export interface PlayerMatchPerformance {
  id: string;
  matchId: string;
  date: string;
  opponent: string;
  runs: number;
  balls: number;
  wickets: number;
  bowlingRuns: number;
  bowlingBalls: number;
  catches: number;
  note: string;
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  role: PlayerRole;
  battingStyle: string;
  bowlingStyle: string;
  jerseyNumber: number;
  image: string;
  dateOfBirth?: string;
  nationality?: string;
  bio?: string;
  matches: number;
  runs: number;
  wickets: number;
  strikeRate: number;
  economy: number;
  recentScores: string[];
  careerStats?: PlayerCareerStats;
  matchPerformances?: PlayerMatchPerformance[];
  createdAt: string;
}

export interface BattingLine {
  playerId: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  out: boolean;
  dismissal?: string;
}

export interface BowlingLine {
  playerId: string;
  balls: number;
  maidens: number;
  runs: number;
  wickets: number;
}

export interface Innings {
  teamId: string;
  runs: number;
  wickets: number;
  balls: number;
  extras: number;
  batting: BattingLine[];
  bowling: BowlingLine[];
  fallOfWickets: string[];
}

export interface BallEvent {
  id: string;
  matchId: string;
  inningsNumber: number;
  over: number;
  ball: number;
  battingTeamId: string;
  bowlingTeamId: string;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  type: BallEventType;
  runs: number;
  extras: number;
  wicket: boolean;
  wicketDetails?: {
    dismissalType: string;
    fielderId?: string;
    newBatsmanId?: string;
  };
  label: string;
  commentary: string;
  createdAt: string;
}

export interface LiveMatchState {
  matchId: string;
  inningsNumber: number;
  battingTeamId: string;
  bowlingTeamId: string;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  runs: number;
  wickets: number;
  balls: number;
  target?: number;
  partnershipRuns: number;
  partnershipBalls: number;
  lastWicket?: string;
  lastSix: string[];
  commentary: BallEvent[];
}

export interface Result {
  id: string;
  matchId: string;
  resultType: ResultType;
  winnerTeamId?: string;
  teamAScore: string;
  teamBScore: string;
  teamARuns: number;
  teamBRuns: number;
  teamABalls: number;
  teamBBalls: number;
  teamAWickets: number;
  teamBWickets: number;
  playerOfMatch?: string;
  notes?: string;
  completedAt: string;
}

export interface Match {
  id: string;
  matchNumber: string;
  teamAId: string;
  teamBId: string;
  dateTime: string;
  venue: string;
  matchType: string;
  status: MatchStatus;
  tossWinnerId?: string;
  tossDecision?: "Bat" | "Field";
  umpires?: string;
  innings: Innings[];
  live?: LiveMatchState;
  result?: Result;
  createdAt: string;
}

export interface Scorecard {
  matchId: string;
  innings: Innings[];
}

export interface PointsTableRow {
  teamId: string;
  played: number;
  won: number;
  lost: number;
  noResult: number;
  points: number;
  runsFor: number;
  oversFaced: number;
  runsAgainst: number;
  oversBowled: number;
  nrr: number;
  qualification: "Qualifier 1" | "Eliminator" | "In Race" | "Needs Win" | "Eliminated";
}

export interface PlayoffFixture {
  id: string;
  title: "Qualifier 1" | "Eliminator" | "Qualifier 2" | "Final";
  teamA?: Team;
  teamB?: Team;
  detail: string;
}

export interface LeagueSnapshot {
  teams: Team[];
  players: Player[];
  matches: Match[];
  results: Result[];
  pointsTable: PointsTableRow[];
  liveMatch?: Match;
}
