import { GlobalMarketData, GlobalEvent } from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const CACHE_MS = 60000;

let cache: { data: GlobalMarketData | null; ts: number } = {
  data: null,
  ts: 0
};

// ── FIX: Filter events to only show next 365 days from today ──────────────
function filterEventsNext365Days(events: GlobalEvent[]): GlobalEvent[] {
  const today     = new Date();
  today.setHours(0, 0, 0, 0);

  const yearAhead = new Date();
  yearAhead.setDate(today.getDate() + 365);
  yearAhead.setHours(23, 59, 59, 999);

  return events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= today && eventDate <= yearAhead;
  });
}

export async function fetchGlobalMarkets(): Promise<GlobalMarketData> {

  if (cache.data && Date.now() - cache.ts < CACHE_MS) {
    return cache.data;
  }

  const res = await fetch(`${API_BASE}/markets/global`);

  if (!res.ok) {
    throw new Error(`Backend error: ${res.status} ${res.statusText}`);
  }

  const raw = await res.json();

  // ── FIX: Apply 365-day rolling window to events ──────────────────────────
  const allEvents: GlobalEvent[] = raw.events || [];
  const filteredEvents = filterEventsNext365Days(allEvents);

  const data: GlobalMarketData = {
    indices:      raw.indices      || { us: [], europe: [], asia: [], emerging: [] },
    forex:        raw.forex        || [],
    bonds:        raw.bonds        || [],
    commodities:  raw.commodities  || [],
    vix:          raw.vix          || null,
    // ── FIX: Use filtered events (next 365 days only) ──
    events:       filteredEvents,
    regions:      raw.regions      || [],
    lastUpdated:  raw.lastUpdated  || Date.now(),
    marketStatus: raw.marketStatus || { us: "closed", europe: "closed", asia: "closed" }
  };

  cache = { data, ts: Date.now() };
  return data;
}

export function invalidateCache() {
  cache = { data: null, ts: 0 };
}