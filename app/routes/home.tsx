import { useMemo, useState } from "react";
import { useLoaderData, useNavigation } from "react-router";
import { CryptoCard } from "../CryptoCard";
import { FilterInput } from "../FilterInput";
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
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const [filter, setFilter] = useState("");

  const filteredCoins = useMemo(() => {
    if (isLoaderError(data)) return [];
    if (!filter.trim()) return data.coins;
    const q = filter.toLowerCase();
    return data.coins.filter(
      (coin) => coin.name.toLowerCase().includes(q) || coin.symbol.toLowerCase().includes(q)
    );
  }, [data, filter]);

  if (isLoaderError(data)) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
            Error: {data.error}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Crypto Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">
              Updated {new Date(data.lastUpdated).toLocaleTimeString()}
            </p>
          </div>
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Live
          </span>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <FilterInput value={filter} onChange={setFilter} />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-2xl p-5 h-32 animate-pulse"
              />
            ))}
          </div>
        ) : filteredCoins.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-400 text-sm">No results for &ldquo;{filter}&rdquo;</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCoins.map((coin) => (
              <CryptoCard key={coin.symbol} coin={coin} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
