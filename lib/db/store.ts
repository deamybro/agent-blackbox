import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { neon } from "@neondatabase/serverless";
import type { Decision, Metrics } from "@/lib/types";

const databaseUrl = process.env.DATABASE_URL || "data/blackbox.db";
const usePostgres = databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://");
let sqlite: DatabaseSync | null = null;
let postgresReady: Promise<void> | null = null;

function localDb() {
  if (sqlite) return sqlite;
  const dbPath = path.resolve(process.cwd(), databaseUrl);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  sqlite = new DatabaseSync(dbPath);
  sqlite.exec(`PRAGMA busy_timeout = 10000;
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS decisions (id TEXT PRIMARY KEY, timestamp TEXT NOT NULL, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS snapshots (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT NOT NULL, balance REAL NOT NULL, pnl REAL NOT NULL);`);
  return sqlite;
}

function pg() {
  return neon(databaseUrl);
}

async function ensurePostgres() {
  if (!postgresReady) {
    postgresReady = (async () => {
      const sql = pg();
      await sql`CREATE TABLE IF NOT EXISTS decisions (id TEXT PRIMARY KEY, timestamp TEXT NOT NULL, data JSONB NOT NULL)`;
      await sql`CREATE TABLE IF NOT EXISTS snapshots (id BIGSERIAL PRIMARY KEY, timestamp TEXT NOT NULL, balance DOUBLE PRECISION NOT NULL, pnl DOUBLE PRECISION NOT NULL)`;
    })();
  }
  return postgresReady;
}

export async function saveDecision(d: Decision) {
  if (usePostgres) {
    await ensurePostgres();
    const sql = pg();
    await sql`INSERT INTO decisions (id, timestamp, data) VALUES (${d.id}, ${d.timestamp}, ${JSON.stringify(d)}::jsonb)`;
    await sql`INSERT INTO snapshots (timestamp, balance, pnl) VALUES (${d.timestamp}, ${d.balanceAfter}, ${d.resultPnL})`;
  } else {
    const db = localDb();
    db.prepare("INSERT INTO decisions (id, timestamp, data) VALUES (?, ?, ?)").run(d.id, d.timestamp, JSON.stringify(d));
    db.prepare("INSERT INTO snapshots (timestamp, balance, pnl) VALUES (?, ?, ?)").run(d.timestamp, d.balanceAfter, d.resultPnL);
  }
  return d;
}

export async function getDecisions(limit = 200): Promise<Decision[]> {
  if (usePostgres) {
    await ensurePostgres();
    const rows = await pg()`SELECT data FROM decisions ORDER BY timestamp DESC LIMIT ${limit}` as { data: Decision }[];
    return rows.map(r => r.data);
  }
  return (localDb().prepare("SELECT data FROM decisions ORDER BY timestamp DESC LIMIT ?").all(limit) as { data: string }[]).map(r => JSON.parse(r.data));
}

export async function getDecision(id: string): Promise<Decision | null> {
  if (usePostgres) {
    await ensurePostgres();
    const rows = await pg()`SELECT data FROM decisions WHERE id = ${id} LIMIT 1` as { data: Decision }[];
    return rows[0]?.data || null;
  }
  const row = localDb().prepare("SELECT data FROM decisions WHERE id = ?").get(id) as { data: string } | undefined;
  return row ? JSON.parse(row.data) : null;
}

export async function currentBalance() {
  if (usePostgres) {
    await ensurePostgres();
    const rows = await pg()`SELECT balance FROM snapshots ORDER BY id DESC LIMIT 1` as { balance: number }[];
    return Number(rows[0]?.balance ?? 100000);
  }
  const row = localDb().prepare("SELECT balance FROM snapshots ORDER BY id DESC LIMIT 1").get() as { balance: number } | undefined;
  return row?.balance ?? 100000;
}

async function snapshots() {
  if (usePostgres) {
    await ensurePostgres();
    return await pg()`SELECT timestamp, balance as value, pnl FROM snapshots ORDER BY id ASC LIMIT 100` as { timestamp: string; value: number; pnl: number }[];
  }
  return localDb().prepare("SELECT timestamp, balance as value, pnl FROM snapshots ORDER BY id ASC LIMIT 100").all() as { timestamp: string; value: number; pnl: number }[];
}

export async function getMetrics(): Promise<Metrics> {
  const [decisions, balance, points] = await Promise.all([getDecisions(), currentBalance(), snapshots()]);
  const executed = decisions.filter(d => d.tradeStatus === "EXECUTED");
  const pnl = executed.reduce((a, d) => a + d.resultPnL, 0);
  const wins = executed.filter(d => d.resultPnL > 0).length;
  const averageRisk = decisions.length ? decisions.reduce((a, d) => a + d.riskScore, 0) / decisions.length : 0;
  const reasons = decisions.flatMap(d => d.riskReasons);
  const commonRiskReason = reasons.length ? Object.entries(reasons.reduce<Record<string, number>>((a, x) => ({ ...a, [x]: (a[x] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1])[0][0] : "No risk exceptions yet";
  let peak = 100000, maxDrawdown = 0;
  points.forEach(s => { peak = Math.max(peak, Number(s.value)); maxDrawdown = Math.max(maxDrawdown, (peak - Number(s.value)) / peak); });
  const count = (v: string) => decisions.filter(d => d.riskVerdict === v).length;
  return {
    total: decisions.length, approved: count("ALLOW"), blocked: count("BLOCK"), reduced: count("REDUCE_SIZE"), review: count("HUMAN_REVIEW"),
    portfolioValue: balance, pnl, winRate: executed.length ? wins / executed.length : 0, maxDrawdown, averageRisk,
    currentRegime: decisions[0]?.marketRegime || "UNCLEAR", commonRiskReason, decisions,
    equityCurve: [{ timestamp: "Start", value: 100000, pnl: 0 }, ...points.map(p => ({ ...p, value: Number(p.value), pnl: Number(p.pnl) }))],
    verdicts: ["ALLOW", "REDUCE_SIZE", "HUMAN_REVIEW", "BLOCK"].map(name => ({ name: name as Metrics["verdicts"][number]["name"], value: count(name) }))
  };
}
