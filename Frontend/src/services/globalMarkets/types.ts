export interface CandlePoint {
  x: number;                                    // ms epoch timestamp
  y: [number, number, number, number];          // [open, high, low, close]
}

export interface IndexQuote {
  symbol: string; name: string; price: number; change: number;
  changePercent: number; high: number; low: number;
  timestamp: number; status: "open" | "closed" | "pre" | "after";
  candles: CandlePoint[];                       // real 15-min OHLC
  timezone?: string;                            // exchange timezone e.g. "America/New_York"
}
export interface ForexPair {
  pair: string; base: string; quote: string;
  rate: number; change: number; changePercent: number;
}
export interface BondYield { name: string; yield: number; change: number; }
export interface Commodity {
  name: string; symbol: string; price: number;
  change: number; changePercent: number; unit: string;
  candles: CandlePoint[];                       // real 15-min OHLC
  timezone?: string;                            // exchange timezone
}
export interface VixData {
  value: number; change: number; changePercent: number;
  sentiment: "low" | "moderate" | "high" | "extreme";
}
export interface GlobalEvent {
  date: string; region: string; title: string;
  impact: "Low" | "Medium" | "High"; actual?: string; forecast?: string;
  url?: string;                                 // clickable link for event
}
export interface RegionSummary {
  name: string; flag: string; avgChange: number;
  best: { name: string; change: number };
  worst: { name: string; change: number };
  countries: string[];
}
export interface GlobalMarketData {
  indices: { us: IndexQuote[]; europe: IndexQuote[]; asia: IndexQuote[]; emerging: IndexQuote[] };
  forex: ForexPair[]; bonds: BondYield[]; commodities: Commodity[];
  vix: VixData | null; events: GlobalEvent[]; regions: RegionSummary[];
  lastUpdated: number;
  marketStatus: { us: "open"|"closed"; europe: "open"|"closed"; asia: "open"|"closed" };
}
export type LoadingState = "idle" | "loading" | "success" | "error";

// ── Chart helper ───────────────────────────────────────────
export type ChartPeriod = "1D" | "5D" | "1M" | "6M" | "YTD" | "1Y" | "5Y" | "MAX";