"use client";

import Link from "next/link";
import { type FormEvent, type KeyboardEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2
} from "lucide-react";
import { answerLocalQuestion } from "@/lib/insights/localAssistant";
import type {
  AssistantChatAction,
  AssistantChatMessage,
  AssistantChatResponse,
  AutomatedInsightsPayload,
  AutomatedInsightsResponse,
  InsightActionCard,
  InsightCard,
  InsightPriority,
  InsightRiskCard,
  InsightSeverity
} from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

interface SmartAssistantPanelProps {
  insights: AutomatedInsightsResponse | null;
  loading?: boolean;
  generating?: boolean;
  onRefresh?: () => void | Promise<unknown>;
  variant?: "full" | "preview";
  showEngineStatus?: boolean;
  payload?: (AutomatedInsightsPayload & { todayKey?: string }) | null;
}

function priorityClasses(priority: InsightPriority | InsightSeverity): string {
  if (priority === "high") return "border-red-300/30 bg-red-400/12 text-red-100";
  if (priority === "medium") return "border-amber-300/30 bg-amber-400/12 text-amber-100";
  return "border-emerald-300/25 bg-emerald-400/10 text-emerald-100";
}

function priorityLabel(priority: InsightPriority | InsightSeverity): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function LoadingState({ compact = false }: { compact?: boolean }) {
  return (
    <div className="glass-panel rounded-lg p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-lg border border-emerald-300/25 bg-emerald-400/12 text-emerald-100">
          <LoaderCircle className="h-6 w-6 animate-spin" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="h-3 w-44 rounded-full bg-white/10" />
          <div className="mt-3 h-5 w-full max-w-lg rounded-full bg-white/10" />
        </div>
      </div>
      <div className={cn("mt-5 grid gap-3", compact ? "md:grid-cols-1" : "md:grid-cols-3")}>
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-24 rounded-lg border border-white/10 bg-white/[0.035]" />
        ))}
      </div>
    </div>
  );
}

function RelatedLink({ href, label = "View related page" }: { href?: string; label?: string }) {
  if (!href) return null;
  return (
    <Link
      href={href}
      className="mt-3 inline-flex items-center gap-2 text-xs font-black text-emerald-200 hover:text-emerald-100"
    >
      {label}
      <ExternalLink className="h-3.5 w-3.5" />
    </Link>
  );
}

function InsightTile({ item }: { item: InsightCard }) {
  return (
    <article className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-black text-white">{item.title}</h3>
        <span className={cn("rounded-full border px-2 py-1 text-[0.66rem] font-black uppercase", priorityClasses(item.priority))}>
          {priorityLabel(item.priority)}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
      <RelatedLink href={item.relatedPage ?? item.relatedHref} />
    </article>
  );
}

function ActionTile({ item }: { item: InsightActionCard }) {
  return (
    <article className="rounded-lg border border-emerald-300/18 bg-emerald-400/[0.055] p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-black text-white">{item.title}</h3>
        <span className={cn("rounded-full border px-2 py-1 text-[0.66rem] font-black uppercase", priorityClasses(item.priority))}>
          {priorityLabel(item.priority)}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
      <RelatedLink href={item.relatedPage ?? item.relatedHref} />
    </article>
  );
}

function RiskTile({ item }: { item: InsightRiskCard }) {
  return (
    <article className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-black text-white">{item.title}</h3>
        <span className={cn("rounded-full border px-2 py-1 text-[0.66rem] font-black uppercase", priorityClasses(item.severity))}>
          {priorityLabel(item.severity)}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
      <RelatedLink href={item.relatedPage ?? item.relatedHref} />
    </article>
  );
}

function SectionHeader({
  icon,
  title,
  count
}: {
  icon: ReactNode;
  title: string;
  count?: number;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-sm font-black text-white">
        {icon}
        {title}
      </h2>
      {typeof count === "number" ? (
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-black text-slate-300">
          {count}
        </span>
      ) : null}
    </div>
  );
}

const emptyPayload: AutomatedInsightsPayload & { todayKey?: string } = {
  teams: [],
  fixtures: [],
  results: [],
  standings: [],
  reports: [],
  alerts: [],
  settings: undefined
};

const suggestedPrompts = [
  "What matches are there today?",
  "Who is leading the points table?",
  "Which results are pending?",
  "What reports should I generate?",
  "Which team has the best NRR?",
  "Show upcoming fixtures",
  "What should I do next?"
];

type ChatMessage = AssistantChatMessage & {
  relatedPage?: string;
  suggestedActions?: AssistantChatAction[];
};

function isChatResponse(value: unknown): value is AssistantChatResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as AssistantChatResponse;
  return (
    (candidate.mode === "gemini" || candidate.mode === "local") &&
    typeof candidate.answer === "string" &&
    Array.isArray(candidate.suggestedActions)
  );
}

function ChatActionLinks({ actions, relatedPage }: { actions?: AssistantChatAction[]; relatedPage?: string }) {
  const safeActions = actions?.filter((action) => action.href.startsWith("/")).slice(0, 3) ?? [];
  const safeRelatedPage = relatedPage?.startsWith("/") ? relatedPage : undefined;

  if (safeActions.length === 0 && !safeRelatedPage) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {safeActions.map((action) => (
        <Link
          key={`${action.label}-${action.href}`}
          href={action.href}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/24 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-400/16"
        >
          {action.label}
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      ))}
      {safeRelatedPage && safeActions.every((action) => action.href !== safeRelatedPage) ? (
        <Link
          href={safeRelatedPage}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-black text-slate-200 hover:bg-white/[0.08]"
        >
          View related page
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  );
}

function ChatPanel({ payload }: { payload?: (AutomatedInsightsPayload & { todayKey?: string }) | null }) {
  const data = useMemo(() => payload ?? emptyPayload, [payload]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Ask me about today's fixtures, standings leaders, pending results, reports, NRR, or next actions."
    }
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const shouldFocus =
      window.location.hash === "#chat" ||
      new URLSearchParams(window.location.search).get("focus") === "chat";
    if (shouldFocus) {
      window.setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, []);

  const sendMessage = async (messageText: string) => {
    const trimmed = messageText.trim();
    if (!trimmed || sending) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    try {
      const response = await fetch("/api/assistant-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: nextMessages.map(({ role, content }) => ({ role, content })),
          data
        })
      });
      const parsed = response.ok ? await response.json() : null;
      const answer = isChatResponse(parsed) ? parsed : answerLocalQuestion(trimmed, data);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: answer.answer,
          relatedPage: answer.relatedPage,
          suggestedActions: answer.suggestedActions
        }
      ]);
    } catch {
      const answer = answerLocalQuestion(trimmed, data);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: `I can still answer using current tournament data.\n\n${answer.answer}`,
          relatedPage: answer.relatedPage,
          suggestedActions: answer.suggestedActions
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void sendMessage(input);
    }
  };

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-black text-white">
            <MessageSquare className="h-4 w-4 text-cyan-200" />
            Chat with Tournament Assistant
          </h2>
          <p className="mt-1 text-xs text-slate-400">Answers use current tournament data.</p>
        </div>
        <button
          type="button"
          onClick={() =>
            setMessages([
              {
                role: "assistant",
                content: "Chat cleared. Ask me about fixtures, standings, pending results, reports, or next actions."
              }
            ])
          }
          className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-slate-300 hover:bg-white/[0.08] hover:text-white"
          aria-label="Clear chat"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {suggestedPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => void sendMessage(prompt)}
            disabled={sending}
            className="rounded-lg border border-cyan-300/16 bg-cyan-300/[0.055] px-3 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-300/10 disabled:opacity-60"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="max-h-[420px] overflow-y-auto rounded-lg border border-white/10 bg-slate-950/42 p-3">
        <div className="grid gap-3">
          {messages.map((message, index) => {
            const isUser = message.role === "user";
            return (
              <div key={`${message.role}-${index}-${message.content.slice(0, 12)}`} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[92%] rounded-lg border px-4 py-3 text-sm leading-6",
                    isUser
                      ? "border-emerald-300/28 bg-emerald-400/12 text-emerald-50"
                      : "border-white/10 bg-white/[0.055] text-slate-200"
                  )}
                >
                  <p className="whitespace-pre-line">{message.content}</p>
                  {!isUser ? (
                    <ChatActionLinks actions={message.suggestedActions} relatedPage={message.relatedPage} />
                  ) : null}
                </div>
              </div>
            );
          })}
          {sending ? (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.055] px-4 py-3 text-sm font-semibold text-slate-300">
                <LoaderCircle className="h-4 w-4 animate-spin text-cyan-200" />
                Thinking with tournament data...
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about today's matches, leaders, pending results..."
          className="min-w-0 flex-1"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="premium-button grid h-11 w-12 shrink-0 place-items-center"
          aria-label="Send chat message"
        >
          {sending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </section>
  );
}

export function SmartAssistantPanel({
  insights,
  loading = false,
  generating = false,
  onRefresh,
  variant = "full",
  showEngineStatus = false,
  payload
}: SmartAssistantPanelProps) {
  if (loading && !insights) {
    return <LoadingState compact={variant === "preview"} />;
  }

  if (!insights) {
    return (
      <div className="glass-panel rounded-lg p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-red-300/30 bg-red-400/12 text-red-100">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-200">
              Automated Insights
            </p>
            <h2 className="mt-1 text-xl font-black text-white">Insights unavailable</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Tournament data could not be prepared yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "preview") {
    const actions = insights.recommendedActions.slice(0, 2);
    return (
      <div className="glass-panel rounded-lg p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-emerald-300/25 bg-emerald-400/12 text-emerald-100">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
                Automated Insights
              </p>
              <h2 className="mt-2 text-xl font-black text-white">AI Operations Preview</h2>
              <p className="mt-1 text-xs text-slate-500">Generated {formatDateTime(insights.generatedAt)}</p>
            </div>
          </div>
          {onRefresh ? (
            <button
              type="button"
              onClick={() => void onRefresh()}
              disabled={generating}
              className="secondary-button flex items-center gap-2 px-3 py-2 text-sm font-black"
            >
              {generating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Regenerate
            </button>
          ) : null}
        </div>

        <div className="rounded-lg border border-emerald-300/22 bg-emerald-400/10 p-4">
          <p className="text-sm font-semibold leading-6 text-emerald-50">{insights.summary}</p>
        </div>

        <div className="mt-4 grid gap-3">
          {actions.length > 0 ? (
            actions.map((action) => <ActionTile key={`${action.title}-${action.actionType}`} item={action} />)
          ) : (
            <div className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm font-semibold text-emerald-50">
              All tournament operations are clear.
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/smart-assistant" className="premium-button px-4 py-3 text-sm">
            Open Automated Insights
          </Link>
          <Link href="/smart-assistant?focus=chat#chat" className="secondary-button px-4 py-3 text-sm font-black">
            Ask Assistant
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-lg p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-emerald-300/25 bg-emerald-400/12 text-emerald-100">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
              Automated Insights
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">AI Tournament Assistant</h2>
            <p className="mt-1 text-xs text-slate-500">Last generated {formatDateTime(insights.generatedAt)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showEngineStatus ? (
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-slate-300">
              AI Engine: {insights.mode === "gemini" ? "Gemini" : "Local insights"}
            </span>
          ) : null}
          {onRefresh ? (
            <button
              type="button"
              onClick={() => void onRefresh()}
              disabled={generating}
              className="secondary-button flex items-center gap-2 px-3 py-2 text-sm font-black"
            >
              {generating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Regenerate
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-emerald-300/22 bg-emerald-400/10 p-4">
        <p className="text-sm font-semibold leading-6 text-emerald-50">{insights.summary}</p>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-5">
          <section>
            <SectionHeader
              title="Insights"
              count={insights.insights.length}
              icon={<Sparkles className="h-4 w-4 text-amber-200" />}
            />
            <div className="grid gap-3">
              {insights.insights.map((item) => (
                <InsightTile key={`${item.title}-${item.description}`} item={item} />
              ))}
            </div>
          </section>

          <section>
            <SectionHeader
              title="Risks / Alerts"
              count={insights.risks.length}
              icon={<AlertTriangle className="h-4 w-4 text-red-200" />}
            />
            <div className="grid gap-3">
              {insights.risks.map((item) => (
                <RiskTile key={`${item.title}-${item.description}`} item={item} />
              ))}
            </div>
          </section>
        </div>

        <div className="grid content-start gap-5">
          <section>
            <SectionHeader
              title="Action Queue"
              count={insights.recommendedActions.length}
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-200" />}
            />
            <div className="grid gap-3">
              {insights.recommendedActions.length > 0 ? (
                insights.recommendedActions.map((item) => (
                  <ActionTile key={`${item.title}-${item.actionType}`} item={item} />
                ))
              ) : (
                <div className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm font-semibold text-emerald-50">
                  No pending actions. Tournament operations are clear.
                </div>
              )}
            </div>
          </section>

          <div id="chat">
            <ChatPanel payload={payload} />
          </div>
        </div>
      </div>
    </div>
  );
}
