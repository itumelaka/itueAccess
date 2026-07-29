import { describe, expect, it } from "vitest";

import {
  MAIN_GUEST_QR_FILE_NAME,
  locationQrPath,
  qrDownloadFileName,
} from "./qr-download";

describe("qrDownloadFileName", () => {
  it("uses the unchanged location code in the user QR filename", () => {
    expect(qrDownloadFileName("Makmal Penyelidikan", "MAKMAL")).toBe(
      "itu-eaccess-user-MAKMAL.svg",
    );
  });

  it("keeps a clear filename for the backward-compatible guest QR download", () => {
    expect(qrDownloadFileName("Makmal Penyelidikan", "MAKMAL", "guest")).toBe(
      "itu-eaccess-guest-MAKMAL.svg",
    );
  });

  it("removes unsafe filename and header characters from location codes", () => {
    expect(qrDownloadFileName("Biosekuriti", "BIO:/ Unit #1%", "user")).toBe(
      "itu-eaccess-user-BIO-UNIT-1.svg",
    );
  });

  it("falls back to the location name when the code is blank", () => {
    expect(qrDownloadFileName("Bilik Server", "")).toBe(
      "itu-eaccess-user-BILIK-SERVER.svg",
    );
  });

  it("uses the approved main guest HD filename", () => {
    expect(MAIN_GUEST_QR_FILE_NAME).toBe("itu-eaccess-guest-main.svg");
  });
});

describe("locationQrPath", () => {
  it("keeps user QR codes on the existing scan route", () => {
    expect(locationQrPath("AUDI", "user")).toBe("/scan/AUDI");
  });

  it("preserves the backward-compatible direct guest route", () => {
    expect(locationQrPath("AUDI", "guest")).toBe("/guest/AUDI");
  });
});