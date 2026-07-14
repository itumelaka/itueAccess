import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InstallCard } from "./install-card";

describe("InstallCard", () => {
  it("explains installation and keeps manual guidance available", () => {
    render(<InstallCard initialPlatform="ios" />);

    expect(screen.getByRole("heading", { name: "Pasang ITU eAccess" })).toBeTruthy();
    expect(screen.getByText(/Tambah ke Skrin Utama/)).toBeTruthy();
    expect(screen.getByText(/tidak memerlukan Play Store/i)).toBeTruthy();
  });
});
