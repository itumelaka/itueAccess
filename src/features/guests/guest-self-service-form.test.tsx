import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/script", () => ({
  default: ({ onReady }: { onReady?: () => void }) => (
    <button data-testid="turnstile-script" type="button" onClick={onReady}>
      Muatkan Turnstile test
    </button>
  ),
}));

import { GuestSelfServiceForm } from "./guest-self-service-form";

type TurnstileCallbacks = {
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};

let turnstileCallbacks: TurnstileCallbacks | null = null;
const turnstileReset = vi.fn();
const turnstileRemove = vi.fn();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function renderGuestForm() {
  return render(
    <GuestSelfServiceForm
      locationCode="AUDITORIUM"
      locationName="Auditorium"
      turnstileSiteKey="public-site-key"
    />,
  );
}

async function loadTurnstile(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId("turnstile-script"));
  expect(turnstileCallbacks).not.toBeNull();
  act(() => turnstileCallbacks?.callback("verified-token"));
}

beforeEach(() => {
  turnstileCallbacks = null;
  turnstileReset.mockReset();
  turnstileRemove.mockReset();
  window.turnstile = {
    render: vi.fn((_container, options) => {
      turnstileCallbacks = options;
      return "widget-1";
    }),
    reset: turnstileReset,
    remove: turnstileRemove,
  };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  delete window.turnstile;
});

describe("GuestSelfServiceForm", () => {
  it("shows loading, then checks in without reloading or exposing server secrets", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ ok: true, visit: null }))
      .mockResolvedValueOnce(
        jsonResponse({
          ok: true,
          visit: {
            id: "visit-1",
            name: "Tetamu Satu",
            locationName: "Auditorium",
            checkInAt: "2026-07-29T00:00:00.000Z",
          },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderGuestForm();
    expect(
      screen.getByRole("heading", { name: "Memeriksa rekod anda…" }),
    ).toBeTruthy();
    await screen.findByRole("heading", { name: "Maklumat lawatan" });
    await loadTurnstile(user);

    await user.type(screen.getByLabelText("Nama penuh"), "  Tetamu Satu  ");
    await user.type(
      screen.getByLabelText("Organisasi / syarikat"),
      "  Jabatan ITU  ",
    );
    await user.type(screen.getByLabelText("Tujuan lawatan"), "  Mesyuarat  ");
    await user.click(screen.getByRole("button", { name: "Daftar masuk" }));

    expect(
      await screen.findByRole("heading", { name: "Tetamu Satu" }),
    ).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain(
      "Daftar masuk berjaya",
    );

    const requestBody = JSON.parse(
      String(fetchMock.mock.calls[1]?.[1]?.body),
    ) as Record<string, unknown>;
    expect(requestBody).toMatchObject({
      locationCode: "AUDITORIUM",
      name: "Tetamu Satu",
      organization: "Jabatan ITU",
      purpose: "Mesyuarat",
      turnstileToken: "verified-token",
    });
    expect(requestBody).not.toHaveProperty("TURNSTILE_SECRET_KEY");
    expect(requestBody).not.toHaveProperty("SUPABASE_SERVICE_ROLE_KEY");
    expect(turnstileRemove).toHaveBeenCalledWith("widget-1");
  });

  it("shows field validation errors before sending a check-in request", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ ok: true, visit: null }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderGuestForm();
    await screen.findByRole("heading", { name: "Maklumat lawatan" });
    await loadTurnstile(user);
    await user.click(screen.getByRole("button", { name: "Daftar masuk" }));

    expect(screen.getByText(/Masukkan nama penuh/)).toBeTruthy();
    expect(screen.getByText(/Masukkan organisasi/)).toBeTruthy();
    expect(screen.getByText(/Terangkan tujuan lawatan/)).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain(
      "Semak maklumat",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("handles a session network error and allows a retry", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(jsonResponse({ ok: true, visit: null }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderGuestForm();
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Sesi tetamu tidak dapat diperiksa",
    );
    await user.click(screen.getByRole("button", { name: "Cuba lagi" }));

    expect(
      await screen.findByRole("heading", { name: "Maklumat lawatan" }),
    ).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("requires checkout confirmation and shows a completion state", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          ok: true,
          visit: {
            id: "visit-2",
            name: "Tetamu Dua",
            locationName: "Auditorium",
            checkInAt: "2026-07-29T00:00:00.000Z",
          },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderGuestForm();
    await screen.findByRole("heading", { name: "Tetamu Dua" });
    await user.click(screen.getByRole("button", { name: "Daftar keluar" }));

    expect(screen.getByText("Sahkan daftar keluar")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await user.click(
      screen.getByRole("button", { name: "Ya, daftar keluar" }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Terima kasih, Tetamu Dua",
      }),
    ).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain(
      "Rekod keluar anda telah disimpan",
    );
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/guest/check-out");
  });
});
