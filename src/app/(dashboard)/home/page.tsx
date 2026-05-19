import { redirect } from "next/navigation";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileRow } from "@/components/dashboard/profile-row";
import { WelcomeDialog } from "@/components/dashboard/welcome-dialog";
import { getGreeting } from "@/lib/utils";
import { ApiKeyAlert } from "@/components/dashboard/api-key-alert";
import { type SortOption, type SortDirection } from "@/components/resume/management/resume-sort-controls";
import type { ResumeSummary } from "@/lib/types";
import { ResumesSection } from "@/components/dashboard/resumes-section";
import { getDashboardData } from "@/utils/actions";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const isNewSignup = params?.type === 'signup' && params?.token_hash;

  let data;
  try {
    data = await getDashboardData();
    if (!data.profile) {
      redirect("/");
    }
  } catch {
    redirect("/");
  }

  const { profile, baseResumes: unsortedBaseResumes, tailoredResumes: unsortedTailoredResumes } = data;

  const baseSort = (params.baseSort as SortOption) || 'createdAt';
  const baseDirection = (params.baseDirection as SortDirection) || 'desc';
  const tailoredSort = (params.tailoredSort as SortOption) || 'createdAt';
  const tailoredDirection = (params.tailoredDirection as SortDirection) || 'desc';

  function sortResumes(resumes: ResumeSummary[], sort: SortOption, direction: SortDirection) {
    return [...resumes].sort((a, b) => {
      const modifier = direction === 'asc' ? 1 : -1;
      switch (sort) {
        case 'name':
          return modifier * a.name.localeCompare(b.name);
        case 'jobTitle':
          return modifier * ((a.target_role || '').localeCompare(b.target_role || '') || 0);
        case 'createdAt':
        default:
          return modifier * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      }
    });
  }

  const baseResumes = sortResumes(unsortedBaseResumes, baseSort, baseDirection);
  const tailoredResumes = sortResumes(unsortedTailoredResumes, tailoredSort, tailoredDirection);

  if (!profile) {
    return (
      <main className="min-h-screen p-6 md:p-8 lg:p-10 relative flex items-center justify-center">
        <div className="glass-card max-w-md w-full p-8">
          <div className="text-center space-y-4">
            <User className="w-12 h-12 text-dia-tertiary mx-auto" />
            <h2 className="text-2xl font-light text-foreground">Profile Not Found</h2>
            <p className="text-dia-body text-sm">
              We couldn&apos;t find your profile information.
            </p>
            <Button className="w-full">
              Contact Support
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative sm:pb-12 pb-40">
      <WelcomeDialog isOpen={!!isNewSignup} />

      <div className="relative z-10">
        <ProfileRow profile={profile} />

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="mb-6 space-y-6">
            <ApiKeyAlert />

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-light text-foreground">
                  {getGreeting()}, {profile.first_name}
                </h1>
                <p className="text-sm text-dia-body mt-1">
                  Your resume dashboard
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <ResumesSection
                type="base"
                resumes={baseResumes}
                profile={profile}
                sortParam="baseSort"
                directionParam="baseDirection"
                currentSort={baseSort}
                currentDirection={baseDirection}
              />

              <div className="h-px bg-dia-divider" />

              <ResumesSection
                type="tailored"
                resumes={tailoredResumes}
                profile={profile}
                sortParam="tailoredSort"
                directionParam="tailoredDirection"
                currentSort={tailoredSort}
                currentDirection={tailoredDirection}
                baseResumes={baseResumes}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
