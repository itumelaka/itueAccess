import { createHealthResponse } from "@/features/pwa/health-response";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("locations").select("id").limit(1);

  return Response.json(createHealthResponse(!error), {
    status: error ? 503 : 200,
    headers: { "Cache-Control": "no-store" },
  });
}
