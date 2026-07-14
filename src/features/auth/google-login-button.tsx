"use client";

import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function GoogleLoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function login() {
    setIsLoading(true);
    setMessage(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setMessage("Log masuk Google tidak berjaya. Sila cuba lagi.");
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={login}
        disabled={isLoading}
        className="google-login-button"
      >
        <svg viewBox="0 0 48 48" aria-hidden="true" className="google-mark">
          <path fill="#FFC107" d="M43.6 20H24v8h11.3c-1.7 4.8-6.2 8-11.3 8A12 12 0 1 1 31.7 14l5.7-5.7A20 20 0 1 0 44 24c0-1.3-.1-2.7-.4-4Z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8A12 12 0 0 1 31.7 14l5.7-5.7A20 20 0 0 0 6.3 14.7Z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3A12 12 0 0 1 12.9 28l-6.6 5.1A20 20 0 0 0 24 44Z" />
          <path fill="#1976D2" d="M43.6 20H24v8h11.3a12 12 0 0 1-4 5.5l6.3 5.3A19.8 19.8 0 0 0 44 24c0-1.3-.1-2.7-.4-4Z" />
        </svg>
        <span>{isLoading ? "Membuka Google…" : "Log masuk dengan Google"}</span>
      </button>
      {message ? <p className="mt-3 text-sm text-red-700">{message}</p> : null}
    </div>
  );
}
