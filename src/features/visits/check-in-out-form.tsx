"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { checkIn, checkOut } from "./visit-actions";

type Props = { mode: "CHECK_IN" | "CHECK_OUT"; locationCode?: string; locationName?: string };

export function CheckInOutForm({ mode, locationCode, locationName }: Props) {
  const router = useRouter();
  const requestId = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    if (mode === "CHECK_IN" && !locationCode) return;
    requestId.current ??= crypto.randomUUID();
    setBusy(true);
    setMessage(null);
    const result = mode === "CHECK_IN"
      ? await checkIn(locationCode!, requestId.current)
      : await checkOut(requestId.current);
    setBusy(false);
    setMessage(result.ok ? (mode === "CHECK_IN" ? "Kemasukan berjaya direkodkan." : "Keluaran berjaya direkodkan.") : result.message);
    if (result.ok) { requestId.current = null; router.refresh(); }
  }

  const confirmation = mode === "CHECK_IN" ? `Masuk ke ${locationName}?` : "Rekod keluar sekarang?";
  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-bold">{confirmation}</h2>
      <button type="button" onClick={submit} disabled={busy} className="mt-5 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-60">
        {busy ? "Menghantar…" : mode === "CHECK_IN" ? "Ya, rekod masuk" : "Ya, rekod keluar"}
      </button>
      <p className="mt-4 min-h-6 text-sm" aria-live="polite">{message}</p>
    </section>
  );
}
