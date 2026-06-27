import { useLoaderData } from "react-router";
import { COINS } from "../coins";
import { isLoaderError } from "../types";
import type { HomeLoaderResult } from "../types";

export function meta() {
  return [
    { title: "Crypto Dashboard" },
    { name: "description", content: "Real-time cryptocurrency exchange rates" },
  ];
}

export async function loader(): Promise<HomeLoaderResult> {
  try {
    const res = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=USD");

    if (!res.ok) {
      throw new Error(`Coinbase API responded with ${res.status}`);
    }

    const json = await res.json();
    const rates: Record<string, string> = json.data.rates;

    // rates[symbol] = how many of that coin per 1 USD
    // e.g. rates["BTC"] = "0.0000152" means 1 USD = 0.0000152 BTC
    const btcPerUsd = parseFloat(rates["BTC"]);

    const coins = COINS.map((coin) => {
      const coinPerUsd = parseFloat(rates[coin.symbol]);
      // USD price of 1 coin = 1 / (coins per USD)
      const usdRate = coinPerUsd > 0 ? 1 / coinPerUsd : 0;
      // BTC price of 1 coin = (BTC per USD) / (coin per USD)
      const btcRate = btcPerUsd > 0 && coinPerUsd > 0 ? btcPerUsd / coinPerUsd : 0;

      return { ...coin, usdRate, btcRate };
    });

    return { coins, lastUpdated: new Date().toISOString() };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to fetch exchange rates",
    };
  }
}

export default function Home() {
  const data = useLoaderData<typeof loader>();

  if (isLoaderError(data)) {
    return (
      <main className="p-8">
        <p className="text-red-500">Error: {data.error}</p>
      </main>
    );
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Crypto Dashboard</h1>
      <p className="text-sm text-gray-500 mb-6">
        Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
      </p>
      <ul>
        {data.coins.map((coin) => (
          <li key={coin.symbol}>
            {coin.name} ({coin.symbol}) — ${coin.usdRate.toLocaleString()} — {coin.btcRate.toFixed(8)} BTC
          </li>
        ))}
      </ul>
    </main>
  );
}
