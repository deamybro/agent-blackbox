import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Decision, Metrics } from "@/lib/types";

const dbPath = path.resolve(process.cwd(), process.env.DATABASE_URL || "data/blackbox.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec(`PRAGMA busy_timeout = 10000;
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS decisions (id TEXT PRIMARY KEY, timestamp TEXT NOT NULL, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS snapshots (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT NOT NULL, balance REAL NOT NULL, pnl REAL NOT NULL);`);

export function saveDecision(d: Decision) {
  db.prepare("INSERT INTO decisions (id, timestamp, data) VALUES (?, ?, ?)").run(d.id, d.timestamp, JSON.stringify(d));
  db.prepare("INSERT INTO snapshots (timestamp, balance, pnl) VALUES (?, ?, ?)").run(d.timestamp, d.balanceAfter, d.resultPnL);
  return d;
}

export function getDecisions(limit = 200): Decision[] {
  return (db.prepare("SELECT data FROM decisions ORDER BY timestamp DESC LIMIT ?").all(limit) as { data: string }[]).map(r => JSON.parse(r.data));
}

export function getDecision(id: string): Decision | null {
  const row = db.prepare("SELECT data FROM decisions WHERE id = ?").get(id) as { data: string } | undefined;
  return row ? JSON.parse(row.data) : null;
}

export function currentBalance() {
  const row = db.prepare("SELECT balance FROM snapshots ORDER BY id DESC LIMIT 1").get() as { balance: number } | undefined;
  return row?.balance ?? 100000;
}

export function getMetrics(): Metrics {
  const decisions = getDecisions();
  const executed = decisions.filter(d => d.tradeStatus === "EXECUTED");
  const pnl = executed.reduce((a, d) => a + d.resultPnL, 0);
  const wins = executed.filter(d => d.resultPnL > 0).length;
  const averageRisk = decisions.length ? decisions.reduce((a, d) => a + d.riskScore, 0) / decisions.length : 0;
  const reasons = decisions.flatMap(d => d.riskReasons);
  const commonRiskReason = reasons.length ? Object.entries(reasons.reduce<Record<string, number>>((a, x) => ({ ...a, [x]: (a[x] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1])[0][0] : "No risk exceptions yet";
  const snapshots = db.prepare("SELECT timestamp, balance as value, pnl FROM snapshots ORDER BY id ASC LIMIT 100").all() as { timestamp: string; value: number; pnl: number }[];
  let peak = 100000, maxDrawdown = 0;
  snapshots.forEach(s => { peak = Math.max(peak, s.value); maxDrawdown = Math.max(maxDrawdown, (peak - s.value) / peak); });
  const count = (v: string) => decisions.filter(d => d.riskVerdict === v).length;
  return {
    total: decisions.length, approved: count("ALLOW"), blocked: count("BLOCK"), reduced: count("REDUCE_SIZE"), review: count("HUMAN_REVIEW"),
    portfolioValue: currentBalance(), pnl, winRate: executed.length ? wins / executed.length : 0, maxDrawdown, averageRisk,
    currentRegime: decisions[0]?.marketRegime || "UNCLEAR", commonRiskReason, decisions,
    equityCurve: [{ timestamp: "Start", value: 100000, pnl: 0 }, ...snapshots],
    verdicts: ["ALLOW", "REDUCE_SIZE", "HUMAN_REVIEW", "BLOCK"].map(name => ({ name: name as Metrics["verdicts"][number]["name"], value: count(name) }))
  };
}
