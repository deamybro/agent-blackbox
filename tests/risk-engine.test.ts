import { describe, expect, it } from "vitest";
import { createProposal } from "@/lib/agent/runner";
import { checkRisk } from "@/lib/risk/engine";

describe("risk firewall", () => {
  it("allows a controlled BTC proposal", () => {
    const result = checkRisk(createProposal("safe"));
    expect(["ALLOW", "REDUCE_SIZE"]).toContain(result.verdict);
    expect(result.score).toBeLessThanOrEqual(60);
  });
  it("blocks dangerous leverage and concentration", () => {
    const result = checkRisk(createProposal("dangerous"));
    expect(result.verdict).toBe("BLOCK");
    expect(result.finalPositionSize).toBe(0);
    expect(result.score).toBeGreaterThan(80);
  });
  it("explains every verdict", () => {
    const result = checkRisk(createProposal("dangerous"));
    expect(result.explanation).toContain("Verdict: BLOCK");
    expect(result.checks.length).toBeGreaterThanOrEqual(15);
  });
});
