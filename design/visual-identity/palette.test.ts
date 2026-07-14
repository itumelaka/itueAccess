import { describe, expect, it } from "vitest";

import { brandPalette } from "./palette";

describe("brandPalette", () => {
  it("contains six valid hexadecimal colours", () => {
    expect(Object.values(brandPalette)).toHaveLength(6);
    for (const colour of Object.values(brandPalette)) {
      expect(colour).toMatch(/^#[0-9A-F]{6}$/);
    }
  });
});
