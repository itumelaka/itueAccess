import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "../src/lib/supabase/types";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  INITIAL_ADMIN_EMAIL: z.string().email(),
});

async function main() {
  const env = envSchema.parse(process.env);
  const email = env.INITIAL_ADMIN_EMAIL.trim().toLowerCase();
  const supabase = createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: profiles, error: findError } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("email", email);

  if (findError) throw new Error(`Tidak dapat mencari profil admin: ${findError.message}`);
  if (profiles.length !== 1) throw new Error(`Bootstrap dihentikan: dijangka 1 profil untuk ${email}, ditemui ${profiles.length}.`);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role: "ADMIN", status: "ACTIVE" })
    .eq("id", profiles[0].id);

  if (updateError) throw new Error(`Tidak dapat mengaktifkan admin: ${updateError.message}`);
  console.log(`Admin awal telah diaktifkan: ${email}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Bootstrap admin gagal.");
  process.exitCode = 1;
});
