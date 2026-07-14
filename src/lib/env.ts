import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_FALLBACK_FORM_URL: z.string().url().default(
    "https://docs.google.com/forms/d/1lA7ng0Bj9KjepnaGJjhlIlEYOo-MmHxtirv6GkWVxqw/viewform",
  ),
});

export function parsePublicEnv(input: Record<string, string | undefined>) {
  return publicEnvSchema.parse(input);
}

function readPublicEnv() {
  return parsePublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_FALLBACK_FORM_URL: process.env.NEXT_PUBLIC_FALLBACK_FORM_URL,
  });
}

export const publicEnv = {
  get NEXT_PUBLIC_SUPABASE_URL() {
    return readPublicEnv().NEXT_PUBLIC_SUPABASE_URL;
  },
  get NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY() {
    return readPublicEnv().NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  },
  get NEXT_PUBLIC_FALLBACK_FORM_URL() {
    return readPublicEnv().NEXT_PUBLIC_FALLBACK_FORM_URL;
  },
} as const;
