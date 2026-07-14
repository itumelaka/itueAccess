import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const concepts = [
  "a1-dvs-pixel-circuit.svg",
  "a2-dvs-access-gate.svg",
  "b1-itu-circuit-shield.svg",
  "b2-eaccess-monogram.svg",
];

describe("brand concept SVGs", () => {
  it("meet the icon contract", () => {
    const titles = new Set<string>();
    for (const filename of concepts) {
      const svg = readFileSync(join(__dirname, filename), "utf8");
      expect(svg).toContain('viewBox="0 0 512 512"');
      expect(svg).toContain("#1D388C");
      expect(svg).toContain("#E6002D");
      expect(svg).toContain("#FFF200");
      expect(svg).not.toMatch(/Jabatan Perkhidmatan Veterinar/i);
      const title = svg.match(/<title>([^<]+)<\/title>/)?.[1];
      expect(title).toBeTruthy();
      titles.add(title!);
    }
    expect(titles.size).toBe(concepts.length);
  });
});
