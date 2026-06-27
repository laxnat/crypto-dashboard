import { clsx } from "clsx";
import type { CoinRate } from "./types";
import { formatUSD, formatBTC } from "./utils";

interface CryptoCardProps {
  coin: CoinRate;
  isDragging?: boolean;
}

export function CryptoCard({ coin, isDragging = false }: CryptoCardProps) {
  return (
    <div
      className={clsx(
        "bg-white border rounded-2xl p-5 shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing select-none",
        isDragging
          ? "border-blue-400 shadow-lg"
          : "border-gray-200 hover:shadow-md hover:border-blue-200"
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <img
          src={coin.iconUrl}
          alt={coin.name}
          width={36}
          height={36}
          className="rounded-full"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <div>
          <p className="font-semibold text-gray-900 text-sm leading-tight">{coin.name}</p>
          <p className="text-xs text-gray-400 font-medium tracking-wide">{coin.symbol}</p>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xl font-bold text-gray-900">{formatUSD(coin.usdRate)}</p>
        <p className="text-xs text-gray-400">{formatBTC(coin.btcRate)}</p>
      </div>
    </div>
  );
}
