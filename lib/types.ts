export type Side = "LONG" | "SHORT" | "HOLD" | "CLOSE";
export type Verdict = "ALLOW" | "REDUCE_SIZE" | "HUMAN_REVIEW" | "BLOCK";
export type Regime = "TRENDING_BULL" | "TRENDING_BEAR" | "RANGING" | "HIGH_VOLATILITY" | "LOW_LIQUIDITY" | "CRISIS" | "UNCLEAR";
export type ExecutionMode = "SIMULATION" | "PAPER";
export type TradeStatus = "EXECUTED" | "BLOCKED" | "REVIEW" | "HELD";
export type SignalCategory = "macro" | "market_intel" | "news" | "sentiment" | "technical" | "on_chain" | "liquidity" | "funding";

export interface Signal {
  category: SignalCategory;
  source: string;
  value: number;
  score: number;
  timestamp: string;
  freshness: number;
  explanation: string;
}

export interface MarketContext {
  price: number;
  volatility: number;
  trendStrength: number;
  sentimentScore: number;
  fundingRate: number;
  newsScore: number;
  technicalScore: number;
  onChainScore: number;
  volumeCondition: number;
}

export interface Proposal {
  agentName: string;
  symbol: string;
  side: Side;
  proposedPositionSize: number;
  leverage: number;
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  confidence: number;
  reasoning: string;
  signals: Signal[];
  market: MarketContext;
}

export interface RiskCheck {
  name: string;
  status: "PASS" | "WARN" | "FAIL";
  score: number;
  explanation: string;
}

export interface RiskResult {
  verdict: Verdict;
  score: number;
  reasons: string[];
  checks: RiskCheck[];
  finalPositionSize: number;
  regime: Regime;
  explanation: string;
}

export interface Decision extends Proposal {
  id: string;
  timestamp: string;
  finalPositionSize: number;
  marketRegime: Regime;
  riskVerdict: Verdict;
  riskScore: number;
  riskReasons: string[];
  riskChecks: RiskCheck[];
  verdictExplanation: string;
  executionMode: ExecutionMode;
  tradeStatus: TradeStatus;
  resultPnL: number;
  postTradeReview: string;
  exitPrice?: number;
  balanceAfter: number;
  liveOrderId?: string;
  liveClientOid?: string;
}

export interface BitgetStatus {
  network: "BITGET_MAINNET";
  configured: boolean;
  publicMarketConnected: boolean;
  authenticated: boolean;
  executionMode: "PAPER_ONLY";
  btcPrice?: number;
  accountEquity?: number;
  availableBalance?: number;
  message: string;
}

export interface Metrics {
  total: number;
  approved: number;
  blocked: number;
  reduced: number;
  review: number;
  portfolioValue: number;
  pnl: number;
  winRate: number;
  maxDrawdown: number;
  averageRisk: number;
  currentRegime: Regime;
  commonRiskReason: string;
  decisions: Decision[];
  equityCurve: { timestamp: string; value: number; pnl: number }[];
  verdicts: { name: Verdict; value: number }[];
}
