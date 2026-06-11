"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, MapPin } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { PageHeader } from "@/components/PageHeader";
import { ResultForm } from "@/components/ResultForm";
import { getFixtures, getTeams } from "@/lib/storage";
import type { Fixture, Team } from "@/lib/types";
import { cn, formatDate, formatTime, getTeamName } from "@/lib/utils";

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

  const upcomingFixtures = useMemo(
    () =>
      fixtures
        .filter((fixture) => fixture.status === "upcoming")
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    [fixtures]
  );

  const selectedFixture = upcomingFixtures.find((fixture) => fixture.id === selectedFixtureId);

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
            description="Select an upcoming fixture, enter the final scorecard, and trigger automatic standings recalculation."
          />

          <section className="grid gap-6 xl:grid-cols-[0.85fr_1.4fr]">
            <div className="glass-panel rounded-lg p-5">
              <h2 className="mb-4 text-xl font-black text-white">Upcoming Matches</h2>
              {upcomingFixtures.length > 0 ? (
                <div className="grid gap-3">
                  {upcomingFixtures.map((fixture) => {
                    const active = fixture.id === selectedFixtureId;

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
                          <p className="font-black text-white">
                            {getTeamName(teams, fixture.teamAId)} vs {getTeamName(teams, fixture.teamBId)}
                          </p>
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
                      </button>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="No upcoming fixtures"
                  description="Create a fixture or reset demo data to submit match results."
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
