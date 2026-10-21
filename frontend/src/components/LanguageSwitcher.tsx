'use client'

import { useLanguage, useTranslations } from '@/context/LanguageContext'
import { Button, Text } from '@/components/ui'

interface LanguageSwitcherProps {
  className?: string
}

export default function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLanguage()
  const tCommon = useTranslations('common')

  const toggleLanguage = () => {
    setLocale(locale === 'vi' ? 'en' : 'vi')
  }

  const isVi = locale === 'vi'
  const label = isVi ? tCommon('switchToEn') : tCommon('switchToVi')

  return (
    <Button
      variant="ghost"
      size='icon-sm'
      onClick={toggleLanguage}
      title={label}
      aria-label={label}
    >
      <Text as="span" size="xs" weight="bold" color="inherit">
        {isVi ? tCommon('langVi') : tCommon('langEn')}
      </Text>
    </Button>
  )
}
