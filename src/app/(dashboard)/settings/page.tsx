import { SettingsContent } from '@/components/settings/settings-content'
import { getAuthenticatedUser } from '@/utils/auth'


export default async function SettingsPage() {
  const user = await getAuthenticatedUser();

  return (
    <div className="min-h-screen bg-dia-canvas">
      <main className="pt-4 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
        <SettingsContent user={user} />
      </main>
    </div>
  )
}
