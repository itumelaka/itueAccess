"use client";

import Script from "next/script";
import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  guestDetailsSchema,
  type GuestDetails,
} from "@/features/guests/validation";

type GuestSession = {
  id: string;
  name: string;
  locationName: string;
  checkInAt: string;
};

type GuestApiResult = {
  ok?: boolean;
  error?: string;
  visit?: GuestSession | null;
};

type Notice = {
  tone: "success" | "error" | "info";
  text: string;
};

type GuestField = keyof GuestDetails;
type FieldErrors = Partial<Record<GuestField, string>>;
type SessionState = "loading" | "ready" | "error";
type TurnstileState = "loading" | "ready" | "verified" | "error";

type TurnstileOptions = {
  sitekey: string;
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
  theme: "light";
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileOptions) => string;
  reset: (widgetId?: string) => void;
  remove?: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

function isGuestSession(value: unknown): value is GuestSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<GuestSession>;
  return (
    typeof session.id === "string" &&
    typeof session.name === "string" &&
    typeof session.locationName === "string" &&
    typeof session.checkInAt === "string"
  );
}

async function readApiResult(response: Response): Promise<GuestApiResult> {
  try {
    return (await response.json()) as GuestApiResult;
  } catch {
    return { ok: false };
  }
}

async function requestGuestSession(signal?: AbortSignal) {
  const response = await fetch("/api/guest/session", {
    cache: "no-store",
    signal,
  });
  const result = await readApiResult(response);
  if (!response.ok || !result.ok) {
    throw new Error("Session request failed");
  }
  return isGuestSession(result.visit) ? result.visit : null;
}

function StatusNotice({ notice }: { notice: Notice | null }) {
  if (!notice) return null;
  return (
    <p
      className={`guest-self-service__notice guest-self-service__notice--${notice.tone}`}
      role={notice.tone === "error" ? "alert" : "status"}
    >
      {notice.text}
    </p>
  );
}

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
  const [completedSession, setCompletedSession] =
    useState<GuestSession | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>("loading");
  const [submitting, setSubmitting] = useState(false);
  const [confirmingCheckout, setConfirmingCheckout] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileState, setTurnstileState] =
    useState<TurnstileState>("loading");
  const [checkInRequestId, setCheckInRequestId] = useState(() =>
    crypto.randomUUID(),
  );
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void requestGuestSession(controller.signal)
      .then((activeSession) => {
        setSession(activeSession);
        setSessionState("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSessionState("error");
        setNotice({
          tone: "error",
          text: "Sesi tetamu tidak dapat diperiksa. Semak sambungan dan cuba lagi.",
        });
      });
    return () => controller.abort();
  }, []);

  async function retrySession() {
    setSessionState("loading");
    setNotice(null);
    try {
      setSession(await requestGuestSession());
      setSessionState("ready");
    } catch {
      setSessionState("error");
      setNotice({
        tone: "error",
        text: "Sesi tetamu tidak dapat diperiksa. Semak sambungan dan cuba lagi.",
      });
    }
  }

  const removeTurnstile = useCallback(() => {
    if (turnstileWidgetIdRef.current) {
      window.turnstile?.remove?.(turnstileWidgetIdRef.current);
      turnstileWidgetIdRef.current = null;
    }
  }, []);

  const renderTurnstile = useCallback(() => {
    if (
      !turnstileSiteKey ||
      !turnstileContainerRef.current ||
      !window.turnstile ||
      turnstileWidgetIdRef.current
    ) {
      return;
    }

    try {
      turnstileWidgetIdRef.current = window.turnstile.render(
        turnstileContainerRef.current,
        {
          sitekey: turnstileSiteKey,
          theme: "light",
          callback: (token) => {
            setTurnstileToken(token);
            setTurnstileState("verified");
          },
          "expired-callback": () => {
            setTurnstileToken(null);
            setTurnstileState("ready");
            setNotice({
              tone: "error",
              text: "Pengesahan keselamatan telah tamat. Sila lengkapkan semula.",
            });
          },
          "error-callback": () => {
            setTurnstileToken(null);
            setTurnstileState("error");
            setNotice({
              tone: "error",
              text: "Pengesahan keselamatan tidak dapat dimuatkan. Sila muat semula halaman.",
            });
          },
        },
      );
      setTurnstileState("ready");
    } catch {
      setTurnstileState("error");
      setNotice({
        tone: "error",
        text: "Pengesahan keselamatan tidak dapat dimuatkan. Sila muat semula halaman.",
      });
    }
  }, [turnstileSiteKey]);

  useEffect(() => removeTurnstile, [removeTurnstile]);

  function resetTurnstile() {
    window.turnstile?.reset(turnstileWidgetIdRef.current ?? undefined);
    setTurnstileToken(null);
    setTurnstileState("ready");
  }

  function clearFieldError(field: GuestField) {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function checkIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const parsed = guestDetailsSchema.safeParse({
      name: form.get("name"),
      organization: form.get("organization"),
      purpose: form.get("purpose"),
    });

    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as GuestField;
        if (field && !errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      setNotice({
        tone: "error",
        text: "Semak maklumat yang ditandakan sebelum meneruskan.",
      });
      return;
    }

    if (!turnstileToken) {
      setNotice({
        tone: "error",
        text: "Lengkapkan pengesahan keselamatan sebelum daftar masuk.",
      });
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const response = await fetch("/api/guest/check-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requestId: checkInRequestId,
          locationCode,
          ...parsed.data,
          turnstileToken,
        }),
      });
      const result = await readApiResult(response);
      if (!response.ok || !result.ok || !isGuestSession(result.visit)) {
        setNotice({
          tone: "error",
          text: result.error ?? "Daftar masuk tidak berjaya. Sila cuba lagi.",
        });
        resetTurnstile();
        return;
      }

      formElement.reset();
      removeTurnstile();
      setSession(result.visit);
      setNotice({
        tone: "success",
        text: "Daftar masuk berjaya. Simpan halaman ini untuk daftar keluar nanti.",
      });
    } catch {
      setNotice({
        tone: "error",
        text: "Daftar masuk tidak dapat dihantar. Semak sambungan dan cuba lagi.",
      });
      resetTurnstile();
    } finally {
      setSubmitting(false);
    }
  }

  async function checkOut() {
    if (!session) return;
    setSubmitting(true);
    setNotice(null);

    try {
      const response = await fetch("/api/guest/check-out", { method: "POST" });
      const result = await readApiResult(response);
      if (!response.ok || !result.ok) {
        setNotice({
          tone: "error",
          text: result.error ?? "Daftar keluar tidak berjaya. Sila cuba lagi.",
        });
        return;
      }

      setCompletedSession(session);
      setSession(null);
      setConfirmingCheckout(false);
      setNotice({
        tone: "success",
        text: "Rekod keluar anda telah disimpan.",
      });
    } catch {
      setNotice({
        tone: "error",
        text: "Daftar keluar tidak dapat dihantar. Semak sambungan dan cuba lagi.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (sessionState === "loading") {
    return (
      <section
        className="guest-self-service__card guest-self-service__loading"
        aria-busy="true"
      >
        <span className="guest-self-service__spinner" aria-hidden="true" />
        <p className="guest-self-service__kicker">Sesi tetamu</p>
        <h2>Memeriksa rekod anda…</h2>
        <p>Proses ini biasanya mengambil beberapa saat.</p>
      </section>
    );
  }

  if (sessionState === "error") {
    return (
      <section className="guest-self-service__card">
        <p className="guest-self-service__kicker">Sambungan terganggu</p>
        <h2>Sesi belum dapat diperiksa</h2>
        <StatusNotice notice={notice} />
        <button
          className="guest-self-service__secondary"
          type="button"
          onClick={() => void retrySession()}
        >
          Cuba lagi
        </button>
      </section>
    );
  }

  if (completedSession) {
    return (
      <section className="guest-self-service__card guest-self-service__complete">
        <div className="guest-self-service__success-mark" aria-hidden="true">
          ✓
        </div>
        <p className="guest-self-service__kicker">Lawatan selesai</p>
        <h2>Terima kasih, {completedSession.name}</h2>
        <StatusNotice notice={notice} />
        <p>
          Anda telah didaftarkan keluar dari{" "}
          <strong>{completedSession.locationName}</strong>.
        </p>
        <button
          className="guest-self-service__secondary"
          type="button"
          onClick={() => {
            setCompletedSession(null);
            setNotice(null);
            setCheckInRequestId(crypto.randomUUID());
            setTurnstileState("loading");
          }}
        >
          Daftar lawatan baharu
        </button>
      </section>
    );
  }

  if (session) {
    const isDifferentLocation = session.locationName !== locationName;
    return (
      <section className="guest-self-service__card">
        <div className="guest-self-service__status-row">
          <p className="guest-self-service__kicker">Sesi aktif</p>
          <span className="guest-self-service__live-badge">
            Sedang berada di lokasi
          </span>
        </div>
        <h2>{session.name}</h2>
        <StatusNotice notice={notice} />
        {isDifferentLocation ? (
          <p className="guest-self-service__context-note">
            Anda membuka QR untuk {locationName}, tetapi sesi aktif anda berada
            di lokasi berikut.
          </p>
        ) : null}
        <dl className="guest-session-details">
          <div>
            <dt>Lokasi</dt>
            <dd>{session.locationName}</dd>
          </div>
          <div>
            <dt>Masa masuk</dt>
            <dd>
              {new Date(session.checkInAt).toLocaleString("ms-MY", {
                timeZone: "Asia/Kuala_Lumpur",
              })}
            </dd>
          </div>
        </dl>
        {confirmingCheckout ? (
          <div className="guest-self-service__confirmation">
            <strong>Sahkan daftar keluar</strong>
            <p>Pastikan anda benar-benar telah meninggalkan lokasi.</p>
            <div>
              <button
                className="guest-self-service__checkout"
                type="button"
                onClick={() => void checkOut()}
                disabled={submitting}
              >
                {submitting ? "Menyimpan…" : "Ya, daftar keluar"}
              </button>
              <button
                className="guest-self-service__secondary"
                type="button"
                onClick={() => setConfirmingCheckout(false)}
                disabled={submitting}
              >
                Batal
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              className="guest-self-service__checkout"
              type="button"
              onClick={() => setConfirmingCheckout(true)}
            >
              Daftar keluar
            </button>
            <p className="guest-self-service__action-note">
              Daftar keluar hanya apabila anda sudah meninggalkan lokasi.
            </p>
          </>
        )}
      </section>
    );
  }

  return (
    <section className="guest-self-service__card">
      {turnstileSiteKey ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onReady={renderTurnstile}
          onError={() => {
            setTurnstileState("error");
            setNotice({
              tone: "error",
              text: "Pengesahan keselamatan tidak dapat dimuatkan. Sila muat semula halaman.",
            });
          }}
        />
      ) : null}
      <p className="guest-self-service__kicker">Daftar masuk tetamu</p>
      <h2>Maklumat lawatan</h2>
      <p className="guest-self-service__intro">
        Lengkapkan maklumat berikut untuk masuk ke <strong>{locationName}</strong>.
      </p>
      <form onSubmit={checkIn} className="guest-self-service__form" noValidate>
        <label htmlFor="guest-name">
          Nama penuh
          <input
            id="guest-name"
            name="name"
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "guest-name-error" : undefined}
            onChange={() => clearFieldError("name")}
          />
          {fieldErrors.name ? (
            <span id="guest-name-error" className="guest-self-service__field-error">
              {fieldErrors.name}
            </span>
          ) : null}
        </label>
        <label htmlFor="guest-organization">
          Organisasi / syarikat
          <input
            id="guest-organization"
            name="organization"
            required
            minLength={2}
            maxLength={160}
            autoComplete="organization"
            aria-invalid={Boolean(fieldErrors.organization)}
            aria-describedby={
              fieldErrors.organization ? "guest-organization-error" : undefined
            }
            onChange={() => clearFieldError("organization")}
          />
          {fieldErrors.organization ? (
            <span
              id="guest-organization-error"
              className="guest-self-service__field-error"
            >
              {fieldErrors.organization}
            </span>
          ) : null}
        </label>
        <label htmlFor="guest-purpose">
          Tujuan lawatan
          <textarea
            id="guest-purpose"
            name="purpose"
            required
            minLength={3}
            maxLength={240}
            rows={4}
            aria-invalid={Boolean(fieldErrors.purpose)}
            aria-describedby={
              fieldErrors.purpose ? "guest-purpose-error" : undefined
            }
            onChange={() => clearFieldError("purpose")}
          />
          {fieldErrors.purpose ? (
            <span
              id="guest-purpose-error"
              className="guest-self-service__field-error"
            >
              {fieldErrors.purpose}
            </span>
          ) : null}
        </label>
        <div className="guest-self-service__security">
          <span>Pengesahan keselamatan</span>
          {turnstileSiteKey ? (
            <div ref={turnstileContainerRef} />
          ) : (
            <p role="alert">Pendaftaran tetamu belum dikonfigurasi.</p>
          )}
          {turnstileState === "loading" && turnstileSiteKey ? (
            <small>Memuatkan pengesahan…</small>
          ) : null}
          {turnstileState === "verified" ? (
            <small className="guest-self-service__verified">
              Pengesahan selesai.
            </small>
          ) : null}
        </div>
        <StatusNotice notice={notice} />
        <p className="guest-self-service__privacy">
          Dengan meneruskan, anda bersetuju maklumat ini digunakan untuk rekod
          keselamatan dan akses ITU.
        </p>
        <button
          type="submit"
          disabled={
            submitting ||
            !turnstileSiteKey ||
            turnstileState !== "verified"
          }
        >
          {submitting ? "Mendaftarkan…" : "Daftar masuk"}
        </button>
      </form>
    </section>
  );
}
