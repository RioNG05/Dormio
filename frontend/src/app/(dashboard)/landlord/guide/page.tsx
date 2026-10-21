'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Video,
  FileQuestion,
  MessageCircle,
  FileText,
  Zap,
  Users,
  ChevronRight,
  X,
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  Clock,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Text'
import { useTranslations } from '@/context/LanguageContext'

interface GuideStep {
  titleKey: string
  descKey: string
}

interface GuideItem {
  id: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  borderHover: string
  badgeBg: string
  titleKey: string
  descKey: string
  categoryKey: string
  readTimeKey: string
  summaryKey: string
  steps: GuideStep[]
  tipKey: string
  actionBtnKey: string
  actionHref: string
}

const GUIDES: GuideItem[] = [
  {
    id: 'contracts',
    icon: FileText,
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    iconColor: 'text-emerald-600',
    borderHover: 'hover:border-emerald-500',
    badgeBg: 'bg-success-soft text-success',
    titleKey: 'landlordGuideContractsTitle',
    descKey: 'landlordGuideContractsDesc',
    categoryKey: 'landlordGuideContractsCategory',
    readTimeKey: 'landlordGuideContractsReadTime',
    summaryKey: 'landlordGuideContractsSummary',
    steps: [
      {
        titleKey: 'landlordGuideContractsStep1Title',
        descKey: 'landlordGuideContractsStep1Desc',
      },
      {
        titleKey: 'landlordGuideContractsStep2Title',
        descKey: 'landlordGuideContractsStep2Desc',
      },
      {
        titleKey: 'landlordGuideContractsStep3Title',
        descKey: 'landlordGuideContractsStep3Desc',
      },
      {
        titleKey: 'landlordGuideContractsStep4Title',
        descKey: 'landlordGuideContractsStep4Desc',
      },
      {
        titleKey: 'landlordGuideContractsStep5Title',
        descKey: 'landlordGuideContractsStep5Desc',
      },
    ],
    tipKey: 'landlordGuideContractsTip',
    actionBtnKey: 'landlordGuideContractsActionBtn',
    actionHref: '/landlord/contracts',
  },
  {
    id: 'invoices',
    icon: Zap,
    iconBg: 'bg-blue-50 dark:bg-blue-950/40',
    iconColor: 'text-blue-600',
    borderHover: 'hover:border-blue-500',
    badgeBg: 'bg-info-soft text-info',
    titleKey: 'landlordGuideInvoicesTitle',
    descKey: 'landlordGuideInvoicesDesc',
    categoryKey: 'landlordGuideInvoicesCategory',
    readTimeKey: 'landlordGuideInvoicesReadTime',
    summaryKey: 'landlordGuideInvoicesSummary',
    steps: [
      {
        titleKey: 'landlordGuideInvoicesStep1Title',
        descKey: 'landlordGuideInvoicesStep1Desc',
      },
      {
        titleKey: 'landlordGuideInvoicesStep2Title',
        descKey: 'landlordGuideInvoicesStep2Desc',
      },
      {
        titleKey: 'landlordGuideInvoicesStep3Title',
        descKey: 'landlordGuideInvoicesStep3Desc',
      },
      {
        titleKey: 'landlordGuideInvoicesStep4Title',
        descKey: 'landlordGuideInvoicesStep4Desc',
      },
      {
        titleKey: 'landlordGuideInvoicesStep5Title',
        descKey: 'landlordGuideInvoicesStep5Desc',
      },
    ],
    tipKey: 'landlordGuideInvoicesTip',
    actionBtnKey: 'landlordGuideInvoicesActionBtn',
    actionHref: '/landlord/invoices',
  },
  {
    id: 'staff',
    icon: Users,
    iconBg: 'bg-purple-50 dark:bg-purple-950/40',
    iconColor: 'text-purple-600',
    borderHover: 'hover:border-purple-500',
    badgeBg: 'bg-deposit-soft text-deposit',
    titleKey: 'landlordGuideStaffTitle',
    descKey: 'landlordGuideStaffDesc',
    categoryKey: 'landlordGuideStaffCategory',
    readTimeKey: 'landlordGuideStaffReadTime',
    summaryKey: 'landlordGuideStaffSummary',
    steps: [
      {
        titleKey: 'landlordGuideStaffStep1Title',
        descKey: 'landlordGuideStaffStep1Desc',
      },
      {
        titleKey: 'landlordGuideStaffStep2Title',
        descKey: 'landlordGuideStaffStep2Desc',
      },
      {
        titleKey: 'landlordGuideStaffStep3Title',
        descKey: 'landlordGuideStaffStep3Desc',
      },
      {
        titleKey: 'landlordGuideStaffStep4Title',
        descKey: 'landlordGuideStaffStep4Desc',
      },
      {
        titleKey: 'landlordGuideStaffStep5Title',
        descKey: 'landlordGuideStaffStep5Desc',
      },
    ],
    tipKey: 'landlordGuideStaffTip',
    actionBtnKey: 'landlordGuideStaffActionBtn',
    actionHref: '/landlord/staff',
  },
]

export default function GuidePage() {
  const t = useTranslations('landlord')
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null)

  const selectedGuide = GUIDES.find(g => g.id === selectedGuideId) || null
  const currentGuideIndex = GUIDES.findIndex(g => g.id === selectedGuideId)

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedGuideId(null)
      }
    }
    if (selectedGuideId) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedGuideId])

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Title & Subtitle */}
      <div>
        <Text as="h1" variant="heading" size="2xl">
          {t('landlordOperationsGuideTitle')}
        </Text>
        <Text variant="body" size="sm" color="subtle" className="mt-1">
          {t('landlordOperationsGuideSubtitle')}
        </Text>
      </div>

      {/* Top Resource Cards - Cards 2, 3, 4 are hidden per user requirement (preserved in code) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card p-6 border border-line rounded-2xl shadow-2xs hover:border-primary/60 transition-all cursor-pointer group flex items-start gap-4 col-span-1 md:col-span-2 lg:col-span-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <Text
              as="h3"
              variant="heading"
              size="base"
              className="group-hover:text-primary transition-colors"
            >
              {t('landlordOperationsDocGuide')}
            </Text>
            <Text variant="body" size="sm" color="subtle" className="mt-1">
              {t('landlordOperationsDocGuideDesc')}
            </Text>
          </div>
        </div>

        {/* Video hướng dẫn - Hidden per requirement (do not delete) */}
        <div className="hidden bg-card p-6 border border-line rounded-xl shadow-xs hover:border-accent transition-colors cursor-pointer group">
          <Video className="w-8 h-8 text-accent mb-4 group-hover:scale-110 transition-transform" />
          <Text as="h3" variant="heading" size="sm" className="mb-2">
            {t('landlordOperationsVideoGuide')}
          </Text>
          <Text variant="body" size="sm" color="subtle">
            {t('landlordOperationsVideoGuideDesc')}
          </Text>
        </div>

        {/* Câu hỏi thường gặp - Hidden per requirement (do not delete) */}
        <div className="hidden bg-card p-6 border border-line rounded-xl shadow-xs hover:border-blue-500 transition-colors cursor-pointer group">
          <FileQuestion className="w-8 h-8 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
          <Text as="h3" variant="heading" size="sm" className="mb-2">
            {t('landlordOperationsFaq')}
          </Text>
          <Text variant="body" size="sm" color="subtle">
            {t('landlordOperationsFaqDesc')}
          </Text>
        </div>

        {/* Chat với CSKH - Hidden per requirement (do not delete) */}
        <div className="hidden bg-card p-6 border border-line rounded-xl shadow-xs hover:border-green-500 transition-colors cursor-pointer group">
          <MessageCircle className="w-8 h-8 text-green-500 mb-4 group-hover:scale-110 transition-transform" />
          <Text as="h3" variant="heading" size="sm" className="mb-2">
            {t('landlordOperationsChatSupport')}
          </Text>
          <Text variant="body" size="sm" color="subtle">
            {t('landlordOperationsChatSupportDesc')}
          </Text>
        </div>
      </div>

      {/* Featured Articles Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Text as="h2" variant="heading" size="lg">
            {t('landlordOperationsFeaturedArticles')}
          </Text>
          <span className="px-2.5 py-1 rounded-full bg-card-hover text-muted text-xs font-bold">
            {t('landlordGuideArticlesCount', { count: GUIDES.length })}
          </span>
        </div>

        {/* Guide Cards */}
        <div className="grid grid-cols-1 gap-4">
          {GUIDES.map(guide => {
            const Icon = guide.icon
            return (
              <div
                key={guide.id}
                onClick={() => setSelectedGuideId(guide.id)}
                className={`p-5 sm:p-6 bg-card border border-line rounded-2xl shadow-2xs ${guide.borderHover} hover:shadow-md transition-all cursor-pointer group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-2xl ${guide.iconBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                  >
                    <Icon className={`w-6 h-6 ${guide.iconColor}`} />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${guide.badgeBg}`}
                      >
                        {t(guide.categoryKey)}
                      </span>
                      <span className="text-muted text-xs flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        {t(guide.readTimeKey)}
                      </span>
                    </div>
                    <Text
                      as="h4"
                      variant="heading"
                      size="base"
                      className="group-hover:text-primary transition-colors"
                    >
                      {t(guide.titleKey)}
                    </Text>
                    <Text variant="body" size="sm" color="subtle" className="line-clamp-2">
                      {t(guide.descKey)}
                    </Text>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform self-end sm:self-center shrink-0">
                  <span>{t('landlordGuideReadNow')}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Guide Detail Modal Popup */}
      {selectedGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedGuideId(null)}
        >
          <div
            className="bg-card rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-line animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-line flex items-center justify-between gap-4 bg-surface/50 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selectedGuide.iconBg}`}
                >
                  <selectedGuide.icon className={`w-5 h-5 ${selectedGuide.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${selectedGuide.badgeBg}`}
                    >
                      {t(selectedGuide.categoryKey)}
                    </span>
                    <span className="text-muted text-xs flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" />
                      {t(selectedGuide.readTimeKey)}
                    </span>
                  </div>
                  <Text as="h3" variant="heading" size="lg" className="truncate">
                    {t(selectedGuide.titleKey)}
                  </Text>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSelectedGuideId(null)}
                className="shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
              {/* Summary Box */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <Text variant="body" className="text-foreground font-medium leading-relaxed">
                  {t(selectedGuide.summaryKey)}
                </Text>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="space-y-4">
                <Text as="h4" variant="heading" size="base">
                  {t('landlordGuideStepsTitle')}
                </Text>
                <div className="space-y-3">
                  {selectedGuide.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-surface border border-line hover:border-line transition-colors flex items-start gap-3.5"
                    >
                      <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Text
                          variant="body"
                          weight="bold"
                          color="default"
                          className="text-foreground"
                        >
                          {t(step.titleKey)}
                        </Text>
                        <Text
                          variant="body"
                          size="sm"
                          color="secondary"
                          className="mt-1 text-muted leading-relaxed"
                        >
                          {t(step.descKey)}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tip / Notice Callout Box */}
              <div className="p-4 rounded-xl bg-warning-soft border border-warning-subtle flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <Text
                    variant="body"
                    size="xs"
                    weight="black"
                    color="orange"
                    uppercase
                    className="tracking-wider"
                  >
                    {t('landlordGuideImportantTip')}
                  </Text>
                  <Text
                    variant="body"
                    size="sm"
                    className="text-warning font-medium mt-0.5 leading-relaxed"
                  >
                    {t(selectedGuide.tipKey)}
                  </Text>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-line bg-surface/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                {currentGuideIndex > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                    onClick={() => setSelectedGuideId(GUIDES[currentGuideIndex - 1].id)}
                  >
                    {t('landlordGuideModalPrev')}
                  </Button>
                )}
                {currentGuideIndex < GUIDES.length - 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    onClick={() => setSelectedGuideId(GUIDES[currentGuideIndex + 1].id)}
                  >
                    {t('landlordGuideModalNext')}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedGuideId(null)}
                >
                  {t('landlordGuideModalClose')}
                </Button>
                <Link href={selectedGuide.actionHref}>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    {t(selectedGuide.actionBtnKey)}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
