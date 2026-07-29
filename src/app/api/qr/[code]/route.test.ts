import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireProfile: vi.fn(),
  toString: vi.fn().mockResolvedValue("<svg />"),
}));

vi.mock("qrcode", () => ({ default: { toString: mocks.toString } }));
vi.mock("@/features/auth/require-profile", () => ({
  requireProfile: mocks.requireProfile,
}));

import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.toString.mockResolvedValue("<svg />");
});

describe("GET /api/qr/[code]", () => {
  it("downloads an ADMIN-protected HD SVG with the exact existing user payload", async () => {
    const response = await GET(
      new Request("https://itu.example/api/qr/AUDI?name=Auditorium"),
      { params: Promise.resolve({ code: "AUDI" }) },
    );

    expect(mocks.requireProfile).toHaveBeenCalledWith("ADMIN");
    expect(mocks.toString).toHaveBeenCalledWith(
      "https://itu.example/scan/AUDI",
      expect.objectContaining({ type: "svg" }),
    );
    expect(response.headers.get("content-type")).toBe(
      "image/svg+xml; charset=utf-8",
    );
    expect(response.headers.get("content-disposition")).toContain(
      'filename="itu-eaccess-user-AUDI.svg"',
    );
    expect(await response.text()).toBe("<svg />");
  });

  it("preserves the backward-compatible ADMIN-protected guest download", async () => {
    const response = await GET(
      new Request(
        "https://itu.example/api/qr/AUDI?audience=guest&name=Auditorium",
      ),
      { params: Promise.resolve({ code: "AUDI" }) },
    );

    expect(mocks.requireProfile).toHaveBeenCalledWith("ADMIN");
    expect(mocks.toString).toHaveBeenCalledWith(
      "https://itu.example/guest/AUDI",
      expect.objectContaining({ type: "svg" }),
    );
    expect(response.headers.get("content-disposition")).toContain(
      'filename="itu-eaccess-guest-AUDI.svg"',
    );
  });
});