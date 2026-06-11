export type FixtureStatus = "upcoming" | "completed";

export interface Team {
  id: string;
  name: string;
  shortName: string;
  captain: string;
  contact: string;
  city: string;
  logoColor: string;
  createdAt: string;
}

export interface Fixture {
  id: string;
  teamAId: string;
  teamBId: string;
  date: string;
  time: string;
  venue: string;
  status: FixtureStatus;
  winnerTeamId?: string;
  teamAScore?: number;
  teamBScore?: number;
  teamAWickets?: number;
  teamBWickets?: number;
  teamAOvers?: string;
  teamBOvers?: string;
  fours?: number;
  sixes?: number;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface PointsRow {
  teamId: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  points: number;
  runsFor: number;
  runsAgainst: number;
  oversFor: number;
  oversAgainst: number;
  netRunRate: number;
  lastUpdated: string;
}

export interface DashboardStats {
  totalTeams: number;
  totalFixtures: number;
  upcomingMatches: number;
  completedMatches: number;
  leaderTeamName: string;
}

export type TeamInput = Omit<Team, "id" | "createdAt">;

export interface FixtureInput {
  teamAId: string;
  teamBId: string;
  date: string;
  time: string;
  venue: string;
}

export interface ResultInput {
  teamAScore: number;
  teamBScore: number;
  teamAWickets: number;
  teamBWickets: number;
  teamAOvers: string;
  teamBOvers: string;
  fours: number;
  sixes: number;
  notes?: string;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  description?: string;
}
