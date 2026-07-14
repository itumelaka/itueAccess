import type { Metadata } from "next";

import { InstallCard } from "@/features/pwa/install-card";

export const metadata: Metadata = { title: "Pasang aplikasi | ITU eAccess" };

export default function InstallPage() {
  return <main className="install-page"><InstallCard /></main>;
}
