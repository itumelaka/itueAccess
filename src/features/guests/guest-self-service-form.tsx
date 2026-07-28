"use client";

import Script from "next/script";
import { FormEvent, useEffect, useState } from "react";

type GuestSession = {
  id: string;
  name: string;
  locationName: string;
  checkInAt: string;
};

export function GuestSelfServiceForm({
  locationCode,
  locationName,
  turnstileSiteKey,
}: {
  locationCode: string;
  locationName: string;
  turnstileSiteKey: string;
}) {
  const [session, setSession] = useState<GuestSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [checkInRequestId] = useState(() => crypto.randomUUID());

  useEffect(() => {
    fetch("/api/guest/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => setSession(result.visit ?? null))
      .catch(() => setMessage("Sesi tetamu tidak dapat diperiksa."))
      .finally(() => setLoadingSession(false));
  }, []);

  async function checkIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/guest/check-in", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        requestId: checkInRequestId,
        locationCode,
        name: form.get("name"),
        organization: form.get("organization"),
        purpose: form.get("purpose"),
        turnstileToken: form.get("cf-turnstile-response"),
      }),
    });
    const result = await response.json();
    if (result.ok) {
      window.location.reload();
      return;
    }
    setMessage(result.error ?? "Daftar masuk tidak berjaya.");
    setSubmitting(false);
  }

  async function checkOut() {
    setSubmitting(true);
    setMessage(null);
    const response = await fetch("/api/guest/check-out", { method: "POST" });
    const result = await response.json();
    if (result.ok) {
      setSession(null);
      setMessage("Daftar keluar berjaya. Terima kasih.");
    } else {
      setMessage(result.error ?? "Daftar keluar tidak berjaya.");
    }
    setSubmitting(false);
  }

  if (loadingSession) {
    return <p className="guest-self-service__message">Memeriksa sesi tetamu…</p>;
  }

  if (session) {
    return (
      <section className="guest-self-service__card">
        <p className="guest-self-service__kicker">Tetamu sedang berada di lokasi</p>
        <h2>{session.name}</h2>
        <dl className="guest-session-details">
          <div><dt>Lokasi</dt><dd>{session.locationName}</dd></div>
          <div>
            <dt>Masa masuk</dt>
            <dd>{new Date(session.checkInAt).toLocaleString("ms-MY", { timeZone: "Asia/Kuala_Lumpur" })}</dd>
          </div>
        </dl>
        <button
          className="guest-self-service__checkout"
          type="button"
          onClick={checkOut}
          disabled={submitting}
        >
          {submitting ? "Menghantar…" : "Daftar keluar"}
        </button>
        {message ? <p role="status">{message}</p> : null}
      </section>
    );
  }

  return (
    <section className="guest-self-service__card">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <p className="guest-self-service__kicker">Daftar masuk tetamu</p>
      <h2>{locationName}</h2>
      <form onSubmit={checkIn} className="guest-self-service__form">
        <label>Nama penuh<input name="name" required minLength={2} maxLength={120} autoComplete="name" /></label>
        <label>Organisasi<input name="organization" required minLength={2} maxLength={160} /></label>
        <label>Tujuan lawatan<textarea name="purpose" required minLength={3} maxLength={240} /></label>
        <div className="cf-turnstile" data-sitekey={turnstileSiteKey} />
        <p className="guest-self-service__privacy">
          Maklumat ini digunakan untuk rekod keselamatan dan akses ITU.
        </p>
        <button type="submit" disabled={submitting || !turnstileSiteKey}>
          {submitting ? "Menghantar…" : "Daftar masuk"}
        </button>
      </form>
      {!turnstileSiteKey ? (
        <p role="alert">Pendaftaran tetamu belum dikonfigurasi.</p>
      ) : null}
      {message ? <p role="alert">{message}</p> : null}
    </section>
  );
}
