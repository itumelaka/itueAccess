import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoginHero } from "./login-hero";

describe("LoginHero", () => {
  it("presents the approved ITU eAccess login message and action", () => {
    render(<LoginHero />);

    expect(screen.getByRole("img", { name: "ITU eAccess" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Rekod Keluar & Masuk" })).toBeTruthy();
    expect(screen.getByText("Sistem rekod akses bilik ITU yang mudah, selamat dan teratur.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Log masuk dengan Google" })).toBeTruthy();
    expect(screen.getByText(/Log masuk Google disahkan melalui Supabase Auth/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Pasang sebagai aplikasi" }).getAttribute("href")).toBe("/install");
    expect(screen.getByText("Masuk mudah, rekod teratur.")).toBeTruthy();
  });
});
