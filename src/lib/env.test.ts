import { describe, expect, it } from "vitest";
import { parsePublicEnv } from "./env";

describe("parsePublicEnv", () => {
  it("rejects a non-URL Supabase endpoint", () => {
    expect(() =>
      parsePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "invalid",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "key",
      }),
    ).toThrow();
  });

  it("provides a validated emergency fallback form URL", () => {
    const parsed = parsePublicEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "key",
    });

    expect(parsed.NEXT_PUBLIC_FALLBACK_FORM_URL).toBe(
      "https://docs.google.com/forms/d/1lA7ng0Bj9KjepnaGJjhlIlEYOo-MmHxtirv6GkWVxqw/viewform",
    );
    expect(() => parsePublicEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "key",
      NEXT_PUBLIC_FALLBACK_FORM_URL: "not-a-url",
    })).toThrow();
  });
});
