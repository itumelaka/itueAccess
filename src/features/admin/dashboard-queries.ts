type PersonType = "USER" | "GUEST";
type UserCategory = "STAFF" | "PELATIH" | null;

export type DashboardVisit = {
  id: string;
  person_type: PersonType;
  profile_id: string | null;
  location_id: string;
  check_in_at: string;
  check_out_at: string | null;
  guest_name?: string | null;
  guest_organization?: string | null;
  profiles?: {
    email: string | null;
    display_name: string | null;
    category: UserCategory;
  } | Array<{
    email: string | null;
    display_name: string | null;
    category: UserCategory;
  }> | null;
  locations?: {
    name: string | null;
  } | Array<{
    name: string | null;
  }> | null;
};

export type DashboardProfile = {
  id: string;
  category: UserCategory;
};

export type DashboardLocation = {
  id: string;
  name: string;
};

type DashboardInput = {
  openVisits: DashboardVisit[];
  activityVisits: DashboardVisit[];
  profiles: DashboardProfile[];
  locations: DashboardLocation[];
  now?: Date;
  overdueHours?: number;
};

const malaysiaDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kuala_Lumpur",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function dateKey(value: string | Date) {
  return malaysiaDate.format(typeof value === "string" ? new Date(value) : value);
}

function firstOrSelf<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function categoryLabel(category: UserCategory, personType: PersonType) {
  if (personType === "GUEST") return "Tetamu";
  if (category === "STAFF") return "Staf";
  if (category === "PELATIH") return "Pelatih";
  return "Pengguna";
}

export function summarizeDashboard({
  openVisits,
  activityVisits,
  profiles,
  locations,
  now = new Date(),
  overdueHours = 12,
}: DashboardInput) {
  const today = dateKey(now);
  const categories = new Map(profiles.map((profile) => [profile.id, profile.category]));
  const insideByLocation = new Map<string, number>();

  let staffInside = 0;
  let traineeInside = 0;
  let guestInside = 0;
  let overdue = 0;
  const currentOccupants = [];

  for (const visit of openVisits) {
    insideByLocation.set(
      visit.location_id,
      (insideByLocation.get(visit.location_id) ?? 0) + 1,
    );

    if (visit.person_type === "GUEST") guestInside += 1;
    if (visit.person_type === "USER" && visit.profile_id) {
      const category = categories.get(visit.profile_id);
      if (category === "STAFF") staffInside += 1;
      if (category === "PELATIH") traineeInside += 1;
    }

    const hoursInside = (now.getTime() - new Date(visit.check_in_at).getTime()) / 3_600_000;
    const isOverdue = hoursInside > overdueHours;
    if (isOverdue) overdue += 1;

    const profile = firstOrSelf(visit.profiles);
    const location = firstOrSelf(visit.locations);
    const category =
      visit.person_type === "USER" && visit.profile_id
        ? (profile?.category ?? categories.get(visit.profile_id) ?? null)
        : null;

    currentOccupants.push({
      id: visit.id,
      name:
        visit.person_type === "GUEST"
          ? (visit.guest_name ?? "Tetamu")
          : (profile?.display_name ?? profile?.email ?? "Pengguna"),
      categoryLabel: categoryLabel(category, visit.person_type),
      locationName:
        location?.name ??
        locations.find((item) => item.id === visit.location_id)?.name ??
        "Lokasi tidak diketahui",
      checkInAt: visit.check_in_at,
      hoursInside: Math.round(hoursInside * 10) / 10,
      isOverdue,
    });
  }

  return {
    inside: openVisits.length,
    staffInside,
    traineeInside,
    guestInside,
    openedToday: activityVisits.filter((visit) => dateKey(visit.check_in_at) === today).length,
    closedToday: activityVisits.filter(
      (visit) => visit.check_out_at && dateKey(visit.check_out_at) === today,
    ).length,
    overdue,
    currentOccupants,
    overdueOccupants: currentOccupants.filter((occupant) => occupant.isOverdue),
    byLocation: locations.map((location) => ({
      ...location,
      inside: insideByLocation.get(location.id) ?? 0,
    })),
  };
}
