import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { publicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

const publicPwaAssets = new Set(["/sw.js", "/offline.html", "/manifest.webmanifest"]);

export function shouldRefreshSession(pathname: string) {
  return !publicPwaAssets.has(pathname) && !/\.(?:svg|png|jpg|jpeg|gif|webp)$/.test(pathname);
}

export async function middleware(request: NextRequest) {
  if (!shouldRefreshSession(request.nextUrl.pathname)) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // This validates and refreshes the session with Supabase Auth.
  // Authorization still happens inside protected pages via requireProfile().
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw\\.js|offline\\.html|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
