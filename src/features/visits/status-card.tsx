import { formatMalaysiaDateTime } from "@/lib/format-date";

type StatusCardProps = {
  visit: { locationName: string; checkInAt: string } | null;
};

export function StatusCard({ visit }: StatusCardProps) {
  return (
    <section className={`rounded-3xl p-6 ${visit ? "bg-emerald-50 text-emerald-950" : "bg-slate-100 text-slate-900"}`}>
      <p className="text-sm font-semibold uppercase tracking-widest">Status semasa</p>
      {visit ? (
        <><h2 className="mt-2 text-2xl font-bold">Sedang berada di {visit.locationName}</h2><p className="mt-2">Masuk pada {formatMalaysiaDateTime(visit.checkInAt)}</p></>
      ) : (
        <><h2 className="mt-2 text-2xl font-bold">Tiada lawatan terbuka</h2><p className="mt-2 text-slate-600">Imbas QR lokasi untuk merekodkan kemasukan.</p></>
      )}
    </section>
  );
}
