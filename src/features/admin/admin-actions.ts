"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { requireProfile } from "@/features/auth/require-profile";
import {
  archiveUserMovement,
  archiveGuestMovement,
  syncArchivePayload,
} from "@/features/spreadsheet/archive-sync";
import { resolveArchiveCategory } from "@/features/spreadsheet/archive-category";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  parseGuestRegistration,
  parseUserApproval,
  parseUserCategoryUpdate,
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

type GuestVisitRow = {
  check_in_at: string;
  check_out_at: string | null;
  guest_name: string | null;
  guest_organization: string | null;
  guest_purpose: string | null;
};

type ManualVisitRow = GuestVisitRow & {
  person_type: "USER" | "GUEST";
  locations: { name: string | null } | { name: string | null }[] | null;
  profiles:
    | {
        email: string | null;
        display_name: string | null;
        category: "STAFF" | "PELATIH" | null;
        role: "ADMIN" | "USER" | null;
      }
    | Array<{
        email: string | null;
        display_name: string | null;
        category: "STAFF" | "PELATIH" | null;
        role: "ADMIN" | "USER" | null;
      }>
    | null;
};

async function syncGuestVisitArchive(input: {
  visit: GuestVisitRow | null;
  status: "MASUK" | "KELUAR";
  recorderEmail: string;
}) {
  if (!input.visit) return;

  await syncArchivePayload(
    archiveGuestMovement({
      status: input.status,
      occurredAt:
        input.status === "KELUAR"
          ? (input.visit.check_out_at ?? input.visit.check_in_at)
          : input.visit.check_in_at,
      recorderEmail: input.recorderEmail,
      guestName: input.visit.guest_name,
      organization: input.visit.guest_organization,
      purpose: input.visit.guest_purpose,
    }),
  );
}

function firstOrSelf<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function syncManualVisitArchive(input: {
  visit: ManualVisitRow | null;
  recorderEmail: string;
}) {
  if (!input.visit) return;

  if (input.visit.person_type === "GUEST") {
    await syncGuestVisitArchive({
      visit: input.visit,
      status: "KELUAR",
      recorderEmail: input.recorderEmail,
    });
    return;
  }

  const profile = firstOrSelf(input.visit.profiles);
  const location = firstOrSelf(input.visit.locations);

  await syncArchivePayload(
    archiveUserMovement({
      status: "KELUAR",
      occurredAt: input.visit.check_out_at ?? input.visit.check_in_at,
      email: profile?.email ?? "",
      displayName: profile?.display_name ?? "",
      category: resolveArchiveCategory({
        visitCategory: profile?.category,
        profileRole: profile?.role,
      }),
      locationName: location?.name ?? "",
    }),
  );
}

export async function approveUser(formData: FormData) {
  const input = parseUserApproval({
    profileId: text(formData, "profileId"),
    category: text(formData, "category"),
    displayName: text(formData, "displayName"),
  });
  const supabase = await adminClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      category: input.category,
      display_name: input.displayName,
      status: "ACTIVE",
    })
    .eq("id", input.profileId);
  ensureSuccess(error);
  revalidatePath("/admin/users");
}

export async function rejectUser(formData: FormData) {
  const profileId = text(formData, "profileId");
  if (!profileId) throw new Error("Pengguna tidak sah");
  const supabase = await adminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ status: "SUSPENDED" })
    .eq("id", profileId);
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

export async function updateUserCategory(formData: FormData) {
  const input = parseUserCategoryUpdate({
    profileId: text(formData, "profileId"),
    category: text(formData, "category"),
  });
  const supabase = await adminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ category: input.category || null })
    .eq("id", input.profileId);
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
  const { profile } = await requireProfile("ADMIN");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("register_guest", {
    p_location_id: input.locationId,
    p_name: input.name,
    p_organization: input.organization,
    p_purpose: input.purpose,
    p_request_id: randomUUID(),
  });
  ensureSuccess(error);
  await syncGuestVisitArchive({
    visit: data,
    status: "MASUK",
    recorderEmail: profile.email,
  });
  revalidatePath("/admin/guests");
  revalidatePath("/admin");
}

export async function checkOutGuest(formData: FormData) {
  const visitId = text(formData, "visitId");
  if (!visitId) throw new Error("Rekod tetamu tidak ditemui");
  const { profile } = await requireProfile("ADMIN");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("admin_check_out_guest", {
    p_visit_id: visitId,
    p_request_id: randomUUID(),
  });
  ensureSuccess(error);
  await syncGuestVisitArchive({
    visit: data,
    status: "KELUAR",
    recorderEmail: profile.email,
  });
  revalidatePath("/admin/guests");
  revalidatePath("/admin");
}

export async function adminCheckOutVisit(formData: FormData) {
  const visitId = text(formData, "visitId");
  if (!visitId) throw new Error("Rekod lawatan tidak ditemui");

  const { profile } = await requireProfile("ADMIN");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_check_out_visit", {
    p_visit_id: visitId,
    p_request_id: randomUUID(),
  });
  ensureSuccess(error);

  const { data: visit, error: readError } = await supabase
    .from("visits")
    .select(
      "person_type, check_in_at, check_out_at, guest_name, guest_organization, guest_purpose, locations(name), profiles!visits_profile_id_fkey(email, display_name, category, role)",
    )
    .eq("id", visitId)
    .single();
  ensureSuccess(readError);

  await syncManualVisitArchive({
    visit: visit as ManualVisitRow | null,
    recorderEmail: profile.email,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/history");
  revalidatePath("/admin/guests");
}
