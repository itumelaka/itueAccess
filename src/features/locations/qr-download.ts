export function qrDownloadFileName(name: string | null | undefined, code = "LOKASI") {
  const source = (name || code || "LOKASI").trim();
  const safeName = source
    .toUpperCase()
    .replace(/[\\/:*?"<>|#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return `QR ${safeName || "LOKASI"}.svg`;
}
