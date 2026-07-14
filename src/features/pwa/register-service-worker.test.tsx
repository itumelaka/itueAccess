import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RegisterServiceWorker } from "./register-service-worker";

describe("RegisterServiceWorker", () => {
  it("registers the privacy-safe worker from the site root", async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: { register },
    });

    render(<RegisterServiceWorker />);

    await waitFor(() => expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/" }));
  });
});
