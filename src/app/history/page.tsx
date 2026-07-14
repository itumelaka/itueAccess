import { requireProfile } from "@/features/auth/require-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function boundedDates(from?: string, to?: string) {
  const end = to && !Number.isNaN(Date.parse(to)) ? new Date(to) : new Date();
  const requestedStart = from && !Number.isNaN(Date.parse(from)) ? new Date(from) : new Date(end.getTime() - 30 * 86400000);
  const earliest = new Date(end.getTime() - 90 * 86400000);
  return { start: requestedStart < earliest ? earliest : requestedStart, end };
}

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const { profile } = await requireProfile();
  const { start, end } = boundedDates((await searchParams).from, (await searchParams).to);
  const supabase = await createSupabaseServerClient();
  const { data: visits } = await supabase.from("visits").select("id, check_in_at, check_out_at, locations(name)").eq("profile_id", profile.id).gte("check_in_at", start.toISOString()).lte("check_in_at", end.toISOString()).order("check_in_at", { ascending: false }).limit(200);

  return <main className="mx-auto max-w-3xl px-6 py-10"><h1 className="text-3xl font-bold">Sejarah saya</h1><div className="mt-6 space-y-3">{visits?.length ? visits.map((visit) => <article key={visit.id} className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold">{visit.locations.name}</h2><p className="mt-1 text-sm text-slate-600">Masuk: {new Date(visit.check_in_at).toLocaleString("ms-MY")}</p><p className="text-sm text-slate-600">Keluar: {visit.check_out_at ? new Date(visit.check_out_at).toLocaleString("ms-MY") : "Belum keluar"}</p></article>) : <p>Tiada rekod dalam tempoh ini.</p>}</div></main>;
}
