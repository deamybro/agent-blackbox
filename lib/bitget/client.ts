import crypto from "node:crypto";

const BASE_URL = "https://api.bitget.com";
const PRODUCT_TYPE = "USDT-FUTURES";
const MARGIN_COIN = "USDT";
const configured = Boolean(process.env.BITGET_API_KEY && process.env.BITGET_SECRET_KEY && process.env.BITGET_PASSPHRASE);

type ApiEnvelope<T> = { code: string; msg: string; requestTime: number; data: T };
type Ticker = { symbol: string; lastPr: string; high24h: string; low24h: string; change24h: string; quoteVolume: string; fundingRate: string };
type Account = { marginCoin: string; available: string; accountEquity: string; usdtEquity: string };

function credentials() {
  if (!configured) throw new Error("Bitget API credentials are not configured.");
  return {
    key: process.env.BITGET_API_KEY as string,
    secret: process.env.BITGET_SECRET_KEY as string,
    passphrase: process.env.BITGET_PASSPHRASE as string
  };
}

function queryString(params?: Record<string, string>) {
  return params ? new URLSearchParams(params).toString() : "";
}

async function request<T>(method: "GET" | "POST", requestPath: string, params?: Record<string, string>, body?: Record<string, string>, auth = false): Promise<T> {
  const query = queryString(params);
  const bodyString = body ? JSON.stringify(body) : "";
  const timestamp = Date.now().toString();
  const headers: Record<string, string> = { "Content-Type": "application/json", locale: "en-US" };
  if (auth) {
    const c = credentials();
    const prehash = `${timestamp}${method}${requestPath}${query ? `?${query}` : ""}${bodyString}`;
    headers["ACCESS-KEY"] = c.key;
    headers["ACCESS-PASSPHRASE"] = c.passphrase;
    headers["ACCESS-TIMESTAMP"] = timestamp;
    headers["ACCESS-SIGN"] = crypto.createHmac("sha256", c.secret).update(prehash).digest("base64");
  }
  const response = await fetch(`${BASE_URL}${requestPath}${query ? `?${query}` : ""}`, {
    method, headers, body: bodyString || undefined, cache: "no-store", signal: AbortSignal.timeout(10000)
  });
  const envelope = await response.json() as ApiEnvelope<T>;
  if (!response.ok || envelope.code !== "00000") throw new Error(`Bitget ${envelope.code || response.status}: ${envelope.msg || "Request failed"}`);
  return envelope.data;
}

export const bitget = {
  configured,
  async ticker(symbol: string) {
    const data = await request<Ticker[]>("GET", "/api/v2/mix/market/ticker", { productType: PRODUCT_TYPE, symbol });
    if (!data[0]) throw new Error(`No Bitget ticker returned for ${symbol}.`);
    return data[0];
  },
  async account() {
    const data = await request<Account[]>("GET", "/api/v2/mix/account/accounts", { productType: PRODUCT_TYPE }, undefined, true);
    const account = data.find(x => x.marginCoin === MARGIN_COIN) || data[0];
    if (!account) throw new Error("No Bitget USDT futures account was returned.");
    return account;
  },
  async verifyConnection() {
    const ticker = await this.ticker("BTCUSDT");
    if (!configured) return { ticker, account: null };
    return { ticker, account: await this.account() };
  }
};
