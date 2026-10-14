'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Scale,
  ShieldCheck,
  Printer,
  Search,
  ArrowLeft,
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
import { TextInput } from '@/components/ui/TextInput'
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
  const [searchQuery, setSearchQuery] = useState('')

  const currentSections = activeTab === 'terms' ? TERMS_SECTIONS : PRIVACY_SECTIONS

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return currentSections

    return currentSections.filter(sec => {
      const title = t(sec.titleKey).toLowerCase()
      const content = t(sec.contentKey).toLowerCase()
      return title.includes(q) || content.includes(q)
    })
  }, [currentSections, searchQuery, t])

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#2AC1BC]/10 text-[#2AC1BC] text-[10px] font-black rounded-full border border-[#2AC1BC]/30 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 fill-[#2AC1BC]" /> {t('authLegalDecree13Badge')}
          </span>
          <Text variant="caption" color="subtle" size="xs">
            {t('authLegalLastUpdated')}
          </Text>
        </div>

        <Text as="h1" variant="heading" size="2xl" className="text-zinc-900 tracking-tight">
          {activeTab === 'terms' ? t('authLegalTabTerms') : t('authLegalTabPrivacy')}
        </Text>

        <Text variant="body" size="xs" color="subtle" className="leading-relaxed">
          {t('authLegalSubtitle')}
        </Text>
      </div>

      {/* Tab Switcher using Button components */}
      <div className="flex p-1 bg-zinc-100/90 rounded-2xl border border-zinc-200/70 gap-1">
        <Button
          type="button"
          variant={activeTab === 'terms' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('terms')}
          className={`flex-1 rounded-xl text-xs font-extrabold ${
            activeTab === 'terms' ? 'shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
          }`}
          leftIcon={<Scale className="w-3.5 h-3.5" />}
        >
          {t('authLegalTabTerms')}
        </Button>
        <Button
          type="button"
          variant={activeTab === 'privacy' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('privacy')}
          className={`flex-1 rounded-xl text-xs font-extrabold ${
            activeTab === 'privacy' ? 'shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
          }`}
          leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
        >
          {t('authLegalTabPrivacy')}
        </Button>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex items-center gap-2">
        <TextInput
          placeholder={t('authLegalSearchPlaceholder')}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-zinc-400" />}
          className="rounded-xl py-2 text-xs border-zinc-200 focus:border-[#2AC1BC]"
          containerClassName="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePrint}
          leftIcon={<Printer className="w-3.5 h-3.5 text-zinc-500" />}
          className="rounded-xl text-xs font-bold border-zinc-200 text-zinc-700 hover:bg-zinc-50 shrink-0"
        >
          {t('authLegalPrint')}
        </Button>
      </div>

      {/* Dedicated Scrollable Sections Container: Only policy info scrolls, page layout stays fixed */}
      <div className="border border-zinc-200/80 rounded-2xl p-2.5 sm:p-3.5 bg-zinc-50/50 space-y-3 max-h-[46vh] sm:max-h-[50vh] lg:max-h-[52vh] overflow-y-auto custom-scrollbar">
        {filteredSections.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-zinc-200/80 space-y-2">
            <Search className="w-8 h-8 text-zinc-300 mx-auto" />
            <Text variant="body" size="sm" weight="bold" color="secondary">
              Không tìm thấy nội dung phù hợp với từ khóa
            </Text>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="text-xs text-[#2AC1BC]"
            >
              Xóa bộ lọc tìm kiếm
            </Button>
          </div>
        ) : (
          <>
            {filteredSections.map(sec => {
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

            {/* Dedicated DPO Card at bottom of Privacy Policy scrollable list */}
            {activeTab === 'privacy' && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-white border border-emerald-500/20 space-y-2.5 mt-2">
                <div className="flex items-center gap-2 text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-[#2AC1BC]" />
                  <Text as="h4" variant="heading" size="sm">
                    {t('authPrivacySec7Title')}
                  </Text>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>Hotline DPO: 0344 265 925 (24/7)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>Email: privacy@dormio.vn</span>
                  </div>
                  <div className="flex items-start gap-2 sm:col-span-2">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span>Đại học FPT Hà Nội, Khu CNC Hòa Lạc, Thạch Thất, Hà Nội</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Legal Footer Note */}
      <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/70 text-center space-y-2 shrink-0">
        <Text variant="caption" size="2xs" color="subtle" className="leading-relaxed block">
          {t('authLegalAcceptFooter')}
        </Text>
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-0.5">
          <Link href="/register">
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              className="text-xs font-bold rounded-xl"
            >
              {t('authLegalBackToRegister')}
            </Button>
          </Link>
          <Link href="/login">
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="text-xs font-bold rounded-xl"
            >
              {t('authLoginBtn')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
