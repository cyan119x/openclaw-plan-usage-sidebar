import { asNonNegativeFiniteNumber } from "@openclaw/normalization-core/number-coercion";
import { asNullableObjectRecord as readCostRecord } from "@openclaw/normalization-core/record-coerce";
import { html, nothing } from "lit";
import { isTranscriptOnlyOpenClawAssistantMessage } from "../../../../../src/shared/transcript-only-openclaw-assistant.js";
import type { GatewaySessionRow } from "../../../api/types.ts";
import { renderProviderQuotaGroup } from "../../../components/provider-quota-card.ts";
import { t } from "../../../i18n/index.ts";
import { formatCompactTokenCount, formatCost } from "../../../lib/format.ts";
import { isMonitoredAuthProvider } from "../../../lib/model-auth.ts";
import {
  collectProviderQuotaGroups,
  type ProviderUsageDisplayProps,
} from "../../../lib/provider-quota-summary.ts";
import { resolveSessionContextLimit } from "../../../lib/sessions/context-budget.ts";
import { handleChatComposerDetailsToggle } from "./chat-picker-overlay.ts";

const CONTEXT_NOTICE_RATIO = 0.85;

type ContextNoticeOptions = {
  messages?: unknown[];
  providerUsage?: ProviderUsageDisplayProps;
};

type ProviderCostStats = {
  input?: number;
  output?: number;
  cacheRead?: number;
  cacheWrite?: number;
};

function readCostValue(
  cost: Record<string, unknown> | null,
  key: "input" | "output" | "cacheRead" | "cacheWrite",
) {
  return asNonNegativeFiniteNumber(cost?.[key]);
}

function latestProviderCostStats(messages: unknown[] | undefined): ProviderCostStats | null {
  for (let index = (messages?.length ?? 0) - 1; index >= 0; index -= 1) {
    const message = readCostRecord(messages?.[index]);
    if (message?.role === "user") {
      return null;
    }
    if (message?.role !== "assistant" || isTranscriptOnlyOpenClawAssistantMessage(message)) {
      continue;
    }
    const directCost = readCostRecord(message.cost);
    const usageCost = readCostRecord(readCostRecord(message.usage)?.cost);
    const stats: ProviderCostStats = {};
    for (const key of ["input", "output", "cacheRead", "cacheWrite"] as const) {
      const cost = readCostValue(directCost, key) ?? readCostValue(usageCost, key);
      if (cost !== undefined) {
        stats[key] = cost;
      }
    }
    if (
      [stats.input, stats.output, stats.cacheRead, stats.cacheWrite].some((value) => value != null)
    ) {
      return stats;
    }
  }
  return null;
}

function latestAssistantProvider(messages: unknown[] | undefined): string | null {
  for (let index = (messages?.length ?? 0) - 1; index >= 0; index -= 1) {
    const message = readCostRecord(messages?.[index]);
    if (message?.role !== "assistant" || isTranscriptOnlyOpenClawAssistantMessage(message)) {
      continue;
    }
    return typeof message.provider === "string" ? message.provider.trim() || null : null;
  }
  return null;
}

function parseHexRgb(hex: string): [number, number, number] | null {
  const h = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) {
    return null;
  }
  return [
    Number.parseInt(h.slice(0, 2), 16),
    Number.parseInt(h.slice(2, 4), 16),
    Number.parseInt(h.slice(4, 6), 16),
  ];
}

let cachedThemeNoticeColors: {
  warnHex: string;
  dangerHex: string;
  warnRgb: [number, number, number];
  dangerRgb: [number, number, number];
} | null = null;

function getThemeNoticeColors() {
  if (cachedThemeNoticeColors) {
    return cachedThemeNoticeColors;
  }
  const rootStyle = getComputedStyle(document.documentElement);
  const warnHex = rootStyle.getPropertyValue("--warn").trim() || "#f59e0b";
  const dangerHex = rootStyle.getPropertyValue("--danger").trim() || "#ef4444";
  cachedThemeNoticeColors = {
    warnHex,
    dangerHex,
    warnRgb: parseHexRgb(warnHex) ?? [245, 158, 11],
    dangerRgb: parseHexRgb(dangerHex) ?? [239, 68, 68],
  };
  return cachedThemeNoticeColors;
}

function getContextNoticeViewModel(
  session: GatewaySessionRow | undefined,
  defaultContextTokens: number | null,
): {
  pct: number;
  used: number;
  limit: number;
  input: number | null;
  output: number | null;
  cost: number | null;
  detail: string;
  color: string;
  bg: string;
  warning: boolean;
  approximate: boolean;
  fromLastPrompt: boolean;
} | null {
  const used = session?.totalTokens;
  const { tokens: limit, fromLastPrompt } = resolveSessionContextLimit(
    session,
    defaultContextTokens,
  );
  if (typeof used !== "number" || !Number.isFinite(used) || used < 0 || !limit) {
    return null;
  }
  const approximate = session?.totalTokensFresh === false;
  const ratio = used / limit;
  const pct = Math.min(Math.round(ratio * 100), 100);
  // A stale total is still useful orientation, but must not drive warning or
  // compaction decisions because the session may already have compacted.
  const warning = !approximate && ratio >= CONTEXT_NOTICE_RATIO;
  // Session rows expose the latest run snapshot; totalTokens is the separate context snapshot.
  const input = Number.isFinite(session?.inputTokens) ? (session?.inputTokens ?? null) : null;
  const output = Number.isFinite(session?.outputTokens) ? (session?.outputTokens ?? null) : null;
  const cost =
    typeof session?.estimatedCostUsd === "number" &&
    Number.isFinite(session.estimatedCostUsd) &&
    session.estimatedCostUsd >= 0
      ? session.estimatedCostUsd
      : null;
  const usage = {
    fromLastPrompt,
    used,
    limit,
    input,
    output,
    cost,
  };
  if (!warning) {
    return {
      pct,
      ...usage,
      detail: `${approximate ? "~" : ""}${formatCompactTokenCount(used)} / ${formatCompactTokenCount(limit)}`,
      color: "var(--muted)",
      bg: "color-mix(in srgb, var(--muted) 8%, transparent)",
      warning,
      approximate,
    };
  }
  const { warnRgb, dangerRgb } = getThemeNoticeColors();
  const [wr, wg, wb] = warnRgb;
  const [dr, dg, db] = dangerRgb;
  const mix = Math.min(Math.max((ratio - 0.85) / 0.1, 0), 1);
  const r = Math.round(wr + (dr - wr) * mix);
  const g = Math.round(wg + (dg - wg) * mix);
  const b = Math.round(wb + (db - wb) * mix);
  const color = `rgb(${r}, ${g}, ${b})`;
  const bgOpacity = 0.08 + 0.08 * mix;
  const bg = `rgba(${r}, ${g}, ${b}, ${bgOpacity})`;
  return {
    pct,
    ...usage,
    detail: `${formatCompactTokenCount(used)} / ${formatCompactTokenCount(limit)}`,
    color,
    bg,
    warning,
    approximate,
  };
}

const RING_RADIUS = 6.5;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function renderContextNotice(
  session: GatewaySessionRow | undefined,
  defaultContextTokens: number | null,
  options: ContextNoticeOptions = {},
) {
  const model = getContextNoticeViewModel(session, defaultContextTokens);
  const quotaGroups = options.providerUsage
    ? collectProviderQuotaGroups(
        options.providerUsage.modelAuthStatusResult ?? null,
        isMonitoredAuthProvider,
      )
    : [];
  const currentProvider =
    session?.modelProvider?.trim() || latestAssistantProvider(options.messages);
  const normalizedProvider = currentProvider?.toLowerCase();
  const currentGroup = normalizedProvider
    ? quotaGroups.find((group) =>
        group.providers.some((id) => id.trim().toLowerCase() === normalizedProvider),
      )
    : undefined;
  if (!model && !currentGroup) {
    return nothing;
  }
  const summary = model
    ? t("chat.composer.contextUsage.summary", {
        used: `${model.approximate ? "~" : ""}${formatCompactTokenCount(model.used)}`,
        limit: formatCompactTokenCount(model.limit),
        pct: `${model.approximate ? "~" : ""}${model.pct}`,
      })
    : t("chat.usageRemaining");
  const percentage = model ? `${model.approximate ? "~" : ""}${model.pct}%` : null;
  const dashOffset = model ? RING_CIRCUMFERENCE * (1 - model.pct / 100) : RING_CIRCUMFERENCE;
  const providerCosts = model ? latestProviderCostStats(options.messages) : null;
  // Plan-billed sessions hide dollar estimates: subscription usage is bounded
  // by the plan windows below, and per-token math would misread as real spend.
  // Billing mode is provider-level: session rows do not record which auth
  // profile served the run, so a provider with both an API key and a
  // subscription resolves to subscription display (per-run credential
  // attribution is #102807).
  const showCosts = !currentGroup;
  const formatStat = (value: number | null) =>
    value === null ? t("usage.common.emptyValue") : formatCompactTokenCount(value);
  const renderCostStat = (label: string, value: number | undefined) =>
    value === undefined || value <= 0
      ? nothing
      : html`
          <div>
            <dt>${label}</dt>
            <dd>${formatCost(value)}</dd>
          </div>
        `;
  const hasProviderCosts = providerCosts
    ? [
        providerCosts.input,
        providerCosts.output,
        providerCosts.cacheRead,
        providerCosts.cacheWrite,
      ].some((value) => value !== undefined && value > 0)
    : false;
  return html`
    <div
      class="context-usage"
      style=${model ? `--ctx-color:${model.color};--ctx-bg:${model.bg}` : ""}
    >
      <details @toggle=${handleChatComposerDetailsToggle}>
        <summary
          class="context-ring ${model?.warning ? "context-ring--warning" : ""}"
          aria-label=${summary}
          title=${t("chat.composer.contextUsage.open")}
        >
          <svg
            class="context-ring__dial"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            aria-hidden="true"
          >
            <circle class="context-ring__track" cx="8" cy="8" r=${RING_RADIUS} />
            <circle
              class="context-ring__fill"
              cx="8"
              cy="8"
              r=${RING_RADIUS}
              stroke-dasharray=${RING_CIRCUMFERENCE.toFixed(2)}
              stroke-dashoffset=${dashOffset.toFixed(2)}
            />
          </svg>
        </summary>
        <section class="context-usage__popover" aria-label=${t("chat.composer.contextUsage.title")}>
          ${
            model
              ? html`
                  <div class="context-usage__header">
                    <span class="context-usage__title"
                      >${t(model.fromLastPrompt ? "chat.composer.contextUsage.promptBudget" : "chat.composer.contextUsage.contextWindow")}</span
                    >
                    <strong class="context-usage__context-value"
                      >${model.detail} · ${percentage}</strong
                    >
                  </div>
                  <div
                    class="context-usage__bar"
                    role="progressbar"
                    aria-label=${summary}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow=${model.pct}
                  >
                    <span style="width: ${model.pct}%"></span>
                  </div>
                `
              : nothing
          }
          ${
            model
              ? html`
                  <div class="context-usage__section-label">
                    ${t("chat.composer.contextUsage.latestRunTokens")}
                  </div>
                  <dl class="context-usage__stats">
                    <div>
                      <dt>${t("usage.breakdown.input")}</dt>
                      <dd>${formatStat(model.input)}</dd>
                    </div>
                    <div>
                      <dt>${t("usage.breakdown.output")}</dt>
                      <dd>${formatStat(model.output)}</dd>
                    </div>
                    ${
                      !showCosts || model.cost === null
                        ? nothing
                        : html`
                            <div>
                              <dt>${t("chat.composer.contextUsage.estimatedCost")}</dt>
                              <dd>${formatCost(model.cost)}</dd>
                            </div>
                          `
                    }
                  </dl>
                `
              : nothing
          }
          ${
            showCosts && providerCosts && hasProviderCosts
              ? html`
                  <div class="context-usage__section-label">${t("usage.breakdown.costByType")}</div>
                  <dl class="context-usage__stats">
                    ${renderCostStat(t("usage.breakdown.input"), providerCosts.input)}
                    ${renderCostStat(t("usage.breakdown.output"), providerCosts.output)}
                    ${renderCostStat(t("usage.breakdown.cacheRead"), providerCosts.cacheRead)}
                    ${renderCostStat(t("usage.breakdown.cacheWrite"), providerCosts.cacheWrite)}
                  </dl>
                `
              : nothing
          }
          ${currentGroup ? renderProviderQuotaGroup(currentGroup, options.providerUsage?.basePath) : nothing}
        </section>
      </details>
    </div>
  `;
}
