"use client";

import { useMemo, useState } from "react";
import { Save } from "lucide-react";
import type { Fixture, ResultInput, Team } from "@/lib/types";
import { parseCricketOversToDecimal } from "@/lib/points";
import { submitFixtureResult } from "@/lib/storage";
import { getTeamName } from "@/lib/utils";
import { useToast } from "./ToastProvider";

interface ResultFormProps {
  fixture: Fixture;
  teams: Team[];
  onSubmitted: (fixtures: Fixture[], celebrationText: string) => void;
}

interface ResultFormState {
  teamAScore: string;
  teamBScore: string;
  teamAWickets: string;
  teamBWickets: string;
  teamAOvers: string;
  teamBOvers: string;
  fours: string;
  sixes: string;
  notes: string;
}

const initialState: ResultFormState = {
  teamAScore: "",
  teamBScore: "",
  teamAWickets: "",
  teamBWickets: "",
  teamAOvers: "",
  teamBOvers: "",
  fours: "0",
  sixes: "0",
  notes: ""
};

function toNumber(value: string): number {
  return Number(value.trim());
}

function validateOvers(value: string): string {
  try {
    parseCricketOversToDecimal(value);
    return "";
  } catch (error) {
    return error instanceof Error ? error.message : "Invalid cricket overs.";
  }
}

function validateNonNegativeInteger(value: string, label: string): string {
  if (value.trim() === "") return `${label} is required.`;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return `${label} must be 0 or greater.`;
  return "";
}

function validateWickets(value: string, label: string): string {
  const baseError = validateNonNegativeInteger(value, label);
  if (baseError) return baseError;
  if (Number(value) > 10) return `${label} must be between 0 and 10.`;
  return "";
}

export function ResultForm({ fixture, teams, onSubmitted }: ResultFormProps) {
  const [form, setForm] = useState<ResultFormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { showToast } = useToast();

  const teamAName = getTeamName(teams, fixture.teamAId);
  const teamBName = getTeamName(teams, fixture.teamBId);

  const preview = useMemo(() => {
    const teamAScore = Number(form.teamAScore);
    const teamBScore = Number(form.teamBScore);

    if (!Number.isFinite(teamAScore) || !Number.isFinite(teamBScore) || form.teamAScore === "" || form.teamBScore === "") {
      return "Awaiting scores";
    }

    if (teamAScore > teamBScore) return `${teamAName} winning`;
    if (teamBScore > teamAScore) return `${teamBName} winning`;
    return "Match tied";
  }, [form.teamAScore, form.teamBScore, teamAName, teamBName]);

  const handleChange = (field: keyof ResultFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const validateForm = (): boolean => {
    const nextErrors: Record<string, string> = {
      teamAScore: validateNonNegativeInteger(form.teamAScore, `${teamAName} runs`),
      teamBScore: validateNonNegativeInteger(form.teamBScore, `${teamBName} runs`),
      teamAWickets: validateWickets(form.teamAWickets, `${teamAName} wickets`),
      teamBWickets: validateWickets(form.teamBWickets, `${teamBName} wickets`),
      teamAOvers: form.teamAOvers.trim() ? validateOvers(form.teamAOvers) : `${teamAName} overs is required.`,
      teamBOvers: form.teamBOvers.trim() ? validateOvers(form.teamBOvers) : `${teamBName} overs is required.`,
      fours: validateNonNegativeInteger(form.fours, "Fours"),
      sixes: validateNonNegativeInteger(form.sixes, "Sixes")
    };

    const compactErrors = Object.fromEntries(
      Object.entries(nextErrors).filter(([, value]) => Boolean(value))
    );

    setErrors(compactErrors);
    return Object.keys(compactErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (fixture.status === "completed") {
      showToast({ type: "error", title: "Result already submitted" });
      return;
    }

    if (!validateForm()) {
      showToast({ type: "error", title: "Check result fields", description: "A few cricket score fields need attention." });
      return;
    }

    const resultData: ResultInput = {
      teamAScore: toNumber(form.teamAScore),
      teamBScore: toNumber(form.teamBScore),
      teamAWickets: toNumber(form.teamAWickets),
      teamBWickets: toNumber(form.teamBWickets),
      teamAOvers: form.teamAOvers.trim(),
      teamBOvers: form.teamBOvers.trim(),
      fours: toNumber(form.fours),
      sixes: toNumber(form.sixes),
      notes: form.notes.trim() || undefined
    };

    try {
      const nextFixtures = submitFixtureResult(fixture.id, resultData);
      const winnerName =
        resultData.teamAScore > resultData.teamBScore
          ? teamAName
          : resultData.teamBScore > resultData.teamAScore
            ? teamBName
            : "";
      const messages = [
        resultData.sixes > 0 ? "SIX!" : "",
        resultData.fours > 0 ? "FOUR!" : "",
        winnerName ? `WINNER: ${winnerName}` : "MATCH TIED!"
      ].filter(Boolean);

      showToast({ type: "success", title: "Result submitted", description: "Points table recalculated." });
      setForm(initialState);
      onSubmitted(nextFixtures, messages.join(" "));
    } catch (error) {
      showToast({
        type: "error",
        title: "Could not submit result",
        description: error instanceof Error ? error.message : "Please try again."
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel rounded-lg p-5">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">
            Result entry
          </p>
          <h2 className="mt-1 text-2xl font-black text-white">
            {teamAName} vs {teamBName}
          </h2>
        </div>
        <div className="rounded-full border border-emerald-300/25 bg-emerald-400/12 px-3 py-2 text-sm font-black text-emerald-100">
          {preview}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
          <h3 className="mb-4 font-black text-white">{teamAName}</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="field-label">
              Runs
              <input
                data-testid="team-a-runs"
                type="number"
                min="0"
                value={form.teamAScore}
                onChange={(event) => handleChange("teamAScore", event.target.value)}
              />
              {errors.teamAScore ? <span className="text-xs text-red-200">{errors.teamAScore}</span> : null}
            </label>
            <label className="field-label">
              Wickets
              <input
                data-testid="team-a-wickets"
                type="number"
                min="0"
                max="10"
                value={form.teamAWickets}
                onChange={(event) => handleChange("teamAWickets", event.target.value)}
              />
              {errors.teamAWickets ? <span className="text-xs text-red-200">{errors.teamAWickets}</span> : null}
            </label>
            <label className="field-label">
              Overs
              <input
                data-testid="team-a-overs"
                type="text"
                inputMode="decimal"
                placeholder="10.5"
                value={form.teamAOvers}
                onChange={(event) => handleChange("teamAOvers", event.target.value)}
              />
              {errors.teamAOvers ? <span className="text-xs text-red-200">{errors.teamAOvers}</span> : null}
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
          <h3 className="mb-4 font-black text-white">{teamBName}</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="field-label">
              Runs
              <input
                data-testid="team-b-runs"
                type="number"
                min="0"
                value={form.teamBScore}
                onChange={(event) => handleChange("teamBScore", event.target.value)}
              />
              {errors.teamBScore ? <span className="text-xs text-red-200">{errors.teamBScore}</span> : null}
            </label>
            <label className="field-label">
              Wickets
              <input
                data-testid="team-b-wickets"
                type="number"
                min="0"
                max="10"
                value={form.teamBWickets}
                onChange={(event) => handleChange("teamBWickets", event.target.value)}
              />
              {errors.teamBWickets ? <span className="text-xs text-red-200">{errors.teamBWickets}</span> : null}
            </label>
            <label className="field-label">
              Overs
              <input
                data-testid="team-b-overs"
                type="text"
                inputMode="decimal"
                placeholder="9.4"
                value={form.teamBOvers}
                onChange={(event) => handleChange("teamBOvers", event.target.value)}
              />
              {errors.teamBOvers ? <span className="text-xs text-red-200">{errors.teamBOvers}</span> : null}
            </label>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_2fr]">
        <label className="field-label">
          Fours
          <input
            data-testid="fours"
            type="number"
            min="0"
            value={form.fours}
            onChange={(event) => handleChange("fours", event.target.value)}
          />
          {errors.fours ? <span className="text-xs text-red-200">{errors.fours}</span> : null}
        </label>
        <label className="field-label">
          Sixes
          <input
            data-testid="sixes"
            type="number"
            min="0"
            value={form.sixes}
            onChange={(event) => handleChange("sixes", event.target.value)}
          />
          {errors.sixes ? <span className="text-xs text-red-200">{errors.sixes}</span> : null}
        </label>
        <label className="field-label">
          Match notes
          <textarea
            data-testid="match-notes"
            rows={3}
            value={form.notes}
            onChange={(event) => handleChange("notes", event.target.value)}
            placeholder="Optional umpire notes or innings context"
          />
        </label>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          data-testid="submit-result"
          className="premium-button flex items-center gap-2 px-5 py-3"
        >
          <Save className="h-4 w-4" />
          Submit Result
        </button>
      </div>
    </form>
  );
}
