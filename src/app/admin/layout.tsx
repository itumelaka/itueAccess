import { AdminNav } from "@/components/admin/nav";
import { requireProfile } from "@/features/auth/require-profile";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireProfile("ADMIN");
  return <div className="admin-shell"><AdminNav /><div className="admin-content">{children}</div></div>;
}
