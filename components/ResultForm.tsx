"use client";

import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { getFixtureResult } from "@/lib/points";
import type { Fixture, ResultInput, ResultType, Team } from "@/lib/types";
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
  resultType: ResultType;
  winnerTeamId: string;
  playerOfMatch: string;
  fours: string;
  sixes: string;
  notes: string;
}

function emptyStateForFixture(fixture: Fixture): ResultFormState {
  const result = getFixtureResult(fixture);
  return {
    teamAScore: result ? String(result.teamARuns) : "",
    teamBScore: result ? String(result.teamBRuns) : "",
    teamAWickets: result ? String(result.teamAWickets) : "",
    teamBWickets: result ? String(result.teamBWickets) : "",
    teamAOvers: result?.teamAOvers ?? "",
    teamBOvers: result?.teamBOvers ?? "",
    resultType: result?.resultType ?? "Normal win",
    winnerTeamId: result?.winnerTeamId ?? "",
    playerOfMatch: result?.playerOfMatch ?? "",
    fours: String(fixture.fours ?? 0),
    sixes: String(fixture.sixes ?? 0),
    notes: result?.notes ?? fixture.notes ?? ""
  };
}

function toNumber(value: string): number {
  if (!value.trim()) return 0;
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

function validateNonNegativeInteger(value: string, label: string, required = true): string {
  if (value.trim() === "") return required ? `${label} is required.` : "";
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return `${label} must be 0 or greater.`;
  return "";
}

function validateWickets(value: string, label: string, required = true): string {
  const baseError = validateNonNegativeInteger(value, label, required);
  if (baseError) return baseError;
  if (value.trim() && Number(value) > 10) return `${label} must be between 0 and 10.`;
  return "";
}

export function ResultForm({ fixture, teams, onSubmitted }: ResultFormProps) {
  const [form, setForm] = useState<ResultFormState>(() => emptyStateForFixture(fixture));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { showToast } = useToast();

  const teamAName = getTeamName(teams, fixture.teamAId);
  const teamBName = getTeamName(teams, fixture.teamBId);

  useEffect(() => {
    setForm(emptyStateForFixture(fixture));
    setErrors({});
  }, [fixture]);

  const preview = useMemo(() => {
    if (form.resultType === "No result") return "No result";
    if (form.resultType === "Walkover") {
      return form.winnerTeamId ? `${getTeamName(teams, form.winnerTeamId)} walkover` : "Walkover winner needed";
    }

    const teamAScore = Number(form.teamAScore);
    const teamBScore = Number(form.teamBScore);

    if (!Number.isFinite(teamAScore) || !Number.isFinite(teamBScore) || form.teamAScore === "" || form.teamBScore === "") {
      return "Awaiting scores";
    }

    if (form.resultType === "Tie" || teamAScore === teamBScore) return "Match tied";
    if (teamAScore > teamBScore) return `${teamAName} winning`;
    return `${teamBName} winning`;
  }, [form.resultType, form.teamAScore, form.teamBScore, form.winnerTeamId, teamAName, teamBName, teams]);

  const handleChange = (field: keyof ResultFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const validateForm = (): boolean => {
    const scoreRequired = form.resultType !== "No result" && form.resultType !== "Walkover";
    const oversRequired = scoreRequired;
    const nextErrors: Record<string, string> = {
      teamAScore: validateNonNegativeInteger(form.teamAScore, `${teamAName} runs`, scoreRequired),
      teamBScore: validateNonNegativeInteger(form.teamBScore, `${teamBName} runs`, scoreRequired),
      teamAWickets: validateWickets(form.teamAWickets, `${teamAName} wickets`, scoreRequired),
      teamBWickets: validateWickets(form.teamBWickets, `${teamBName} wickets`, scoreRequired),
      teamAOvers: oversRequired
        ? form.teamAOvers.trim()
          ? validateOvers(form.teamAOvers)
          : `${teamAName} overs is required.`
        : "",
      teamBOvers: oversRequired
        ? form.teamBOvers.trim()
          ? validateOvers(form.teamBOvers)
          : `${teamBName} overs is required.`
        : "",
      fours: validateNonNegativeInteger(form.fours, "Fours"),
      sixes: validateNonNegativeInteger(form.sixes, "Sixes")
    };

    const teamAScore = toNumber(form.teamAScore);
    const teamBScore = toNumber(form.teamBScore);

    if (form.resultType === "Tie" && scoreRequired && teamAScore !== teamBScore) {
      nextErrors.resultType = "Tie results need equal team scores.";
    }

    if (form.resultType === "Normal win" && scoreRequired && teamAScore === teamBScore) {
      nextErrors.resultType = "Normal wins cannot have equal scores. Choose Tie instead.";
    }

    if (form.resultType === "Walkover" && !form.winnerTeamId) {
      nextErrors.winnerTeamId = "Walkover winner is required.";
    }

    if (form.winnerTeamId && ![fixture.teamAId, fixture.teamBId].includes(form.winnerTeamId)) {
      nextErrors.winnerTeamId = "Winner must be one of the fixture teams.";
    }

    const compactErrors = Object.fromEntries(
      Object.entries(nextErrors).filter(([, value]) => Boolean(value))
    );

    setErrors(compactErrors);
    return Object.keys(compactErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      showToast({ type: "error", title: "Check result fields", description: "A few cricket score fields need attention." });
      return;
    }

    const winnerTeamId =
      form.resultType === "Tie" || form.resultType === "No result"
        ? undefined
        : form.winnerTeamId || undefined;

    const resultData: ResultInput = {
      teamAScore: toNumber(form.teamAScore),
      teamBScore: toNumber(form.teamBScore),
      teamAWickets: toNumber(form.teamAWickets),
      teamBWickets: toNumber(form.teamBWickets),
      teamAOvers: form.teamAOvers.trim() || "0",
      teamBOvers: form.teamBOvers.trim() || "0",
      resultType: form.resultType,
      winnerTeamId,
      playerOfMatch: form.playerOfMatch.trim() || undefined,
      fours: toNumber(form.fours),
      sixes: toNumber(form.sixes),
      notes: form.notes.trim() || undefined
    };

    try {
      const nextFixtures = submitFixtureResult(fixture.id, resultData);
      const resolvedWinner =
        resultData.winnerTeamId ??
        (resultData.teamAScore > resultData.teamBScore
          ? fixture.teamAId
          : resultData.teamBScore > resultData.teamAScore
            ? fixture.teamBId
            : undefined);
      const winnerName = resolvedWinner ? getTeamName(teams, resolvedWinner) : "";
      const messages = [
        resultData.sixes > 0 ? "SIX!" : "",
        resultData.fours > 0 ? "FOUR!" : "",
        resultData.resultType === "No result"
          ? "NO RESULT RECORDED"
          : winnerName
            ? `WINNER: ${winnerName}`
            : "MATCH TIED!"
      ].filter(Boolean);

      showToast({ type: "success", title: "Result saved", description: "Points table recalculated from completed fixtures." });
      onSubmitted(nextFixtures, messages.join(" "));
    } catch (error) {
      showToast({
        type: "error",
        title: "Could not save result",
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

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <label className="field-label">
          Result type
          <select value={form.resultType} onChange={(event) => handleChange("resultType", event.target.value as ResultType)}>
            {(["Normal win", "Tie", "No result", "Walkover"] as ResultType[]).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.resultType ? <span className="text-xs text-red-200">{errors.resultType}</span> : null}
        </label>
        <label className="field-label">
          Winner
          <select value={form.winnerTeamId} onChange={(event) => handleChange("winnerTeamId", event.target.value)} disabled={form.resultType === "Tie" || form.resultType === "No result"}>
            <option value="">Auto / no winner</option>
            <option value={fixture.teamAId}>{teamAName}</option>
            <option value={fixture.teamBId}>{teamBName}</option>
          </select>
          {errors.winnerTeamId ? <span className="text-xs text-red-200">{errors.winnerTeamId}</span> : null}
        </label>
        <label className="field-label">
          Player of the match
          <input value={form.playerOfMatch} onChange={(event) => handleChange("playerOfMatch", event.target.value)} placeholder="Optional" />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
          <h3 className="mb-4 font-black text-white">{teamAName}</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="field-label">
              Runs
              <input data-testid="team-a-runs" type="number" min="0" value={form.teamAScore} onChange={(event) => handleChange("teamAScore", event.target.value)} />
              {errors.teamAScore ? <span className="text-xs text-red-200">{errors.teamAScore}</span> : null}
            </label>
            <label className="field-label">
              Wickets
              <input data-testid="team-a-wickets" type="number" min="0" max="10" value={form.teamAWickets} onChange={(event) => handleChange("teamAWickets", event.target.value)} />
              {errors.teamAWickets ? <span className="text-xs text-red-200">{errors.teamAWickets}</span> : null}
            </label>
            <label className="field-label">
              Overs
              <input data-testid="team-a-overs" type="text" inputMode="decimal" placeholder="10.5" value={form.teamAOvers} onChange={(event) => handleChange("teamAOvers", event.target.value)} />
              {errors.teamAOvers ? <span className="text-xs text-red-200">{errors.teamAOvers}</span> : null}
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
          <h3 className="mb-4 font-black text-white">{teamBName}</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="field-label">
              Runs
              <input data-testid="team-b-runs" type="number" min="0" value={form.teamBScore} onChange={(event) => handleChange("teamBScore", event.target.value)} />
              {errors.teamBScore ? <span className="text-xs text-red-200">{errors.teamBScore}</span> : null}
            </label>
            <label className="field-label">
              Wickets
              <input data-testid="team-b-wickets" type="number" min="0" max="10" value={form.teamBWickets} onChange={(event) => handleChange("teamBWickets", event.target.value)} />
              {errors.teamBWickets ? <span className="text-xs text-red-200">{errors.teamBWickets}</span> : null}
            </label>
            <label className="field-label">
              Overs
              <input data-testid="team-b-overs" type="text" inputMode="decimal" placeholder="9.4" value={form.teamBOvers} onChange={(event) => handleChange("teamBOvers", event.target.value)} />
              {errors.teamBOvers ? <span className="text-xs text-red-200">{errors.teamBOvers}</span> : null}
            </label>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_2fr]">
        <label className="field-label">
          Fours
          <input data-testid="fours" type="number" min="0" value={form.fours} onChange={(event) => handleChange("fours", event.target.value)} />
          {errors.fours ? <span className="text-xs text-red-200">{errors.fours}</span> : null}
        </label>
        <label className="field-label">
          Sixes
          <input data-testid="sixes" type="number" min="0" value={form.sixes} onChange={(event) => handleChange("sixes", event.target.value)} />
          {errors.sixes ? <span className="text-xs text-red-200">{errors.sixes}</span> : null}
        </label>
        <label className="field-label">
          Match notes
          <textarea data-testid="match-notes" rows={3} value={form.notes} onChange={(event) => handleChange("notes", event.target.value)} placeholder="Optional umpire notes or innings context" />
        </label>
      </div>

      <div className="mt-5 flex justify-end">
        <button type="submit" data-testid="submit-result" className="premium-button flex items-center gap-2 px-5 py-3">
          <Save className="h-4 w-4" />
          Save Result
        </button>
      </div>
    </form>
  );
}
