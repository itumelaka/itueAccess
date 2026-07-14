import { createHealthResponse } from "@/features/pwa/health-response";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("locations").select("id").limit(1);

  return Response.json(createHealthResponse(!error), {
    status: error ? 503 : 200,
    headers: { "Cache-Control": "no-store" },
  });
}
