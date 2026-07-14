import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ConnectionBanner } from "./connection-banner";

describe("ConnectionBanner", () => {
  it("shows the emergency notice only when offline", () => {
    const { rerender } = render(<ConnectionBanner fallbackUrl="https://forms.example" initialOnline={true} />);
    expect(screen.queryByRole("alert")).toBeNull();

    rerender(<ConnectionBanner fallbackUrl="https://forms.example" initialOnline={false} />);
    expect(screen.getByRole("alert")).toBeTruthy();
  });
});
