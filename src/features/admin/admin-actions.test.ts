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

  return {
    createSupabaseServerClient,
    eq,
    from,
    requireProfile,
    revalidatePath,
    update,
  };
});

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/features/auth/require-profile", () => ({ requireProfile: mocks.requireProfile }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.createSupabaseServerClient }));

import { approveUser, rejectUser } from "./admin-actions";

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
