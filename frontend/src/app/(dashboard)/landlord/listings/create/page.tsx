'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams, redirect } from 'next/navigation'
import { FEATURE_FLAGS } from '@/config/features'
import {
  Check,
  ChevronLeft,
  UploadCloud,
  ImageIcon,
  Plus,
  Trash2,
  Sparkles,
  AlertCircle,
  Building2,
  Coins,
  ShieldCheck,
  Loader2,
  X,
  Wand2,
  Tag,
  Compass,
  DollarSign,
  Layers,
  HelpCircle,
} from 'lucide-react'
import Link from 'next/link'
import { postService, PostQuotaStatus, AiPostDraftResponse } from '@/services/post.service'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { getRooms, type RoomItem } from '@/services/room.service'
import { getMyBoardingHouses } from '@/services/boarding-house.service'
import { formatCurrency } from '@/utils'
import { Button, TextInput, NumberInput, SelectInput, TextareaInput } from '@/components/ui'

function CreateListingForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { buildings: authBuildings, activeBuildingId } = useAuth()
  const t = useTranslations('landlord')

  const queryRoomId = searchParams.get('roomId')
  const queryAiDraft = searchParams.get('aiDraft')

  // Form states (Zero mockups)
  const [title, setTitle] = useState('')
  const [roomId, setRoomId] = useState(queryRoomId || '')
  const [depositAmount, setDepositAmount] = useState<number | string>(3000000)
  const [content, setContent] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [newImageUrl, setNewImageUrl] = useState('')

  // Boarding House & Rooms states
  const [landlordBuildings, setLandlordBuildings] = useState<any[]>(authBuildings || [])
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('')
  const [rooms, setRooms] = useState<RoomItem[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(false)

  // UI / Logic states
  const [isDirty, setIsDirty] = useState(false)
  const [isConfirmCloseModalOpen, setIsConfirmCloseModalOpen] = useState(false)
  const [quota, setQuota] = useState<PostQuotaStatus | null>(null)
  const [isLoadingQuota, setIsLoadingQuota] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  // AI Rental Post Suggestions State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [aiTone, setAiTone] = useState<'professional' | 'youthful' | 'budget'>('professional')
  const [aiCustomNotes, setAiCustomNotes] = useState('')
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [aiDraftResult, setAiDraftResult] = useState<AiPostDraftResponse | null>(null)
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null)

  // Load quota status on mount
  useEffect(() => {
    async function fetchQuota() {
      try {
        setIsLoadingQuota(true)
        const data = await postService.getQuota()
        setQuota(data)
      } catch (err: any) {
        console.warn('Could not fetch quota from server, using default quota display:', err)
        setQuota({
          isLandlord: true,
          planName: 'free',
          baseDailyQuota: 3,
          bonusDailyQuota: 0,
          dailyPostQuota: 3,
          freePostsUsedToday: 0,
          freePostsRemainingToday: 3,
          purchasedCreditsAvailable: 0,
          canPublish: true,
        })
      } finally {
        setIsLoadingQuota(false)
      }
    }
    fetchQuota()
  }, [])

  // Sync landlord boarding houses
  useEffect(() => {
    if (authBuildings && authBuildings.length > 0) {
      setLandlordBuildings(authBuildings)
      if (!selectedBuildingId) {
        setSelectedBuildingId(activeBuildingId || authBuildings[0].id)
      }
    } else {
      getMyBoardingHouses({ silent: true })
        .then(data => {
          if (data && data.length > 0) {
            setLandlordBuildings(data)
            if (!selectedBuildingId) {
              setSelectedBuildingId(activeBuildingId || data[0].id)
            }
          }
        })
        .catch(err => {
          console.warn('Could not load boarding houses:', err)
        })
    }
  }, [authBuildings, activeBuildingId, selectedBuildingId])

  // Fetch real rooms of selected boarding house from backend API
  useEffect(() => {
    if (!selectedBuildingId) {
      setRooms([])
      return
    }

    let isMounted = true
    setIsLoadingRooms(true)

    getRooms(selectedBuildingId, { limit: 100 })
      .then(res => {
        if (!isMounted) return
        const fetchedRooms = res?.data || []
        setRooms(fetchedRooms)

        // If queryRoomId matches a room, pre-select it
        if (queryRoomId && fetchedRooms.some(r => r.id === queryRoomId)) {
          setRoomId(queryRoomId)
          if (queryAiDraft === 'true') {
            setIsAiModalOpen(true)
          }
        }
      })
      .catch(err => {
        console.warn('Failed to fetch rooms for house:', err)
        if (isMounted) {
          setRooms([])
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingRooms(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [selectedBuildingId, queryRoomId, queryAiDraft])

  const handleBuildingChange = (bId: string) => {
    setSelectedBuildingId(bId)
    setRoomId('')
    setIsDirty(true)
  }

  const handleRoomChange = (rId: string) => {
    setRoomId(rId)
    setIsDirty(true)
    setErrorMessage(null)

    // Smart pre-fill: if user selects a room and title is empty
    if (rId) {
      const room = rooms.find(r => r.id === rId)
      const house = landlordBuildings.find(b => b.id === selectedBuildingId)
      if (
        room &&
        (!title.trim() || title.startsWith('Cho thuê phòng') || title.startsWith('Rent room'))
      ) {
        const defaultHouseName = house?.name || t('landlordListingsCreateAiDefaultProperty')
        setTitle(`${t('landlordListingsCreateRoomPrefix')} ${room.roomNumber} - ${defaultHouseName}`)
      }
    }
  }

  const selectedRoom = rooms.find(r => r.id === roomId)

  const handleFieldChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
    setter(value)
    setIsDirty(true)
    setErrorMessage(null)
  }

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return
    setImageUrls([...imageUrls, newImageUrl.trim()])
    setNewImageUrl('')
    setIsDirty(true)
  }

  const handleRemoveImage = (indexToRemove: number) => {
    setImageUrls(imageUrls.filter((_, idx) => idx !== indexToRemove))
    setIsDirty(true)
  }

  const handleCancelClick = () => {
    if (isDirty) {
      setIsConfirmCloseModalOpen(true)
    } else {
      router.push('/landlord/listings')
    }
  }

  // AI Post Draft Generation
  const handleOpenAiModal = () => {
    if (!roomId) {
      setErrorMessage(t('landlordListingsCreateErrSelectRoomAi'))
      return
    }
    setAiErrorMessage(null)
    setIsAiModalOpen(true)
  }

  const handleGenerateAi = async () => {
    if (!roomId) {
      setAiErrorMessage(t('landlordListingsCreateErrSelectRoomAiExtract'))
      return
    }

    try {
      setIsGeneratingAi(true)
      setAiErrorMessage(null)
      const draft = await postService.generateAiDraft({
        roomId,
        tone: aiTone,
        customNotes: aiCustomNotes.trim() || undefined,
      })
      setAiDraftResult(draft)
    } catch (err: any) {
      setAiErrorMessage(err?.message || t('landlordListingsCreateErrAiInit'))
    } finally {
      setIsGeneratingAi(false)
    }
  }

  const handleApplyAiDraft = () => {
    if (!aiDraftResult) return

    setTitle(aiDraftResult.title)
    setContent(aiDraftResult.content)
    setDepositAmount(aiDraftResult.depositAmount)

    if (aiDraftResult.imageUrls && aiDraftResult.imageUrls.length > 0) {
      const merged = Array.from(new Set([...imageUrls, ...aiDraftResult.imageUrls]))
      setImageUrls(merged)
    }

    setIsDirty(true)
    setIsAiModalOpen(false)
    setSuccessToast(t('landlordListingsCreateToastAiApplied'))
    setTimeout(() => setSuccessToast(null), 3000)
  }

  const handleSubmit = async (publishStatus: 'posted' | 'draft') => {
    if (isSubmitting) return

    if (!title.trim()) {
      setErrorMessage(t('landlordListingsCreateErrTitleMin'))
      return
    }
    if (title.trim().length < 5) {
      setErrorMessage(t('landlordListingsCreateErrTitleMin'))
      return
    }
    if (!content.trim() || content.trim().length < 10) {
      setErrorMessage(t('landlordListingsCreateErrContentMin'))
      return
    }
    if (Number(depositAmount) < 0 || isNaN(Number(depositAmount))) {
      setErrorMessage(t('landlordListingsCreateErrDepositInvalid'))
      return
    }

    if (
      publishStatus === 'posted' &&
      quota &&
      quota.freePostsRemainingToday <= 0 &&
      quota.purchasedCreditsAvailable <= 0
    ) {
      setErrorMessage(t('landlordListingsCreateErrQuotaExceeded'))
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage(null)

      await postService.createPost({
        title: title.trim(),
        content: content.trim(),
        depositAmount: Number(depositAmount),
        roomId: roomId.trim() || undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        status: publishStatus,
      })

      // Refresh quota in background
      postService
        .getQuota()
        .then(setQuota)
        .catch(() => {})

      setSuccessToast(
        publishStatus === 'posted'
          ? t('landlordListingsCreateToastSuccess')
          : t('landlordListingsCreateToastDraftSuccess'),
      )

      setIsDirty(false)
      setTimeout(() => {
        router.push('/landlord/listings')
      }, 1200)
    } catch (err: any) {
      setErrorMessage(err.message || t('landlordListingsCreateToastError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between bg-card p-6 rounded-3xl border border-line shadow-sm">
        <div className="flex items-center gap-4">
          <Button rounded="full"
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancelClick}
            title={t('landlordListingsCreateBackBtn')}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              {t('landlordListingsCreatePageTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-0.5">
              {t('landlordListingsCreatePageSubtitle')}
            </p>
          </div>
        </div>

        {/* Quota Badge */}
        {!isLoadingQuota && quota && (
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-[#FF6B35]/10 to-[#2ac1bc]/10 border border-[#FF6B35]/20 rounded-2xl">
            <Coins className="w-5 h-5 text-[#FF6B35]" />
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase text-muted tracking-wider">
                {t('landlordListingsCreateQuotaLabel')}
              </div>
              <div className="text-xs font-black text-foreground">
                {quota.freePostsRemainingToday > 0 ? (
                  <span className="text-[#2ac1bc]">
                    {t('landlordListingsCreateFreePostsRemaining', {
                      remaining: quota.freePostsRemainingToday,
                      total: quota.dailyPostQuota,
                    })}
                  </span>
                ) : quota.purchasedCreditsAvailable > 0 ? (
                  <span className="text-[#FF6B35]">
                    {t('landlordListingsCreatePaidCreditsRemaining', {
                      count: quota.purchasedCreditsAvailable,
                    })}
                  </span>
                ) : (
                  <span className="text-rose-500">{t('landlordListingsCreateOutOfQuota')}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-4 bg-success-soft border border-success-subtle text-success rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-bold">{successToast}</span>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-danger-soft border border-danger-subtle text-danger rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="text-sm font-bold">{errorMessage}</span>
        </div>
      )}

      {/* Main Form */}
      <div className="bg-card p-8 rounded-3xl border border-line shadow-sm space-y-8">
        {/* 1. Basic Info */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-line pb-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#FF6B35] text-white text-xs font-black">
              1
            </span>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              {t('landlordListingsCreateBasicInfo')}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <TextInput
              label={t('landlordListingsCreateTitleLabel')}
              required
              value={title}
              onChange={e => handleFieldChange(setTitle, e.target.value)}
              placeholder={t('landlordListingsCreateTitlePh')}
              helperText={t('landlordListingsCreateTitleHelp')}
            />

            <div className="space-y-6">
              {/* Boarding House and Linked Room selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-surface/70 rounded-2xl border border-line">
                {/* Select Boarding House */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground/90 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#2AC1BC]" />
                    {t('landlordListingsCreateBuildingLabel')}
                  </label>

                  {landlordBuildings.length === 0 ? (
                    <div className="p-3 bg-warning-soft border border-warning-subtle rounded-xl text-xs text-warning">
                      {t('landlordListingsCreateNoBuildings')}{' '}
                      <Link href="/landlord/setup" className="underline font-bold">
                        {t('landlordListingsCreateCreateBuilding')}
                      </Link>
                    </div>
                  ) : (
                    <SelectInput
                      value={selectedBuildingId}
                      onChange={e => handleBuildingChange(e.target.value)}
                      options={landlordBuildings.map(b => ({
                        value: b.id,
                        label: `${b.name} ${b.address ? `(${b.address})` : ''}`,
                      }))}
                    />
                  )}
                  <span className="text-xs text-muted">
                    {t('landlordListingsCreateBuildingHelp')}
                  </span>
                </div>

                {/* Select Room */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-foreground/90">
                      {t('landlordListingsCreateLinkedRoom')}
                    </label>
                    {isLoadingRooms && (
                      <span className="text-xs text-[#2AC1BC] flex items-center gap-1 font-semibold">
                        <Loader2 className="w-3 h-3 animate-spin" />{' '}
                        {t('landlordListingsCreateLoadingRooms')}
                      </span>
                    )}
                  </div>

                  <SelectInput
                    value={roomId}
                    onChange={e => handleRoomChange(e.target.value)}
                    disabled={isLoadingRooms || !selectedBuildingId}
                    options={[
                      { value: '', label: `-- ${t('landlordListingsCreateRoomGeneric')} --` },
                      ...rooms.map(room => {
                        const typeName =
                          room.roomType?.name || t('landlordListingsCreateRoomStandard')
                        const areaStr = room.area ? ` • ${room.area}m²` : ''
                        const statusMap: Record<string, string> = {
                          available: t('landlordListingsCreateRoomStatusAvailable'),
                          deposited: t('landlordListingsCreateRoomStatusDeposited'),
                          occupied: t('landlordListingsCreateRoomStatusOccupied'),
                          maintainace: t('landlordListingsCreateRoomStatusMaintenance'),
                        }
                        const statusLabel = statusMap[room.status] || room.status

                        return {
                          value: room.id,
                          label: `${t('landlordListingsCreateRoomPrefix')} ${room.roomNumber} (${t('landlordListingsCreateFloorPrefix')} ${room.floor}) - ${typeName}${areaStr} [${statusLabel}]`,
                        }
                      }),
                    ]}
                  />

                  {rooms.length === 0 && !isLoadingRooms && selectedBuildingId && (
                    <span className="text-xs text-amber-600 block">
                      {t('landlordListingsCreateBuildingNoRooms')}{' '}
                      <Link href="/landlord/rooms" className="underline font-bold">
                        {t('landlordListingsCreateAddRoomNow')}
                      </Link>
                    </span>
                  )}

                  {selectedRoom && (
                    <div className="p-3 bg-card border border-line rounded-xl text-xs space-y-1 mt-2 shadow-xs animate-in fade-in duration-200">
                      <div className="flex justify-between font-bold text-foreground">
                        <span>
                          {t('landlordListingsCreateRoomPrefix')} {selectedRoom.roomNumber}
                        </span>
                        <span className="text-[#2AC1BC] font-extrabold">
                          {selectedRoom.roomType?.name || t('landlordListingsCreateRoomStandard')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted text-[11px]">
                        <span>
                          {t('landlordListingsCreateFloorPrefix')}: {selectedRoom.floor}
                        </span>
                        {selectedRoom.area && (
                          <span>
                            {t('landlordListingsCreateAreaPrefix')}: {selectedRoom.area} m²
                          </span>
                        )}
                        {selectedRoom.maxOccupants && (
                          <span>
                            {t('landlordListingsCreateCapacityPrefix')}: {selectedRoom.maxOccupants}{' '}
                            {t('landlordListingsCreatePeopleUnit')}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <span className="text-xs text-muted block">
                    {t('landlordListingsCreateLinkedRoomHelp')}
                  </span>
                </div>
              </div>

              {/* Deposit Amount */}
              <NumberInput
                label={t('landlordListingsCreateDepositLabel')}
                required
                min={0}
                step={100000}
                value={depositAmount}
                onChange={e => handleFieldChange(setDepositAmount, e.target.value)}
                placeholder="VD: 3500000"
                helperText={t('landlordListingsCreateDepositHelp')}
              />
            </div>
          </div>
        </div>

        {/* 2. Detailed Description with AI Assistant */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#FF6B35] text-white text-xs font-black">
                2
              </span>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                {t('landlordListingsCreateDescriptionSection')}
              </h3>
            </div>

            {/* AI Suggestion Trigger Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenAiModal}
              className="from-teal-600 to-[#2AC1BC] hover:opacity-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{t('landlordListingsCreateAiSuggestBtn')}</span>
            </Button>
          </div>

          <TextareaInput
            label={t('landlordListingsCreateContentLabel')}
            required
            rows={9}
            value={content}
            onChange={e => handleFieldChange(setContent, e.target.value)}
            placeholder={t('landlordListingsCreateContentPh')}
            helperText={t('landlordListingsCreateContentHelp')}
            className="resize-none leading-relaxed"
          />
        </div>

        {/* 3. Images */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-line pb-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#FF6B35] text-white text-xs font-black">
              3
            </span>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              {t('landlordListingsCreateGalleryLabel')}
            </h3>
          </div>

          {/* Add Image by URL */}
          <div className="flex gap-2 items-center">
            <TextInput
              type="url"
              value={newImageUrl}
              onChange={e => setNewImageUrl(e.target.value)}
              placeholder={t('landlordListingsCreateAddImagePh')}
              containerClassName="flex-1 space-y-0"
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleAddImage}
            >
              <Plus className="w-4 h-4" /> {t('landlordListingsCreateAddImageBtn')}
            </Button>
          </div>

          {/* Image Previews */}
          {imageUrls.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {imageUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-2xl overflow-hidden border border-line aspect-video bg-card-hover shadow-sm"
                >
                  <img
                    src={url}
                    alt={`Listing preview ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => {
                      ;(e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button rounded="full"
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveImage(idx)}
                      title={t('landlordListingsCreateDeleteImage')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 border-2 border-dashed border-line rounded-2xl text-center space-y-2">
              <ImageIcon className="w-8 h-8 text-zinc-300 mx-auto" />
              <p className="text-xs font-semibold text-muted">
                {t('landlordListingsCreateNoImages')}
              </p>
              <p className="text-[11px] text-muted">{t('landlordListingsCreateNoImagesHelp')}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-line">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancelClick}
            disabled={isSubmitting}
          >
            {t('landlordListingsCreateCancelBtn')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSubmit('draft')}
            disabled={isSubmitting}
          >
            {t('landlordListingsCreateSaveDraftBtn')}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => handleSubmit('posted')}
            disabled={isSubmitting}
            className="from-[#FF6B35] to-orange-600 hover:opacity-95"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('landlordListingsCreateSubmitting')}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{t('landlordListingsCreatePublishBtn')}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* AI RENTAL POST DRAFT ASSISTANT MODAL */}
      {/* ========================================================================= */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-line animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-line flex items-center justify-between sticky top-0 bg-card z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#2AC1BC] to-teal-700 text-white flex items-center justify-center shadow-sm">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground flex items-center gap-2">
                    <span>{t('landlordListingsCreateAiModalTitle')}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#2AC1BC]/15 text-[#138e89]">
                      Plus Tier
                    </span>
                  </h3>
                  <p className="text-xs text-muted">
                    {t('landlordListingsCreateAiModalSubtitle')}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAiModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5">
              {/* Selected Room Context Banner */}
              <div className="p-4 rounded-2xl bg-primary-soft border border-primary-subtle flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-primary">
                    {t('landlordListingsCreateAiSelectedRoom')}: P.
                    {selectedRoom?.roomNumber || t('landlordListingsCreateAiNotSelected')} (
                    {t('landlordListingsCreateFloorPrefix')} {selectedRoom?.floor || 1})
                  </div>
                  <div className="text-primary">
                    {t('landlordListingsCreateAiRoomType')}:{' '}
                    {selectedRoom?.roomType?.name || t('landlordListingsCreateRoomStandard')} •{' '}
                    {t('landlordListingsCreateAreaPrefix')}: {selectedRoom?.area || '25'} m²
                  </div>
                  <div className="text-primary text-[11px]">
                    {t('landlordListingsCreateAiProperty')}:{' '}
                    {landlordBuildings.find(b => b.id === selectedBuildingId)?.name ||
                      t('landlordListingsCreateAiDefaultProperty')}
                  </div>
                </div>
                <span className="px-2 py-1 rounded-lg bg-teal-200/80 text-primary font-extrabold text-[10px]">
                  {t('landlordListingsCreateAiBhmsData')}
                </span>
              </div>

              {/* Controls: Tone & Custom Highlights */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground/90 block">
                    {t('landlordListingsCreateAiToneLabel')}:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        id: 'professional',
                        label: t('landlordListingsCreateAiToneProfessional'),
                        desc: t('landlordListingsCreateAiToneProfessionalDesc'),
                        icon: '👔',
                      },
                      {
                        id: 'youthful',
                        label: t('landlordListingsCreateAiToneYouthful'),
                        desc: t('landlordListingsCreateAiToneYouthfulDesc'),
                        icon: '🎒',
                      },
                      {
                        id: 'budget',
                        label: t('landlordListingsCreateAiToneBudget'),
                        desc: t('landlordListingsCreateAiToneBudgetDesc'),
                        icon: '💰',
                      },
                    ].map(t => (
                      <Button fullWidth
                        key={t.id}
                        type="button"
                        variant="ghost"
                        onClick={() => setAiTone(t.id as any)}
                      >
                        <div className="text-sm font-bold flex items-center gap-1.5 w-full">
                          <span>{t.icon}</span>
                          <span>{t.label}</span>
                        </div>
                        <div className="text-[10px] text-muted mt-1 font-normal">{t.desc}</div>
                      </Button>
                    ))}
                  </div>
                </div>

                <TextInput
                  label={t('landlordListingsCreateAiNotesLabel')}
                  value={aiCustomNotes}
                  onChange={e => setAiCustomNotes(e.target.value)}
                  placeholder={t('landlordListingsCreateAiNotesPh')}
                  className="text-xs py-2"
                />

                {aiErrorMessage && (
                  <div className="p-3 bg-danger-soft border border-danger-subtle text-danger rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{aiErrorMessage}</span>
                  </div>
                )}

                {/* Generate Button */}
                <Button fullWidth size="icon"
                  type="button"
                  variant="primary"
                  disabled={isGeneratingAi}
                  onClick={handleGenerateAi}
                  className="from-teal-600 to-[#2AC1BC] hover:opacity-95"
                >
                  {isGeneratingAi ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t('landlordListingsCreateAiExtracting')}</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>
                        {aiDraftResult
                          ? t('landlordListingsCreateAiRegenerateBtn')
                          : t('landlordListingsCreateAiGenerateBtn')}
                      </span>
                    </>
                  )}
                </Button>
              </div>

              {/* AI Draft Result Preview */}
              {aiDraftResult && (
                <div className="p-4 rounded-2xl border border-line bg-surface/70 space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b border-line pb-2.5">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      {t('landlordListingsCreateAiResultTitle')}
                    </span>
                    <span className="text-[10px] text-muted font-mono">
                      {t('landlordListingsCreateAiSession')} #
                      {aiDraftResult.conversationId.slice(0, 8)}
                    </span>
                  </div>

                  {/* Suggested Title */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                      {t('landlordListingsCreateAiResultTitleLabel')}:
                    </span>
                    <div className="text-xs font-bold text-foreground p-2.5 bg-card rounded-xl border border-line">
                      {aiDraftResult.title}
                    </div>
                  </div>

                  {/* Suggested Badges */}
                  {aiDraftResult.highlights.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                        {t('landlordListingsCreateAiResultHighlights')}:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {aiDraftResult.highlights.map((h, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-card text-foreground/90 border border-line"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Deposit */}
                  <div className="flex items-center justify-between text-xs p-2.5 bg-card rounded-xl border border-line">
                    <span className="font-bold text-muted">
                      {t('landlordListingsCreateAiResultDeposit')}:
                    </span>
                    <span className="font-extrabold text-[#2AC1BC]">
                      {formatCurrency(aiDraftResult.depositAmount)}
                    </span>
                  </div>

                  {/* Suggested Content Preview */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                      {t('landlordListingsCreateAiResultContent')}:
                    </span>
                    <div className="text-xs text-foreground/90 p-3 bg-card rounded-xl border border-line max-h-56 overflow-y-auto whitespace-pre-line leading-relaxed font-sans">
                      {aiDraftResult.content}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-line flex items-center justify-end gap-2.5 bg-surface/50">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAiModalOpen(false)}
              >
                {t('landlordListingsCreateAiCloseBtn')}
              </Button>
              {aiDraftResult && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleApplyAiDraft}
                >
                  <Check className="w-4 h-4" />
                  <span>{t('landlordListingsCreateAiApplyBtn')}</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal when Closing Unsaved Form (Rule #10) */}
      {isConfirmCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-6 border border-line">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-warning-soft text-amber-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">
                  {t('landlordListingsCreateConfirmCloseTitle')}
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  {t('landlordListingsCreateConfirmCloseDesc')}
                </p>
              </div>
            </div>

            <div className="text-xs text-muted bg-surface p-4 rounded-2xl leading-relaxed">
              {t('landlordListingsCreateConfirmCloseWarning')}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmCloseModalOpen(false)}
              >
                {t('landlordListingsCreateConfirmCloseKeep')}
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => {
                  setIsConfirmCloseModalOpen(false)
                  setIsDirty(false)
                  router.push('/landlord/listings')
                }}
              >
                {t('landlordListingsCreateConfirmCloseDiscard')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CreateListingPage() {
  if (!FEATURE_FLAGS.ENABLE_BHRP) {
    redirect('/landlord')
  }
  const t = useTranslations('landlord')
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-muted space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2AC1BC]" />
          <p className="text-xs font-semibold">{t('landlordListingsCreateLoadingPage')}</p>
        </div>
      }
    >
      <CreateListingForm />
    </Suspense>
  )
}
