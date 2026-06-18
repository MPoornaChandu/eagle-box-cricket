"use client";

import { motion } from "framer-motion";
import { CalendarDays, Edit3, MapPin, Phone, Trash2, UserRound, UsersRound } from "lucide-react";
import type { Team } from "@/lib/types";
import { formatDate, getInitials } from "@/lib/utils";

interface TeamCardProps {
  team: Team;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
}

export function TeamCard({ team, onEdit, onDelete }: TeamCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="glass-panel rounded-lg p-5"
    >
      <div className="flex items-start gap-4">
        <div
          className="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-white/20 text-lg font-black text-white shadow-glow"
          style={{ background: team.logoColor }}
        >
          {getInitials(team.name, team.shortName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="break-words text-xl font-black text-white">{team.name}</h2>
            <span className="rounded-full border border-amber-300/24 bg-amber-300/10 px-2 py-1 text-xs font-black text-amber-100">
              {team.shortName}
            </span>
            <span
              className={
                team.status === "Active"
                  ? "rounded-full border border-emerald-300/24 bg-emerald-300/10 px-2 py-1 text-xs font-black text-emerald-100"
                  : "rounded-full border border-slate-300/24 bg-slate-300/10 px-2 py-1 text-xs font-black text-slate-200"
              }
            >
              {team.status}
            </span>
          </div>
          <div className="mt-4 grid gap-2 text-sm text-slate-300">
            <p className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-emerald-200" />
              {team.captain}
            </p>
            <p className="flex items-center gap-2">
              <UsersRound className="h-4 w-4 text-violet-200" />
              {team.coach}
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-emerald-200" />
              {team.contact || "Contact optional"}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-200" />
              {team.homeVenue}
            </p>
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-slate-300" />
              Created {formatDate(team.createdAt.slice(0, 10))}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          title="Edit team"
          onClick={() => onEdit(team)}
          className="secondary-button flex flex-1 items-center justify-center gap-2 px-3 py-2 text-sm font-black"
        >
          <Edit3 className="h-4 w-4" />
          Edit
        </button>
        <button
          type="button"
          title="Delete team"
          onClick={() => onDelete(team)}
          className="danger-button flex flex-1 items-center justify-center gap-2 px-3 py-2 text-sm font-black"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    </motion.article>
  );
}
