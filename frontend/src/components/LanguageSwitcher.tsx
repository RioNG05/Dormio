'use client'

import { useLanguage } from '@/context/LanguageContext'
import { Button, Text } from '@/components/ui'

interface LanguageSwitcherProps {
  className?: string
}

export default function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLanguage()

  const toggleLanguage = () => {
    setLocale(locale === 'vi' ? 'en' : 'vi')
  }

  const isVi = locale === 'vi'

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      title={isVi ? 'Switch to English (EN)' : 'Chuyển sang Tiếng Việt (VI)'}
      aria-label={isVi ? 'Switch to English (EN)' : 'Chuyển sang Tiếng Việt (VI)'}
      className={`!h-8 !w-9 !p-0 select-none ${className}`}
    >
      <Text as="span" size="xs" weight="bold" color="inherit">
        {isVi ? 'VI' : 'EN'}
      </Text>
    </Button>
  )
}
