import QRCode from "qrcode";

import { requireProfile } from "@/features/auth/require-profile";
import { MAIN_GUEST_QR_FILE_NAME } from "@/features/locations/qr-download";

export async function GET(request: Request) {
  await requireProfile("ADMIN");

  const requestUrl = new URL(request.url);
  const svg = await QRCode.toString(`${requestUrl.origin}/guest`, {
    type: "svg",
    margin: 2,
    color: { dark: "#9A0020", light: "#FFFFFF" },
  });

  return new Response(svg, {
    headers: {
      "cache-control": "private, no-store",
      "content-disposition": `attachment; filename="${MAIN_GUEST_QR_FILE_NAME}"`,
      "content-type": "image/svg+xml; charset=utf-8",
    },
  });
}