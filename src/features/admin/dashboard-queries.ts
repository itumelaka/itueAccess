type PersonType = "USER" | "GUEST";
type UserCategory = "STAFF" | "PELATIH" | null;

export type DashboardVisit = {
  id: string;
  person_type: PersonType;
  profile_id: string | null;
  location_id: string;
  check_in_at: string;
  check_out_at: string | null;
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
    if (hoursInside > overdueHours) overdue += 1;
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
    byLocation: locations.map((location) => ({
      ...location,
      inside: insideByLocation.get(location.id) ?? 0,
    })),
  };
}
