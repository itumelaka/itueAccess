export type LocationQrAudience = "user" | "guest";

export const MAIN_GUEST_QR_FILE_NAME = "QR PENDAFTARAN TETAMU ITU.svg";

export function qrDownloadFileName(
  name: string | null | undefined,
  code = "LOKASI",
  audience: LocationQrAudience = "user",
) {
  const source = (name || code || "LOKASI").trim();
  const safeName = source
    .toUpperCase()
    .replace(/[\u0000-\u001f\u007f\\/:*?"<>|#%]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const prefix = audience === "guest" ? "QR TETAMU" : "QR";
  return `${prefix} ${safeName || "LOKASI"}.svg`;
}

export function locationQrPath(
  code: string,
  audience: LocationQrAudience = "user",
) {
  const prefix = audience === "guest" ? "/guest" : "/scan";
  return `${prefix}/${encodeURIComponent(code)}`;
}