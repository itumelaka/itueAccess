import { z } from "zod";

const approvalSchema = z.object({
  profileId: z.string().min(1),
  displayName: z.string().trim().min(1),
  category: z.enum(["STAFF", "PELATIH"], {
    error: "Kategori pengguna diperlukan",
  }),
});

const categoryUpdateSchema = z.object({
  profileId: z.string().min(1),
  category: z.union([z.literal(""), z.enum(["STAFF", "PELATIH"])]),
});

const guestSchema = z.object({
  name: z.string().trim().min(1),
  organization: z.string().trim().min(1),
  purpose: z.string().trim().min(1),
  locationId: z.string().min(1),
});

export function toLocationCode(value: string) {
  return value
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export function parseUserApproval(input: {
  profileId: string;
  category: string;
  displayName: string;
}) {
  const result = approvalSchema.safeParse(input);
  if (!result.success) throw new Error("Nama penuh dan kategori pengguna diperlukan");
  return result.data;
}

export function parseUserCategoryUpdate(input: {
  profileId: string;
  category: string;
}) {
  const result = categoryUpdateSchema.safeParse(input);
  if (!result.success) throw new Error("Kategori pengguna tidak sah");
  return result.data;
}

export function parseGuestRegistration(input: {
  name: string;
  organization: string;
  purpose: string;
  locationId: string;
}) {
  const result = guestSchema.safeParse(input);
  if (!result.success) throw new Error("Maklumat tetamu belum lengkap");
  return result.data;
}
