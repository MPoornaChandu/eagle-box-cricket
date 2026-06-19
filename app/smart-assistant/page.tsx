"use client";

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { SmartAssistantPanel } from "@/components/SmartAssistantPanel";
import { useAuth } from "@/hooks/useAuth";
import { useAutomatedInsights } from "@/hooks/useAutomatedInsights";

export default function SmartAssistantPage() {
  const { role } = useAuth();
  const { insights, loading, generating, regenerate, payload } = useAutomatedInsights({
    generateOnMount: true,
    useRemoteOnMount: true
  });

  return (
    <AppShell>
      <PageHeader
        title="Automated Insights"
        breadcrumb="Dashboard / Automated Insights"
        description="AI-powered cricket operations assistant for standings, fixtures, reports, and tournament actions."
      />

      <SmartAssistantPanel
        insights={insights}
        loading={loading}
        generating={generating}
        onRefresh={regenerate}
        showEngineStatus={role === "Admin"}
        payload={payload}
      />
    </AppShell>
  );
}
