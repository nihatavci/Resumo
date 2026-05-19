import { redirect } from "next/navigation";
import { getDashboardData } from "@/utils/actions";

export default async function RootPage() {
  let hasProfile = false;
  try {
    const data = await getDashboardData();
    hasProfile = !!data.profile;
  } catch {
    // No profile yet
  }

  if (hasProfile) {
    redirect("/workspace");
  } else {
    redirect("/onboarding");
  }
}
