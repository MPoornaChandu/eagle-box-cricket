export type TeamStatus = "Active" | "Inactive";

export type WorkflowStatus =
  | "Draft"
  | "Scheduled"
  | "Live"
  | "Completed"
  | "Points Updated"
  | "Report Generated";

export type MatchType = "League" | "Semi Final" | "Final" | "Friendly";

export type ResultType = "Normal win" | "Tie" | "No result" | "Walkover";

export type FormResult = "W" | "L" | "T" | "NR";

export interface Team {
  id: string;
  name: string;
  shortName: string;
  captain: string;
  coach: string;
  homeVenue: string;
  contact?: string;
  logoColor: string;
  createdAt: string;
  status: TeamStatus;
}

export interface MatchResult {
  teamARuns: number;
  teamAWickets: number;
  teamAOvers: string;
  teamBRuns: number;
  teamBWickets: number;
  teamBOvers: string;
  resultType: ResultType;
  winnerTeamId?: string;
  playerOfMatch?: string;
  notes?: string;
  submittedAt: string;
}

export interface Fixture {
  id: string;
  matchId: string;
  teamAId: string;
  teamBId: string;
  date: string;
  time: string;
  venue: string;
  matchType: MatchType;
  status: WorkflowStatus;
  tossWinnerTeamId?: string;
  winnerTeamId?: string;
  teamAScore?: number;
  teamBScore?: number;
  teamAWickets?: number;
  teamBWickets?: number;
  teamAOvers?: string;
  teamBOvers?: string;
  resultType?: ResultType;
  playerOfMatch?: string;
  fours?: number;
  sixes?: number;
  notes?: string;
  result?: MatchResult;
  createdAt: string;
  completedAt?: string;
  pointsUpdatedAt?: string;
  reportGeneratedAt?: string;
}

export interface PointsRow {
  teamId: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
  runsFor: number;
  oversFaced: number;
  runsAgainst: number;
  oversBowled: number;
  netRunRate: number;
  lastFive: FormResult[];
  lastUpdated: string;
}

export interface DashboardStats {
  totalTeams: number;
  totalFixtures: number;
  completedMatches: number;
  upcomingMatches: number;
  pendingResults: number;
  leaderTeamName: string;
  reportsGenerated: number;
  alertsCount: number;
}

export type TeamInput = Omit<Team, "id" | "createdAt">;

export interface FixtureInput {
  teamAId: string;
  teamBId: string;
  date: string;
  time: string;
  venue: string;
  matchType: MatchType;
  status: WorkflowStatus;
  tossWinnerTeamId?: string;
  notes?: string;
}

export interface ResultInput {
  teamAScore: number;
  teamBScore: number;
  teamAWickets: number;
  teamBWickets: number;
  teamAOvers: string;
  teamBOvers: string;
  resultType: ResultType;
  winnerTeamId?: string;
  playerOfMatch?: string;
  fours: number;
  sixes: number;
  notes?: string;
}

export interface ReportLog {
  id: string;
  title: string;
  type:
    | "Tournament Summary"
    | "Teams Report"
    | "Fixtures Report"
    | "Results Report"
    | "Points Table Report"
    | "Pending Actions Report"
    | "Mock PDF Report";
  generatedAt: string;
  fixtureId?: string;
  summary: string;
}

export interface AlertItem {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  fixtureId?: string;
}

export interface ActivityItem {
  id: string;
  message: string;
  timestamp: string;
  type: "team" | "fixture" | "result" | "report" | "workflow" | "system";
}

export interface SmartSummary {
  headline: string;
  insights: string[];
  recommendedAction: string;
  generatedAt: string;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  description?: string;
}
