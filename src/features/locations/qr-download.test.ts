import { describe, expect, it } from "vitest";

import {
  MAIN_GUEST_QR_FILE_NAME,
  locationQrPath,
  qrDownloadFileName,
} from "./qr-download";

describe("qrDownloadFileName", () => {
  it("uses the location name as the user QR filename", () => {
    expect(qrDownloadFileName("Makmal Penyelidikan")).toBe(
      "QR MAKMAL PENYELIDIKAN.svg",
    );
  });

  it("uses a clearly distinguished guest QR filename", () => {
    expect(qrDownloadFileName("Makmal Penyelidikan", "MAKMAL", "guest")).toBe(
      "QR TETAMU MAKMAL PENYELIDIKAN.svg",
    );
  });

  it("removes unsafe filename and header characters", () => {
    expect(qrDownloadFileName("Bio:Sekuriti / Unit #1%\n", "BIO", "guest")).toBe(
      "QR TETAMU BIO SEKURITI UNIT 1.svg",
    );
  });

  it("falls back to the location code when name is blank", () => {
    expect(qrDownloadFileName("", "BIO")).toBe("QR BIO.svg");
  });

  it("uses the approved main guest QR filename", () => {
    expect(MAIN_GUEST_QR_FILE_NAME).toBe("QR PENDAFTARAN TETAMU ITU.svg");
  });
});

describe("locationQrPath", () => {
  it("keeps user QR codes on the scan route", () => {
    expect(locationQrPath("AUDI", "user")).toBe("/scan/AUDI");
  });

  it("targets the direct guest route for optional location QR codes", () => {
    expect(locationQrPath("AUDI", "guest")).toBe("/guest/AUDI");
  });
});