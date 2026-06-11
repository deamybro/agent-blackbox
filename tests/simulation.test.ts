import { describe, expect, it } from "vitest";
import { createProposal } from "@/lib/agent/runner";
import { checkRisk } from "@/lib/risk/engine";
import { simulateTrade } from "@/lib/simulation/engine";
describe("simulation engine", () => {
  it("does not execute blocked trades", () => {
    const p=createProposal("dangerous"), r=checkRisk(p), sim=simulateTrade(p,r,100000,"blocked");
    expect(sim.pnl).toBe(0); expect(sim.balanceAfter).toBe(100000);
  });
  it("tracks outcomes for permitted trades", () => {
    const p=createProposal("safe"), r=checkRisk(p), sim=simulateTrade(p,r,100000,"safe-cycle");
    expect(sim.exitPrice).toBeGreaterThan(0); expect(Number.isFinite(sim.pnl)).toBe(true);
  });
});
