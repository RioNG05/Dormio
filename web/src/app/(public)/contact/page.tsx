'use client'

import React, { useState } from 'react'
import {
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Send,
  CheckCircle2,
  ExternalLink,
  PhoneCall,
  MoveRight,
  SquareArrowOutUpRight
} from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import {
  Button,
  Form,
  SelectInput,
  Text,
  TextareaInput,
  TextInput,
} from '@/components/ui'

export default function ContactPage() {
  const t = useTranslations('guest')

  const [topic, setTopic] = useState('tu-van')
  const [customSubject, setCustomSubject] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [content, setContent] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !phone || !content) return
    setSubmitted(true)
  }

  return (
    <div className="flex flex-col min-h-screen bg-card animate-in fade-in duration-500 pb-20 overflow-x-hidden">
      {/* 100% Full-Width Screen Hero Banner Header */}
      <section className="relative w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center border-b border-zinc-800">
        <div className="absolute inset-0 bg-linear-to-b from-zinc-950/95 via-zinc-950/85 to-zinc-950/98 backdrop-blur-[2px] z-0" />
        <div className="relative z-10 max-w-4xl mx-auto space-y-4">
          <div>
            <Text
              as="h1"
              weight='extrabold'
              color="white"
              className='text-3xl sm:text-5xl lg:text-6xl leading-[1.18] drop-shadow-md'>
              {t('guestContactTitle1')}
            </Text>{' '}
            <br className="hidden sm:inline" />
            <Text
              as="h1"
              weight='extrabold'
              className="text-3xl sm:text-5xl lg:text-6xl leading-[1.18] drop-shadow-md bg-gradient-to-r from-primary via-[#3BDAC8] via-[#FFAE42] to-accent bg-clip-text text-transparent"
            >
              {t('guestContactTitle2')}
            </Text>
          </div>

          <Text
            variant="subtitle"
            size="xs"
            weight="medium"
            className="sm:text-sm text-zinc-300 leading-relaxed max-w-xl mx-auto text-balance"
          >
            {t('guestContactSubtitle')}
          </Text>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Direct Support Channels */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <Text
                as="span"
                variant="overline"
                size="xs"
                weight="extrabold"
                color="brand"
                className="block"
              >
                {t('guestContactDirectChannels')}
              </Text>
              <Text
                as="h2"
                variant="heading"
                size="2xl"
                weight="black"
                className="sm:text-3xl leading-snug"
              >
                {t('guestContactAlwaysReady')}
              </Text>
              <Text variant="subtitle" size="xs" weight="medium" className="leading-relaxed">
                {t('guestContactHours')}
              </Text>
            </div>

            <div className="space-y-4 pt-2">
              {/* Channel 1: Phone / Zalo */}
              <a
                href="tel:0344265925"
                className="p-5 rounded-3xl bg-surface border border-line flex items-start gap-4 hover:border-accent transition-all group shadow-xs cursor-pointer block"
                title={t('guestContactCallTooltip')}
              >
                <div className="p-3.5 bg-accent/10 text-accent rounded-2xl shrink-0 group-hover:scale-110 transition-transform">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <Text as="h3" variant="heading" size="sm" weight="extrabold">
                    {t('guestContactHotlineTitle')}
                  </Text>
                  <Text
                    variant="body"
                    size="xs"
                    weight="black"
                    color="orange"
                    className="mt-0.5 group-hover:underline"
                  >
                    0344.265.925 {t('guestContact247Support')}
                  </Text>
                  <Text
                    as="span"
                    variant="caption"
                    size="3xs"
                    weight="medium"
                    color="subtle"
                    className="block mt-1"
                  >
                    {t('guestContactHotlineSub')}
                  </Text>
                </div>
              </a>

              {/* Channel 2: Email */}
              <a
                href="mailto:contact@dormio.site"
                className="p-5 rounded-3xl bg-surface border border-line flex items-start gap-4 hover:border-primary transition-all group shadow-xs cursor-pointer block"
                title={t('guestContactEmailTooltip')}
              >
                <div className="p-3.5 bg-primary/10 text-primary rounded-2xl shrink-0 group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <Text as="h3" variant="heading" size="sm" weight="extrabold">
                    {t('guestContactEmailTitle')}
                  </Text>
                  <Text
                    variant="body"
                    size="xs"
                    weight="semibold"
                    className="text-foreground mt-0.5 group-hover:text-primary group-hover:underline"
                  >
                    contact@dormio.site
                  </Text>
                  <Text
                    as="span"
                    variant="caption"
                    size="3xs"
                    weight="medium"
                    color="subtle"
                    className="block mt-1"
                  >
                    {t('guestContactEmailSub')}
                  </Text>
                </div>
              </a>

              {/* Channel 3: Headquarters Address */}
              <div className="p-5 rounded-3xl bg-surface border border-line flex items-start gap-4 hover:border-zinc-400 transition-all group shadow-xs">
                <div className="p-3.5 bg-zinc-900 text-white rounded-2xl shrink-0 group-hover:scale-110 transition-transform">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <Text as="h3" variant="heading" size="sm" weight="extrabold">
                    {t('guestContactOfficeTitle')}
                  </Text>
                  <Text variant="body" size="xs" weight="medium" color="secondary" className="leading-relaxed">
                    {t('guestContactOfficeAddress')}
                  </Text>

                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Ho%C3%A0+L%E1%BA%A1c%2C+Th%E1%BA%A1ch+Th%E1%BA%A5t%2C+H%C3%A0+N%E1%BB%99i"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:underline pt-1"
                  >
                    <Text as="span" size="2xs" weight="bold" color="brand">
                      {t('guestContactMaps')}
                    </Text>
                    <ExternalLink className="w-3 h-3 text-primary" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7 bg-card rounded-3xl p-6 sm:p-8 border border-line shadow-xl space-y-6">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <Text as="h3" variant="heading" size="xl" weight="black">
                  {t('guestContactSuccessTitle')}
                </Text>
                <Text variant="subtitle" size="xs" className="max-w-md mx-auto leading-relaxed">
                  {t('guestContactSuccessDesc', { phone })}
                </Text>
                <Button variant="dark" size="md" onClick={() => setSubmitted(false)}>
                  {t('guestContactSendAnotherBtn')}
                </Button>
              </div>
            ) : (
              <Form onSubmit={handleSubmit}>
                <Form.Header
                  title={t('guestContactFormTitle')}
                  description={t('guestContactFormSubtitle')}
                />

                {/* Topic Selection using SelectInput */}
                <SelectInput
                  label={t('guestContactTopicLabel')}
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  options={[
                    { value: 'tu-van', label: t('guestContactTopicOpt1') },
                    { value: 'bhrp', label: t('guestContactTopicOpt2') },
                    { value: 'ky-thuat', label: t('guestContactTopicOpt3') },
                    { value: 'khac', label: t('guestContactTopicOpt4') },
                  ]}
                  className="py-3 bg-surface rounded-2xl"
                />

                {/* Dynamic input when topic === "khac" using TextInput */}
                {topic === 'khac' && (
                  <TextInput
                    label={t('guestContactCustomSubjectLabel')}
                    placeholder={t('guestContactCustomSubjectPlaceholder')}
                    value={customSubject}
                    onChange={e => setCustomSubject(e.target.value)}
                    containerClassName="animate-in fade-in duration-300"
                    className="py-3 bg-surface rounded-2xl"
                  />
                )}

                <Form.Grid cols={2}>
                  <TextInput
                    label={t('guestContactFullNameLabel')}
                    placeholder={t('guestContactFullNamePlaceholder')}
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="py-3 bg-surface rounded-2xl"
                  />

                  <TextInput
                    label={t('guestContactPhoneLabel')}
                    placeholder={t('guestContactPhonePlaceholder')}
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="py-3 bg-surface rounded-2xl"
                  />
                </Form.Grid>

                <TextareaInput
                  label={t('guestContactContentLabel')}
                  rows={4}
                  placeholder={t('guestContactContentPlaceholder')}
                  required
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="py-3 bg-surface rounded-2xl"
                />

                {/* Solid Brand Teal Action Button using Button */}
                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  rightIcon={<Send />}
                >
                  {t('guestContactSubmitBtn')}
                </Button>
              </Form>
            )}
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="bg-zinc-900 rounded-3xl p-8 sm:p-12 text-white text-center space-y-6 shadow-2xl border border-zinc-800">
          <Text
            as="h2"
            variant="heading"
            size="2xl"
            weight="black"
            color="white"
            className="sm:text-4xl leading-snug"
          >
            {t('guestContactCtaTitle')}
          </Text>
          <Text
            variant="subtitle"
            size="xs"
            weight="medium"
            color="subtle"
            className="sm:text-sm max-w-lg mx-auto"
          >
            {t('guestContactCtaSubtitle')}
          </Text>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Button
              href="/landlord/setup"
              size="lg"
              rightIcon={<SquareArrowOutUpRight />}
              className="w-full sm:w-auto"
            >
              {t('guestContactUseFreeBtn')}
            </Button>
            <Button
              href="/pricing"
              variant="accent"
              size="lg"
              rightIcon={<MoveRight />}
              className="w-full sm:w-auto"
            >
              {t('guestFeaturesViewPricingBtn')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
