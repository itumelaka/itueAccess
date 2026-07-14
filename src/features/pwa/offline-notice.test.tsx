import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OfflineNotice } from "./offline-notice";

describe("OfflineNotice", () => {
  it("warns that the visit was not saved and links to the emergency form", () => {
    render(<OfflineNotice fallbackUrl="https://forms.example/emergency" />);

    expect(screen.getByRole("alert").textContent).toContain(
      "Sistem tidak dapat dihubungi. Rekod MASUK/KELUAR belum disimpan.",
    );
    expect(screen.getByRole("link", { name: "Buka borang kecemasan" }).getAttribute("href"))
      .toBe("https://forms.example/emergency");
  });
});
