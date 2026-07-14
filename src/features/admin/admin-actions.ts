"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { requireProfile } from "@/features/auth/require-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  parseGuestRegistration,
  parseUserApproval,
  toLocationCode,
} from "./admin-inputs";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function adminClient() {
  await requireProfile("ADMIN");
  return createSupabaseServerClient();
}

function ensureSuccess(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function approveUser(formData: FormData) {
  const input = parseUserApproval({
    profileId: text(formData, "profileId"),
    category: text(formData, "category"),
  });
  const supabase = await adminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ category: input.category, status: "ACTIVE" })
    .eq("id", input.profileId);
  ensureSuccess(error);
  revalidatePath("/admin/users");
}

export async function setUserStatus(formData: FormData) {
  const profileId = text(formData, "profileId");
  const status = text(formData, "status");
  if (!profileId || !["ACTIVE", "SUSPENDED"].includes(status)) {
    throw new Error("Status pengguna tidak sah");
  }
  const supabase = await adminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ status: status as "ACTIVE" | "SUSPENDED" })
    .eq("id", profileId);
  ensureSuccess(error);
  revalidatePath("/admin/users");
}

export async function promoteUser(formData: FormData) {
  const profileId = text(formData, "profileId");
  const confirmation = text(formData, "confirmation").toLowerCase();
  const supabase = await adminClient();
  const { data: target, error: readError } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", profileId)
    .single();
  ensureSuccess(readError);
  if (!target || confirmation !== target.email.toLowerCase()) {
    throw new Error("Taip e-mel pengguna untuk pengesahan kedua");
  }
  const { error } = await supabase
    .from("profiles")
    .update({ role: "ADMIN", status: "ACTIVE" })
    .eq("id", profileId);
  ensureSuccess(error);
  revalidatePath("/admin/users");
}

export async function createLocation(formData: FormData) {
  const name = text(formData, "name");
  const code = toLocationCode(text(formData, "code") || name);
  if (!name || code.length < 3) throw new Error("Nama dan kod lokasi diperlukan");
  const supabase = await adminClient();
  const { error } = await supabase.from("locations").insert({ name, code });
  ensureSuccess(error);
  revalidatePath("/admin/locations");
}

export async function toggleLocation(formData: FormData) {
  const locationId = text(formData, "locationId");
  const isActive = text(formData, "isActive") === "true";
  const supabase = await adminClient();
  const { error } = await supabase
    .from("locations")
    .update({ is_active: !isActive })
    .eq("id", locationId);
  ensureSuccess(error);
  revalidatePath("/admin/locations");
}

export async function registerGuest(formData: FormData) {
  const input = parseGuestRegistration({
    name: text(formData, "name"),
    organization: text(formData, "organization"),
    purpose: text(formData, "purpose"),
    locationId: text(formData, "locationId"),
  });
  const supabase = await adminClient();
  const { error } = await supabase.rpc("register_guest", {
    p_location_id: input.locationId,
    p_name: input.name,
    p_organization: input.organization,
    p_purpose: input.purpose,
    p_request_id: randomUUID(),
  });
  ensureSuccess(error);
  revalidatePath("/admin/guests");
  revalidatePath("/admin");
}

export async function checkOutGuest(formData: FormData) {
  const visitId = text(formData, "visitId");
  if (!visitId) throw new Error("Rekod tetamu tidak ditemui");
  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_check_out_guest", {
    p_visit_id: visitId,
    p_request_id: randomUUID(),
  });
  ensureSuccess(error);
  revalidatePath("/admin/guests");
  revalidatePath("/admin");
}
