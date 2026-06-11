import { describe, expect, it } from "vitest";
import { classifyRegime } from "@/lib/regime/classifier";
describe("regime classifier", () => {
  it("identifies crisis conditions", () => expect(classifyRegime({price:1,volatility:.9,trendStrength:-.8,sentimentScore:-.8,fundingRate:.002,newsScore:-.7,technicalScore:-.7,onChainScore:-.4,volumeCondition:.7})).toBe("CRISIS"));
  it("identifies a controlled bull trend", () => expect(classifyRegime({price:1,volatility:.3,trendStrength:.7,sentimentScore:.5,fundingRate:.0002,newsScore:.3,technicalScore:.6,onChainScore:.3,volumeCondition:.8})).toBe("TRENDING_BULL"));
});
