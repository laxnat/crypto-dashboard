import { useEffect, useMemo, useState } from "react";
import { Form, useLoaderData, useNavigation, useRevalidator } from "react-router";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { SortableCryptoCard } from "../SortableCryptoCard";
import { FilterInput } from "../FilterInput";
import { COINS } from "../coins";
import { requireAuth } from "../session.server";
import { isLoaderError } from "../types";
import type { HomeLoaderResult, CoinRate } from "../types";
import type { Route } from "./+types/home";

const ORDER_KEY = "crypto-dashboard-order";
const THEME_KEY = "crypto-dashboard-theme";
const REFRESH_INTERVAL_MS = 60_000;

export function meta() {
  return [
    { title: "Crypto Dashboard" },
    { name: "description", content: "Real-time cryptocurrency exchange rates" },
  ];
}

export async function loader({ request }: Route.LoaderArgs): Promise<HomeLoaderResult> {
  await requireAuth(request);
  try {
    const res = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=USD");

    if (!res.ok) {
      throw new Error(`Coinbase API responded with ${res.status}`);
    }

    const json = await res.json() as { data: { rates: Record<string, string> } };
    const rates: Record<string, string> = json.data.rates;

    const btcPerUsd = parseFloat(rates["BTC"]);

    const coins = COINS.map((coin) => {
      const coinPerUsd = parseFloat(rates[coin.symbol]);
      const usdRate = coinPerUsd > 0 ? 1 / coinPerUsd : 0;
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
  const revalidator = useRevalidator();

  const isPageLoading = navigation.state === "loading";
  const isRefreshing = revalidator.state === "loading";

  const [coinOrder, setCoinOrder] = useState<string[]>(() => {
    const defaultOrder = isLoaderError(data) ? [] : data.coins.map((c) => c.symbol);
    if (typeof window === "undefined") return defaultOrder;
    try {
      const saved = localStorage.getItem(ORDER_KEY);
      if (!saved) return defaultOrder;
      const parsed = JSON.parse(saved) as string[];
      const validSymbols = new Set(defaultOrder);
      const filtered = parsed.filter((s) => validSymbols.has(s));
      const missing = defaultOrder.filter((s) => !parsed.includes(s));
      return [...filtered, ...missing];
    } catch {
      return defaultOrder;
    }
  });

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const [filter, setFilter] = useState("");

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const id = setInterval(() => revalidator.revalidate(), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [revalidator]);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(THEME_KEY, next ? "dark" : "light");
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const filteredCoins = useMemo<CoinRate[]>(() => {
    if (isLoaderError(data)) return [];
    const ordered = coinOrder
      .map((symbol) => data.coins.find((c) => c.symbol === symbol))
      .filter((c): c is CoinRate => c !== undefined);

    if (!filter.trim()) return ordered;
    const q = filter.toLowerCase();
    return ordered.filter(
      (coin) => coin.name.toLowerCase().includes(q) || coin.symbol.toLowerCase().includes(q)
    );
  }, [data, coinOrder, filter]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setCoinOrder((prev) => {
      const oldIndex = prev.indexOf(active.id as string);
      const newIndex = prev.indexOf(over.id as string);
      const next = arrayMove(prev, oldIndex, newIndex);
      localStorage.setItem(ORDER_KEY, JSON.stringify(next));
      return next;
    });
  }

  if (isLoaderError(data)) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-600 dark:text-red-400 text-sm">
            Error: {data.error}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Crypto Dashboard
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {isRefreshing
                ? "Refreshing..."
                : `Updated ${new Date(data.lastUpdated).toLocaleTimeString()}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => revalidator.revalidate()}
              disabled={isRefreshing}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
              Live
            </span>
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              {isDark ? (
                // Sun icon
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
                  />
                </svg>
              ) : (
                // Moon icon
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"
                  />
                </svg>
              )}
            </button>
            <Form method="post" action="/logout">
              <button
                type="submit"
                className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
              >
                Sign out
              </button>
            </Form>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <FilterInput value={filter} onChange={setFilter} />
        </div>

        {/* Grid */}
        {isPageLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 h-32 animate-pulse"
              />
            ))}
          </div>
        ) : filteredCoins.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-400 text-sm">No results for &ldquo;{filter}&rdquo;</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={coinOrder} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredCoins.map((coin) => (
                  <SortableCryptoCard key={coin.symbol} coin={coin} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </main>
  );
}
