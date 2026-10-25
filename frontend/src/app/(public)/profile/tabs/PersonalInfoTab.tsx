'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ShieldCheck, Edit3, Save, X, CreditCard } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { Button, Form, Text, TextInput, DateInput, SelectInput } from '@/components/ui'
import { ImageUpload } from '@/components/ImageUpload'
import { userService, UserIdentification } from '@/services/user.service'

function normalizeDateForInput(val?: string | null): string {
  if (!val) return ''
  if (val.includes('T')) return val.split('T')[0]
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
    const [d, m, y] = val.split('/')
    return `${y}-${m}-${d}`
  }
  return val
}

export default function PersonalInfoTab() {
  const t = useTranslations('guest')
  const { user, updateUserProfile } = useAuth()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditingInfo, setIsEditingInfo] = useState(false)

  // Real user identification state
  const [fullName, setFullName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [email, setEmail] = useState(user?.email || '')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [nationality, setNationality] = useState('Việt Nam')
  const [identityCard, setIdentityCard] = useState('')
  const [idIssueDate, setIdIssueDate] = useState('')
  const [idIssuePlace, setIdIssuePlace] = useState('')
  const [address, setAddress] = useState('')

  // Emergency contact
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')

  // CCCD Photos (real URLs from Cloudinary backend)
  const [cardFrontUrl, setCardFrontUrl] = useState('')
  const [cardBackUrl, setCardBackUrl] = useState('')

  // Cache saved data to rollback when user cancels editing
  const [savedData, setSavedData] = useState<{
    fullName: string
    phone: string
    email: string
    dob: string
    gender: 'male' | 'female'
    nationality: string
    identityCard: string
    idIssueDate: string
    idIssuePlace: string
    address: string
    emergencyName: string
    emergencyPhone: string
    cardFrontUrl: string
    cardBackUrl: string
  } | null>(null)

  const applyData = useCallback(
    (idData: UserIdentification | null | undefined, currentUser: typeof user) => {
      let parsedEmergencyName = ''
      let parsedEmergencyPhone = ''

      if (idData?.note) {
        try {
          const parsed = JSON.parse(idData.note)
          parsedEmergencyName = parsed.emergencyName || ''
          parsedEmergencyPhone = parsed.emergencyPhone || ''
        } catch {
          // If plain string, fallback to empty or ignore
        }
      }

      const placeOfOriginStr =
        typeof idData?.placeOfOrigin === 'string'
          ? idData.placeOfOrigin
          : idData?.placeOfOrigin?.address || ''

      const placeOfResidenceStr =
        typeof idData?.placeOfResidence === 'string'
          ? idData.placeOfResidence
          : idData?.placeOfResidence?.address || ''

      const currentFullName = idData?.fullName || currentUser?.name || ''
      const currentPhone = currentUser?.phone || ''
      const currentEmail = currentUser?.email || ''
      const currentDob = normalizeDateForInput(idData?.dateOfBirth)
      const currentGender = (idData?.gender as 'male' | 'female') || 'male'
      const currentNationality = idData?.nationality || 'Việt Nam'
      const currentIdNum = idData?.identityNumber || ''
      const currentIssueDate = normalizeDateForInput(idData?.issueDate)
      const currentIssuePlace = placeOfOriginStr
      const currentAddress = placeOfResidenceStr
      const currentFrontUrl = idData?.cardFrontUrl || ''
      const currentBackUrl = idData?.cardBackUrl || ''

      setFullName(currentFullName)
      setPhone(currentPhone)
      setEmail(currentEmail)
      setDob(currentDob)
      setGender(currentGender)
      setNationality(currentNationality)
      setIdentityCard(currentIdNum)
      setIdIssueDate(currentIssueDate)
      setIdIssuePlace(currentIssuePlace)
      setAddress(currentAddress)
      setEmergencyName(parsedEmergencyName)
      setEmergencyPhone(parsedEmergencyPhone)
      setCardFrontUrl(currentFrontUrl)
      setCardBackUrl(currentBackUrl)

      setSavedData({
        fullName: currentFullName,
        phone: currentPhone,
        email: currentEmail,
        dob: currentDob,
        gender: currentGender,
        nationality: currentNationality,
        identityCard: currentIdNum,
        idIssueDate: currentIssueDate,
        idIssuePlace: currentIssuePlace,
        address: currentAddress,
        emergencyName: parsedEmergencyName,
        emergencyPhone: parsedEmergencyPhone,
        cardFrontUrl: currentFrontUrl,
        cardBackUrl: currentBackUrl,
      })
    },
    [],
  )

  useEffect(() => {
    let isMounted = true

    const fetchIdentification = async () => {
      setIsLoading(true)
      try {
        const res = await userService.getIdentification()
        if (!isMounted) return
        const idData = res?.userIdentification || res?.identification
        applyData(idData, user)
      } catch (err) {
        console.warn('Could not fetch user identification:', err)
        if (isMounted) {
          applyData(null, user)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchIdentification()

    return () => {
      isMounted = false
    }
  }, [user, applyData])

  const genderOptions = [
    { label: t('guestProfileGenderMale'), value: 'male' },
    { label: t('guestProfileGenderFemale'), value: 'female' },
  ]

  const handleCancel = () => {
    if (savedData) {
      setFullName(savedData.fullName)
      setPhone(savedData.phone)
      setEmail(savedData.email)
      setDob(savedData.dob)
      setGender(savedData.gender)
      setNationality(savedData.nationality)
      setIdentityCard(savedData.identityCard)
      setIdIssueDate(savedData.idIssueDate)
      setIdIssuePlace(savedData.idIssuePlace)
      setAddress(savedData.address)
      setEmergencyName(savedData.emergencyName)
      setEmergencyPhone(savedData.emergencyPhone)
      setCardFrontUrl(savedData.cardFrontUrl)
      setCardBackUrl(savedData.cardBackUrl)
    }
    setIsEditingInfo(false)
  }

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedFullName = fullName.trim()
    const trimmedIdCard = identityCard.trim()

    if (!trimmedFullName) {
      toast.error(t('guestDepositIdNameError') || 'Vui lòng nhập họ và tên đầy đủ.')
      return
    }

    if (trimmedIdCard) {
      if (!/^\d{12}$/.test(trimmedIdCard)) {
        toast.error(t('guestDepositIdCccdError') || 'Số CCCD phải gồm đúng 12 chữ số.')
        return
      }

      if (!dob) {
        toast.error(t('guestDepositIdDobError') || 'Vui lòng chọn ngày sinh theo CCCD.')
        return
      }
    }

    setIsSaving(true)
    try {
      if (trimmedIdCard) {
        const emergencyPayload = JSON.stringify({
          emergencyName: emergencyName.trim(),
          emergencyPhone: emergencyPhone.trim(),
        })

        await userService.upsertIdentification({
          identityNumber: trimmedIdCard,
          fullName: trimmedFullName,
          dateOfBirth: dob,
          gender: gender || 'male',
          nationality: nationality.trim() || 'Việt Nam',
          placeOfOrigin: idIssuePlace.trim() || undefined,
          placeOfResidence: address.trim() || undefined,
          issueDate: idIssueDate || undefined,
          cardFrontUrl: cardFrontUrl.trim() || undefined,
          cardBackUrl: cardBackUrl.trim() || undefined,
          note: emergencyPayload,
        })
      }

      // Update Auth context and localStorage
      updateUserProfile({
        name: trimmedFullName,
        phone: phone.trim(),
        email: email.trim(),
      })

      // Update saved data snapshot
      setSavedData({
        fullName: trimmedFullName,
        phone: phone.trim(),
        email: email.trim(),
        dob,
        gender,
        nationality,
        identityCard: trimmedIdCard,
        idIssueDate,
        idIssuePlace: idIssuePlace.trim(),
        address: address.trim(),
        emergencyName: emergencyName.trim(),
        emergencyPhone: emergencyPhone.trim(),
        cardFrontUrl: cardFrontUrl.trim(),
        cardBackUrl: cardBackUrl.trim(),
      })

      setIsEditingInfo(false)
      toast.success(t('guestProfileInfoSuccess'))
    } catch (err: any) {
      console.error('Failed to save user identification:', err)
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể lưu thông tin. Vui lòng kiểm tra lại.'
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-card rounded-3xl p-5 sm:p-8 border border-line shadow-xs space-y-6">
          <div className="h-6 w-48 bg-line/60 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-12 bg-surface rounded-2xl border border-line/50" />
            <div className="h-12 bg-surface rounded-2xl border border-line/50" />
            <div className="h-12 bg-surface rounded-2xl border border-line/50" />
            <div className="h-12 bg-surface rounded-2xl border border-line/50" />
          </div>
          <div className="h-12 bg-surface rounded-2xl border border-line/50" />
        </div>

        <div className="bg-card rounded-3xl p-5 sm:p-8 border border-line shadow-xs space-y-6">
          <div className="h-6 w-56 bg-line/60 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-12 bg-surface rounded-2xl border border-line/50" />
            <div className="h-12 bg-surface rounded-2xl border border-line/50" />
            <div className="h-12 bg-surface rounded-2xl border border-line/50" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="aspect-[16/10] bg-surface rounded-2xl border border-line/50" />
            <div className="aspect-[16/10] bg-surface rounded-2xl border border-line/50" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <Form onSubmit={handleSaveInfo} className="space-y-6 animate-in fade-in duration-300">
      {/* 1. General Profile Info Card */}
      <div className="bg-card rounded-3xl p-5 sm:p-8 border border-line shadow-xs space-y-6">
        <Form.Header
          title={t('guestProfileInfoSectionTitle')}
          description={t('guestProfileInfoSectionSub')}
          actions={
            !isEditingInfo ? (
              <Button
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
                  onClick={handleCancel}
                  disabled={isSaving}
                  leftIcon={<X />}
                >
                  {t('guestProfileBtnCancelShort')}
                </Button>

                <Button
                  type="submit"
                  isLoading={isSaving}
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

          <DateInput
            label={t('guestProfileInfoDobLabel')}
            disabled={!isEditingInfo}
            value={dob}
            onChange={e => setDob(e.target.value)}
            maxDate="today"
            displayFormat="DD/MM/YYYY"
            containerClassName="w-full"
            className="py-3 bg-surface rounded-2xl"
          />

          <SelectInput
            label={t('guestProfileGenderLabel')}
            disabled={!isEditingInfo}
            value={gender}
            onChange={e => setGender(e.target.value as 'male' | 'female')}
            options={genderOptions}
            className="py-3 bg-surface rounded-2xl"
          />

          <TextInput
            label={t('guestProfileInfoAddressLabel')}
            disabled={!isEditingInfo}
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="py-3 bg-surface rounded-2xl"
          />
        </Form.Grid>
      </div>

      {/* 2. Citizen Identification (CCCD / eKYC) Card */}
      <div className="bg-card rounded-3xl p-5 sm:p-8 border border-line shadow-xs space-y-5">
        <Form.Header
          title={t('guestProfileEkycSectionTitle')}
          description={t('guestProfileInfoSectionSub')}
        />

        {isEditingInfo && (
          <Form.Alert variant="warning" message={t('guestProfileEkycNotice')} />
        )}

        <Form.Grid cols={3}>
          <TextInput
            label={t('guestProfileIdCardNumLabel')}
            labelClassName="text-[10px] uppercase text-muted font-bold"
            disabled={!isEditingInfo}
            value={identityCard}
            onChange={e => setIdentityCard(e.target.value)}
            placeholder="001202012345"
            className="bg-surface font-mono font-black"
          />

          <DateInput
            label={t('guestProfileIdCardDateLabel')}
            labelClassName="text-[10px] uppercase text-muted font-bold"
            disabled={!isEditingInfo}
            value={idIssueDate}
            onChange={e => setIdIssueDate(e.target.value)}
            maxDate="today"
            displayFormat="DD/MM/YYYY"
            className="bg-surface font-bold"
          />

          <TextInput
            label={t('guestProfileIdCardPlaceLabel')}
            labelClassName="text-[10px] uppercase text-muted font-bold"
            disabled={!isEditingInfo}
            value={idIssuePlace}
            onChange={e => setIdIssuePlace(e.target.value)}
            placeholder="Cục Cảnh sát QLHC về TTXH"
            className="bg-surface font-bold"
          />
        </Form.Grid>

        {/* CCCD Front and Back Photos */}
        {isEditingInfo ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <ImageUpload
              label={t('guestProfileEkycFront')}
              value={cardFrontUrl}
              onChange={setCardFrontUrl}
              folder="dormio/identifications"
              aspectRatio="card"
              alt={t('guestProfileEkycFront')}
            />
            <ImageUpload
              label={t('guestProfileEkycBack')}
              value={cardBackUrl}
              onChange={setCardBackUrl}
              folder="dormio/identifications"
              aspectRatio="card"
              alt={t('guestProfileEkycBack')}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Front ID Card */}
            <div className="p-4 bg-surface rounded-2xl border border-line space-y-2">
              <div className="flex items-center justify-between">
                <Text as="span" size="xs" weight="extrabold" color="secondary">
                  {t('guestProfileEkycFront')}
                </Text>
                {cardFrontUrl && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-success-soft text-success border border-success-subtle flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    {t('guestProfileEkycAiVerified')}
                  </span>
                )}
              </div>

              {cardFrontUrl ? (
                <div className="aspect-[16/10] bg-surface rounded-xl overflow-hidden relative group border border-line shadow-xs">
                  <img
                    src={cardFrontUrl}
                    alt={t('guestProfileEkycFront')}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 right-2 px-2.5 py-1 bg-success text-white rounded-md text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1 whitespace-nowrap">
                    <ShieldCheck className="w-3 h-3" />
                    {t('guestProfileEkycFaceMatched')}
                  </span>
                </div>
              ) : (
                <div className="aspect-[16/10] bg-surface/50 rounded-xl border border-dashed border-line flex flex-col items-center justify-center p-4 text-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-card border border-line flex items-center justify-center text-muted shadow-xs">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <Text size="xs" weight="bold" color="secondary">
                    {t('guestProfileEkycFront')}
                  </Text>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-warning-soft text-warning border border-warning-subtle">
                    {t('guestProfileEkycNotUploaded')}
                  </span>
                </div>
              )}
            </div>

            {/* Back ID Card */}
            <div className="p-4 bg-surface rounded-2xl border border-line space-y-2">
              <div className="flex items-center justify-between">
                <Text as="span" size="xs" weight="extrabold" color="secondary">
                  {t('guestProfileEkycBack')}
                </Text>
                {cardBackUrl && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-success-soft text-success border border-success-subtle flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    {t('guestProfileEkycAiVerified')}
                  </span>
                )}
              </div>

              {cardBackUrl ? (
                <div className="aspect-[16/10] bg-surface rounded-xl overflow-hidden relative group border border-line shadow-xs">
                  <img
                    src={cardBackUrl}
                    alt={t('guestProfileEkycBack')}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 right-2 px-2.5 py-1 bg-success text-white rounded-md text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1 whitespace-nowrap">
                    <ShieldCheck className="w-3 h-3" />
                    {t('guestProfileEkycFingerprintValid')}
                  </span>
                </div>
              ) : (
                <div className="aspect-[16/10] bg-surface/50 rounded-xl border border-dashed border-line flex flex-col items-center justify-center p-4 text-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-card border border-line flex items-center justify-center text-muted shadow-xs">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <Text size="xs" weight="bold" color="secondary">
                    {t('guestProfileEkycBack')}
                  </Text>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-warning-soft text-warning border border-warning-subtle">
                    {t('guestProfileEkycNotUploaded')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Emergency Contact Card */}
      <div className="bg-card rounded-3xl p-5 sm:p-8 border border-line shadow-xs space-y-5">
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
            placeholder="Nguyễn Văn B (Người thân)"
            className="py-3 bg-surface rounded-2xl"
          />

          <TextInput
            label={t('guestProfileEmergencyPhoneLabel')}
            disabled={!isEditingInfo}
            value={emergencyPhone}
            onChange={e => setEmergencyPhone(e.target.value)}
            placeholder="0912.345.678"
            className="py-3 bg-surface rounded-2xl"
          />
        </Form.Grid>
      </div>

      {/* 4. Bottom Save Action Bar */}
      {isEditingInfo && (
        <Form.Actions>
          <Button
            variant="secondary"
            size="lg"
            onClick={handleCancel}
            disabled={isSaving}
            className="w-full sm:w-auto rounded-2xl"
          >
            {t('guestProfileBtnCancel')}
          </Button>
          <Button
            type="submit"
            size="lg"
            isLoading={isSaving}
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
