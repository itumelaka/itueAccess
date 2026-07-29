import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const eq = vi.fn(() => ({ eq, maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return {
    createSupabaseAdminClient: vi.fn(() => ({ from })),
    eq,
    from,
    maybeSingle,
    select,
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mocks.createSupabaseAdminClient,
}));
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("not-found");
  }),
}));
vi.mock("@/features/guests/guest-self-service-layout", () => ({
  GuestSelfServiceLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock("@/features/guests/guest-self-service-form", () => ({
  GuestSelfServiceForm: ({ locationCode }: { locationCode?: string }) => (
    <div data-testid="direct-location-code">{locationCode}</div>
  ),
}));

import GuestSelfServicePage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.eq.mockImplementation(() => ({ eq: mocks.eq, maybeSingle: mocks.maybeSingle }));
  mocks.select.mockImplementation(() => ({ eq: mocks.eq }));
  mocks.from.mockImplementation(() => ({ select: mocks.select }));
  mocks.createSupabaseAdminClient.mockImplementation(() => ({ from: mocks.from }));
});

afterEach(cleanup);

describe("/guest/[locationCode]", () => {
  it("keeps the active server-resolved location predetermined", async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: { code: "AUDI", name: "Auditorium" },
      error: null,
    });

    render(
      await GuestSelfServicePage({
        params: Promise.resolve({ locationCode: "audi" }),
      }),
    );

    expect(mocks.eq).toHaveBeenCalledWith("code", "AUDI");
    expect(mocks.eq).toHaveBeenCalledWith("is_active", true);
    expect(screen.getByTestId("direct-location-code").textContent).toBe("AUDI");
  });
});