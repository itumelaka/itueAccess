import { describe, expect, it } from "vitest";

import { resolveArchiveCategory } from "./archive-category";

describe("resolveArchiveCategory", () => {
  it("uses the visit profile category when available", () => {
    expect(
      resolveArchiveCategory({
        visitCategory: "PELATIH",
        profileCategory: "STAFF",
        profileRole: "ADMIN",
      }),
    ).toBe("PELATIH");
  });

  it("treats an admin without category as staff for spreadsheet archive", () => {
    expect(
      resolveArchiveCategory({
        visitCategory: null,
        profileCategory: null,
        profileRole: "ADMIN",
      }),
    ).toBe("STAFF");
  });

  it("does not archive normal users without category", () => {
    expect(
      resolveArchiveCategory({
        visitCategory: null,
        profileCategory: null,
        profileRole: "USER",
      }),
    ).toBeNull();
  });
});
