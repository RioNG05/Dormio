'use client'

import React from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { Button } from '@/components/ui'

export interface ThemeSwitcherProps {
  className?: string
}

export default function ThemeSwitcher({ className = '' }: ThemeSwitcherProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const tCommon = useTranslations('common')
  const transitionTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
    }
  }, [])

  const handleToggleTheme = () => {
    const root = document.documentElement
    root.classList.add('theme-transitioning')

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current)
    }

    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')

    transitionTimeoutRef.current = setTimeout(() => {
      root.classList.remove('theme-transitioning')
    }, 350)
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleToggleTheme}
      title={tCommon('toggleTheme')}
      aria-label={tCommon('toggleTheme')}
      className={`!h-8 !w-9 !p-0 select-none group relative overflow-hidden border-line hover:border-primary/50 ${className}`}
    >
      <span className="relative flex items-center justify-center w-4 h-4">
        {/* Sun icon shown in Light Mode (Warm Accent Orange #FF6B35) */}
        <Sun className="theme-switcher-icon w-4 h-4 text-accent transition-all duration-300 ease-out rotate-0 scale-100 opacity-100 group-hover:rotate-12 group-hover:scale-110 dark:-rotate-90 dark:scale-0 dark:opacity-0" />
        {/* Moon icon shown in Dark Mode (Brand Primary Teal #2AC1BC) */}
        <Moon className="theme-switcher-icon absolute inset-0 w-4 h-4 text-primary transition-all duration-300 ease-out rotate-90 scale-0 opacity-0 dark:rotate-0 dark:scale-100 dark:opacity-100 dark:group-hover:-rotate-12 dark:group-hover:scale-110" />
      </span>
    </Button>
  )
}

