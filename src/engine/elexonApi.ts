// Elexon BMRS API integration for real GB market data
// Public API, no key required. Data has ~1-2 day lag for system prices.

const BASE = 'https://data.elexon.co.uk/bmrs/api/v1';

export interface ElexonSystemPrice {
  settlementDate: string;
  settlementPeriod: number;
  systemSellPrice: number;
  systemBuyPrice: number;
  netImbalanceVolume: number;
}

export interface ElexonMID {
  settlementDate: string;
  settlementPeriod: number;
  price: number;
  volume: number;
  dataProvider: string;
}

export interface ElexonDayData {
  date: string;
  daPrices: number[];      // 48 SPs, £/MWh (from MID/APXMIDP)
  sipPrices: number[];     // 48 SPs, system price
  niv: number[];           // 48 SPs, net imbalance volume
  isComplete: boolean;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

async function fetchJson(url: string): Promise<{ data?: unknown[] }> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Elexon API ${resp.status}: ${resp.statusText}`);
  return resp.json();
}

// Fetch system prices (SIP + NIV) for a given date
// Uses the path-style endpoint: /balancing/settlement/system-prices/{date}
async function fetchSystemPrices(date: string): Promise<ElexonSystemPrice[]> {
  const url = `${BASE}/balancing/settlement/system-prices/${date}?format=json`;
  const data = await fetchJson(url);
  return (data.data ?? []) as ElexonSystemPrice[];
}

// Fetch Market Index Data (day-ahead reference prices) for a given date
async function fetchMID(date: string): Promise<ElexonMID[]> {
  const nextDay = new Date(date + 'T00:00:00Z');
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const url = `${BASE}/datasets/MID?from=${date}T00:00:00Z&to=${formatDate(nextDay)}T00:00:00Z&format=json`;
  const data = await fetchJson(url);
  return (data.data ?? []) as ElexonMID[];
}

// Build a complete day's data from Elexon APIs
export async function fetchDayData(date: string): Promise<ElexonDayData> {
  const [sysPrices, midData] = await Promise.all([
    fetchSystemPrices(date).catch(() => []),
    fetchMID(date).catch(() => []),
  ]);

  // Extract DA prices from APXMIDP provider
  const apxPrices = midData.filter(d => d.dataProvider === 'APXMIDP');
  const daPrices = new Array(48).fill(0);
  for (const d of apxPrices) {
    const sp = d.settlementPeriod - 1; // 0-indexed
    if (sp >= 0 && sp < 48) daPrices[sp] = d.price;
  }

  // Extract system prices and NIV
  const sipPrices = new Array(48).fill(0);
  const niv = new Array(48).fill(0);
  for (const d of sysPrices) {
    const sp = d.settlementPeriod - 1;
    if (sp >= 0 && sp < 48) {
      // Use systemBuyPrice as the imbalance price (SBP ≈ SIP for short system)
      sipPrices[sp] = d.systemBuyPrice ?? d.systemSellPrice ?? 0;
      niv[sp] = Math.round(d.netImbalanceVolume ?? 0);
    }
  }

  // If DA prices are missing, use system prices as fallback
  const hasDa = daPrices.some(p => p !== 0);
  if (!hasDa) {
    for (let i = 0; i < 48; i++) {
      daPrices[i] = sipPrices[i];
    }
  }

  const isComplete = sysPrices.length >= 46; // allow for DST days

  return { date, daPrices, sipPrices, niv, isComplete };
}

// Fetch the most recent complete settlement day (typically D-2 for safety)
export async function fetchLatestDay(): Promise<ElexonDayData> {
  const today = new Date();
  // Try D-2 first (most reliable for complete data), then D-3 as fallback
  for (const lag of [2, 3, 4, 5]) {
    const target = new Date(today);
    target.setUTCDate(target.getUTCDate() - lag);
    const dateStr = formatDate(target);

    try {
      const data = await fetchDayData(dateStr);
      if (data.isComplete) return data;
    } catch {
      continue;
    }
  }

  throw new Error('Could not fetch recent Elexon data');
}

// Fetch a specific historical date
export async function fetchHistoricalDay(date: string): Promise<ElexonDayData> {
  return fetchDayData(date);
}
