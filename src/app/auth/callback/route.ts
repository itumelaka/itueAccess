import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null, origin: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";

  const target = new URL(value, origin);
  return target.origin === origin ? `${target.pathname}${target.search}${target.hash}` : "/";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"), requestUrl.origin);

  if (!code) return NextResponse.redirect(new URL("/?auth_error=missing_code", requestUrl.origin));

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) return NextResponse.redirect(new URL("/?auth_error=oauth_callback", requestUrl.origin));

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
