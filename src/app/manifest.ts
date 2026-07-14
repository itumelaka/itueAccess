import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ITU eAccess",
    short_name: "ITU eAccess",
    description: "Sistem rekod masuk dan keluar bilik ITU yang mudah, selamat dan teratur.",
    start_url: "/",
    display: "standalone",
    background_color: "#F3F7FC",
    theme_color: "#1D388C",
    orientation: "portrait-primary",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
