import { describe, expect, it } from "vitest";

import { createHealthResponse } from "./health-response";

describe("createHealthResponse", () => {
  it("returns operational state without PII or internal error details", () => {
    const body = createHealthResponse(false, new Date("2026-07-14T12:00:00.000Z"));

    expect(body).toEqual({ app: "ok", database: "error", checkedAt: "2026-07-14T12:00:00.000Z" });
    expect(Object.keys(body)).toEqual(["app", "database", "checkedAt"]);
    expect(JSON.stringify(body)).not.toMatch(/email|user|count|message/i);
  });
});
