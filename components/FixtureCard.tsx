"use client";

import { motion } from "framer-motion";
import { CalendarClock, Edit3, MapPin, Trash2 } from "lucide-react";
import type { Fixture, Team } from "@/lib/types";
import { formatDate, formatScore, formatTime, getTeamName } from "@/lib/utils";

interface FixtureCardProps {
  fixture: Fixture;
  teams: Team[];
  onEdit?: (fixture: Fixture) => void;
  onDelete: (fixture: Fixture) => void;
  compact?: boolean;
}

export function FixtureCard({ fixture, teams, onEdit, onDelete, compact = false }: FixtureCardProps) {
  const teamA = getTeamName(teams, fixture.teamAId);
  const teamB = getTeamName(teams, fixture.teamBId);
  const completed = fixture.status === "completed";

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      className="glass-panel rounded-lg p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="break-words text-xl font-black text-white">
              {teamA} <span className="text-cyan-200">vs</span> {teamB}
            </h2>
            <span
              className={
                completed
                  ? "rounded-full border border-emerald-300/25 bg-emerald-400/12 px-2 py-1 text-xs font-black text-emerald-100"
                  : "rounded-full border border-cyan-300/25 bg-cyan-400/12 px-2 py-1 text-xs font-black text-cyan-100"
              }
            >
              {completed ? "Completed" : "Upcoming"}
            </span>
          </div>
          <div className="mt-4 grid gap-2 text-sm text-slate-300">
            <p className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-cyan-200" />
              {formatDate(fixture.date)} at {formatTime(fixture.time)}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-200" />
              {fixture.venue}
            </p>
          </div>
        </div>

        {completed ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm">
            <p className="font-black text-white">
              {formatScore(fixture.teamAScore, fixture.teamAWickets)} -{" "}
              {formatScore(fixture.teamBScore, fixture.teamBWickets)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Winner: {fixture.winnerTeamId ? getTeamName(teams, fixture.winnerTeamId) : "Tie"}
            </p>
          </div>
        ) : null}
      </div>

      {!compact ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {!completed && onEdit ? (
            <button
              type="button"
              title="Edit fixture"
              onClick={() => onEdit(fixture)}
              className="secondary-button flex min-w-[8rem] flex-1 items-center justify-center gap-2 px-3 py-2 text-sm font-black"
            >
              <Edit3 className="h-4 w-4" />
              Edit
            </button>
          ) : null}
          <button
            type="button"
            title="Delete fixture"
            onClick={() => onDelete(fixture)}
            className="danger-button flex min-w-[8rem] flex-1 items-center justify-center gap-2 px-3 py-2 text-sm font-black"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      ) : null}
    </motion.article>
  );
}
