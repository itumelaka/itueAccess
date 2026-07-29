import QRCode from "qrcode";

import { requireProfile } from "@/features/auth/require-profile";
import {
  type LocationQrAudience,
  locationQrPath,
  qrDownloadFileName,
} from "@/features/locations/qr-download";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  await requireProfile("ADMIN");

  const { code } = await params;
  const requestUrl = new URL(request.url);
  const locationName = requestUrl.searchParams.get("name");
  const audience: LocationQrAudience =
    requestUrl.searchParams.get("audience") === "guest" ? "guest" : "user";
  const targetUrl = `${requestUrl.origin}${locationQrPath(code, audience)}`;
  const svg = await QRCode.toString(targetUrl, {
    type: "svg",
    margin: 2,
    color: { dark: "#000000", light: "#FFFFFF" },
  });

  return new Response(svg, {
    headers: {
      "cache-control": "private, no-store",
      "content-disposition": `attachment; filename="${qrDownloadFileName(locationName, code, audience)}"`,
      "content-type": "image/svg+xml; charset=utf-8",
    },
  });
}