export type TeamStatus = "Active" | "Inactive" | "Archived";

export type ThemeMode = "dark" | "light" | "system";

export type ResolvedThemeMode = "dark" | "light";

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

export type TossDecision = "Bat" | "Field";

export type UserRole = "Admin" | "Viewer";

export interface DemoSession {
  email: string;
  role: UserRole;
  loggedInAt: string;
}

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

export interface PlayerBattingStat {
  id: string;
  fixtureId: string;
  teamId: string;
  playerName: string;
  runs: number;
  balls: number;
  createdAt: string;
}

export interface PlayerBowlingStat {
  id: string;
  fixtureId: string;
  teamId: string;
  playerName: string;
  oversBalls: number;
  wickets: number;
  runsGiven: number;
  createdAt: string;
}

export type PlayerBattingInput = Omit<PlayerBattingStat, "id" | "fixtureId" | "createdAt">;

export type PlayerBowlingInput = Omit<PlayerBowlingStat, "id" | "fixtureId" | "createdAt">;

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
  electedTo?: TossDecision;
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
  ballsFaced: number;
  runsAgainst: number;
  ballsBowled: number;
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
  bestNrr: string;
  reportsGenerated: number;
  alertsCount: number;
  databaseStatus: string;
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
  electedTo?: TossDecision;
  notes?: string;
}

export interface ResultInput {
  tossWinnerTeamId?: string;
  electedTo?: TossDecision;
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
  battingStats?: PlayerBattingInput[];
  bowlingStats?: PlayerBowlingInput[];
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
    | "Player Stats Report";
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
  type: "team" | "fixture" | "result" | "report" | "workflow" | "settings" | "system";
}

export type ActivityLog = ActivityItem;

export type SmartSummaryMode = "gemini" | "rule-based";

export interface SmartSummary {
  mode: SmartSummaryMode;
  summary: string;
  insights: string[];
  recommendedActions: string[];
  risks: string[];
  generatedAt: string;
}

export type AutomatedInsightsMode = "gemini" | "local" | "fallback";

export type InsightPriority = "high" | "medium" | "low";

export type InsightSeverity = "high" | "medium" | "low";

export type InsightActionType =
  | "team_setup"
  | "fixture_creation"
  | "fixture_review"
  | "result_entry"
  | "report_generation"
  | "standings_review"
  | "workflow_review"
  | "scoreboard_share"
  | "settings_review";

export interface InsightCard {
  title: string;
  description: string;
  priority: InsightPriority;
  relatedHref?: string;
  relatedPage?: string;
}

export interface InsightActionCard {
  title: string;
  description: string;
  actionType: InsightActionType;
  priority: InsightPriority;
  relatedHref?: string;
  relatedPage?: string;
}

export interface InsightRiskCard {
  title: string;
  description: string;
  severity: InsightSeverity;
  relatedHref?: string;
  relatedPage?: string;
}

export interface AutomatedInsightsPayload {
  teams: Team[];
  fixtures: Fixture[];
  results: Array<MatchResult & { fixtureId?: string }>;
  standings: PointsRow[];
  reports: ReportLog[];
  alerts: AlertItem[];
  settings?: Partial<TournamentSettings>;
}

export interface AutomatedInsightsResponse {
  mode: AutomatedInsightsMode;
  summary: string;
  insights: InsightCard[];
  recommendedActions: InsightActionCard[];
  risks: InsightRiskCard[];
  generatedAt: string;
}

export interface AssistantChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantChatAction {
  label: string;
  href: string;
}

export interface AssistantChatResponse {
  mode: "gemini" | "local";
  answer: string;
  relatedPage?: string;
  suggestedActions: AssistantChatAction[];
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  description?: string;
}

export interface TournamentSettings {
  id: string;
  tournamentName: string;
  format: "Round Robin" | "Knockout" | "Group Stage + Knockout";
  maxTeams: number;
  pointsPerWin: number;
  pointsPerTie: number;
  pointsPerLoss: number;
  createdAt: string;
  updatedAt: string;
}

export type TournamentSettingsInput = Omit<TournamentSettings, "id" | "createdAt" | "updatedAt">;
