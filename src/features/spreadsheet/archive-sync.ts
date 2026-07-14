type ArchiveStatus = "MASUK" | "KELUAR";
type UserCategory = "STAFF" | "PELATIH";
type ArchiveSheetName = "STAFF" | "STUDENT" | "TETAMU";

export type ArchivePayload = {
  sheetName: ArchiveSheetName;
  values: Array<string | number>;
};

export type UserMovementInput = {
  status: ArchiveStatus;
  occurredAt: string;
  email: string;
  displayName: string | null;
  category: UserCategory | null;
  locationName: string;
};

export type GuestMovementInput = {
  status: ArchiveStatus;
  occurredAt: string;
  recorderEmail: string;
  guestName: string | null;
  organization: string | null;
  purpose: string | null;
};

function malaysiaDateParts(isoDate: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date(isoDate));

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    timestamp: `${get("day")}-${get("month")}-${get("year")} ${get("hour")}:${get("minute")}:${get("second")}`,
    year: Number(get("year")),
    month: Number(get("month")),
  };
}

export function archiveUserMovement(input: UserMovementInput): ArchivePayload | null {
  const date = malaysiaDateParts(input.occurredAt);
  const displayName = input.displayName ?? "";

  if (input.category === "STAFF") {
    return {
      sheetName: "STAFF",
      values: [
        date.timestamp,
        input.email,
        "STAFF",
        displayName,
        input.locationName,
        input.status,
      ],
    };
  }

  if (input.category === "PELATIH") {
    return {
      sheetName: "STUDENT",
      values: [
        date.timestamp,
        input.email,
        displayName,
        input.locationName,
        input.status,
        date.year,
        date.month,
        "",
      ],
    };
  }

  return null;
}

export function archiveGuestMovement(input: GuestMovementInput): ArchivePayload {
  const date = malaysiaDateParts(input.occurredAt);

  return {
    sheetName: "TETAMU",
    values: [
      date.timestamp,
      input.recorderEmail,
      input.guestName ?? "",
      input.organization ?? "",
      input.purpose ?? "",
      input.status,
      date.year,
      date.month,
      "",
    ],
  };
}

export async function syncArchivePayload(
  payload: ArchivePayload | null,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; message?: string }> {
  if (!payload) return { ok: false, message: "No archive payload to sync" };

  const url = process.env.SPREADSHEET_ARCHIVE_WEBHOOK_URL;
  const secret = process.env.SPREADSHEET_ARCHIVE_SECRET;

  if (!url || !secret) {
    return {
      ok: false,
      message: "Spreadsheet archive sync is not configured",
    };
  }

  try {
    const response = await fetchImpl(`${url}?secret=${encodeURIComponent(secret)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `Spreadsheet archive sync failed: ${response.status}`,
      };
    }

    const data = await response.json().catch(() => null);
    if (data && data.ok === false) {
      return {
        ok: false,
        message: String(data.error ?? "Spreadsheet archive sync failed"),
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Spreadsheet archive sync failed",
    };
  }
}
