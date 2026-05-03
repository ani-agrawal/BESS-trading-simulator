interface IntradayPriceInput {
  forecastPrices: number[];
  sipOutturn: number[];
  revealedPeriods: number;
  currentPrice: number;
  period: number;
}

function roundPrice(value: number): number {
  return Math.round(value * 100) / 100;
}

function clampPrice(value: number): number {
  return Math.max(-100, Math.min(300, value));
}

export function getIntradayPrice({
  forecastPrices,
  sipOutturn,
  revealedPeriods,
  currentPrice,
  period,
}: IntradayPriceInput): number {
  const da = forecastPrices[period];
  const basePrice = Number.isFinite(da) && da !== 0 ? da : currentPrice || 50;

  const lastSip = revealedPeriods > 0 ? sipOutturn[revealedPeriods - 1] : 0;
  const previousSip = revealedPeriods > 1 ? sipOutturn[revealedPeriods - 2] : lastSip;
  const latestOutturnDrift = lastSip ? (lastSip - basePrice) * 0.22 : 0;
  const momentum = lastSip && previousSip ? (lastSip - previousSip) * 0.12 : 0;
  const horizon = Math.max(0, period - revealedPeriods);
  const horizonDecay = Math.max(0.35, 1 - horizon * 0.045);
  const forecastRevision = (
    Math.sin((period + 1) * 1.73 + revealedPeriods * 0.41) * 5.5
    + Math.cos((period - revealedPeriods + 2) * 0.9) * 2.5
  ) * horizonDecay;

  return roundPrice(clampPrice(basePrice + latestOutturnDrift + momentum + forecastRevision));
}

