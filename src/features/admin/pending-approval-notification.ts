import { getCloudflareContext } from "@opennextjs/cloudflare";

export type PendingApprovalNotificationInput = {
  adminUrl: string;
  createdAt: string;
  displayName: string;
  email: string;
};

export type PendingApprovalNotificationPayload = {
  action: "notifyPendingUser";
  adminUrl: string;
  createdAt: string;
  displayName: string;
  email: string;
};

function getNotificationConfig() {
  const processUrl = process.env.SPREADSHEET_ARCHIVE_WEBHOOK_URL;
  const processSecret = process.env.SPREADSHEET_ARCHIVE_SECRET;

  if (processUrl && processSecret) {
    return { url: processUrl, secret: processSecret };
  }

  try {
    const { env } = getCloudflareContext({ async: false });
    const cloudflareEnv = env as Record<string, string | undefined>;
    const url = cloudflareEnv.SPREADSHEET_ARCHIVE_WEBHOOK_URL;
    const secret = cloudflareEnv.SPREADSHEET_ARCHIVE_SECRET;

    if (url && secret) {
      return { url, secret };
    }
  } catch {
    // Outside Cloudflare runtime, process.env is the only config source.
  }

  return { url: processUrl, secret: processSecret };
}

function malaysiaTimestamp(isoDate: string) {
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

  return `${get("day")}-${get("month")}-${get("year")} ${get("hour")}:${get("minute")}:${get("second")}`;
}

export function buildPendingApprovalNotificationPayload(
  input: PendingApprovalNotificationInput,
): PendingApprovalNotificationPayload {
  return {
    action: "notifyPendingUser",
    adminUrl: input.adminUrl,
    createdAt: malaysiaTimestamp(input.createdAt),
    displayName: input.displayName,
    email: input.email,
  };
}

export async function syncPendingApprovalNotification(
  input: PendingApprovalNotificationInput,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; message?: string }> {
  const { url, secret } = getNotificationConfig();

  if (!url || !secret) {
    return {
      ok: false,
      message: "Pending approval notification is not configured",
    };
  }

  const payload = buildPendingApprovalNotificationPayload(input);

  try {
    const response = await fetchImpl(`${url}?secret=${encodeURIComponent(secret)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `Pending approval notification failed: ${response.status}`,
      };
    }

    const data = await response.json().catch(() => null);
    if (data && data.ok === false) {
      return {
        ok: false,
        message: String(data.error ?? "Pending approval notification failed"),
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Pending approval notification failed",
    };
  }
}
