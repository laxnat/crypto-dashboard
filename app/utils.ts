export function formatUSD(value: number): string {
  if (value >= 1) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  // Small values (e.g. DOGE, XRP) — show more precision
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  }).format(value);
}

export function formatBTC(value: number): string {
  if (value === 1) return "1 BTC";
  return `${value.toFixed(8)} BTC`;
}
