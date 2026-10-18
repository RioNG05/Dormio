'use client'

import React, { useState } from 'react'
import {
  Scale,
  ShieldCheck,
  Printer,
  Lock,
  FileText,
  CreditCard,
  Building2,
  Users,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
} from 'lucide-react'
import { Text } from '@/components/ui/Text'
import { Button } from '@/components/ui/Button'
import { Form } from '@/components/ui/Form'
import { useTranslations } from '@/context/LanguageContext'

interface LegalViewProps {
  initialTab?: 'terms' | 'privacy'
}

interface LegalSection {
  id: string
  titleKey: string
  contentKey: string
  icon: React.ElementType
}

const TERMS_SECTIONS: LegalSection[] = [
  {
    id: 'terms-1',
    titleKey: 'authTermsSec1Title',
    contentKey: 'authTermsSec1Content',
    icon: Scale,
  },
  {
    id: 'terms-2',
    titleKey: 'authTermsSec2Title',
    contentKey: 'authTermsSec2Content',
    icon: Lock,
  },
  {
    id: 'terms-3',
    titleKey: 'authTermsSec3Title',
    contentKey: 'authTermsSec3Content',
    icon: Building2,
  },
  {
    id: 'terms-4',
    titleKey: 'authTermsSec4Title',
    contentKey: 'authTermsSec4Content',
    icon: Users,
  },
  {
    id: 'terms-5',
    titleKey: 'authTermsSec5Title',
    contentKey: 'authTermsSec5Content',
    icon: CreditCard,
  },
  {
    id: 'terms-6',
    titleKey: 'authTermsSec6Title',
    contentKey: 'authTermsSec6Content',
    icon: FileText,
  },
  {
    id: 'terms-7',
    titleKey: 'authTermsSec7Title',
    contentKey: 'authTermsSec7Content',
    icon: AlertCircle,
  },
  {
    id: 'terms-8',
    titleKey: 'authTermsSec8Title',
    contentKey: 'authTermsSec8Content',
    icon: CheckCircle2,
  },
]

const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: 'privacy-1',
    titleKey: 'authPrivacySec1Title',
    contentKey: 'authPrivacySec1Content',
    icon: ShieldCheck,
  },
  {
    id: 'privacy-2',
    titleKey: 'authPrivacySec2Title',
    contentKey: 'authPrivacySec2Content',
    icon: Lock,
  },
  {
    id: 'privacy-3',
    titleKey: 'authPrivacySec3Title',
    contentKey: 'authPrivacySec3Content',
    icon: FileText,
  },
  {
    id: 'privacy-4',
    titleKey: 'authPrivacySec4Title',
    contentKey: 'authPrivacySec4Content',
    icon: Users,
  },
  {
    id: 'privacy-5',
    titleKey: 'authPrivacySec5Title',
    contentKey: 'authPrivacySec5Content',
    icon: CreditCard,
  },
  {
    id: 'privacy-6',
    titleKey: 'authPrivacySec6Title',
    contentKey: 'authPrivacySec6Content',
    icon: CheckCircle2,
  },
  {
    id: 'privacy-7',
    titleKey: 'authPrivacySec7Title',
    contentKey: 'authPrivacySec7Content',
    icon: Phone,
  },
]

export default function LegalView({ initialTab = 'terms' }: LegalViewProps) {
  const t = useTranslations('auth')
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab)

  const currentSections = activeTab === 'terms' ? TERMS_SECTIONS : PRIVACY_SECTIONS

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <Text variant="caption" color="subtle" size="xs">
        {t('authLegalLastUpdated')}
      </Text>

      {/* Tab Switcher using Button components */}
      <div className="flex p-1 bg-zinc-100/90 rounded-2xl border border-zinc-200/70 gap-1">
        <Button
          type="button"
          variant={activeTab === 'terms' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('terms')}
          className="flex-1"
          leftIcon={<Scale  />}
        >
          {t('authLegalTabTerms')}
        </Button>
        <Button
          type="button"
          variant={activeTab === 'privacy' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('privacy')}
          className="flex-1"
          leftIcon={<ShieldCheck  />}
        >
          {t('authLegalTabPrivacy')}
        </Button>
      </div>

      {/* Dedicated Scrollable Sections Container: Only policy info scrolls, page layout stays fixed */}
      <div className="flex-10 border border-zinc-200/80 rounded-2xl p-2.5 sm:p-3.5 bg-zinc-50/50 space-y-3 overflow-y-auto custom-scrollbar">
        {currentSections.map(sec => {
          const Icon = sec.icon
          return (
            <div
              key={sec.id}
              className="p-3.5 sm:p-4 rounded-xl bg-white border border-zinc-200/80 shadow-2xs hover:border-[#2AC1BC]/40 transition-all space-y-1.5"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <Text as="h3" variant="heading" size="sm" className="text-zinc-900">
                  {t(sec.titleKey)}
                </Text>
              </div>
              <Text
                variant="body"
                size="xs"
                color="secondary"
                className="leading-relaxed pl-8.5 text-zinc-600 font-normal"
              >
                {t(sec.contentKey)}
              </Text>
            </div>
          )
        })}

        {/* Dedicated Card at bottom of Privacy Policy scrollable list */}
        {activeTab === 'privacy' && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-white border border-emerald-500/20 space-y-2.5 mt-2">
            <div className="flex items-center gap-2 text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-[#2AC1BC]" />
              <Text as="h4" variant="heading" size="sm">
                {t('authPrivacySec7Title')}
              </Text>
            </div>
            <Form.Grid cols={2} gap="sm" className="text-zinc-600">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <Text as="span" variant="body" size="xs" color="secondary">
                  Hotline: 0344 265 925 (24/7)
                </Text>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <Text as="span" variant="body" size="xs" color="secondary">
                  Email: contact@dormio.site
                </Text>
              </div>
              <div className="flex items-start gap-2 col-span-full">
                <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                <Text as="span" variant="body" size="xs" color="secondary">
                  Hoà Lạc, Thạch Thất, Hà Nội
                </Text>
              </div>
            </Form.Grid>
          </div>
        )}
      </div>

      {/* Legal Footer Note */}
      <Text variant="caption" size="2xs" color="subtle" className="leading-relaxed block">
        {t('authLegalAcceptFooter')}
      </Text>
    </div>
  )
}
