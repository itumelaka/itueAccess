import { describe, expect, it } from "vitest";

import { decideProfileRoute } from "./require-profile";

describe("decideProfileRoute", () => {
  it("sends pending users to /pending", () => {
    expect(decideProfileRoute({ role: "USER", status: "PENDING" }, false)).toBe("/pending");
  });

  it("sends suspended users to /suspended", () => {
    expect(decideProfileRoute({ role: "USER", status: "SUSPENDED" }, false)).toBe("/suspended");
  });

  it("blocks users from admin routes", () => {
    expect(decideProfileRoute({ role: "USER", status: "ACTIVE" }, true)).toBe("/forbidden");
  });

  it("allows active admins into admin routes", () => {
    expect(decideProfileRoute({ role: "ADMIN", status: "ACTIVE" }, true)).toBeNull();
  });
});
