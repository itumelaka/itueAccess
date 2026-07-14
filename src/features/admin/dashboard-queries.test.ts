import { describe, expect, it } from "vitest";

import { summarizeDashboard } from "./dashboard-queries";

describe("summarizeDashboard", () => {
  it("separates current occupancy from today's activity", () => {
    const now = new Date("2026-07-14T12:00:00Z");
    const profiles = [
      { id: "staff-1", category: "STAFF" as const },
      { id: "trainee-1", category: "PELATIH" as const },
    ];
    const locations = [
      { id: "loc-1", name: "Bilik Server" },
      { id: "loc-2", name: "Bilik Mesyuarat" },
    ];
    const openVisits = [
      {
        id: "visit-1",
        person_type: "USER" as const,
        profile_id: "staff-1",
        location_id: "loc-1",
        check_in_at: "2026-07-14T08:00:00Z",
        check_out_at: null,
      },
      {
        id: "visit-2",
        person_type: "USER" as const,
        profile_id: "trainee-1",
        location_id: "loc-2",
        check_in_at: "2026-07-13T10:00:00Z",
        check_out_at: null,
      },
      {
        id: "visit-3",
        person_type: "GUEST" as const,
        profile_id: null,
        location_id: "loc-1",
        check_in_at: "2026-07-14T09:00:00Z",
        check_out_at: null,
      },
    ];
    const activityVisits = [
      ...openVisits.filter((visit) => visit.id !== "visit-2"),
      {
        id: "visit-4",
        person_type: "USER" as const,
        profile_id: "staff-1",
        location_id: "loc-1",
        check_in_at: "2026-07-14T07:00:00Z",
        check_out_at: "2026-07-14T08:00:00Z",
      },
    ];

    expect(
      summarizeDashboard({ openVisits, activityVisits, profiles, locations, now }),
    ).toEqual({
      inside: 3,
      staffInside: 1,
      traineeInside: 1,
      guestInside: 1,
      openedToday: 3,
      closedToday: 1,
      overdue: 1,
      byLocation: [
        { id: "loc-1", name: "Bilik Server", inside: 2 },
        { id: "loc-2", name: "Bilik Mesyuarat", inside: 1 },
      ],
    });
  });

  it("keeps active locations visible when they have no occupants", () => {
    const summary = summarizeDashboard({
      openVisits: [],
      activityVisits: [],
      profiles: [],
      locations: [{ id: "loc-1", name: "Bilik Server" }],
      now: new Date("2026-07-14T12:00:00Z"),
    });

    expect(summary.byLocation).toEqual([
      { id: "loc-1", name: "Bilik Server", inside: 0 },
    ]);
  });
});
