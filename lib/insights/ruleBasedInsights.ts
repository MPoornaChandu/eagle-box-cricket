import { getFixtureResult, hasResult, isCompletedFixture } from "@/lib/points";
import type {
  AlertItem,
  AutomatedInsightsPayload,
  AutomatedInsightsResponse,
  Fixture,
  InsightActionCard,
  InsightCard,
  InsightPriority,
  InsightRiskCard,
  PointsRow,
  Team
} from "@/lib/types";
import { formatDate, formatNrr, getFixtureTitle, getTeamName, isResultStatus } from "@/lib/utils";

function plural(count: number, singular: string, pluralValue = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralValue}`;
}

function normalizePriority(value: AlertItem["severity"]): InsightPriority {
  if (value === "critical") return "high";
  if (value === "warning") return "medium";
  return "low";
}

function sortedUpcomingFixtures(fixtures: Fixture[]): Fixture[] {
  return fixtures
    .filter((fixture) => !isResultStatus(fixture.status))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

function completedWithoutReports(fixtures: Fixture[]): Fixture[] {
  return fixtures.filter((fixture) => isCompletedFixture(fixture) && fixture.status !== "Report Generated");
}

function pendingResultFixtures(fixtures: Fixture[]): Fixture[] {
  return fixtures.filter(
    (fixture) =>
      (fixture.status === "Scheduled" || fixture.status === "Live" || fixture.status === "Completed") &&
      !hasResult(fixture)
  );
}

function pointsLeader(standings: PointsRow[]): PointsRow | undefined {
  return standings.find((row) => row.played > 0);
}

function bestNrrRow(standings: PointsRow[]): PointsRow | undefined {
  return [...standings]
    .filter((row) => row.played > 0)
    .sort((a, b) => b.netRunRate - a.netRunRate)[0];
}

function dataQualityRisks(payload: AutomatedInsightsPayload): InsightRiskCard[] {
  const risks: InsightRiskCard[] = [];
  const teamIds = new Set(payload.teams.map((team) => team.id));
  const missingFixtureData = payload.fixtures.filter(
    (fixture) => !fixture.date || !fixture.time || !fixture.venue.trim()
  );
  const invalidReferences = payload.fixtures.filter(
    (fixture) => !teamIds.has(fixture.teamAId) || !teamIds.has(fixture.teamBId)
  );

  if (missingFixtureData.length > 0) {
    risks.push({
      title: "Fixture details incomplete",
      description: `${plural(missingFixtureData.length, "fixture")} need date, time, or venue details before match operations.`,
      severity: "medium",
      relatedHref: "/fixtures"
    });
  }

  if (invalidReferences.length > 0) {
    risks.push({
      title: "Fixture team references need review",
      description: `${plural(invalidReferences.length, "fixture")} reference inactive or unavailable teams and are hidden from live operations.`,
      severity: "high",
      relatedHref: "/fixtures"
    });
  }

  return risks;
}

function formInsight(standings: PointsRow[], teams: Team[]): InsightCard | null {
  const strong = standings.find((row) => row.lastFive.slice(0, 3).filter((form) => form === "W").length >= 2);
  if (strong) {
    return {
      title: "Strong form detected",
      description: `${getTeamName(teams, strong.teamId)} have momentum based on recent wins.`,
      priority: "low",
      relatedHref: "/standings"
    };
  }

  const weak = standings.find((row) => row.lastFive.slice(0, 3).filter((form) => form === "L").length >= 2);
  if (weak) {
    return {
      title: "Form watch",
      description: `${getTeamName(teams, weak.teamId)} have recent losses and may need closer performance review.`,
      priority: "low",
      relatedHref: "/standings"
    };
  }

  return null;
}

function ensureMinimumInsights(insights: InsightCard[], payload: AutomatedInsightsPayload): InsightCard[] {
  const next = [...insights];

  if (payload.teams.length === 0) {
    next.push({
      title: "Team setup required",
      description: "Add teams to start tournament setup.",
      priority: "high",
      relatedHref: "/teams"
    });
  }

  if (payload.fixtures.length === 0) {
    next.push({
      title: "Fixture schedule required",
      description: "Create fixtures to start scheduling.",
      priority: payload.teams.length >= 2 ? "high" : "medium",
      relatedHref: "/fixtures"
    });
  }

  if (next.length === 0) {
    next.push({
      title: "Operations clear",
      description: "No urgent tournament issues are visible from the current data.",
      priority: "low",
      relatedHref: "/workflow"
    });
  }

  while (next.length < 3) {
    next.push({
      title: "Keep data current",
      description: "Review fixtures, results, and reports after each match window to keep standings accurate.",
      priority: "low",
      relatedHref: "/workflow"
    });
  }

  return next.slice(0, 5);
}

export function buildRuleBasedInsights(payload: AutomatedInsightsPayload): AutomatedInsightsResponse {
  const teams = payload.teams;
  const fixtures = payload.fixtures;
  const standings = payload.standings;
  const reports = payload.reports;
  const completedFixtures = fixtures.filter(isCompletedFixture);
  const upcomingFixtures = sortedUpcomingFixtures(fixtures);
  const pendingResults = pendingResultFixtures(fixtures);
  const reportReadyFixtures = completedWithoutReports(fixtures);
  const leader = pointsLeader(standings);
  const bestNrr = bestNrrRow(standings);
  const nextFixture = upcomingFixtures[0];
  const formCard = formInsight(standings, teams);
  const completedCount = completedFixtures.length;

  const insights: InsightCard[] = [];
  const recommendedActions: InsightActionCard[] = [];
  const risks: InsightRiskCard[] = [];

  if (leader) {
    insights.push({
      title: "Leader update",
      description: `${getTeamName(teams, leader.teamId)} lead with ${leader.points} points from ${plural(leader.played, "match", "matches")}.`,
      priority: "medium",
      relatedHref: "/standings"
    });
  } else {
    insights.push({
      title: "Standings not active yet",
      description: "No completed matches yet. Enter results to activate standings and NRR.",
      priority: fixtures.length > 0 ? "medium" : "low",
      relatedHref: "/results"
    });
  }

  if (bestNrr) {
    insights.push({
      title: "Best NRR",
      description: `${getTeamName(teams, bestNrr.teamId)} have the best NRR at ${formatNrr(bestNrr.netRunRate)}.`,
      priority: "medium",
      relatedHref: "/standings"
    });
  }

  if (nextFixture) {
    insights.push({
      title: "Next fixture",
      description: `${getFixtureTitle(nextFixture, teams)} is scheduled on ${formatDate(nextFixture.date)}.`,
      priority: "medium",
      relatedHref: "/fixtures"
    });
  }

  if (formCard) insights.push(formCard);

  if (pendingResults.length > 0) {
    insights.push({
      title: "Result entry pending",
      description: `${plural(pendingResults.length, "fixture")} ${pendingResults.length === 1 ? "is" : "are"} waiting for result entry.`,
      priority: "high",
      relatedHref: "/results"
    });
    recommendedActions.push({
      title: "Enter pending match results",
      description: `${plural(pendingResults.length, "fixture")} need scorecards before standings are fully current.`,
      actionType: "result_entry",
      priority: "high",
      relatedHref: "/results"
    });
  }

  if (reportReadyFixtures.length > 0) {
    insights.push({
      title: "Reports ready",
      description: `${plural(reportReadyFixtures.length, "completed match", "completed matches")} ${reportReadyFixtures.length === 1 ? "is" : "are"} ready for report generation.`,
      priority: "medium",
      relatedHref: "/reports"
    });
    recommendedActions.push({
      title: "Generate reports for completed matches",
      description: `${plural(reportReadyFixtures.length, "completed match", "completed matches")} can be moved through the reporting workflow.`,
      actionType: "report_generation",
      priority: "medium",
      relatedHref: "/reports"
    });
  }

  if (teams.length === 0) {
    recommendedActions.push({
      title: "Add tournament teams",
      description: "Teams are required before fixtures, results, and standings can operate.",
      actionType: "team_setup",
      priority: "high",
      relatedHref: "/teams"
    });
  } else if (teams.length < 2) {
    recommendedActions.push({
      title: "Add another team",
      description: "At least two active teams are required to create a fixture.",
      actionType: "team_setup",
      priority: "high",
      relatedHref: "/teams"
    });
  }

  if (fixtures.length === 0 && teams.length >= 2) {
    recommendedActions.push({
      title: "Create fixtures",
      description: "Create fixtures to start scheduling and unlock result workflows.",
      actionType: "fixture_creation",
      priority: "high",
      relatedHref: "/fixtures"
    });
  }

  if (upcomingFixtures.length > 0 && pendingResults.length === 0) {
    recommendedActions.push({
      title: "Review upcoming fixtures",
      description: `${plural(upcomingFixtures.length, "fixture")} ${upcomingFixtures.length === 1 ? "is" : "are"} scheduled for upcoming operations.`,
      actionType: "fixture_review",
      priority: "low",
      relatedHref: "/fixtures"
    });
  }

  payload.alerts.slice(0, 3).forEach((alert) => {
    risks.push({
      title: alert.title,
      description: alert.description,
      severity: normalizePriority(alert.severity),
      relatedHref: alert.fixtureId ? "/workflow" : "/workflow"
    });
  });

  risks.push(...dataQualityRisks(payload));

  if (pendingResults.length > 0) {
    risks.push({
      title: "Standings may be outdated",
      description: "Pending results can delay points table and NRR accuracy.",
      severity: "medium",
      relatedHref: "/results"
    });
  }

  if (reportReadyFixtures.length > 0) {
    risks.push({
      title: "Pending reports",
      description: `${plural(reportReadyFixtures.length, "completed match", "completed matches")} ${reportReadyFixtures.length === 1 ? "is" : "are"} ready for report generation.`,
      severity: "low",
      relatedHref: "/reports"
    });
  }

  const summary = leader
    ? `${getTeamName(teams, leader.teamId)} lead with ${leader.points} points. ${plural(upcomingFixtures.length, "fixture")} upcoming, ${plural(pendingResults.length, "result")} pending.`
    : completedCount === 0
      ? `No completed matches yet. ${plural(teams.length, "team")} and ${plural(fixtures.length, "fixture")} are active.`
      : `${plural(completedCount, "match", "matches")} completed with standings ready for review.`;

  return {
    mode: "local",
    summary,
    insights: ensureMinimumInsights(insights, payload),
    recommendedActions: recommendedActions.slice(0, 5),
    risks: risks.length > 0
      ? risks.slice(0, 5)
      : [
          {
            title: "No active risks",
            description: reports.length > 0 ? "Tournament reports and workflow data look clear." : "No blocking operational risks are visible right now.",
            severity: "low",
            relatedHref: "/workflow"
          }
        ],
    generatedAt: new Date().toISOString()
  };
}
