import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./app.css", import.meta.url), "utf8");

describe("app typography tokens", () => {
  it("defines the compact SaaS typography scale and compatibility aliases", () => {
    expect(css).toContain("--app-text-xs: 11px;");
    expect(css).toContain("--app-text-sm: 12px;");
    expect(css).toContain("--app-text-md: 13px;");
    expect(css).toContain("--app-text-lg: 14px;");
    expect(css).toContain("--app-text-section: 16px;");
    expect(css).toContain("--app-text-panel: 18px;");
    expect(css).toContain("--app-text-page: 24px;");
    expect(css).toContain("--app-text-editor: 16px;");

    expect(css).toContain("--app-compact-text: var(--app-text-sm);");
    expect(css).toContain("--app-body-text: var(--app-text-md);");
    expect(css).toContain("--app-title-text: var(--app-text-panel);");
    expect(css).toContain("--app-editor-text: var(--app-text-editor);");
  });

  it("defines standard line-height tokens", () => {
    expect(css).toContain("--app-leading-tight: 1.25;");
    expect(css).toContain("--app-leading-normal: 1.45;");
    expect(css).toContain("--app-leading-editor: 1.65;");
  });

  it("keeps raw font-size values limited to the intentional brand lockup", () => {
    const rawFontSizes = [...css.matchAll(/font-size:\s*(\d+px);/g)].map((match) => match[0]);
    expect(rawFontSizes).toEqual(["font-size: 25px;", "font-size: 19px;", "font-size: 20px;"]);
  });
});
