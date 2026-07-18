import { describe, it, expect } from "vitest";
import { icons, HelpCircle } from "lucide-react";
import { iconMapper } from "./iconMapper";

const [knownIconName, KnownIconComponent] = Object.entries(icons)[0];

describe("iconMapper", () => {
  it("returns the correct component for a known icon name", () => {
    expect(iconMapper(knownIconName)).toBe(KnownIconComponent);
  });

  it("falls back to HelpCircle for an unknown icon name", () => {
    expect(iconMapper("definitely-not-an-icon")).toBe(HelpCircle);
  });

  it("never returns undefined", () => {
    expect(iconMapper("another-garbage-name")).toBeDefined();
    expect(iconMapper("")).toBeDefined();
    expect(iconMapper(knownIconName)).toBeDefined();
  });
});