import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const order = vi.fn();
  const eq = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { createSupabaseAdminClient: vi.fn(() => ({ from })), eq, from, order, select };
});

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mocks.createSupabaseAdminClient,
}));
vi.mock("@/features/guests/guest-self-service-layout", () => ({
  GuestSelfServiceLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock("@/features/guests/guest-self-service-form", () => ({
  GuestSelfServiceForm: ({
    locations,
  }: {
    locations?: Array<{ code: string; name: string }>;
  }) => (
    <div data-testid="guest-form">
      {locations?.map((location) => (
        <span key={location.code}>{`${location.code}:${location.name}`}</span>
      ))}
    </div>
  ),
}));

import GuestRegistrationPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.eq.mockImplementation(() => ({ order: mocks.order }));
  mocks.select.mockImplementation(() => ({ eq: mocks.eq }));
  mocks.from.mockImplementation(() => ({ select: mocks.select }));
  mocks.createSupabaseAdminClient.mockImplementation(() => ({ from: mocks.from }));
});

afterEach(cleanup);

describe("/guest", () => {
  it("queries only active locations and provides them to the form", async () => {
    mocks.order.mockResolvedValue({
      data: [
        { code: "AUDI", name: "Auditorium" },
        { code: "MAKMAL", name: "Makmal" },
      ],
      error: null,
    });

    render(await GuestRegistrationPage());

    expect(mocks.from).toHaveBeenCalledWith("locations");
    expect(mocks.eq).toHaveBeenCalledWith("is_active", true);
    expect(screen.getByTestId("guest-form")).toBeTruthy();
    expect(screen.getByText("AUDI:Auditorium")).toBeTruthy();
    expect(screen.getByText("MAKMAL:Makmal")).toBeTruthy();
  });

  it("shows an empty state when there are no active locations", async () => {
    mocks.order.mockResolvedValue({ data: [], error: null });

    render(await GuestRegistrationPage());

    expect(screen.getByRole("heading", { name: "Tiada lokasi aktif" })).toBeTruthy();
  });

  it("shows an accessible error state when locations cannot be loaded", async () => {
    mocks.order.mockResolvedValue({ data: null, error: { message: "offline" } });

    render(await GuestRegistrationPage());

    expect(screen.getByRole("alert").textContent).toContain(
      "Lokasi belum dapat dimuatkan",
    );
  });
});