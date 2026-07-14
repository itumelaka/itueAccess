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
        className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white disabled:cursor-wait disabled:opacity-60"
      >
        {isLoading ? "Membuka Google…" : "Log masuk dengan Google"}
      </button>
      {message ? <p className="mt-3 text-sm text-red-700">{message}</p> : null}
    </div>
  );
}
