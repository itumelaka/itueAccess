import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const order = vi.fn();
  const select = vi.fn(() => ({ order }));
  const from = vi.fn(() => ({ select }));

  return {
    createLocation: vi.fn(),
    createSupabaseServerClient: vi.fn(async () => ({ from })),
    from,
    headers: vi.fn(async () => ({
      get: (name: string) =>
        name === "x-forwarded-proto"
          ? "https"
          : name === "x-forwarded-host"
            ? "itu.example"
            : null,
    })),
    order,
    requireProfile: vi.fn(),
    select,
    toDataURL: vi.fn(async (target: string) => `data:image/png,${target}`),
    toggleLocation: vi.fn(),
  };
});

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <span role="img" aria-label={alt} data-src={src} />
  ),
}));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("qrcode", () => ({ default: { toDataURL: mocks.toDataURL } }));
vi.mock("@/features/admin/admin-actions", () => ({
  createLocation: mocks.createLocation,
  toggleLocation: mocks.toggleLocation,
}));
vi.mock("@/features/auth/require-profile", () => ({
  requireProfile: mocks.requireProfile,
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));

import AdminLocationsPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.order.mockResolvedValue({
    data: [
      {
        id: "location-audi",
        name: "Auditorium",
        code: "AUDI",
        is_active: true,
      },
    ],
    error: null,
  });
  mocks.select.mockImplementation(() => ({ order: mocks.order }));
  mocks.from.mockImplementation(() => ({ select: mocks.select }));
  mocks.createSupabaseServerClient.mockImplementation(async () => ({
    from: mocks.from,
  }));
});

afterEach(cleanup);

describe("Admin Locations QR display", () => {
  it("shows one main Guest QR and only one User QR for each location", async () => {
    render(await AdminLocationsPage());

    expect(mocks.requireProfile).toHaveBeenCalledWith("ADMIN");
    expect(screen.getByRole("img", { name: "Kod QR pendaftaran tetamu ITU" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Kod QR pengguna Auditorium" })).toBeTruthy();
    expect(screen.queryByRole("img", { name: "Kod QR tetamu Auditorium" })).toBeNull();
    expect(screen.queryByText("Tetamu lokasi")).toBeNull();
    expect(screen.getAllByRole("img")).toHaveLength(2);
  });

  it("keeps displayed and downloaded QR payloads aligned with existing routes", async () => {
    render(await AdminLocationsPage());

    expect(mocks.toDataURL).toHaveBeenCalledTimes(2);
    expect(mocks.toDataURL).toHaveBeenCalledWith(
      "https://itu.example/guest",
      expect.any(Object),
    );
    expect(mocks.toDataURL).toHaveBeenCalledWith(
      "https://itu.example/scan/AUDI",
      expect.any(Object),
    );
    expect(mocks.toDataURL).not.toHaveBeenCalledWith(
      "https://itu.example/guest/AUDI",
      expect.anything(),
    );

    const mainDownload = screen.getByRole("link", {
      name: "Muat turun HD QR Tetamu Utama",
    });
    const userDownload = screen.getByRole("link", {
      name: "Muat turun HD QR pengguna",
    });

    expect(mainDownload.getAttribute("href")).toBe(
      "/api/qr/guest-registration",
    );
    expect(mainDownload.getAttribute("download")).toBe(
      "itu-eaccess-guest-main.svg",
    );
    expect(userDownload.getAttribute("href")).toBe(
      "/api/qr/AUDI?name=Auditorium",
    );
    expect(userDownload.getAttribute("download")).toBe(
      "itu-eaccess-user-AUDI.svg",
    );
    expect(screen.getByRole("link", { name: "https://itu.example/scan/AUDI" })).toBeTruthy();
  });
});