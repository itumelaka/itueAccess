import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProfileAccess = {
  role: "ADMIN" | "USER";
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
};

export function decideProfileRoute(profile: ProfileAccess, adminOnly: boolean) {
  if (profile.status === "PENDING") return "/pending";
  if (profile.status === "SUSPENDED") return "/suspended";
  if (adminOnly && profile.role !== "ADMIN") return "/forbidden";
  return null;
}

export async function requireProfile(requiredRole?: "ADMIN") {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, category, status")
    .eq("id", user.id)
    .single();

  if (error || !profile) redirect("/pending");

  const destination = decideProfileRoute(profile, requiredRole === "ADMIN");
  if (destination) redirect(destination);

  return { user, profile };
}
