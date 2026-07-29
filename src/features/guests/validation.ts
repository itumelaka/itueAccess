import { z } from "zod";

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
  purpose: z
    .string()
    .trim()
    .min(3, "Terangkan tujuan lawatan sekurang-kurangnya 3 aksara.")
    .max(240, "Tujuan lawatan tidak boleh melebihi 240 aksara."),
});

export const guestSelfServiceInputSchema = guestDetailsSchema.extend({
  requestId: z.string().uuid(),
  locationCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{3,32}$/),
  turnstileToken: z.string().min(1),
});

export type GuestDetails = z.infer<typeof guestDetailsSchema>;
export type GuestSelfServiceInput = z.infer<
  typeof guestSelfServiceInputSchema
>;
