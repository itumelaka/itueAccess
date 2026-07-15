import { headers } from "next/headers";

import { syncPendingApprovalNotification } from "@/features/admin/pending-approval-notification";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function notifyAdminIfNeeded() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, display_name, status, created_at, admin_notified_at")
    .eq("id", user.id)
    .single();

  if (!profile || profile.status !== "PENDING" || profile.admin_notified_at) {
    return;
  }

  const requestHeaders = await headers();
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (!host) return;

  const result = await syncPendingApprovalNotification({
    adminUrl: `${protocol}://${host}/admin/users`,
    createdAt: profile.created_at,
    displayName: profile.display_name,
    email: profile.email,
  });

  if (result.ok) {
    await supabase.rpc("mark_pending_profile_notified", {
      p_profile_id: profile.id,
    });
  } else {
    console.warn("Pending approval notification failed", result.message);
  }
}

export default async function PendingPage() {
  await notifyAdminIfNeeded();

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-6">
      <section className="rounded-3xl bg-white p-8 shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">ITU eAccess</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">Akaun menunggu kelulusan</h1>
        <p className="mt-4 leading-7 text-slate-600">Admin perlu mengaktifkan akaun dan memilih kategori anda sebelum rekod masuk atau keluar boleh dibuat.</p>
      </section>
    </main>
  );
}
