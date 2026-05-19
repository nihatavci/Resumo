'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SecurityForm } from "./security-form"
import { ApiKeysForm } from "./api-keys-form"
import { DangerZone } from "./danger-zone"
import { AiPromptsForm } from "./ai-prompts-form"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
const sections = [
  { id: "security", title: "Security", description: "Manage your email and password settings", icon: "🔒" },
  { id: "api-keys", title: "API Keys", description: "Manage your API keys for different AI providers", icon: "🔑" },
  { id: "ai-prompts", title: "AI Prompts", description: "Customize AI system prompts for different actions", icon: "🤖" },
  { id: "danger-zone", title: "Danger Zone", description: "Irreversible and destructive actions", icon: "⚠️" },
]

interface SettingsContentProps {
  user: { id: string; email: string | null } | null;
}

export function SettingsContent({ user }: SettingsContentProps) {
  const [activeSection, setActiveSection] = useState<string>("security")

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map(section => ({
        id: section.id,
        element: document.getElementById(section.id),
      }))

      const currentSection = sectionElements.find(({ element }) => {
        if (!element) return false
        const rect = element.getBoundingClientRect()
        return rect.top <= 100 && rect.bottom > 100
      })

      if (currentSection) {
        setActiveSection(currentSection.id)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      })
    }
  }

  return (
    <div className="flex gap-8 relative">
      {/* Table of Contents */}
      <div className="w-64 hidden lg:block">
        <div className="sticky top-20 rounded-dia-sm border border-dia-divider bg-white/90 backdrop-blur-[24px] shadow-dia p-4">
          <h3 className="font-light mb-4 text-muted-foreground">On this page</h3>
          <div className="space-y-1">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left font-normal transition-all duration-200 relative pl-8",
                  activeSection === section.id && 
                  "bg-muted text-foreground font-medium",
                  activeSection !== section.id && "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => scrollToSection(section.id)}
              >
                <span className="absolute left-2">{section.icon}</span>
                <span className="truncate">{section.title}</span>
                {activeSection === section.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-foreground rounded-full" />
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-8">
        {/* Security Settings */}
        <Card id="security" className="border-dia-divider shadow-dia bg-white/90 backdrop-blur-[24px] rounded-dia-sm">
          <CardHeader>
            <CardTitle className="text-xl font-light">Security</CardTitle>
            <CardDescription>Manage your email and password settings</CardDescription>
          </CardHeader>
          <CardContent>
            <SecurityForm user={user} />
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card id="api-keys" className="border-dia-divider shadow-dia bg-white/90 backdrop-blur-[24px] rounded-dia-sm">
          <CardHeader>
            <CardTitle className="text-xl font-light">API Keys</CardTitle>
            <CardDescription>Manage your API keys for different AI providers</CardDescription>
          </CardHeader>
          <CardContent>
            <ApiKeysForm />
          </CardContent>
        </Card>

        {/* AI Prompts */}
        <Card id="ai-prompts" className="border-dia-divider shadow-dia bg-white/90 backdrop-blur-[24px] rounded-dia-sm">
          <CardHeader>
            <CardTitle className="text-xl font-light">AI Prompts</CardTitle>
            <CardDescription>Customize AI system prompts for different actions</CardDescription>
          </CardHeader>
          <CardContent>
            <AiPromptsForm />
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card id="danger-zone" className="border-destructive/50 shadow-dia bg-white/90 backdrop-blur-[24px] rounded-dia-sm">
          <CardHeader>
            <CardTitle className="text-xl font-light text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible and destructive actions</CardDescription>
          </CardHeader>
          <CardContent>
            <DangerZone />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
