'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'resumo_language'

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'tr', label: 'Türkçe' },
] as const

export type LanguageCode = typeof LANGUAGES[number]['code']

export function getStoredLanguage(): LanguageCode | null {
  if (typeof window === 'undefined') return null
  return (localStorage.getItem(STORAGE_KEY) as LanguageCode) ?? null
}

export function LanguageForm() {
  const [selected, setSelected] = useState<LanguageCode | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSelected(getStoredLanguage())
  }, [])

  function handleSelect(code: LanguageCode) {
    setSelected(code)
    localStorage.setItem(STORAGE_KEY, code)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Set the language the AI assistant and generated CV content will always use — regardless of what language the job description is written in.
      </p>
      <div className="flex flex-wrap gap-2">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleSelect(lang.code)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              selected === lang.code
                ? 'bg-foreground text-background border-foreground'
                : 'bg-white text-foreground/70 border-dia-divider hover:border-foreground/40 hover:text-foreground'
            }`}
          >
            {lang.label}
          </button>
        ))}
        {selected && (
          <button
            onClick={() => {
              setSelected(null)
              localStorage.removeItem(STORAGE_KEY)
            }}
            className="px-4 py-2 rounded-full text-sm text-foreground/40 border border-dashed border-dia-divider hover:text-foreground/70 transition-all"
          >
            Clear
          </button>
        )}
      </div>
      {saved && (
        <p className="text-xs text-emerald-600 font-medium">Saved — AI will now always reply in {LANGUAGES.find(l => l.code === selected)?.label}</p>
      )}
      {!selected && (
        <p className="text-xs text-foreground/40">No preference set — AI will detect language from your CV.</p>
      )}
    </div>
  )
}
