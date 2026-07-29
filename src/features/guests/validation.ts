import { z } from "zod";

export const locationCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9-]{3,32}$/, "Pilih lokasi atau destinasi lawatan.");

export const guestDetailsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Masukkan nama penuh sekurang-kurangnya 2 aksara.")
    .max(120, "Nama penuh tidak boleh melebihi 120 aksara."),
  organization: z
    .string()
    .trim()
    .min(2, "Masukkan organisasi sekurang-kurangnya 2 aksara.")
    .max(160, "Nama organisasi tidak boleh melebihi 160 aksara."),
  hostName: z
    .string()
    .trim()
    .min(2, "Masukkan nama pegawai yang hendak ditemui.")
    .max(160, "Nama pegawai tidak boleh melebihi 160 aksara."),
  purpose: z
    .string()
    .trim()
    .min(3, "Terangkan tujuan lawatan sekurang-kurangnya 3 aksara.")
    .max(240, "Tujuan lawatan tidak boleh melebihi 240 aksara."),
});

export const guestRegistrationDetailsSchema = guestDetailsSchema.extend({
  locationCode: locationCodeSchema,
});

export const guestSelfServiceInputSchema =
  guestRegistrationDetailsSchema.extend({
    requestId: z.string().uuid(),
    turnstileToken: z.string().min(1),
  });

export type GuestDetails = z.infer<typeof guestDetailsSchema>;
export type GuestRegistrationDetails = z.infer<
  typeof guestRegistrationDetailsSchema
>;
export type GuestSelfServiceInput = z.infer<
  typeof guestSelfServiceInputSchema
>;