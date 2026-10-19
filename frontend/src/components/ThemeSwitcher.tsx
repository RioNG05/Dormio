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

  const handleToggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleToggleTheme}
      title={tCommon('toggleTheme')}
      aria-label={tCommon('toggleTheme')}
      className={`!h-8 !w-9 !p-0 select-none group border-border hover:border-primary/50 ${className}`}
    >
      {/* Sun icon shown in Light Mode (Warm Accent Orange #FF6B35) */}
      <Sun className="w-4 h-4 text-[#FF6B35] transition-transform duration-200 group-hover:rotate-12 group-hover:scale-110 block dark:hidden" />
      {/* Moon icon shown in Dark Mode (Brand Primary Teal #2AC1BC) */}
      <Moon className="w-4 h-4 text-[#2AC1BC] transition-transform duration-200 group-hover:-rotate-12 group-hover:scale-110 hidden dark:block" />
    </Button>
  )
}
