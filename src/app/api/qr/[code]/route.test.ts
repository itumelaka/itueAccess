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
  it("keeps user downloads ADMIN-protected and targets /scan/", async () => {
    const response = await GET(
      new Request("https://itu.example/api/qr/AUDI?name=Auditorium"),
      { params: Promise.resolve({ code: "AUDI" }) },
    );

    expect(mocks.requireProfile).toHaveBeenCalledWith("ADMIN");
    expect(mocks.toString).toHaveBeenCalledWith(
      "https://itu.example/scan/AUDI",
      expect.objectContaining({ type: "svg" }),
    );
    expect(response.headers.get("content-disposition")).toContain(
      'filename="QR AUDITORIUM.svg"',
    );
  });

  it("keeps guest downloads ADMIN-protected and targets /guest/", async () => {
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
      'filename="QR TETAMU AUDITORIUM.svg"',
    );
  });
});