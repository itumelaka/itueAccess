type ArchiveCategory = "STAFF" | "PELATIH";

export function resolveArchiveCategory(input: {
  visitCategory?: ArchiveCategory | null;
  profileCategory?: ArchiveCategory | null;
  profileRole?: "ADMIN" | "USER" | null;
}): ArchiveCategory | null {
  if (input.visitCategory) return input.visitCategory;
  if (input.profileCategory) return input.profileCategory;
  if (input.profileRole === "ADMIN") return "STAFF";
  return null;
}
