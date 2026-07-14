import { createRequire } from "node:module";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { shouldCacheRequest } = require(join(process.cwd(), "public", "sw.js")) as {
  shouldCacheRequest: (request: { method: string; mode?: string; url: string }, origin: string) => boolean;
};

const origin = "https://itu-eaccess.example";

describe("service-worker cache policy", () => {
  it("allows only versioned application shell assets", () => {
    expect(shouldCacheRequest({ method: "GET", url: `${origin}/offline.html` }, origin)).toBe(true);
    expect(shouldCacheRequest({ method: "GET", url: `${origin}/icon-192.png` }, origin)).toBe(true);
    expect(shouldCacheRequest({ method: "GET", url: `${origin}/_next/static/chunks/app.js` }, origin)).toBe(true);
  });

  it("never caches authenticated pages, APIs, cross-origin data, or navigation HTML", () => {
    for (const url of ["/admin", "/history", "/scan/BILIK-SERVER", "/api/health", "/auth/callback"]) {
      expect(shouldCacheRequest({ method: "GET", url: `${origin}${url}` }, origin)).toBe(false);
    }
    expect(shouldCacheRequest({ method: "GET", url: "https://project.supabase.co/rest/v1/visits" }, origin)).toBe(false);
    expect(shouldCacheRequest({ method: "GET", mode: "navigate", url: `${origin}/` }, origin)).toBe(false);
    expect(shouldCacheRequest({ method: "POST", url: `${origin}/icon-192.png` }, origin)).toBe(false);
  });
});
