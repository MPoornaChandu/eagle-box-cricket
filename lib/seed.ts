import type { Fixture, Team } from "./types";

export const demoTeams: Team[] = [
  {
    id: "team-thunder-strikers",
    name: "Thunder Strikers",
    shortName: "TST",
    captain: "Rahul Sharma",
    contact: "9876543210",
    city: "Hyderabad",
    logoColor: "#22c55e",
    createdAt: "2026-06-01T09:00:00.000Z"
  },
  {
    id: "team-royal-challengers",
    name: "Royal Challengers",
    shortName: "RCB",
    captain: "Virat Singh",
    contact: "9876543211",
    city: "Bangalore",
    logoColor: "#ef4444",
    createdAt: "2026-06-01T09:05:00.000Z"
  },
  {
    id: "team-eagle-warriors",
    name: "Eagle Warriors",
    shortName: "EAG",
    captain: "Arjun Reddy",
    contact: "9876543212",
    city: "Chennai",
    logoColor: "#22d3ee",
    createdAt: "2026-06-01T09:10:00.000Z"
  },
  {
    id: "team-hyderabad-titans",
    name: "Hyderabad Titans",
    shortName: "HYT",
    captain: "Suresh Kumar",
    contact: "9876543213",
    city: "Hyderabad",
    logoColor: "#f59e0b",
    createdAt: "2026-06-01T09:15:00.000Z"
  }
];

export const demoFixtures: Fixture[] = [
  {
    id: "fixture-tst-rcb-2026-06-15",
    teamAId: "team-thunder-strikers",
    teamBId: "team-royal-challengers",
    date: "2026-06-15",
    time: "10:00",
    venue: "Eagle Box Arena",
    status: "upcoming",
    createdAt: "2026-06-01T10:00:00.000Z"
  },
  {
    id: "fixture-eag-hyt-2026-06-16",
    teamAId: "team-eagle-warriors",
    teamBId: "team-hyderabad-titans",
    date: "2026-06-16",
    time: "14:00",
    venue: "Eagle Box Arena",
    status: "upcoming",
    createdAt: "2026-06-01T10:05:00.000Z"
  },
  {
    id: "fixture-tst-eag-2026-06-18",
    teamAId: "team-thunder-strikers",
    teamBId: "team-eagle-warriors",
    date: "2026-06-18",
    time: "10:00",
    venue: "Eagle Box Arena",
    status: "upcoming",
    createdAt: "2026-06-01T10:10:00.000Z"
  }
];

export function getDemoTeams(): Team[] {
  return demoTeams.map((team) => ({ ...team }));
}

export function getDemoFixtures(): Fixture[] {
  return demoFixtures.map((fixture) => ({ ...fixture }));
}
