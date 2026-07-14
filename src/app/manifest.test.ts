import { describe, expect, it } from "vitest";

import manifest from "./manifest";

describe("PWA manifest", () => {
  it("publishes the approved ITU eAccess identity and launcher icons", () => {
    expect(manifest()).toMatchObject({
      name: "ITU eAccess",
      short_name: "ITU eAccess",
      start_url: "/",
      display: "standalone",
      background_color: "#F3F7FC",
      theme_color: "#1D388C",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    });
  });
});
