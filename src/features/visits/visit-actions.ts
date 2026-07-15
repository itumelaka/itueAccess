import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export type VisitActionResult =
  | { ok: true; visitId: string; occurredAt: string }
  | { ok: false; code: "OFFLINE" | "INVALID_LOCATION" | "OPEN_VISIT" | "NOT_ACTIVE" | "UNKNOWN"; message: string };

type RpcResult = Promise<{
  data: { id: string; check_in_at: string; check_out_at?: string | null } | null;
  error: { message: string } | null;
}>;

export type VisitRpc = (name: "check_in" | "check_out", params: Record<string, string>) => RpcResult;
type ArchiveVisit = (input: { visitId: string; status: "MASUK" | "KELUAR" }) => Promise<void>;

const browserRpc: VisitRpc = async (name, params) => {
  const result = await createSupabaseBrowserClient().rpc(name, params as never);
  return result as unknown as Awaited<RpcResult>;
};

const browserArchiveVisit: ArchiveVisit = async (input) => {
  const response = await fetch("/api/spreadsheet/archive-visit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok || data?.ok === false) {
    throw new Error(String(data?.error ?? "Archive sync request failed"));
  }
};

async function archiveSafely(archiveVisit: ArchiveVisit, input: { visitId: string; status: "MASUK" | "KELUAR" }) {
  try {
    await archiveVisit(input);
  } catch (error) {
    console.warn("Spreadsheet archive sync failed", error);
  }
}

function failure(message: string): VisitActionResult {
  if (message.includes("open visit")) return { ok: false, code: "OPEN_VISIT", message: "Anda masih mempunyai rekod lawatan yang belum ditutup." };
  if (message.includes("location")) return { ok: false, code: "INVALID_LOCATION", message: "Lokasi ini tidak sah atau tidak lagi aktif." };
  if (message.includes("not active")) return { ok: false, code: "NOT_ACTIVE", message: "Akaun anda belum aktif. Sila hubungi admin." };
  return { ok: false, code: "UNKNOWN", message: "Permintaan tidak berjaya. Sila cuba lagi." };
}

export async function checkIn(
  locationCode: string,
  requestId: string,
  rpc: VisitRpc = browserRpc,
  archiveVisit: ArchiveVisit = browserArchiveVisit,
): Promise<VisitActionResult> {
  try {
    const { data, error } = await rpc("check_in", { p_location_code: locationCode, p_request_id: requestId });
    if (error || !data) return failure(error?.message ?? "Unknown error");
    await archiveSafely(archiveVisit, { visitId: data.id, status: "MASUK" });
    return { ok: true, visitId: data.id, occurredAt: data.check_in_at };
  } catch {
    return { ok: false, code: "OFFLINE", message: "Tiada sambungan. Rekod belum dihantar; cuba semula apabila talian pulih." };
  }
}

export async function checkOut(
  requestId: string,
  rpc: VisitRpc = browserRpc,
  archiveVisit: ArchiveVisit = browserArchiveVisit,
): Promise<VisitActionResult> {
  try {
    const { data, error } = await rpc("check_out", { p_request_id: requestId });
    if (error || !data) return failure(error?.message ?? "Unknown error");
    await archiveSafely(archiveVisit, { visitId: data.id, status: "KELUAR" });
    return { ok: true, visitId: data.id, occurredAt: data.check_out_at ?? data.check_in_at };
  } catch {
    return { ok: false, code: "OFFLINE", message: "Tiada sambungan. Rekod belum dihantar; cuba semula apabila talian pulih." };
  }
}
