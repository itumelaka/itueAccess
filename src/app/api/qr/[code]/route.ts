import QRCode from "qrcode";

import { requireProfile } from "@/features/auth/require-profile";
import { qrDownloadFileName } from "@/features/locations/qr-download";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  await requireProfile("ADMIN");

  const { code } = await params;
  const requestUrl = new URL(request.url);
  const locationName = requestUrl.searchParams.get("name");
  const scanUrl = `${requestUrl.origin}/scan/${encodeURIComponent(code)}`;
  const svg = await QRCode.toString(scanUrl, {
    type: "svg",
    margin: 2,
    color: { dark: "#000000", light: "#FFFFFF" },
  });

  return new Response(svg, {
    headers: {
      "cache-control": "private, no-store",
      "content-disposition": `attachment; filename="${qrDownloadFileName(locationName, code)}"`,
      "content-type": "image/svg+xml; charset=utf-8",
    },
  });
}
