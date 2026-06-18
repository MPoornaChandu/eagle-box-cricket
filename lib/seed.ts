import type { ActivityItem, Fixture, ReportLog, Team } from "./types";

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
    id: "team-coastal-kings",
    name: "Coastal Kings",
    shortName: "CKG",
    captain: "Dev Menon",
    coach: "Prakash Das",
    homeVenue: "Harbour Nets",
    contact: "dev@eaglebox.com",
    logoColor: "#14b8a6",
    createdAt: "2026-05-28T09:20:00.000Z",
    status: "Active"
  },
  {
    id: "team-skyline-riders",
    name: "Skyline Riders",
    shortName: "SKR",
    captain: "Karan Patel",
    coach: "Nitin Shah",
    homeVenue: "Skyline Oval",
    contact: "9876543215",
    logoColor: "#a855f7",
    createdAt: "2026-05-28T09:25:00.000Z",
    status: "Inactive"
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
    status: "Points Updated",
    tossWinnerTeamId: "team-royal-challengers",
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
    pointsUpdatedAt: "2026-06-12T17:16:00.000Z"
  },
  {
    id: "fixture-ebc-003",
    matchId: "EBC-003",
    teamAId: "team-coastal-kings",
    teamBId: "team-skyline-riders",
    date: "2026-06-16",
    time: "18:00",
    venue: "Harbour Nets",
    matchType: "League",
    status: "Completed",
    tossWinnerTeamId: "team-coastal-kings",
    winnerTeamId: "team-skyline-riders",
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
    notes: "Skyline Riders chased 176 in 19.4 overs. Points update is pending.",
    result: {
      teamARuns: 175,
      teamAWickets: 8,
      teamAOvers: "20.0",
      teamBRuns: 176,
      teamBWickets: 6,
      teamBOvers: "19.4",
      resultType: "Normal win",
      winnerTeamId: "team-skyline-riders",
      playerOfMatch: "Karan Patel",
      notes: "Skyline Riders chased 176 in 19.4 overs. Points update is pending.",
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
    date: "2026-06-17",
    time: "19:00",
    venue: "Eagle Box Arena",
    matchType: "League",
    status: "Scheduled",
    notes: "Prime-time group stage fixture.",
    createdAt: "2026-06-02T10:00:00.000Z"
  },
  {
    id: "fixture-ebc-005",
    matchId: "EBC-005",
    teamAId: "team-thunder-strikers",
    teamBId: "team-coastal-kings",
    date: "2026-06-18",
    time: "10:00",
    venue: "North Stand Ground",
    matchType: "League",
    status: "Scheduled",
    createdAt: "2026-06-02T10:05:00.000Z"
  },
  {
    id: "fixture-ebc-006",
    matchId: "EBC-006",
    teamAId: "team-hyderabad-titans",
    teamBId: "team-skyline-riders",
    date: "2026-06-19",
    time: "14:00",
    venue: "Metro Cricket Park",
    matchType: "League",
    status: "Draft",
    notes: "Awaiting final venue confirmation.",
    createdAt: "2026-06-02T10:10:00.000Z"
  },
  {
    id: "fixture-ebc-007",
    matchId: "EBC-007",
    teamAId: "team-eagle-warriors",
    teamBId: "team-hyderabad-titans",
    date: "2026-06-20",
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
    date: "2026-06-22",
    time: "20:00",
    venue: "Eagle Box Arena",
    matchType: "Final",
    status: "Scheduled",
    notes: "Mock final fixture for demo reporting.",
    createdAt: "2026-06-02T10:20:00.000Z"
  }
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
    title: "Pending actions checklist",
    type: "Pending Actions Report",
    generatedAt: "2026-06-16T20:15:00.000Z",
    summary: "EBC-003 needs points update and final match report generation."
  }
];

export const demoActivities: ActivityItem[] = [
  {
    id: "activity-demo-001",
    message: "EBC-003 result saved. Skyline Riders chased 176 in 19.4 overs.",
    timestamp: "2026-06-16T20:08:00.000Z",
    type: "result"
  },
  {
    id: "activity-demo-002",
    message: "Points table snapshot generated for the internship report log.",
    timestamp: "2026-06-12T17:18:00.000Z",
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
    message: "Six demo teams were loaded for Eagle Box Cricket.",
    timestamp: "2026-06-01T10:00:00.000Z",
    type: "team"
  }
];

export function getDemoTeams(): Team[] {
  return demoTeams.map((team) => ({ ...team }));
}

export function getDemoFixtures(): Fixture[] {
  return demoFixtures.map((fixture) => ({
    ...fixture,
    result: fixture.result ? { ...fixture.result } : undefined
  }));
}

export function getDemoReports(): ReportLog[] {
  return demoReports.map((report) => ({ ...report }));
}

export function getDemoActivities(): ActivityItem[] {
  return demoActivities.map((activity) => ({ ...activity }));
}
