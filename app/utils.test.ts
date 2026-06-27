import { describe, it, expect } from "vitest";
import { formatUSD, formatBTC } from "./utils";

describe("formatUSD", () => {
  it("formats values >= 1 with 2 decimal places", () => {
    expect(formatUSD(60000)).toBe("$60,000.00");
    expect(formatUSD(1582.48)).toBe("$1,582.48");
    expect(formatUSD(1)).toBe("$1.00");
  });

  it("formats small values with higher precision", () => {
    expect(formatUSD(0.5)).toBe("$0.5000");
    expect(formatUSD(0.00042)).toBe("$0.00042");
  });

  it("handles zero", () => {
    expect(formatUSD(0)).toBe("$0.0000");
  });
});

describe("formatBTC", () => {
  it("returns '1 BTC' for exactly 1", () => {
    expect(formatBTC(1)).toBe("1 BTC");
  });

  it("formats fractional values to 8 decimal places", () => {
    expect(formatBTC(0.02627946)).toBe("0.02627946 BTC");
    expect(formatBTC(0)).toBe("0.00000000 BTC");
  });
});
