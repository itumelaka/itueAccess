import { describe, expect, it } from "vitest";

import { shouldRefreshSession } from "./proxy";

describe("shouldRefreshSession", () => {
  it("keeps the offline shell independent from Supabase session refresh", () => {
    for (const pathname of ["/sw.js", "/offline.html", "/manifest.webmanifest", "/icon-192.png"]) {
      expect(shouldRefreshSession(pathname)).toBe(false);
    }
    expect(shouldRefreshSession("/history")).toBe(true);
  });
});
