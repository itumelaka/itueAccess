import { describe, expect, it } from "vitest";

import {
  parseGuestRegistration,
  parseUserApproval,
  toLocationCode,
} from "./admin-inputs";

describe("admin input validation", () => {
  it("normalizes a location name into a stable QR code", () => {
    expect(toLocationCode(" Bilik Server Utama ")).toBe("BILIK-SERVER-UTAMA");
  });

  it("requires a category when approving a user", () => {
    expect(() =>
      parseUserApproval({ profileId: "profile-1", category: "" }),
    ).toThrow("Kategori pengguna diperlukan");
  });

  it("accepts a complete guest registration", () => {
    expect(
      parseGuestRegistration({
        name: "Aminah",
        organization: "Vendor A",
        purpose: "Penyelenggaraan",
        locationId: "location-1",
      }),
    ).toEqual({
      name: "Aminah",
      organization: "Vendor A",
      purpose: "Penyelenggaraan",
      locationId: "location-1",
    });
  });

  it("rejects an incomplete guest registration", () => {
    expect(() =>
      parseGuestRegistration({
        name: "Aminah",
        organization: "",
        purpose: "Penyelenggaraan",
        locationId: "location-1",
      }),
    ).toThrow("Maklumat tetamu belum lengkap");
  });
});
