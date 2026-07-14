import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const selectedLogoPath = join(process.cwd(), "design", "visual-identity", "itu-eaccess-ea-shield.svg");

describe("selected ITU eAccess brand mark", () => {
  it("is a square accessible SVG using the approved palette", () => {
    const svg = readFileSync(selectedLogoPath, "utf8");

    expect(svg).toContain('viewBox="0 0 512 512"');
    expect(svg).toMatch(/<title>ITU eAccess eA Shield<\/title>/);
    expect(svg).toContain("#1D388C");
    expect(svg).toContain("#E6002D");
    expect(svg).toContain("#FFD429");
    expect(svg).not.toMatch(/Jabatan Perkhidmatan Veterinar/i);
  });
});
