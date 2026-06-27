import type { Coin } from "./types";

// Icons sourced from CoinCap CDN — available for all major coins
const icon = (symbol: string) =>
  `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`;

export const COINS: Coin[] = [
  { symbol: "BTC", name: "Bitcoin", iconUrl: icon("btc") },
  { symbol: "ETH", name: "Ethereum", iconUrl: icon("eth") },
  { symbol: "SOL", name: "Solana", iconUrl: icon("sol") },
  { symbol: "BNB", name: "BNB", iconUrl: icon("bnb") },
  { symbol: "XRP", name: "XRP", iconUrl: icon("xrp") },
  { symbol: "ADA", name: "Cardano", iconUrl: icon("ada") },
  { symbol: "AVAX", name: "Avalanche", iconUrl: icon("avax") },
  { symbol: "DOGE", name: "Dogecoin", iconUrl: icon("doge") },
  { symbol: "DOT", name: "Polkadot", iconUrl: icon("dot") },
  { symbol: "LINK", name: "Chainlink", iconUrl: icon("link") },
  { symbol: "UNI", name: "Uniswap", iconUrl: icon("uni") },
  { symbol: "MATIC", name: "Polygon", iconUrl: icon("matic") },
];
