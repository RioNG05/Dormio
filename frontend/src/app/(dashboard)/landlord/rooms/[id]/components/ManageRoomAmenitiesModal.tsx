'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Info,
  AlertTriangle,
  Check,
  Building2,
  Lock,
  Layers,
  CheckCircle2,
} from 'lucide-react'
import {
  Button,
  TextInput,
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

interface ManageRoomAmenitiesModalProps {
  isOpen: boolean
  boardingHouseId: string
  roomId: string
  roomNumber: string
  onClose: () => void
  onSuccess?: () => void
}

type ActiveTab = 'current' | 'addShared' | 'createPrivate'

export const ManageRoomAmenitiesModal: React.FC<ManageRoomAmenitiesModalProps> = ({
  isOpen,
  boardingHouseId,
  roomId,
  roomNumber,
  onClose,
  onSuccess,
}) => {
  const t = useTranslations('landlord')

  const [activeTab, setActiveTab] = useState<ActiveTab>('current')
  const [isLoading, setIsLoading] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Data
  const [currentAmenities, setCurrentAmenities] = useState<RoomAmenityItem[]>([])
  const [sharedPool, setSharedPool] = useState<RoomAmenityItem[]>([])

  // Form states
  const [newPrivateName, setNewPrivateName] = useState('')

  // Edit amenity submodal state
  const [editingAmenity, setEditingAmenity] = useState<RoomAmenityItem | null>(null)
  const [editName, setEditName] = useState('')

  // Delete confirmation submodal state
  const [deletingAmenity, setDeletingAmenity] = useState<RoomAmenityItem | null>(null)

  // Unsaved changes confirmation modal
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  // Load amenities data
  const loadData = useCallback(async () => {
    if (!boardingHouseId || !roomId) return
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const res = await getRoomAmenities(boardingHouseId, roomId)
      setCurrentAmenities(res.currentAmenities || [])
      setSharedPool(res.availableSharedAmenities || [])
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to load amenities')
    } finally {
      setIsLoading(false)
    }
  }, [boardingHouseId, roomId])

  useEffect(() => {
    if (isOpen) {
      loadData()
      setActiveTab('current')
      setNewPrivateName('')
      setEditingAmenity(null)
      setDeletingAmenity(null)
      setSuccessMessage(null)
      setShowDiscardConfirm(false)
    }
  }, [isOpen, loadData])

  // Clear toast after 3s
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Check unsaved changes
  const isFormDirty = () => {
    return newPrivateName.trim().length > 0 || (editingAmenity !== null && editName !== editingAmenity.name)
  }

  const handleRequestClose = () => {
    if (isFormDirty()) {
      setShowDiscardConfirm(true)
    } else {
      handleForceClose()
    }
  }

  const handleForceClose = () => {
    setShowDiscardConfirm(false)
    setNewPrivateName('')
    setEditingAmenity(null)
    setDeletingAmenity(null)
    onClose()
  }

  // Attach shared amenity from house pool
  const handleAttachShared = async (amenityId: string) => {
    setIsActionLoading(true)
    setErrorMessage(null)
    try {
      await addRoomAmenity(boardingHouseId, roomId, { amenityId })
      setSuccessMessage(t('landlordRoomDetailAmenityAddSuccess'))
      await loadData()
      onSuccess?.()
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to attach amenity')
    } finally {
      setIsActionLoading(false)
    }
  }

  // Create new private amenity
  const handleCreatePrivate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = newPrivateName.trim()
    if (!trimmed) return

    setIsActionLoading(true)
    setErrorMessage(null)
    try {
      await addRoomAmenity(boardingHouseId, roomId, { name: trimmed })
      setSuccessMessage(t('landlordRoomDetailAmenityAddSuccess'))
      setNewPrivateName('')
      setActiveTab('current')
      await loadData()
      onSuccess?.()
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to create private amenity')
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
      await loadData()
      onSuccess?.()
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to update amenity')
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
      await loadData()
      onSuccess?.()
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to remove amenity')
    } finally {
      setIsActionLoading(false)
    }
  }

  // Calculate unattached shared amenities
  const currentAmenityIds = new Set(currentAmenities.map(a => a.id))
  const unattachedSharedAmenities = sharedPool.filter(a => !currentAmenityIds.has(a.id))

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleRequestClose} size="2xl">
        <Modal.Header
          title={t('landlordRoomDetailAmenityModalTitle').replace('{roomNumber}', roomNumber)}
          icon={
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
          }
        />

        <Modal.Body className="space-y-5">
          {/* NOTICE BANNER REQUIRED BY USER */}
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

          {/* TABS NAVIGATION */}
          <div className="flex border-b border-line gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('current')}
              className={`pb-2.5 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'current'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-foreground'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              {t('landlordRoomDetailAmenityTabCurrent')} ({currentAmenities.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('addShared')}
              className={`pb-2.5 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'addShared'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-foreground'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              {t('landlordRoomDetailAmenityTabAddShared')} ({unattachedSharedAmenities.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('createPrivate')}
              className={`pb-2.5 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'createPrivate'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-foreground'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              {t('landlordRoomDetailAmenityTabCreatePrivate')}
            </button>
          </div>

          {/* TAB 1: CURRENT AMENITIES LIST */}
          {activeTab === 'current' && (
            <div className="space-y-3 min-h-[220px]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-secondary space-y-2">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <Text size="xs">{t('commonLoading')}</Text>
                </div>
              ) : currentAmenities.length === 0 ? (
                <EmptyState
                  icon={<Sparkles className="w-8 h-8 text-secondary" />}
                  title={t('landlordRoomDetailAmenitiesEmpty')}
                  action={
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setActiveTab('addShared')}
                      leftIcon={<Plus className="w-4 h-4" />}
                    >
                      {t('landlordRoomDetailAmenityTabAddShared')}
                    </Button>
                  }
                />
              ) : (
                <div className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-card">
                  {currentAmenities.map(item => (
                    <div
                      key={item.id}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-surface/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-surface border border-line flex items-center justify-center text-primary">
                          {item.isShared ? (
                            <Building2 className="w-4 h-4" />
                          ) : (
                            <Lock className="w-4 h-4 text-warning" />
                          )}
                        </div>
                        <div>
                          <Text size="sm" weight="bold" color="default">
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

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(item)}
                          disabled={isActionLoading}
                          title={t('commonEdit')}
                        >
                          <Edit2 className="w-3.5 h-3.5 text-secondary hover:text-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingAmenity(item)}
                          disabled={isActionLoading}
                          title={t('commonDelete')}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-danger" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ATTACH SHARED AMENITIES */}
          {activeTab === 'addShared' && (
            <div className="space-y-3 min-h-[220px]">
              <Text size="xs" color="secondary">
                {t('landlordRoomDetailAmenityTabAddShared')}
              </Text>
              {unattachedSharedAmenities.length === 0 ? (
                <EmptyState
                  icon={<Check className="w-8 h-8 text-success" />}
                  title="Tất cả tiện nghi chung đã được gắn vào phòng này."
                  action={
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveTab('createPrivate')}
                      leftIcon={<Plus className="w-4 h-4" />}
                    >
                      {t('landlordRoomDetailAmenityTabCreatePrivate')}
                    </Button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {unattachedSharedAmenities.map(item => (
                    <div
                      key={item.id}
                      className="p-3 border border-line rounded-xl bg-card flex items-center justify-between gap-3 shadow-2xs hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary shrink-0" />
                        <Text size="xs" weight="bold" color="default">
                          {item.name}
                        </Text>
                      </div>
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => handleAttachShared(item.id)}
                        disabled={isActionLoading}
                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                      >
                        {t('landlordRoomDetailAmenityBtnAddShared')}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CREATE PRIVATE AMENITY */}
          {activeTab === 'createPrivate' && (
            <form onSubmit={handleCreatePrivate} className="space-y-4 min-h-[220px]">
              <div className="bg-surface/50 border border-line rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-warning" />
                  <Text size="xs" weight="black" color="default">
                    {t('landlordRoomDetailAmenityTabCreatePrivate')}
                  </Text>
                </div>
                <Text size="xs" color="secondary">
                  {t('landlordRoomDetailAmenityNoticeDesc')}
                </Text>

                <TextInput
                  label={t('landlordRoomDetailAmenityNameLabel')}
                  placeholder={t('landlordRoomDetailAmenityNamePlaceholder')}
                  value={newPrivateName}
                  onChange={e => setNewPrivateName(e.target.value)}
                  disabled={isActionLoading}
                />

                <Button
                  type="submit"
                  size="md"
                  variant="primary"
                  disabled={!newPrivateName.trim() || isActionLoading}
                  isLoading={isActionLoading}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  {t('landlordRoomDetailAmenityBtnCreatePrivate')}
                </Button>
              </div>
            </form>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleRequestClose}>
            {t('commonClose')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* SUB-MODAL 1: EDIT AMENITY & SHARED FORK CHOICE */}
      <Modal
        isOpen={editingAmenity !== null}
        onClose={() => setEditingAmenity(null)}
        size="md"
      >
        <Modal.Header
          title={t('landlordRoomDetailAmenityEditModalTitle')}
          icon={<Edit2 className="w-5 h-5 text-primary" />}
        />
        <Modal.Body className="space-y-4">
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
                {t('landlordRoomDetailAmenityPrivate')} - Thay đổi chỉ áp dụng cho phòng {roomNumber}.
              </Text>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setEditingAmenity(null)}
            disabled={isActionLoading}
          >
            {t('landlordRoomDetailModalCancelBtn')}
          </Button>

          {editingAmenity?.isShared ? (
            <>
              <Button
                variant="secondary"
                onClick={() => handleSaveEdit(true)}
                disabled={!editName.trim() || isActionLoading}
                isLoading={isActionLoading}
                leftIcon={<Lock className="w-3.5 h-3.5" />}
              >
                {t('landlordRoomDetailAmenityBtnForkPrivate')}
              </Button>
              <Button
                variant="primary"
                onClick={() => handleSaveEdit(false)}
                disabled={!editName.trim() || isActionLoading}
                isLoading={isActionLoading}
                leftIcon={<Check className="w-3.5 h-3.5" />}
              >
                {t('landlordRoomDetailAmenityBtnApplyAll')}
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={() => handleSaveEdit(false)}
              disabled={!editName.trim() || isActionLoading}
              isLoading={isActionLoading}
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
        <Modal.Body className="space-y-4">
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
        <Modal.Footer>
          <Button
            variant="outline"
            onClick={() => setDeletingAmenity(null)}
            disabled={isActionLoading}
          >
            {t('landlordRoomDetailModalCancelBtn')}
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDelete}
            isLoading={isActionLoading}
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
        <Modal.Body className="space-y-4">
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
        <Modal.Footer>
          <Button variant="outline" onClick={() => setShowDiscardConfirm(false)}>
            {t('landlordRoomDetailKeepEditingBtn')}
          </Button>
          <Button variant="danger" onClick={handleForceClose}>
            {t('landlordRoomDetailDiscardCloseBtn')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
