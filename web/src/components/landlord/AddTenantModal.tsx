'use client'

import React, { useState, useEffect } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Home,
  Info,
  Loader2,
  Lock,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { Button, Modal, SelectInput, TextInput, Chip } from '@/components/ui'
import { searchTenantByPhone, quickAddTenant, RoomOccupantDto } from '@/services/tenant.service'
import { getRooms, RoomItem } from '@/services/room.service'
import { resolveErrorMessage } from '@/utils'

export interface AddTenantModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (occupant: RoomOccupantDto) => void
  boardingHouseId: string
  fixedRoomId?: string
  fixedRoomNumber?: string
}

type SearchState = 'idle' | 'searching' | 'in_building' | 'in_system' | 'not_in_system'

export function AddTenantModal({
  isOpen,
  onClose,
  onSuccess,
  boardingHouseId,
  fixedRoomId,
  fixedRoomNumber,
}: AddTenantModalProps) {
  const t = useTranslations('landlord')
  const tErrors = useTranslations('errors')

  // Form Fields
  const [phoneNumber, setPhoneNumber] = useState('')
  const [fullName, setFullName] = useState('')
  const [roomId, setRoomId] = useState(fixedRoomId || '')
  const [note, setNote] = useState('')

  // UI States
  const [searchState, setSearchState] = useState<SearchState>('idle')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [rooms, setRooms] = useState<RoomItem[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(false)

  // Confirmation Modal for Unsaved Changes (Rule #10)
  const [showConfirmClose, setShowConfirmClose] = useState(false)

  const isDirty = Boolean(
    phoneNumber.trim() || fullName.trim() || note.trim() || (roomId && roomId !== fixedRoomId),
  )

  // Fetch rooms list if roomId is not fixed
  useEffect(() => {
    if (!isOpen || fixedRoomId || !boardingHouseId) return
    let isMounted = true
    async function loadRooms() {
      try {
        setIsLoadingRooms(true)
        const res = await getRooms(boardingHouseId)
        if (isMounted) {
          setRooms(res?.data || [])
        }
      } catch (err) {
        console.error('Failed to load rooms:', err)
      } finally {
        if (isMounted) setIsLoadingRooms(false)
      }
    }
    loadRooms()
    return () => {
      isMounted = false
    }
  }, [isOpen, fixedRoomId, boardingHouseId])

  // Sync fixedRoomId if passed
  useEffect(() => {
    if (fixedRoomId) {
      setRoomId(fixedRoomId)
    }
  }, [fixedRoomId])

  // Reset all state when modal closes
  const resetForm = () => {
    setPhoneNumber('')
    setFullName('')
    setRoomId(fixedRoomId || '')
    setNote('')
    setSearchState('idle')
    setErrorMessage(null)
    setShowConfirmClose(false)
    setIsSubmitting(false)
  }

  // Handle Close Attempt (Rule #10)
  const handleAttemptClose = () => {
    if (isDirty) {
      setShowConfirmClose(true)
    } else {
      resetForm()
      onClose()
    }
  }

  const handleConfirmDiscard = () => {
    resetForm()
    onClose()
  }

  // Debounced Phone Search
  useEffect(() => {
    const cleanPhone = phoneNumber.trim()
    const VN_PHONE_REGEX = /^0[0-9]{9}$/

    if (!cleanPhone || cleanPhone.length < 10) {
      setSearchState('idle')
      setFullName('')
      setErrorMessage(null)
      return
    }

    if (!VN_PHONE_REGEX.test(cleanPhone)) {
      setSearchState('idle')
      return
    }

    setSearchState('searching')
    setErrorMessage(null)

    const timer = setTimeout(async () => {
      try {
        const res = await searchTenantByPhone(boardingHouseId, cleanPhone)
        if (res.found && res.inBuilding) {
          setSearchState('in_building')
          if (res.user?.fullName) {
            setFullName(res.user.fullName)
          }
        } else if (res.found && !res.inBuilding) {
          setSearchState('in_system')
          if (res.user?.fullName) {
            setFullName(res.user.fullName)
          }
        } else {
          setSearchState('not_in_system')
          setFullName('')
        }
      } catch (err: any) {
        console.error('Failed to search phone:', err)
        setSearchState('not_in_system')
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [phoneNumber, boardingHouseId])

  // Form submission validation
  const canSubmit =
    phoneNumber.trim().length === 10 &&
    fullName.trim().length >= 2 &&
    Boolean(roomId) &&
    searchState !== 'in_building' &&
    searchState !== 'searching' &&
    !isSubmitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    try {
      setIsSubmitting(true)
      setErrorMessage(null)
      const res = await quickAddTenant(boardingHouseId, {
        phoneNumber: phoneNumber.trim(),
        fullName: fullName.trim(),
        roomId,
        note: note.trim() || undefined,
      })
      onSuccess(res)
      resetForm()
      onClose()
    } catch (err: any) {
      console.error('Failed to quick add tenant:', err)
      const resolved = resolveErrorMessage(
        err,
        tErrors,
        t('landlordContractsToastCreateFailed') || 'Không thể thêm khách thuê. Vui lòng thử lại.',
      )
      setErrorMessage(resolved)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleAttemptClose}
        size="lg"
        title={t('landlordTenantModalTitle')}
        description={t('landlordTenantModalSubtitle')}
        icon={<User className="w-5 h-5 text-primary" />}
        asForm
        onSubmit={handleSubmit}
        bodyClassName="space-y-4 max-h-[70vh] overflow-y-auto px-1"
        footer={
          <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full">
            <Button
              size='md'
              type="button"
              variant="secondary"
              onClick={handleAttemptClose}
              className="w-full sm:flex-1"
              disabled={isSubmitting}
            >
              {t('landlordTenantCancelBtn')}
            </Button>
            <Button
              size='md'
              type="submit"
              variant="primary"
              disabled={!canSubmit}
              isLoading={isSubmitting}
              className="w-full sm:flex-1"
            >
              {t('landlordTenantSubmitBtn')}
            </Button>
          </div>
        }
      >
        {errorMessage && (
          <div className="p-3 bg-danger-soft border border-danger-subtle rounded-xl flex items-start gap-2.5 text-xs text-danger">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-danger" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Room selection / display */}
        <div>
          {fixedRoomId ? (
            <div className="p-3 bg-surface border border-line rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs text-muted font-medium">
                  {t('landlordTenantRoomLabel')}:
                </span>
                <span className="text-xs font-black text-foreground">
                  {fixedRoomNumber || t('landlordContractDetailRoomPrefix')}
                </span>
              </div>
              <Chip
                size="xs"
                variant="primary"
                preventHover
                className="uppercase font-black"
              >
                {t('landlordRoomDetailTitle')}
              </Chip>
            </div>
          ) : (
            <SelectInput
              label={t('landlordTenantRoomLabel')}
              required
              value={roomId}
              onChange={e => setRoomId(e.target.value)}
              disabled={isLoadingRooms}
            >
              <option value="">{t('landlordTenantRoomPlaceholder')}</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>
                  {t('landlordContractDetailRoomPrefix')} {r.roomNumber} (
                  {r.roomType?.name || 'Standard'} - {r.status})
                </option>
              ))}
            </SelectInput>
          )}
        </div>

        {/* Phone Input with searching status */}
        <div className="space-y-1.5">
          <div className="relative">
            <TextInput
              label={t('landlordTenantPhoneLabel')}
              required
              type="tel"
              placeholder={t('landlordTenantPhonePlaceholder')}
              value={phoneNumber}
              onChange={e => {
                const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10)
                setPhoneNumber(val)
              }}
              leftIcon={<Phone className="w-4 h-4 text-muted" />}
              maxLength={10}
            />
            {searchState === 'searching' && (
              <div className="absolute right-3 top-9 flex items-center gap-1.5 text-xs text-primary font-bold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('landlordTenantSearching')}</span>
              </div>
            )}
          </div>

          {/* Status Message 1: In Building (Alert Warning/Danger) */}
          {searchState === 'in_building' && (
            <div className="p-3 bg-danger-soft border border-danger-subtle rounded-xl flex items-start gap-2.5 text-xs text-danger animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-danger" />
              <div>
                <span className="font-black block">{t('landlordTenantStateInBuilding')}</span>
                <span className="text-[11px] opacity-90 mt-0.5 block">
                  {t('landlordTenantStateInBuildingDesc')}
                </span>
              </div>
            </div>
          )}

          {/* Status Message 2: In Dormio System (Success/Info cyan) */}
          {searchState === 'in_system' && (
            <div className="p-3 bg-primary-soft border border-primary-border rounded-xl flex items-start gap-2.5 text-xs text-primary animate-in fade-in">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
              <div>
                <span className="font-black block">{t('landlordTenantStateInSystem')}</span>
                <span className="text-[11px] opacity-90 mt-0.5 block">
                  {t('landlordTenantStateInSystemDesc')}
                </span>
              </div>
            </div>
          )}

          {/* Status Message 3: Not in System (Muted Notice) */}
          {searchState === 'not_in_system' && (
            <div className="p-3 bg-surface border border-line rounded-xl flex items-start gap-2.5 text-xs text-muted animate-in fade-in">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-foreground" />
              <div>
                <span className="font-bold text-foreground block">
                  {t('landlordTenantStateNotFound')}
                </span>
                <span className="text-[11px] text-muted mt-0.5 block">
                  {t('landlordTenantStateNotFoundDesc')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tenant Full Name (Locked initially or when in_system/in_building) */}
        <div>
          <TextInput
            label={t('landlordTenantNameLabel')}
            required
            placeholder={t('landlordTenantNamePlaceholder')}
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            disabled={searchState !== 'not_in_system'}
            leftIcon={
              searchState !== 'not_in_system' ? (
                <Lock className="w-4 h-4 text-muted" />
              ) : (
                <User className="w-4 h-4 text-muted" />
              )
            }
          />
        </div>

        {/* Note */}
        <div>
          <TextInput
            label={t('landlordTenantNoteLabel')}
            placeholder={t('landlordTenantNotePlaceholder')}
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>
      </Modal>

      {/* Pop-up Confirmation Modal on Unsaved Exit (Rule #10) */}
      <Modal
        isOpen={showConfirmClose}
        onClose={() => setShowConfirmClose(false)}
        size="sm"
        title={t('landlordTenantConfirmCloseTitle')}
        description={t('landlordTenantConfirmCloseDesc')}
        icon={
          <div className="w-10 h-10 rounded-xl bg-warning-soft text-warning flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
        }
        footer={
          <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5 w-full">
            <Button
              size='md'
              variant="secondary"
              onClick={() => setShowConfirmClose(false)}
              className="w-full sm:flex-1 text-xs"
            >
              {t('landlordTenantConfirmCloseStay')}
            </Button>
            <Button
              size='md'
              variant="danger"
              onClick={handleConfirmDiscard}
              className="w-full sm:flex-1 text-xs"
            >
              {t('landlordTenantConfirmCloseLeave')}
            </Button>
          </div>
        }
      >
        <p className="text-xs text-muted leading-relaxed">
          {t('landlordTenantConfirmCloseDesc')}
        </p>
      </Modal>
    </>
  )
}
