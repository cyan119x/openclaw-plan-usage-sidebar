import { html, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import type { UsageSummary } from "../../../src/infra/provider-usage.types.js";
import type { GatewayBrowserClient } from "../api/gateway.ts";
import { t } from "../i18n/index.ts";
import { OpenClawLightDomElement } from "../lit/openclaw-element.ts";
import { PollController } from "../lit/poll-controller.ts";
import { renderProviderQuotaGroup } from "./provider-quota-card.ts";
import { collectProviderQuotaGroupsFromUsageSummary } from "../lib/provider-quota-summary.ts";
import { IncompleteUsageRetry, isUsageIncomplete } from "../lib/incomplete-usage-retry.ts";
import { requestProviderUsage } from "../lib/provider-usage-request.ts";
import "../styles/sidebar-plan-usage.css";

const REFRESH_INTERVAL_MS = 60_000;
const CACHE_KEY = "openclaw.sidebar-plan-usage.v1";
const CACHE_MAX_AGE_MS = 120_000;
const CACHE_COLD_RETRY_MS = 1_000;
const CACHE_COLD_RETRY_LIMIT = 5;

type CachedUsageSummary = {
  savedAt: number;
  summary: UsageSummary;
};

function isCachedUsageSummary(value: unknown): value is CachedUsageSummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const cached = value as Partial<CachedUsageSummary>;
  return (
    typeof cached.savedAt === "number" &&
    cached.summary !== null &&
    typeof cached.summary === "object" &&
    Array.isArray((cached.summary as { providers?: unknown }).providers) &&
    !isUsageIncomplete(cached.summary)
  );
}

function readCachedUsageSummary(): UsageSummary | null {
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }
    const cached: unknown = JSON.parse(raw);
    if (!isCachedUsageSummary(cached) || Date.now() - cached.savedAt > CACHE_MAX_AGE_MS) {
      window.sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return cached.summary;
  } catch {
    return null;
  }
}

function cacheUsageSummary(summary: UsageSummary): void {
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), summary }));
  } catch {
    // Storage can be unavailable or full; the live request remains authoritative.
  }
}

function isOpenAiOrCodexQuotaProvider(providerId: string): boolean {
  const normalized = providerId.trim().toLowerCase();
  return normalized.includes("openai") || normalized.includes("codex");
}

class SidebarPlanUsage extends OpenClawLightDomElement {
  @property({ attribute: false }) client: GatewayBrowserClient | null = null;
  @property({ attribute: false }) connected = false;
  @property({ attribute: false }) basePath = "";

  @state() private usageSummary: UsageSummary | null = null;
  @state() private unavailable = false;
  private requestVersion = 0;
  private abortController: AbortController | null = null;
  private readonly incompleteUsageRetry = new IncompleteUsageRetry({
    retry: () => this.refreshUsage(),
    retryMs: CACHE_COLD_RETRY_MS,
    limit: CACHE_COLD_RETRY_LIMIT,
    onExhausted: () => {
      if (!this.usageSummary) {
        this.unavailable = true;
      }
    },
  });
  private readonly polling = new PollController(this, REFRESH_INTERVAL_MS, () => {
    void this.refreshUsage();
  }, false);

  private readonly handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      this.polling.start();
      void this.refreshUsage();
    } else {
      this.polling.stop();
    }
  };

  override connectedCallback() {
    super.connectedCallback();
    this.usageSummary ??= readCachedUsageSummary();
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    if (document.visibilityState === "visible") {
      this.polling.start();
    }
    void this.refreshUsage();
  }

  override disconnectedCallback() {
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.abortController?.abort();
    this.abortController = null;
    this.incompleteUsageRetry.dispose();
    super.disconnectedCallback();
  }

  override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (changed.has("client") || changed.has("connected")) {
      if (!this.connected) {
        this.incompleteUsageRetry.dispose();
      }
      void this.refreshUsage();
    }
  }

  private async refreshUsage() {
    if (!this.client || !this.connected || document.visibilityState !== "visible") {
      return;
    }
    this.abortController?.abort();
    const controller = new AbortController();
    this.abortController = controller;
    const client = this.client;
    const requestVersion = ++this.requestVersion;
    const ownsRequest = () =>
      this.client === client &&
      this.connected &&
      this.requestVersion === requestVersion &&
      !controller.signal.aborted;
    try {
      const result = await requestProviderUsage(client, { signal: controller.signal });
      if (!ownsRequest()) {
        return;
      }
      if (result.ok) {
        // Gateway-capable clients receive an empty refreshing marker while its
        // provider cache is cold. It is intentionally not a usable quota snapshot.
        // Keep the last good data on screen and converge through the shared retry policy.
        if (isUsageIncomplete(result.value)) {
          this.unavailable = false;
          this.incompleteUsageRetry.observe(true, client);
          return;
        }
        this.usageSummary = result.value;
        cacheUsageSummary(result.value);
        this.unavailable = false;
        this.incompleteUsageRetry.observe(false, client);
      } else {
        // A failed auxiliary refresh must never clear a successful snapshot.
        this.unavailable = this.usageSummary === null;
      }
    } catch {
      // Cancellation deliberately does not publish an error state. The latest
      // successful snapshot stays visible while a reconnect/request races.
      if (ownsRequest()) {
        this.unavailable = this.usageSummary === null;
      }
    }
  }

  override render() {
    const groups = collectProviderQuotaGroupsFromUsageSummary(this.usageSummary).filter((group) =>
      group.providers.some(isOpenAiOrCodexQuotaProvider),
    );
    return html`
      <section class="sidebar-plan-usage" aria-label=${t("chat.composer.contextUsage.planUsage")}>
        ${
          groups.length > 0
            ? groups.map((group) =>
                renderProviderQuotaGroup(group, this.basePath, { compactRemainingLabel: true }),
              )
            : html`<div class="context-usage__section-label">
                ${t("chat.composer.contextUsage.planUsage")}
              </div>`
        }
        ${this.unavailable && groups.length === 0
          ? html`<div class="sidebar-plan-usage__unavailable" role="status">
              ${t("usage.providerUsage.unavailable")}
            </div>`
          : nothing}
      </section>
    `;
  }
}

if (!customElements.get("openclaw-sidebar-plan-usage")) {
  customElements.define("openclaw-sidebar-plan-usage", SidebarPlanUsage);
}
