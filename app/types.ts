export interface Coin {
  symbol: string;
  name: string;
  iconUrl: string;
}

export interface CoinRate extends Coin {
  usdRate: number;
  btcRate: number;
}

export interface LoaderData {
  coins: CoinRate[];
  lastUpdated: string;
}

export interface LoaderError {
  error: string;
}

export type HomeLoaderResult = LoaderData | LoaderError;

export function isLoaderError(data: HomeLoaderResult): data is LoaderError {
  return "error" in data;
}
