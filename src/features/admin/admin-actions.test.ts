import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const revalidatePath = vi.fn();
  const requireProfile = vi.fn().mockResolvedValue({
    profile: { id: "admin-1", email: "admin@example.com" },
  });
  const eq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ update }));
  const createSupabaseServerClient = vi.fn().mockResolvedValue({ from });
  const syncArchivePayload = vi.fn().mockResolvedValue({ ok: true });
  const archiveUserMovement = vi.fn(() => ({ sheetName: "STAFF", values: [] }));
  const archiveGuestMovement = vi.fn(() => ({ sheetName: "TETAMU", values: [] }));

  return {
    archiveGuestMovement,
    archiveUserMovement,
    createSupabaseServerClient,
    eq,
    from,
    requireProfile,
    revalidatePath,
    syncArchivePayload,
    update,
  };
});

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/features/auth/require-profile", () => ({ requireProfile: mocks.requireProfile }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.createSupabaseServerClient }));
vi.mock("@/features/spreadsheet/archive-sync", () => ({
  archiveGuestMovement: mocks.archiveGuestMovement,
  archiveUserMovement: mocks.archiveUserMovement,
  syncArchivePayload: mocks.syncArchivePayload,
}));

import { adminCheckOutVisit, approveUser, rejectUser, updateUserCategory } from "./admin-actions";

describe("approveUser", () => {
  it("activates the profile with selected category and corrected full name", async () => {
    const formData = new FormData();
    formData.set("profileId", "profile-1");
    formData.set("category", "STAFF");
    formData.set("displayName", "Nama Penuh Betul");

    await approveUser(formData);

    expect(mocks.requireProfile).toHaveBeenCalledWith("ADMIN");
    expect(mocks.from).toHaveBeenCalledWith("profiles");
    expect(mocks.update).toHaveBeenCalledWith({
      category: "STAFF",
      display_name: "Nama Penuh Betul",
      status: "ACTIVE",
    });
    expect(mocks.eq).toHaveBeenCalledWith("id", "profile-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/users");
  });
});

describe("rejectUser", () => {
  it("suspends a pending profile and refreshes the users admin page", async () => {
    const formData = new FormData();
    formData.set("profileId", "profile-1");

    await rejectUser(formData);

    expect(mocks.requireProfile).toHaveBeenCalledWith("ADMIN");
    expect(mocks.from).toHaveBeenCalledWith("profiles");
    expect(mocks.update).toHaveBeenCalledWith({ status: "SUSPENDED" });
    expect(mocks.eq).toHaveBeenCalledWith("id", "profile-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/users");
  });
});

describe("updateUserCategory", () => {
  it("updates a registered profile category and refreshes the users admin page", async () => {
    const formData = new FormData();
    formData.set("profileId", "profile-2");
    formData.set("category", "PELATIH");

    await updateUserCategory(formData);

    expect(mocks.requireProfile).toHaveBeenCalledWith("ADMIN");
    expect(mocks.from).toHaveBeenCalledWith("profiles");
    expect(mocks.update).toHaveBeenCalledWith({ category: "PELATIH" });
    expect(mocks.eq).toHaveBeenCalledWith("id", "profile-2");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/users");
  });

  it("clears a registered profile category when no category is selected", async () => {
    const formData = new FormData();
    formData.set("profileId", "profile-3");
    formData.set("category", "");

    await updateUserCategory(formData);

    expect(mocks.update).toHaveBeenCalledWith({ category: null });
    expect(mocks.eq).toHaveBeenCalledWith("id", "profile-3");
  });
});

describe("adminCheckOutVisit", () => {
  it("closes an open visit through the admin RPC and refreshes dashboard pages", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: { id: "visit-1", check_out_at: "2026-07-15T01:00:00Z" },
      error: null,
    });
    const single = vi.fn().mockResolvedValue({
      data: {
        person_type: "USER",
        check_in_at: "2026-07-15T00:00:00Z",
        check_out_at: "2026-07-15T01:00:00Z",
        guest_name: null,
        guest_organization: null,
        guest_purpose: null,
        locations: { name: "Bilik Server" },
        profiles: {
          email: "staff@example.com",
          display_name: "Staf Satu",
          category: "STAFF",
          role: "USER",
        },
      },
      error: null,
    });
    const eq = vi.fn(() => ({ single }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    mocks.createSupabaseServerClient.mockResolvedValueOnce({ rpc, from });
    const formData = new FormData();
    formData.set("visitId", "visit-1");

    await adminCheckOutVisit(formData);

    expect(mocks.requireProfile).toHaveBeenCalledWith("ADMIN");
    expect(rpc).toHaveBeenCalledWith("admin_check_out_visit", {
      p_visit_id: "visit-1",
      p_request_id: expect.any(String),
    });
    expect(from).toHaveBeenCalledWith("visits");
    expect(mocks.archiveUserMovement).toHaveBeenCalledWith({
      status: "KELUAR",
      occurredAt: "2026-07-15T01:00:00Z",
      email: "staff@example.com",
      displayName: "Staf Satu",
      category: "STAFF",
      locationName: "Bilik Server",
    });
    expect(mocks.syncArchivePayload).toHaveBeenCalledWith({
      sheetName: "STAFF",
      values: [],
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/history");
  });
});
