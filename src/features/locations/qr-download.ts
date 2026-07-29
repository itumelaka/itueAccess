export type LocationQrAudience = "user" | "guest";

export const MAIN_GUEST_QR_FILE_NAME = "itu-eaccess-guest-main.svg";

export function qrDownloadFileName(
  name: string | null | undefined,
  code = "LOKASI",
  audience: LocationQrAudience = "user",
) {
  const source = (code || name || "LOKASI").trim();
  const safeCode = source
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");
  const segment = safeCode || "LOKASI";
  const qrType = audience === "guest" ? "guest" : "user";

  return `itu-eaccess-${qrType}-${segment}.svg`;
}

export function locationQrPath(
  code: string,
  audience: LocationQrAudience = "user",
) {
  const prefix = audience === "guest" ? "/guest" : "/scan";
  return `${prefix}/${encodeURIComponent(code)}`;
}