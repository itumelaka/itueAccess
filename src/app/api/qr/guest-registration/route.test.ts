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

describe("GET /api/qr/guest-registration", () => {
  it("downloads the ADMIN-protected main guest QR targeting /guest", async () => {
    const response = await GET(
      new Request("https://itu.example/api/qr/guest-registration"),
    );

    expect(mocks.requireProfile).toHaveBeenCalledWith("ADMIN");
    expect(mocks.toString).toHaveBeenCalledWith(
      "https://itu.example/guest",
      expect.objectContaining({ type: "svg" }),
    );
    expect(response.headers.get("content-disposition")).toContain(
      'filename="QR PENDAFTARAN TETAMU ITU.svg"',
    );
  });
});