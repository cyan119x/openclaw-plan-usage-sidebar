/* @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import type { GatewayBrowserClient } from "../api/gateway.ts";
import "./sidebar-plan-usage.ts";

type SidebarPlanUsageElement = HTMLElement & {
  client: GatewayBrowserClient | null;
  connected: boolean;
  updateComplete: Promise<unknown>;
};

const mounted: HTMLElement[] = [];

function providerUsage(usedPercent: number) {
  return {
    updatedAt: Date.now(),
    providers: [
      {
        provider: "openai",
        displayName: "OpenAI",
        windows: [{ label: "Week", usedPercent }],
      },
    ],
  };
}

afterEach(() => {
  vi.useRealTimers();
  for (const element of mounted.splice(0)) {
    element.remove();
  }
  window.sessionStorage.clear();
});

describe("sidebar plan usage", () => {
  it("keeps the last quota snapshot while the Gateway usage cache refreshes", async () => {
    vi.useFakeTimers();
    const client = {
      request: vi
        .fn()
        .mockResolvedValueOnce(providerUsage(1))
        .mockResolvedValueOnce({ updatedAt: Date.now(), providers: [], refreshing: true })
        .mockResolvedValueOnce(providerUsage(2)),
    } as unknown as GatewayBrowserClient;
    const element = document.createElement("openclaw-sidebar-plan-usage") as SidebarPlanUsageElement;
    mounted.push(element);
    document.body.append(element);
    element.client = client;
    element.connected = true;

    await vi.advanceTimersByTimeAsync(0);
    await element.updateComplete;
    expect(element.textContent?.replace(/\s+/g, " ").trim()).toContain("99%");

    await (element as unknown as { refreshUsage: () => Promise<void> }).refreshUsage();
    await element.updateComplete;
    expect(element.textContent?.replace(/\s+/g, " ").trim()).toContain("99%");

    await vi.advanceTimersByTimeAsync(1_000);
    await element.updateComplete;
    expect(element.textContent?.replace(/\s+/g, " ").trim()).toContain("98%");
    expect(client.request).toHaveBeenCalledTimes(3);
  });
  it("hydrates the recent session snapshot before the Gateway request completes", async () => {
    window.sessionStorage.setItem(
      "openclaw.sidebar-plan-usage.v1",
      JSON.stringify({ savedAt: Date.now(), summary: providerUsage(7) }),
    );
    const element = document.createElement("openclaw-sidebar-plan-usage") as SidebarPlanUsageElement;
    mounted.push(element);
    document.body.append(element);
    await element.updateComplete;

    expect(element.textContent?.replace(/\s+/g, " ").trim()).toContain("93%");
    expect(element.textContent).not.toContain("remaining");
  });

});
