import Link from "next/link";

import { CheckInOutForm } from "./check-in-out-form";
import { StatusCard } from "./status-card";

type UserHomeProps = {
  active: { locationName: string; checkInAt: string } | null;
  displayName: string | null;
  role: "ADMIN" | "USER";
};

export function UserHome({ active, displayName, role }: UserHomeProps) {
  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
        ITU eAccess
      </p>
      <h1 className="mt-2 text-3xl font-bold">Hai, {displayName}</h1>
      <div className="mt-6">
        <StatusCard visit={active} />
      </div>
      {active ? (
        <CheckInOutForm mode="CHECK_OUT" />
      ) : (
        <p className="mt-6 text-slate-600">
          Imbas QR di pintu bilik untuk merekodkan kemasukan.
        </p>
      )}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Link className="font-semibold text-blue-700" href="/history">
          Lihat sejarah saya →
        </Link>
        {role === "ADMIN" ? (
          <Link
            className="rounded-xl border border-blue-200 px-4 py-3 text-center font-semibold text-blue-700"
            href="/admin"
          >
            Buka Dashboard Admin
          </Link>
        ) : null}
      </div>
    </main>
  );
}
