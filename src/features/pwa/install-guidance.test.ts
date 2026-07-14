import { describe, expect, it } from "vitest";

import { getInstallGuidance } from "./install-guidance";

describe("getInstallGuidance", () => {
  it("gives platform-specific instructions without promising an APK", () => {
    expect(getInstallGuidance("ios")).toContain("Tambah ke Skrin Utama");
    expect(getInstallGuidance("android")).toContain("Pasang aplikasi");
    expect(getInstallGuidance("desktop")).toContain("ikon pemasangan");
  });
});
