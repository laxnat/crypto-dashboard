import { describe, it, expect } from "vitest";
import { isLoaderError } from "./types";
import type { HomeLoaderResult } from "./types";

describe("isLoaderError", () => {
  it("returns true when the result has an error field", () => {
    const result: HomeLoaderResult = { error: "Something went wrong" };
    expect(isLoaderError(result)).toBe(true);
  });

  it("returns false when the result has coins and lastUpdated", () => {
    const result: HomeLoaderResult = {
      coins: [],
      lastUpdated: new Date().toISOString(),
    };
    expect(isLoaderError(result)).toBe(false);
  });
});
