import { describe, expect, it } from "vitest";

import { qrDownloadFileName } from "./qr-download";

describe("qrDownloadFileName", () => {
  it("uses the location name as a safe uppercase QR filename", () => {
    expect(qrDownloadFileName("Makmal Penyelidikan")).toBe(
      "QR MAKMAL PENYELIDIKAN.svg",
    );
  });

  it("removes unsafe filename characters", () => {
    expect(qrDownloadFileName("Bio-Sekuriti / Unit #1")).toBe(
      "QR BIO-SEKURITI UNIT 1.svg",
    );
  });

  it("falls back to the location code when name is blank", () => {
    expect(qrDownloadFileName("", "BIO")).toBe("QR BIO.svg");
  });
});
