/* @vitest-environment jsdom */

import { render } from "lit";
import { afterEach, describe, expect, it } from "vitest";
import { renderProviderQuotaGroup } from "./provider-quota-card.ts";

const containers: HTMLElement[] = [];

function renderQuota(usedPercent: number): HTMLElement {
  const container = document.createElement("div");
  containers.push(container);
  render(
    renderProviderQuotaGroup({
      providers: ["openai"],
      displayName: "OpenAI",
      windows: [{ label: "Week", usedPercent }],
      budgets: [],
    }),
    container,
  );
  return container;
}

afterEach(() => {
  for (const container of containers.splice(0)) {
    render(null, container);
  }
});

describe("provider quota card", () => {
  it.each([
    { usedPercent: 59, remaining: 41, tone: "safe" },
    { usedPercent: 60, remaining: 40, tone: "warn" },
    { usedPercent: 80, remaining: 20, tone: "warn" },
    { usedPercent: 81, remaining: 19, tone: "danger" },
  ])("renders $remaining% remaining with the $tone quota state", ({ usedPercent, remaining, tone }) => {
    const container = renderQuota(usedPercent);
    const bar = container.querySelector<HTMLElement>(".context-usage__limit-bar");
    const fill = bar?.querySelector<HTMLElement>("span");

    expect(container.textContent?.replace(/\s+/g, " ").trim()).toContain(`${remaining}% remaining`);
    expect(bar?.classList.contains("context-usage__limit-bar--quota")).toBe(true);
    expect(bar?.getAttribute("aria-valuenow")).toBe(String(remaining));
    expect(bar?.getAttribute("aria-label")).toBe(`Weekly: ${remaining}% remaining`);
    expect(fill?.classList.contains(`context-usage__limit-fill--${tone}`)).toBe(true);
    expect(fill?.getAttribute("style")).toContain(`width: ${remaining}%`);
  });
});
