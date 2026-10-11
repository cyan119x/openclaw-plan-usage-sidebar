import { html, nothing } from "lit";
import { normalizeBasePath } from "../app-route-paths.ts";
import { icons } from "./icons.ts";
import { t } from "../i18n/index.ts";
import {
  formatQuotaReset,
  type ProviderQuotaGroup,
  type QuotaBudgetSummary,
  type QuotaLimitSummary,
} from "../lib/provider-quota-summary.ts";

function formatUsageWindowLabel(label: string): string {
  if (label === "5h") {
    return t("chat.composer.contextUsage.limitFiveHour");
  }
  if (label === "Week") {
    return t("chat.composer.contextUsage.limitWeekly");
  }
  if (label === "Day") {
    return t("chat.composer.contextUsage.limitDaily");
  }
  const hours = /^(\d+)h$/.exec(label);
  if (hours) {
    return t("chat.composer.contextUsage.limitHours", { hours: hours[1] ?? "" });
  }
  return label;
}

function formatBudgetAmount(amount: number, unit: string): string {
  if (/^[A-Za-z]{3}$/.test(unit)) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: unit.toUpperCase(),
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      // Non-ISO currency codes fall through to plain unit suffix formatting.
    }
  }
  return `${amount.toFixed(2)} ${unit}`;
}

function renderLimitBar(
  valuePercent: number,
  ariaLabel: string,
  severity: "safe" | "warn" | "danger" | null,
  isProviderQuota = false,
) {
  return html`
    <div
      class=${`context-usage__limit-bar${isProviderQuota ? " context-usage__limit-bar--quota" : ""}`}
      role="progressbar"
      aria-label=${ariaLabel}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow=${valuePercent}
    >
      <span
        class=${severity ? `context-usage__limit-fill--${severity}` : ""}
        style="width: ${valuePercent}%"
      ></span>
    </div>
  `;
}

function remainingQuotaSeverity(remainingPercent: number): "safe" | "warn" | "danger" {
  return remainingPercent < 20 ? "danger" : remainingPercent <= 40 ? "warn" : "safe";
}

function renderQuotaLimitRow(limit: QuotaLimitSummary, compactRemainingLabel: boolean) {
  const label = formatUsageWindowLabel(limit.label);
  const reset = formatQuotaReset(limit.resetAt);
  const remainingPercent = 100 - limit.usedPercent;
  const remainingLabel = `${remainingPercent}% remaining`;
  const visibleRemainingLabel = compactRemainingLabel ? `${remainingPercent}%` : remainingLabel;
  return html`
    <div class="context-usage__limit">
      <div class="context-usage__limit-head">
        <span class="context-usage__limit-label">${label}</span>
        <span class="context-usage__limit-meta">
          ${
            reset
              ? html`<span class="context-usage__limit-reset"
                  >${t("chat.composer.contextUsage.resets", { time: reset })}</span
                >`
              : nothing
          }
          <strong>${visibleRemainingLabel}</strong>
        </span>
      </div>
      ${renderLimitBar(
        remainingPercent,
        `${label}: ${remainingLabel}`,
        remainingQuotaSeverity(remainingPercent),
        true,
      )}
    </div>
  `;
}

function renderQuotaBudgetRow(budget: QuotaBudgetSummary) {
  const label = budget.label || t("chat.composer.contextUsage.usageCredits");
  const usedPercent = Math.max(0, Math.min(100, Math.round((budget.used / budget.limit) * 100)));
  const value = t("chat.composer.contextUsage.budgetValue", {
    used: formatBudgetAmount(budget.used, budget.unit),
    limit: formatBudgetAmount(budget.limit, budget.unit),
  });
  return html`
    <div class="context-usage__limit">
      <div class="context-usage__limit-head">
        <span class="context-usage__limit-label">${label}</span>
        <span class="context-usage__limit-meta"><strong>${value}</strong></span>
      </div>
      ${renderLimitBar(
        usedPercent,
        label,
        usedPercent >= 90 ? "danger" : usedPercent >= 75 ? "warn" : null,
      )}
    </div>
  `;
}

export function renderProviderQuotaGroup(
  group: ProviderQuotaGroup,
  basePath = "",
  options: { compactRemainingLabel?: boolean } = {},
) {
  const usageHref = `${normalizeBasePath(basePath)}/usage`;
  return html`
    <div class="context-usage__section-label context-usage__plan-header">
      <span>${t("chat.composer.contextUsage.planUsage")}</span>
      <a
        class="context-usage__plan-link"
        href=${usageHref}
        data-chat-provider-usage="true"
        aria-label=${t("chat.composer.contextUsage.openUsage")}
      >
        ${group.plan ? html`<span class="context-usage__plan-badge">${group.plan}</span>` : nothing}
        ${icons.externalLink}
      </a>
    </div>
    ${
      group.accountEmail
        ? html`<div class="context-usage__account" data-chat-usage-account="true">
            ${group.accountEmail}
          </div>`
        : nothing
    }
    <div class="context-usage__limits">
      ${group.windows.map((limit) => renderQuotaLimitRow(limit, options.compactRemainingLabel === true))}
      ${group.budgets.map((budget) => renderQuotaBudgetRow(budget))}
    </div>
    <div class="context-usage__provenance" data-chat-usage-provider="true">
      <span>${t("sessionsView.provider")}:</span>
      <strong>${group.displayName}</strong>
    </div>
  `;
}
