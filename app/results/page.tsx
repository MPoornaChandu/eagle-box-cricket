"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, MapPin } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { PageHeader } from "@/components/PageHeader";
import { ResultForm } from "@/components/ResultForm";
import { getFixtureResult } from "@/lib/points";
import { getFixtures, getTeams } from "@/lib/storage";
import type { Fixture, Team } from "@/lib/types";
import { cn, formatDate, formatScore, formatTime, getTeamName, statusBadgeClasses } from "@/lib/utils";

export default function ResultsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [selectedFixtureId, setSelectedFixtureId] = useState("");
  const [celebrationText, setCelebrationText] = useState("");
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setTeams(getTeams());
    setFixtures(getFixtures());
  };

  useEffect(() => {
    loadData();
    setLoading(false);
  }, []);

  const resultFixtures = useMemo(
    () =>
      fixtures
        .filter((fixture) => fixture.status !== "Draft" && fixture.status !== "Report Generated")
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    [fixtures]
  );

  const selectedFixture = resultFixtures.find((fixture) => fixture.id === selectedFixtureId);

  const handleSubmitted = (nextFixtures: Fixture[], celebration: string) => {
    setFixtures(nextFixtures);
    setSelectedFixtureId("");
    setCelebrationText(celebration);
    setCelebrationOpen(true);
  };

  return (
    <AppShell>
      {loading ? (
        <LoadingSkeleton label="Loading result center" />
      ) : (
        <>
          <PageHeader
            title="Results"
            breadcrumb="Dashboard / Results"
            description="Enter, review, or adjust scorecards. Saving a result recalculates the points table from completed fixtures."
          />

          <section className="grid gap-6 xl:grid-cols-[0.85fr_1.4fr]">
            <div className="glass-panel rounded-lg p-5">
              <h2 className="mb-4 text-xl font-black text-white">Result Queue</h2>
              {resultFixtures.length > 0 ? (
                <div className="grid gap-3">
                  {resultFixtures.map((fixture) => {
                    const active = fixture.id === selectedFixtureId;
                    const result = getFixtureResult(fixture);

                    return (
                      <button
                        key={fixture.id}
                        type="button"
                        onClick={() => setSelectedFixtureId(fixture.id)}
                        className={cn(
                          "rounded-lg border p-4 text-left transition",
                          active
                            ? "border-cyan-300/45 bg-cyan-300/12 shadow-glow"
                            : "border-white/10 bg-white/[0.04] hover:border-cyan-300/25 hover:bg-white/[0.065]"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-white">
                              {fixture.matchId}: {getTeamName(teams, fixture.teamAId)} vs {getTeamName(teams, fixture.teamBId)}
                            </p>
                            <span className={statusBadgeClasses(fixture.status)}>{fixture.status}</span>
                          </div>
                          {active ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-200" /> : null}
                        </div>
                        <p className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                          <CalendarClock className="h-4 w-4 text-cyan-200" />
                          {formatDate(fixture.date)} at {formatTime(fixture.time)}
                        </p>
                        <p className="mt-2 flex items-center gap-2 text-sm text-slate-300">
                          <MapPin className="h-4 w-4 text-emerald-200" />
                          {fixture.venue}
                        </p>
                        {result ? (
                          <p className="mt-2 text-xs font-semibold text-cyan-100">
                            {formatScore(result.teamARuns, result.teamAWickets)} vs {formatScore(result.teamBRuns, result.teamBWickets)} - {result.resultType}
                          </p>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="No result-ready fixtures"
                  description="Create or schedule a fixture before entering match results."
                />
              )}
            </div>

            <div>
              {selectedFixture ? (
                <ResultForm fixture={selectedFixture} teams={teams} onSubmitted={handleSubmitted} />
              ) : (
                <EmptyState
                  title="Select a fixture"
                  description="Choose an upcoming match to unlock the result entry form."
                />
              )}
            </div>
          </section>

          <CelebrationOverlay
            open={celebrationOpen}
            message={celebrationText}
            onClose={() => setCelebrationOpen(false)}
          />
        </>
      )}
    </AppShell>
  );
}
