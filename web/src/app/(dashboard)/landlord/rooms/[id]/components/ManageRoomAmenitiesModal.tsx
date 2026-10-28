'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Trash2,
  Edit2,
  Info,
  AlertTriangle,
  Check,
  Building2,
  Lock,
  CheckCircle2,
  HouseWifi,
  X,
} from 'lucide-react'
import {
  Button,
  TextInput,
  SelectInput,
  Text,
  Modal,
  Chip,
  EmptyState,
} from '@/components/ui'
import { useTranslations } from '@/context/LanguageContext'
import {
  getRoomAmenities,
  addRoomAmenity,
  updateRoomAmenity,
  deleteRoomAmenity,
  RoomAmenityItem,
} from '@/services/room.service'
import { resolveErrorMessage } from '@/utils/error-resolver'

interface ManageRoomAmenitiesModalProps {
  isOpen: boolean
  boardingHouseId: string
  roomId: string
  roomNumber: string
  onClose: () => void
  onSuccess?: () => void
  onAmenitiesChange?: (updatedAmenities: RoomAmenityItem[]) => void
}

export const ManageRoomAmenitiesModal: React.FC<ManageRoomAmenitiesModalProps> = ({
  isOpen,
  boardingHouseId,
  roomId,
  roomNumber,
  onClose,
  onSuccess,
  onAmenitiesChange,
}) => {
  const t = useTranslations('landlord')
  const tErrors = useTranslations('errors')

  const [isLoading, setIsLoading] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Current amenities data
  const [currentAmenities, setCurrentAmenities] = useState<RoomAmenityItem[]>([])

  // Inline Add Form state
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)
  const [newAmenityName, setNewAmenityName] = useState('')
  const [newAmenityScope, setNewAmenityScope] = useState<'shared' | 'private'>('shared')

  // Edit amenity submodal state
  const [editingAmenity, setEditingAmenity] = useState<RoomAmenityItem | null>(null)
  const [editName, setEditName] = useState('')

  // Delete confirmation submodal state
  const [deletingAmenity, setDeletingAmenity] = useState<RoomAmenityItem | null>(null)

  // Unsaved changes confirmation modal (Rule 10)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  // Load amenities data
  const loadData = useCallback(async () => {
    if (!boardingHouseId || !roomId) return null
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const res = await getRoomAmenities(boardingHouseId, roomId)
      const current = res.currentAmenities || []
      setCurrentAmenities(current)
      return current
    } catch (err: unknown) {
      setErrorMessage(resolveErrorMessage(err, tErrors, t('landlordRoomDetailAmenityLoadFailed')))
      return null
    } finally {
      setIsLoading(false)
    }
  }, [boardingHouseId, roomId, t, tErrors])

  useEffect(() => {
    if (isOpen) {
      loadData()
      setIsAddFormOpen(false)
      setNewAmenityName('')
      setNewAmenityScope('shared')
      setEditingAmenity(null)
      setEditName('')
      setDeletingAmenity(null)
      setSuccessMessage(null)
      setErrorMessage(null)
      setShowDiscardConfirm(false)
    }
  }, [isOpen, loadData])

  // Clear toast after 3.5s
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Check unsaved changes (Rule 10)
  const isFormDirty = useCallback(() => {
    const isAddDirty = isAddFormOpen && newAmenityName.trim().length > 0
    const isEditDirty =
      editingAmenity !== null && editName.trim() !== (editingAmenity.name || '').trim()
    return isAddDirty || isEditDirty
  }, [isAddFormOpen, newAmenityName, editingAmenity, editName])

  const handleRequestClose = () => {
    if (isFormDirty()) {
      setShowDiscardConfirm(true)
    } else {
      handleForceClose()
    }
  }

  const handleForceClose = () => {
    setShowDiscardConfirm(false)
    setIsAddFormOpen(false)
    setNewAmenityName('')
    setNewAmenityScope('shared')
    setEditingAmenity(null)
    setEditName('')
    setDeletingAmenity(null)
    setErrorMessage(null)
    setSuccessMessage(null)
    onClose()
  }

  const handleCloseEditModal = () => {
    setEditingAmenity(null)
    setEditName('')
  }

  // Create & attach amenity
  const handleCreateAmenity = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = newAmenityName.trim()
    if (!trimmed) return

    setIsActionLoading(true)
    setErrorMessage(null)
    try {
      await addRoomAmenity(boardingHouseId, roomId, {
        name: trimmed,
        isShared: newAmenityScope === 'shared',
      })
      setSuccessMessage(t('landlordRoomDetailAmenityAddSuccess'))
      setNewAmenityName('')
      setIsAddFormOpen(false)
      const updated = await loadData()
      if (updated) onAmenitiesChange?.(updated)
      onSuccess?.()
    } catch (err: unknown) {
      setErrorMessage(resolveErrorMessage(err, tErrors, t('landlordRoomDetailAmenityCreateFailed')))
    } finally {
      setIsActionLoading(false)
    }
  }

  // Start editing amenity
  const handleOpenEdit = (amenity: RoomAmenityItem) => {
    setEditingAmenity(amenity)
    setEditName(amenity.name)
    setErrorMessage(null)
  }

  // Save edited amenity
  const handleSaveEdit = async (forkForRoom: boolean = false) => {
    if (!editingAmenity) return
    const trimmed = editName.trim()
    if (!trimmed) return

    setIsActionLoading(true)
    setErrorMessage(null)
    try {
      await updateRoomAmenity(boardingHouseId, roomId, editingAmenity.id, {
        name: trimmed,
        forkForRoom,
      })
      setSuccessMessage(t('landlordRoomDetailAmenityUpdateSuccess'))
      setEditingAmenity(null)
      setEditName('')
      const updated = await loadData()
      if (updated) onAmenitiesChange?.(updated)
      onSuccess?.()
    } catch (err: unknown) {
      setErrorMessage(resolveErrorMessage(err, tErrors, t('landlordRoomDetailAmenityUpdateFailed')))
    } finally {
      setIsActionLoading(false)
    }
  }

  // Delete amenity from room
  const handleConfirmDelete = async () => {
    if (!deletingAmenity) return

    setIsActionLoading(true)
    setErrorMessage(null)
    try {
      await deleteRoomAmenity(boardingHouseId, roomId, deletingAmenity.id)
      setSuccessMessage(t('landlordRoomDetailAmenityRemoveSuccess'))
      setDeletingAmenity(null)
      const updated = await loadData()
      if (updated) onAmenitiesChange?.(updated)
      onSuccess?.()
    } catch (err: unknown) {
      setErrorMessage(resolveErrorMessage(err, tErrors, t('landlordRoomDetailAmenityRemoveFailed')))
    } finally {
      setIsActionLoading(false)
    }
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleRequestClose} size="2xl">
        <Modal.Header
          title={t('landlordRoomDetailAmenityModalTitle', { roomNumber })}
          icon={
            <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
              <HouseWifi className="w-5 h-5" />
            </div>
          }
        />

        <Modal.Body className="space-y-4 max-h-[75vh] overflow-y-auto">
          {/* NOTICE BANNER */}
          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <Text size="xs" weight="black" color="brand">
                {t('landlordRoomDetailAmenityNoticeTitle')}
              </Text>
              <Text size="xs" color="secondary" className="leading-relaxed">
                {t('landlordRoomDetailAmenityNoticeDesc')}
              </Text>
            </div>
          </div>

          {/* SUCCESS & ERROR FEEDBACK */}
          {successMessage && (
            <div className="bg-success-soft border border-success-subtle rounded-xl p-3 flex items-center gap-2 text-success">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <Text size="xs" weight="bold" color="inherit">
                {successMessage}
              </Text>
            </div>
          )}

          {errorMessage && (
            <div className="bg-danger-soft border border-danger-subtle rounded-xl p-3 flex items-center gap-2 text-danger">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <Text size="xs" weight="bold" color="inherit">
                {errorMessage}
              </Text>
            </div>
          )}

          {/* LIST HEADER BAR WITH ADD AMENITY BUTTON */}
          <div className="flex items-center justify-between gap-3 pb-1 border-b border-line">
            <Text size="sm" weight="black" color="default">
              {t('landlordRoomDetailAmenityListTitle', { count: currentAmenities.length })}
            </Text>
            <Button
              size="sm"
              variant={isAddFormOpen ? 'outline' : 'primary'}
              onClick={() => {
                if (isAddFormOpen) {
                  setIsAddFormOpen(false)
                  setNewAmenityName('')
                  setNewAmenityScope('shared')
                } else {
                  setIsAddFormOpen(true)
                }
              }}
              leftIcon={isAddFormOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            >
              {isAddFormOpen ? t('landlordRoomDetailAmenityBtnCancel') : t('landlordRoomDetailAmenityBtnAdd')}
            </Button>
          </div>

          {/* INLINE ADD AMENITY FORM */}
          {isAddFormOpen && (
            <form
              onSubmit={handleCreateAmenity}
              className="p-4 bg-surface/60 border border-line rounded-xl space-y-3.5 transition-all duration-200"
            >
              <Text size="xs" weight="black" color="default">
                {t('landlordRoomDetailAmenityAddFormTitle')}
              </Text>

              <TextInput
                label={t('landlordRoomDetailAmenityNameLabel')}
                placeholder={t('landlordRoomDetailAmenityNamePlaceholder')}
                value={newAmenityName}
                onChange={e => setNewAmenityName(e.target.value)}
                disabled={isActionLoading}
                required
                autoFocus
              />

              <SelectInput
                label={t('landlordRoomDetailAmenityScopeLabel')}
                value={newAmenityScope}
                onChange={e => setNewAmenityScope(e.target.value as 'shared' | 'private')}
                disabled={isActionLoading}
                options={[
                  {
                    value: 'shared',
                    label: t('landlordRoomDetailAmenityScopeShared'),
                    description: t('landlordRoomDetailAmenityScopeSharedHint'),
                  },
                  {
                    value: 'private',
                    label: t('landlordRoomDetailAmenityScopePrivate'),
                    description: t('landlordRoomDetailAmenityScopePrivateHint'),
                  },
                ]}
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setIsAddFormOpen(false)
                    setNewAmenityName('')
                    setNewAmenityScope('shared')
                  }}
                  disabled={isActionLoading}
                >
                  {t('landlordRoomDetailAmenityBtnCancel')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!newAmenityName.trim() || isActionLoading}
                  isLoading={isActionLoading}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  {t('landlordRoomDetailAmenityBtnSubmit')}
                </Button>
              </div>
            </form>
          )}

          {/* CURRENT AMENITIES LIST */}
          <div className="space-y-3 min-h-[160px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-secondary space-y-2">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <Text size="xs">{t('commonLoading')}</Text>
              </div>
            ) : currentAmenities.length === 0 ? (
              <EmptyState
                icon={<HouseWifi className="w-8 h-8 text-secondary" />}
                title={t('landlordRoomDetailAmenitiesEmpty')}
                action={
                  !isAddFormOpen ? (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setIsAddFormOpen(true)}
                      leftIcon={<Plus className="w-4 h-4" />}
                    >
                      {t('landlordRoomDetailAmenityBtnAdd')}
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-card">
                {currentAmenities.map(item => (
                  <div
                    key={item.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-surface/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-surface border border-line flex items-center justify-center text-primary shrink-0">
                        {item.isShared ? (
                          <Building2 className="w-4 h-4 text-primary" />
                        ) : (
                          <Lock className="w-4 h-4 text-warning" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Text size="sm" weight="bold" color="default" className="truncate">
                          {item.name}
                        </Text>
                        <div className="mt-0.5">
                          {item.isShared ? (
                            <Chip size="sm" variant="info" preventHover>
                              {t('landlordRoomDetailAmenityShared')}
                            </Chip>
                          ) : (
                            <Chip size="sm" variant="warning" preventHover>
                              {t('landlordRoomDetailAmenityPrivate')}
                            </Chip>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="secondary"
                        size="icon-sm"
                        onClick={() => handleOpenEdit(item)}
                        disabled={isActionLoading}
                        title={t('commonEdit')}
                      >
                        <Edit2 />
                      </Button>
                      <Button
                        variant="danger"
                        size="icon-sm"
                        onClick={() => setDeletingAmenity(item)}
                        disabled={isActionLoading}
                        title={t('commonDelete')}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer className="flex-col-reverse sm:flex-row sm:justify-end items-stretch sm:items-center gap-2 sm:gap-3">
          <Button variant="secondary" size="md" onClick={handleRequestClose} className="w-full sm:w-auto">
            {t('commonClose')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* SUB-MODAL 1: EDIT AMENITY & SHARED FORK CHOICE */}
      <Modal
        isOpen={editingAmenity !== null}
        onClose={handleCloseEditModal}
        size="md"
      >
        <Modal.Header
          title={t('landlordRoomDetailAmenityEditModalTitle')}
          icon={<Edit2 className="w-5 h-5 text-primary" />}
        />
        <Modal.Body className="space-y-4 max-h-[75vh] overflow-y-auto">
          <TextInput
            label={t('landlordRoomDetailAmenityNameLabel')}
            value={editName}
            onChange={e => setEditName(e.target.value)}
            disabled={isActionLoading}
          />

          {editingAmenity?.isShared ? (
            <div className="bg-warning-soft border border-warning-subtle rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-warning">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <Text size="xs" weight="black" color="inherit">
                  {t('landlordRoomDetailAmenityShared')}
                </Text>
              </div>
              <Text size="xs" color="secondary" className="leading-relaxed">
                {t('landlordRoomDetailAmenityEditSharedWarning')}
              </Text>
            </div>
          ) : (
            <div className="bg-surface border border-line rounded-xl p-3 flex items-center gap-2 text-secondary">
              <Lock className="w-4 h-4 text-warning shrink-0" />
              <Text size="xs">
                {t('landlordRoomDetailAmenityPrivateHelpText', { roomNumber })}
              </Text>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer className="flex-col-reverse sm:flex-row sm:justify-end items-stretch sm:items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={handleCloseEditModal}
            disabled={isActionLoading}
            className="w-full sm:w-auto"
          >
            {t('landlordRoomDetailModalCancelBtn')}
          </Button>

          {editingAmenity?.isShared ? (
            <>
              <Button
                variant="secondary"
                size="md"
                onClick={() => handleSaveEdit(true)}
                disabled={!editName.trim() || isActionLoading}
                isLoading={isActionLoading}
                leftIcon={<Lock className="w-3.5 h-3.5" />}
                className="w-full sm:w-auto"
              >
                {t('landlordRoomDetailAmenityBtnForkPrivate')}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleSaveEdit(false)}
                disabled={!editName.trim() || isActionLoading}
                isLoading={isActionLoading}
                leftIcon={<Check className="w-3.5 h-3.5" />}
                className="w-full sm:w-auto"
              >
                {t('landlordRoomDetailAmenityBtnApplyAll')}
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={() => handleSaveEdit(false)}
              disabled={!editName.trim() || isActionLoading}
              isLoading={isActionLoading}
              className="w-full sm:w-auto"
            >
              {t('landlordRoomDetailSaveChangesBtn')}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* SUB-MODAL 2: CONFIRM DELETE AMENITY */}
      <Modal
        isOpen={deletingAmenity !== null}
        onClose={() => setDeletingAmenity(null)}
        size="md"
        showCloseButton={false}
      >
        <Modal.Body className="space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="flex items-center gap-3 text-danger">
            <div className="p-3 bg-danger-soft rounded-full shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <Text as="h3" weight="black" color="default" size="base">
                {t('landlordRoomDetailAmenityDeleteConfirm')}
              </Text>
              <Text size="xs" color="secondary" className="mt-1">
                {deletingAmenity?.name} (
                {deletingAmenity?.isShared
                  ? t('landlordRoomDetailAmenityShared')
                  : t('landlordRoomDetailAmenityPrivate')}
                )
              </Text>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex-col-reverse sm:flex-row sm:justify-end items-stretch sm:items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => setDeletingAmenity(null)}
            disabled={isActionLoading}
            className="w-full sm:w-auto"
          >
            {t('landlordRoomDetailModalCancelBtn')}
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={handleConfirmDelete}
            isLoading={isActionLoading}
            leftIcon={<Trash2 />}
            className="w-full sm:w-auto"
          >
            {t('commonDelete')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* SUB-MODAL 3: UNSAVED CHANGES CONFIRMATION MODAL (RULE 10) */}
      <Modal
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        size="md"
        showCloseButton={false}
      >
        <Modal.Body className="space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="flex items-center gap-3 text-warning">
            <div className="p-3 bg-warning-soft rounded-full shrink-0">
              <AlertTriangle className="w-6 h-6 text-warning" />
            </div>
            <div>
              <Text as="h3" weight="black" color="default" size="base">
                {t('landlordRoomDetailConfirmCloseTitle')}
              </Text>
              <Text size="xs" color="secondary" className="mt-1">
                {t('landlordRoomDetailConfirmCloseDesc')}
              </Text>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex-col-reverse sm:flex-row sm:justify-end items-stretch sm:items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => setShowDiscardConfirm(false)}
            className="w-full sm:w-auto"
          >
            {t('landlordRoomDetailConfirmCloseContinue')}
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={handleForceClose}
            className="w-full sm:w-auto"
          >
            {t('landlordRoomDetailConfirmCloseDiscard')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
