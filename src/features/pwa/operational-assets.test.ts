import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("PWA operational assets", () => {
  it("provides an offline fallback with no personal data", () => {
    const html = readFileSync(join(process.cwd(), "public", "offline.html"), "utf8");
    expect(html).toContain("Rekod MASUK/KELUAR belum disimpan");
    expect(html).toContain("Buka borang kecemasan");
    expect(html).not.toMatch(/email|penghuni|sejarah lawatan/i);
  });

  it("requires a database URL and writes a non-empty dump plus SHA-256 sidecar", () => {
    const script = readFileSync(join(process.cwd(), "scripts", "backup-database.ps1"), "utf8");
    expect(script).toContain("SUPABASE_DB_URL");
    expect(script).toMatch(/& \$supabasePath db dump/);
    expect(script).toContain("Get-FileHash");
    expect(script).toContain("SHA256");
    expect(script).toContain("Length -le 0");
    expect(script).toContain(".sha256");
    expect(readFileSync(join(process.cwd(), ".gitignore"), "utf8")).toMatch(/^backups\/$/m);
  });
});
