'use client'

import React, { useState } from 'react'
import { ShieldCheck, Edit3, Save, X, Upload } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { Button, Form, Text, TextInput } from '@/components/ui'

export default function PersonalInfoTab() {
  const t = useTranslations('guest')
  const { user } = useAuth()

  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [infoSavedSuccess, setInfoSavedSuccess] = useState(false)

  const [fullName, setFullName] = useState(user?.name || t('guestProfileDefaultFullName'))
  const [phone, setPhone] = useState(user?.phone || '0987.654.321')
  const [email, setEmail] = useState(user?.email || 'nguyenvana@gmail.com')
  const [dob, setDob] = useState('15/08/2002')
  const [identityCard, setIdentityCard] = useState('079202012345')
  const [idIssueDate, setIdIssueDate] = useState('12/04/2023')
  const [idIssuePlace, setIdIssuePlace] = useState(t('guestProfileDefaultIdIssuePlace'))
  const [address, setAddress] = useState(t('guestProfileDefaultAddress'))
  const [cccdEdited, setCccdEdited] = useState(false)

  const [emergencyName, setEmergencyName] = useState(t('guestProfileDefaultEmergencyName'))
  const [emergencyPhone, setEmergencyPhone] = useState('0912.345.678')

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault()
    setIsEditingInfo(false)
    setInfoSavedSuccess(true)
    setTimeout(() => setInfoSavedSuccess(false), 3000)
  }

  return (
    <Form onSubmit={handleSaveInfo} className="space-y-6 animate-in fade-in duration-300">
      {/* Success Toast Banner */}
      {infoSavedSuccess && (
        <Form.Alert
          variant="success"
          message={t('guestProfileInfoSuccess')}
          onClose={() => setInfoSavedSuccess(false)}
        />
      )}

      <div className="bg-card rounded-3xl p-5 sm:p-8 border border-line shadow-sm space-y-6">
        {/* Card Header with Edit Buttons */}
        <Form.Header
          title={t('guestProfileInfoSectionTitle')}
          description={t('guestProfileInfoSectionSub')}
          actions={
            !isEditingInfo ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsEditingInfo(true)}
                leftIcon={<Edit3 />}
                className="w-full sm:w-auto rounded-2xl hover:scale-105"
              >
                {t('guestProfileInfoEditBtn')}
              </Button>
            ) : (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditingInfo(false)}
                  leftIcon={<X />}
                >
                  {t('guestProfileBtnCancelShort')}
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  leftIcon={<Save />}
                  className="hover:scale-105"
                >
                  {t('guestProfileBtnSaveDraft')}
                </Button>
              </div>
            )
          }
        />

        <Form.Grid cols={2}>
          <TextInput
            label={t('guestProfileInfoFullNameLabel')}
            disabled={!isEditingInfo}
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="py-3 bg-surface rounded-2xl"
          />

          <TextInput
            label={t('guestProfileInfoPhoneLabel')}
            disabled={!isEditingInfo}
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="py-3 bg-surface rounded-2xl"
          />

          <TextInput
            label={t('guestProfileInfoEmailLabel')}
            type="email"
            disabled={!isEditingInfo}
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="py-3 bg-surface rounded-2xl"
          />

          <TextInput
            label={t('guestProfileInfoDobLabel')}
            disabled={!isEditingInfo}
            value={dob}
            onChange={e => setDob(e.target.value)}
            className="py-3 bg-surface rounded-2xl"
          />
        </Form.Grid>

        <TextInput
          label={t('guestProfileInfoAddressLabel')}
          disabled={!isEditingInfo}
          value={address}
          onChange={e => setAddress(e.target.value)}
          className="py-3 bg-surface rounded-2xl"
        />
      </div>

      {/* Editable eKYC CCCD Card Box */}
      <div className="bg-card rounded-3xl p-5 sm:p-8 border border-line shadow-sm space-y-5">
        <div className="border-b border-line pb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
            <Text as="h3" variant="heading" size="base" weight="black">
              {t('guestProfileEkycSectionTitle')}
            </Text>
          </div>
          <Text
            as="span"
            variant="badge"
            size="3xs"
            weight="black"
            uppercase
            className={`px-3 py-1 rounded-full whitespace-nowrap ${
              cccdEdited
                ? 'bg-amber-500/10 text-warning border border-amber-500/30'
                : 'bg-primary/10 text-primary border border-primary/30'
            }`}
          >
            {cccdEdited ? t('guestProfileEkycPending') : t('guestProfileEkycAiVerified')}
          </Text>
        </div>

        {/* Warning when editing CCCD */}
        {isEditingInfo && (
          <Form.Alert variant="warning" message={t('guestProfileEkycNotice')} />
        )}

        <Form.Grid cols={3}>
          <TextInput
            label={t('guestProfileIdCardNumLabel')}
            labelClassName="text-[10px] uppercase text-muted"
            disabled={!isEditingInfo}
            value={identityCard}
            onChange={e => {
              setIdentityCard(e.target.value)
              setCccdEdited(true)
            }}
            className="bg-surface font-mono font-black"
          />

          <TextInput
            label={t('guestProfileIdCardDateLabel')}
            labelClassName="text-[10px] uppercase text-muted"
            disabled={!isEditingInfo}
            value={idIssueDate}
            onChange={e => {
              setIdIssueDate(e.target.value)
              setCccdEdited(true)
            }}
            className="bg-surface font-bold"
          />

          <TextInput
            label={t('guestProfileIdCardPlaceLabel')}
            labelClassName="text-[10px] uppercase text-muted"
            disabled={!isEditingInfo}
            value={idIssuePlace}
            onChange={e => {
              setIdIssuePlace(e.target.value)
              setCccdEdited(true)
            }}
            className="bg-surface font-bold"
          />
        </Form.Grid>

        {/* Front and Back Upload Simulation */}
        <Form.Grid cols={2} className="pt-2">
          <div className="p-4 bg-surface rounded-2xl border border-line space-y-2 text-center">
            <div className="flex items-center justify-between">
              <Text as="span" size="xs" weight="extrabold" color="secondary">
                {t('guestProfileEkycFront')}
              </Text>
              {isEditingInfo && (
                <Text
                  as="span"
                  size="3xs"
                  weight="bold"
                  color="brand"
                  className="cursor-pointer hover:underline flex items-center gap-1 whitespace-nowrap"
                >
                  <Upload className="w-3 h-3 shrink-0" />
                  <Text as="span" color="inherit">
                    {t('guestProfileUploadNewPhoto')}
                  </Text>
                </Text>
              )}
            </div>
            <div className="aspect-[16/10] bg-line rounded-xl overflow-hidden relative group border border-line">
              <img
                src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80"
                alt={t('guestProfileEkycFront')}
                className="w-full h-full object-cover"
              />
              <Text
                as="span"
                variant="badge"
                size="3xs"
                weight="black"
                color="white"
                className="absolute bottom-2 right-2 px-2 py-0.5 bg-emerald-500 rounded-md whitespace-nowrap"
              >
                {t('guestProfileEkycFaceMatched')}
              </Text>
            </div>
          </div>

          <div className="p-4 bg-surface rounded-2xl border border-line space-y-2 text-center">
            <div className="flex items-center justify-between">
              <Text as="span" size="xs" weight="extrabold" color="secondary">
                {t('guestProfileEkycBack')}
              </Text>
              {isEditingInfo && (
                <Text
                  as="span"
                  size="3xs"
                  weight="bold"
                  color="brand"
                  className="cursor-pointer hover:underline flex items-center gap-1 whitespace-nowrap"
                >
                  <Upload className="w-3 h-3 shrink-0" />
                  <Text as="span" color="inherit">
                    {t('guestProfileUploadNewPhoto')}
                  </Text>
                </Text>
              )}
            </div>
            <div className="aspect-[16/10] bg-line rounded-xl overflow-hidden relative group border border-line">
              <img
                src="https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80"
                alt={t('guestProfileEkycBack')}
                className="w-full h-full object-cover"
              />
              <Text
                as="span"
                variant="badge"
                size="3xs"
                weight="black"
                color="white"
                className="absolute bottom-2 right-2 px-2 py-0.5 bg-emerald-500 rounded-md whitespace-nowrap"
              >
                {t('guestProfileEkycFingerprintValid')}
              </Text>
            </div>
          </div>
        </Form.Grid>
      </div>

      {/* Editable Emergency Contact */}
      <div className="bg-card rounded-3xl p-5 sm:p-8 border border-line shadow-sm space-y-5">
        <Form.Header
          title={t('guestProfileEmergencySectionTitle')}
          description={t('guestProfileEmergencySectionSub')}
        />

        <Form.Grid cols={2}>
          <TextInput
            label={t('guestProfileEmergencyNameLabel')}
            disabled={!isEditingInfo}
            value={emergencyName}
            onChange={e => setEmergencyName(e.target.value)}
            className="py-3 bg-surface rounded-2xl"
          />

          <TextInput
            label={t('guestProfileEmergencyPhoneLabel')}
            disabled={!isEditingInfo}
            value={emergencyPhone}
            onChange={e => setEmergencyPhone(e.target.value)}
            className="py-3 bg-surface rounded-2xl"
          />
        </Form.Grid>
      </div>

      {/* Bottom Save Action Button when Editing */}
      {isEditingInfo && (
        <Form.Actions>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setIsEditingInfo(false)}
            className="w-full sm:w-auto rounded-2xl"
          >
            {t('guestProfileBtnCancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            leftIcon={<Save />}
            rightIcon={<span>&rarr;</span>}
            className="w-full sm:w-auto rounded-2xl shadow-lg shadow-primary/25 hover:scale-105"
          >
            {t('guestProfileBtnSaveProfile')}
          </Button>
        </Form.Actions>
      )}
    </Form>
  )
}
