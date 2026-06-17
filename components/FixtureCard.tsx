"use client";

import { motion } from "framer-motion";
import { CalendarClock, Edit3, FileText, MapPin, Trash2 } from "lucide-react";
import { getFixtureResult } from "@/lib/points";
import type { Fixture, Team } from "@/lib/types";
import {
  formatDate,
  formatScore,
  formatTime,
  getTeamName,
  statusBadgeClasses
} from "@/lib/utils";
import { WorkflowProgress } from "./WorkflowProgress";

interface FixtureCardProps {
  fixture: Fixture;
  teams: Team[];
  onEdit?: (fixture: Fixture) => void;
  onDelete?: (fixture: Fixture) => void;
  compact?: boolean;
}

export function FixtureCard({ fixture, teams, onEdit, onDelete, compact = false }: FixtureCardProps) {
  const teamA = getTeamName(teams, fixture.teamAId);
  const teamB = getTeamName(teams, fixture.teamBId);
  const result = getFixtureResult(fixture);

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
            <span className={statusBadgeClasses(fixture.status)}>{fixture.status}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-black text-slate-200">
              {fixture.matchType}
            </span>
          </div>
          <div className="mt-4 grid gap-2 text-sm text-slate-300">
            <p className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-violet-200" />
              {fixture.matchId}
            </p>
            <p className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-cyan-200" />
              {formatDate(fixture.date)} at {formatTime(fixture.time)}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-200" />
              {fixture.venue}
            </p>
            {fixture.notes ? <p className="text-xs leading-5 text-slate-400">{fixture.notes}</p> : null}
          </div>
        </div>

        {result ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm">
            <p className="font-black text-white">
              {formatScore(result.teamARuns, result.teamAWickets)} -{" "}
              {formatScore(result.teamBRuns, result.teamBWickets)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {result.resultType}: {result.winnerTeamId ? getTeamName(teams, result.winnerTeamId) : "Tie / no result"}
            </p>
          </div>
        ) : null}
      </div>

      {!compact ? (
        <div className="mt-5">
          <WorkflowProgress status={fixture.status} />
        </div>
      ) : null}

      {!compact ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {onEdit ? (
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
          {onDelete ? (
            <button
              type="button"
              title="Delete fixture"
              onClick={() => onDelete(fixture)}
              className="danger-button flex min-w-[8rem] flex-1 items-center justify-center gap-2 px-3 py-2 text-sm font-black"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          ) : null}
        </div>
      ) : null}
    </motion.article>
  );
}
