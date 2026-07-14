export const OUTAGE_MESSAGE = "Sistem tidak dapat dihubungi. Rekod MASUK/KELUAR belum disimpan.";

export function OfflineNotice({ fallbackUrl }: { fallbackUrl: string }) {
  return (
    <div className="offline-notice" role="alert">
      <strong>{OUTAGE_MESSAGE}</strong>
      <span> Gunakan borang kecemasan jika operasi perlu diteruskan.</span>
      <a href={fallbackUrl} target="_blank" rel="noreferrer">Buka borang kecemasan</a>
    </div>
  );
}
