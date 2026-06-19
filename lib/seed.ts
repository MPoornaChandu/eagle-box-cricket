import type {
  ActivityItem,
  Fixture,
  PlayerBattingStat,
  PlayerBowlingStat,
  ReportLog,
  Team,
  TournamentSettings
} from "./types";

export const demoTournamentSettings: TournamentSettings = {
  id: "settings-demo",
  tournamentName: "Eagle Box Cricket",
  format: "Round Robin",
  maxTeams: 8,
  pointsPerWin: 2,
  pointsPerTie: 1,
  pointsPerLoss: 0,
  createdAt: "2026-06-01T09:00:00.000Z",
  updatedAt: "2026-06-01T09:00:00.000Z"
};

export const demoTeams: Team[] = [
  {
    id: "team-eagle-warriors",
    name: "Eagle Warriors",
    shortName: "EAG",
    captain: "Arjun Reddy",
    coach: "Meera Nair",
    homeVenue: "Eagle Box Arena",
    contact: "arjun@eaglebox.com",
    logoColor: "#16a34a",
    createdAt: "2026-05-28T09:00:00.000Z",
    status: "Active"
  },
  {
    id: "team-thunder-strikers",
    name: "Thunder Strikers",
    shortName: "TST",
    captain: "Rahul Sharma",
    coach: "Vikram Rao",
    homeVenue: "North Stand Ground",
    contact: "9876543210",
    logoColor: "#22c55e",
    createdAt: "2026-05-28T09:05:00.000Z",
    status: "Active"
  },
  {
    id: "team-royal-challengers",
    name: "Royal Challengers",
    shortName: "RCB",
    captain: "Virat Singh",
    coach: "Anil Thomas",
    homeVenue: "Central Turf",
    contact: "virat@eaglebox.com",
    logoColor: "#ef4444",
    createdAt: "2026-05-28T09:10:00.000Z",
    status: "Active"
  },
  {
    id: "team-hyderabad-titans",
    name: "Hyderabad Titans",
    shortName: "HYT",
    captain: "Suresh Kumar",
    coach: "Ramesh Iyer",
    homeVenue: "Metro Cricket Park",
    contact: "9876543213",
    logoColor: "#f59e0b",
    createdAt: "2026-05-28T09:15:00.000Z",
    status: "Active"
  },
  {
    id: "team-valley-kings",
    name: "Valley Kings",
    shortName: "VLK",
    captain: "Dev Menon",
    coach: "Prakash Das",
    homeVenue: "Valley Sports Hub",
    contact: "dev@eaglebox.com",
    logoColor: "#14b8a6",
    createdAt: "2026-05-28T09:20:00.000Z",
    status: "Active"
  },
  {
    id: "team-metro-falcons",
    name: "Metro Falcons",
    shortName: "MTF",
    captain: "Karan Patel",
    coach: "Nitin Shah",
    homeVenue: "Metro Oval",
    contact: "9876543215",
    logoColor: "#2563eb",
    createdAt: "2026-05-28T09:25:00.000Z",
    status: "Active"
  }
];

export const demoFixtures: Fixture[] = [
  {
    id: "fixture-ebc-001",
    matchId: "EBC-001",
    teamAId: "team-eagle-warriors",
    teamBId: "team-thunder-strikers",
    date: "2026-06-10",
    time: "10:00",
    venue: "Eagle Box Arena",
    matchType: "League",
    status: "Report Generated",
    tossWinnerTeamId: "team-thunder-strikers",
    electedTo: "Field",
    winnerTeamId: "team-eagle-warriors",
    teamAScore: 156,
    teamAWickets: 7,
    teamAOvers: "20.0",
    teamBScore: 142,
    teamBWickets: 9,
    teamBOvers: "20.0",
    resultType: "Normal win",
    playerOfMatch: "Arjun Reddy",
    fours: 18,
    sixes: 7,
    notes: "Eagle Warriors defended a professional 20-over total with disciplined death bowling.",
    result: {
      teamARuns: 156,
      teamAWickets: 7,
      teamAOvers: "20.0",
      teamBRuns: 142,
      teamBWickets: 9,
      teamBOvers: "20.0",
      resultType: "Normal win",
      winnerTeamId: "team-eagle-warriors",
      playerOfMatch: "Arjun Reddy",
      notes: "Eagle Warriors defended a professional 20-over total with disciplined death bowling.",
      submittedAt: "2026-06-10T13:22:00.000Z"
    },
    createdAt: "2026-06-01T10:00:00.000Z",
    completedAt: "2026-06-10T13:22:00.000Z",
    pointsUpdatedAt: "2026-06-10T13:27:00.000Z",
    reportGeneratedAt: "2026-06-10T13:34:00.000Z"
  },
  {
    id: "fixture-ebc-002",
    matchId: "EBC-002",
    teamAId: "team-royal-challengers",
    teamBId: "team-hyderabad-titans",
    date: "2026-06-12",
    time: "14:00",
    venue: "Central Turf",
    matchType: "League",
    status: "Report Generated",
    tossWinnerTeamId: "team-royal-challengers",
    electedTo: "Bat",
    winnerTeamId: "team-hyderabad-titans",
    teamAScore: 98,
    teamAWickets: 4,
    teamAOvers: "12.3",
    teamBScore: 99,
    teamBWickets: 3,
    teamBOvers: "11.5",
    resultType: "Normal win",
    playerOfMatch: "Suresh Kumar",
    fours: 21,
    sixes: 5,
    notes: "Hyderabad Titans completed a short-format chase with one ball of the 12th over unused.",
    result: {
      teamARuns: 98,
      teamAWickets: 4,
      teamAOvers: "12.3",
      teamBRuns: 99,
      teamBWickets: 3,
      teamBOvers: "11.5",
      resultType: "Normal win",
      winnerTeamId: "team-hyderabad-titans",
      playerOfMatch: "Suresh Kumar",
      notes: "Hyderabad Titans completed a short-format chase with one ball of the 12th over unused.",
      submittedAt: "2026-06-12T17:10:00.000Z"
    },
    createdAt: "2026-06-01T10:05:00.000Z",
    completedAt: "2026-06-12T17:10:00.000Z",
    pointsUpdatedAt: "2026-06-12T17:16:00.000Z",
    reportGeneratedAt: "2026-06-12T17:21:00.000Z"
  },
  {
    id: "fixture-ebc-003",
    matchId: "EBC-003",
    teamAId: "team-valley-kings",
    teamBId: "team-metro-falcons",
    date: "2026-06-16",
    time: "18:00",
    venue: "Valley Sports Hub",
    matchType: "League",
    status: "Completed",
    tossWinnerTeamId: "team-valley-kings",
    electedTo: "Bat",
    winnerTeamId: "team-metro-falcons",
    teamAScore: 175,
    teamAWickets: 8,
    teamAOvers: "20.0",
    teamBScore: 176,
    teamBWickets: 6,
    teamBOvers: "19.4",
    resultType: "Normal win",
    playerOfMatch: "Karan Patel",
    fours: 24,
    sixes: 8,
    notes: "Metro Falcons chased 176 in 19.4 overs. Points update is pending.",
    result: {
      teamARuns: 175,
      teamAWickets: 8,
      teamAOvers: "20.0",
      teamBRuns: 176,
      teamBWickets: 6,
      teamBOvers: "19.4",
      resultType: "Normal win",
      winnerTeamId: "team-metro-falcons",
      playerOfMatch: "Karan Patel",
      notes: "Metro Falcons chased 176 in 19.4 overs. Points update is pending.",
      submittedAt: "2026-06-16T20:08:00.000Z"
    },
    createdAt: "2026-06-01T10:10:00.000Z",
    completedAt: "2026-06-16T20:08:00.000Z"
  },
  {
    id: "fixture-ebc-004",
    matchId: "EBC-004",
    teamAId: "team-eagle-warriors",
    teamBId: "team-royal-challengers",
    date: "2026-06-18",
    time: "19:00",
    venue: "Eagle Box Arena",
    matchType: "League",
    status: "Points Updated",
    tossWinnerTeamId: "team-eagle-warriors",
    electedTo: "Bat",
    winnerTeamId: "team-eagle-warriors",
    teamAScore: 145,
    teamAWickets: 6,
    teamAOvers: "20.0",
    teamBScore: 132,
    teamBWickets: 8,
    teamBOvers: "20.0",
    resultType: "Normal win",
    playerOfMatch: "Rohit Varma",
    fours: 16,
    sixes: 4,
    notes: "Eagle Warriors controlled the middle overs and defended 145.",
    result: {
      teamARuns: 145,
      teamAWickets: 6,
      teamAOvers: "20.0",
      teamBRuns: 132,
      teamBWickets: 8,
      teamBOvers: "20.0",
      resultType: "Normal win",
      winnerTeamId: "team-eagle-warriors",
      playerOfMatch: "Rohit Varma",
      notes: "Eagle Warriors controlled the middle overs and defended 145.",
      submittedAt: "2026-06-18T21:36:00.000Z"
    },
    createdAt: "2026-06-02T10:00:00.000Z",
    completedAt: "2026-06-18T21:36:00.000Z",
    pointsUpdatedAt: "2026-06-18T21:42:00.000Z"
  },
  {
    id: "fixture-ebc-005",
    matchId: "EBC-005",
    teamAId: "team-thunder-strikers",
    teamBId: "team-valley-kings",
    date: "2026-06-20",
    time: "10:00",
    venue: "North Stand Ground",
    matchType: "League",
    status: "Scheduled",
    notes: "Morning group fixture.",
    createdAt: "2026-06-02T10:05:00.000Z"
  },
  {
    id: "fixture-ebc-006",
    matchId: "EBC-006",
    teamAId: "team-hyderabad-titans",
    teamBId: "team-metro-falcons",
    date: "2026-06-21",
    time: "14:00",
    venue: "Metro Cricket Park",
    matchType: "League",
    status: "Draft",
    notes: "Awaiting final umpire allocation.",
    createdAt: "2026-06-02T10:10:00.000Z"
  },
  {
    id: "fixture-ebc-007",
    matchId: "EBC-007",
    teamAId: "team-eagle-warriors",
    teamBId: "team-hyderabad-titans",
    date: "2026-06-22",
    time: "18:30",
    venue: "Eagle Box Arena",
    matchType: "Semi Final",
    status: "Scheduled",
    createdAt: "2026-06-02T10:15:00.000Z"
  },
  {
    id: "fixture-ebc-008",
    matchId: "EBC-008",
    teamAId: "team-thunder-strikers",
    teamBId: "team-royal-challengers",
    date: "2026-06-23",
    time: "20:00",
    venue: "Eagle Box Arena",
    matchType: "Final",
    status: "Scheduled",
    notes: "Sample final fixture for report generation.",
    createdAt: "2026-06-02T10:20:00.000Z"
  }
];

export const demoPlayerBattingStats: PlayerBattingStat[] = [
  { id: "bat-001", fixtureId: "fixture-ebc-001", teamId: "team-eagle-warriors", playerName: "Arjun Reddy", runs: 62, balls: 41, createdAt: "2026-06-10T13:22:00.000Z" },
  { id: "bat-002", fixtureId: "fixture-ebc-001", teamId: "team-thunder-strikers", playerName: "Rahul Sharma", runs: 48, balls: 36, createdAt: "2026-06-10T13:22:00.000Z" },
  { id: "bat-003", fixtureId: "fixture-ebc-002", teamId: "team-hyderabad-titans", playerName: "Suresh Kumar", runs: 51, balls: 31, createdAt: "2026-06-12T17:10:00.000Z" },
  { id: "bat-004", fixtureId: "fixture-ebc-002", teamId: "team-royal-challengers", playerName: "Virat Singh", runs: 44, balls: 28, createdAt: "2026-06-12T17:10:00.000Z" },
  { id: "bat-005", fixtureId: "fixture-ebc-003", teamId: "team-metro-falcons", playerName: "Karan Patel", runs: 73, balls: 46, createdAt: "2026-06-16T20:08:00.000Z" },
  { id: "bat-006", fixtureId: "fixture-ebc-003", teamId: "team-valley-kings", playerName: "Dev Menon", runs: 66, balls: 42, createdAt: "2026-06-16T20:08:00.000Z" },
  { id: "bat-007", fixtureId: "fixture-ebc-004", teamId: "team-eagle-warriors", playerName: "Rohit Varma", runs: 58, balls: 39, createdAt: "2026-06-18T21:36:00.000Z" },
  { id: "bat-008", fixtureId: "fixture-ebc-004", teamId: "team-royal-challengers", playerName: "Virat Singh", runs: 52, balls: 45, createdAt: "2026-06-18T21:36:00.000Z" }
];

export const demoPlayerBowlingStats: PlayerBowlingStat[] = [
  { id: "bowl-001", fixtureId: "fixture-ebc-001", teamId: "team-eagle-warriors", playerName: "Naveen Rao", oversBalls: 24, wickets: 3, runsGiven: 28, createdAt: "2026-06-10T13:22:00.000Z" },
  { id: "bowl-002", fixtureId: "fixture-ebc-001", teamId: "team-thunder-strikers", playerName: "Imran Ali", oversBalls: 24, wickets: 2, runsGiven: 31, createdAt: "2026-06-10T13:22:00.000Z" },
  { id: "bowl-003", fixtureId: "fixture-ebc-002", teamId: "team-hyderabad-titans", playerName: "Ajay Prasad", oversBalls: 18, wickets: 2, runsGiven: 22, createdAt: "2026-06-12T17:10:00.000Z" },
  { id: "bowl-004", fixtureId: "fixture-ebc-002", teamId: "team-royal-challengers", playerName: "Manoj Pillai", oversBalls: 17, wickets: 1, runsGiven: 25, createdAt: "2026-06-12T17:10:00.000Z" },
  { id: "bowl-005", fixtureId: "fixture-ebc-003", teamId: "team-metro-falcons", playerName: "Aditya Shah", oversBalls: 24, wickets: 3, runsGiven: 34, createdAt: "2026-06-16T20:08:00.000Z" },
  { id: "bowl-006", fixtureId: "fixture-ebc-003", teamId: "team-valley-kings", playerName: "Ravi Das", oversBalls: 24, wickets: 2, runsGiven: 39, createdAt: "2026-06-16T20:08:00.000Z" },
  { id: "bowl-007", fixtureId: "fixture-ebc-004", teamId: "team-eagle-warriors", playerName: "Naveen Rao", oversBalls: 24, wickets: 2, runsGiven: 24, createdAt: "2026-06-18T21:36:00.000Z" },
  { id: "bowl-008", fixtureId: "fixture-ebc-004", teamId: "team-royal-challengers", playerName: "Manoj Pillai", oversBalls: 24, wickets: 2, runsGiven: 29, createdAt: "2026-06-18T21:36:00.000Z" }
];

export const demoReports: ReportLog[] = [
  {
    id: "report-demo-001",
    title: "Opening tournament summary",
    type: "Tournament Summary",
    generatedAt: "2026-06-10T13:35:00.000Z",
    summary: "Initial report generated after EBC-001 with Eagle Warriors leading."
  },
  {
    id: "report-demo-002",
    title: "Points table snapshot",
    type: "Points Table Report",
    generatedAt: "2026-06-12T17:18:00.000Z",
    summary: "Standings recalculated after Hyderabad Titans completed EBC-002."
  },
  {
    id: "report-demo-003",
    title: "Player performers snapshot",
    type: "Player Stats Report",
    generatedAt: "2026-06-18T21:45:00.000Z",
    summary: "Karan Patel, Arjun Reddy, and Naveen Rao are leading early player performance charts."
  }
];

export const demoActivities: ActivityItem[] = [
  {
    id: "activity-demo-001",
    message: "EBC-004 result saved. Eagle Warriors defended 145 in 20 overs.",
    timestamp: "2026-06-18T21:36:00.000Z",
    type: "result"
  },
  {
    id: "activity-demo-002",
    message: "Player performers report generated for batting and bowling leaders.",
    timestamp: "2026-06-18T21:45:00.000Z",
    type: "report"
  },
  {
    id: "activity-demo-003",
    message: "EBC-001 moved to Report Generated.",
    timestamp: "2026-06-10T13:34:00.000Z",
    type: "workflow"
  },
  {
    id: "activity-demo-004",
    message: "Six realistic demo teams were loaded for Eagle Box Cricket.",
    timestamp: "2026-06-01T10:00:00.000Z",
    type: "team"
  }
];

export function getDemoTournamentSettings(): TournamentSettings {
  return { ...demoTournamentSettings };
}

export function getDemoTeams(): Team[] {
  return demoTeams.map((team) => ({ ...team }));
}

export function getDemoFixtures(): Fixture[] {
  return demoFixtures.map((fixture) => ({
    ...fixture,
    result: fixture.result ? { ...fixture.result } : undefined
  }));
}

export function getDemoPlayerBattingStats(): PlayerBattingStat[] {
  return demoPlayerBattingStats.map((stat) => ({ ...stat }));
}

export function getDemoPlayerBowlingStats(): PlayerBowlingStat[] {
  return demoPlayerBowlingStats.map((stat) => ({ ...stat }));
}

export function getDemoReports(): ReportLog[] {
  return demoReports.map((report) => ({ ...report }));
}

export function getDemoActivities(): ActivityItem[] {
  return demoActivities.map((activity) => ({ ...activity }));
}
