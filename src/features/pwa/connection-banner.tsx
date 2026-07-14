"use client";

import { useSyncExternalStore } from "react";

import { OfflineNotice } from "./offline-notice";

export function ConnectionBanner({ fallbackUrl, initialOnline }: { fallbackUrl: string; initialOnline?: boolean }) {
  const browserOnline = useSyncExternalStore(
    (notify) => {
      window.addEventListener("online", notify);
      window.addEventListener("offline", notify);
      return () => {
        window.removeEventListener("online", notify);
        window.removeEventListener("offline", notify);
      };
    },
    () => window.navigator.onLine,
    () => true,
  );
  const isOnline = initialOnline ?? browserOnline;

  return isOnline ? null : <OfflineNotice fallbackUrl={fallbackUrl} />;
}
