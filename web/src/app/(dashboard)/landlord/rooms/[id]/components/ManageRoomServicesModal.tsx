'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Banknote,
  Plus,
  Trash2,
  Edit2,
  Info,
  AlertTriangle,
  Zap,
  Layers,
  CheckCircle2,
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
import { useLanguage, useTranslations } from '@/context/LanguageContext'
import { SERVICE_UNIT_DEFINITIONS } from '@/constants/service-units'
import {
  getRoomServices,
  addRoomService,
  updateRoomService,
  deleteRoomService,
  RoomServiceDetailItem,
} from '@/services/room.service'
import { resolveErrorMessage } from '@/utils/error-resolver'

interface ManageRoomServicesModalProps {
  isOpen: boolean
  boardingHouseId: string
  roomId: string
  roomNumber: string
  onClose: () => void
  onSuccess?: () => void
  onServicesChange?: (updatedServices: RoomServiceDetailItem[]) => void
}

export const ManageRoomServicesModal: React.FC<ManageRoomServicesModalProps> = ({
  isOpen,
  boardingHouseId,
  roomId,
  roomNumber,
  onClose,
  onSuccess,
  onServicesChange,
}) => {
  const t = useTranslations('landlord')
  const tErrors = useTranslations('errors')
  const { locale } = useLanguage()

  const [isLoading, setIsLoading] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Services Data
  const [currentServices, setCurrentServices] = useState<RoomServiceDetailItem[]>([])
  const [availableServices, setAvailableServices] = useState<RoomServiceDetailItem[]>([])

  // Inline Add Form state
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)
  const [addSource, setAddSource] = useState<'existing' | 'custom'>('existing')
  const [selectedExistingServiceId, setSelectedExistingServiceId] = useState('')
  const [newServiceName, setNewServiceName] = useState('')
  const [newServicePrice, setNewServicePrice] = useState('')
  const [newServiceUnit, setNewServiceUnit] = useState('phòng/tháng')
  const [newServiceIsMetered, setNewServiceIsMetered] = useState(false)

  // Edit service submodal state
  const [editingService, setEditingService] = useState<RoomServiceDetailItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editUnit, setEditUnit] = useState('')
  const [editIsMetered, setEditIsMetered] = useState(false)

  // Delete confirmation submodal state
  const [deletingService, setDeletingService] = useState<RoomServiceDetailItem | null>(null)

  // Unsaved changes confirmation modal (Rule 10)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  // Load services data
  const loadData = useCallback(async () => {
    if (!boardingHouseId || !roomId) return null
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const res = await getRoomServices(boardingHouseId, roomId)
      const current = res.currentServices || []
      const available = res.availableServices || []
      setCurrentServices(current)
      setAvailableServices(available)
      return current
    } catch (err: unknown) {
      setErrorMessage(resolveErrorMessage(err, tErrors, t('landlordRoomDetailServiceLoadFailed')))
      return null
    } finally {
      setIsLoading(false)
    }
  }, [boardingHouseId, roomId, t, tErrors])

  useEffect(() => {
    if (isOpen) {
      loadData()
      setIsAddFormOpen(false)
      setAddSource('existing')
      setSelectedExistingServiceId('')
      setNewServiceName('')
      setNewServicePrice('')
      setNewServiceUnit('phòng/tháng')
      setNewServiceIsMetered(false)
      setEditingService(null)
      setEditName('')
      setEditPrice('')
      setEditUnit('')
      setEditIsMetered(false)
      setDeletingService(null)
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
    if (isAddFormOpen) {
      if (addSource === 'existing' && selectedExistingServiceId) return true
      if (
        addSource === 'custom' &&
        (newServiceName.trim().length > 0 || newServicePrice.trim().length > 0)
      ) {
        return true
      }
    }
    if (editingService !== null) {
      const isNameChanged = editName.trim() !== (editingService.name || '').trim()
      const isPriceChanged = editPrice.trim() !== String(editingService.numericPrice ?? '')
      const isUnitChanged = editUnit.trim() !== (editingService.unit || '').trim()
      const isMeteredChanged = editIsMetered !== editingService.isMetered
      return isNameChanged || isPriceChanged || isUnitChanged || isMeteredChanged
    }
    return false
  }, [
    isAddFormOpen,
    addSource,
    selectedExistingServiceId,
    newServiceName,
    newServicePrice,
    editingService,
    editName,
    editPrice,
    editUnit,
    editIsMetered,
  ])

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
    setSelectedExistingServiceId('')
    setNewServiceName('')
    setNewServicePrice('')
    setNewServiceUnit('phòng/tháng')
    setNewServiceIsMetered(false)
    setEditingService(null)
    setEditName('')
    setEditPrice('')
    setEditUnit('')
    setEditIsMetered(false)
    setDeletingService(null)
    setErrorMessage(null)
    setSuccessMessage(null)
    onClose()
  }

  const handleCloseEditModal = () => {
    setEditingService(null)
    setEditName('')
    setEditPrice('')
    setEditUnit('')
    setEditIsMetered(false)
  }

  // Handle Add Service Submit
  const handleAddService = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsActionLoading(true)
    setErrorMessage(null)

    try {
      if (addSource === 'existing') {
        if (!selectedExistingServiceId) return
        await addRoomService(boardingHouseId, roomId, {
          serviceId: selectedExistingServiceId,
        })
      } else {
        const trimmedName = newServiceName.trim()
        if (!trimmedName) return
        const parsedPrice = parseFloat(newServicePrice.replace(/[^\d.]/g, '')) || 0

        await addRoomService(boardingHouseId, roomId, {
          name: trimmedName,
          price: parsedPrice,
          unit: newServiceUnit,
          isMetered: newServiceIsMetered,
        })
      }

      setSuccessMessage(t('landlordRoomDetailServiceAddSuccess'))
      setSelectedExistingServiceId('')
      setNewServiceName('')
      setNewServicePrice('')
      setIsAddFormOpen(false)

      const updated = await loadData()
      if (updated) onServicesChange?.(updated)
      onSuccess?.()
    } catch (err: unknown) {
      setErrorMessage(resolveErrorMessage(err, tErrors, t('landlordRoomDetailServiceAddFailed')))
    } finally {
      setIsActionLoading(false)
    }
  }

  // Start editing a service
  const handleOpenEdit = (service: RoomServiceDetailItem) => {
    setEditingService(service)
    setEditName(service.name)
    setEditPrice(String(service.numericPrice ?? service.price))
    setEditUnit(service.unit)
    setEditIsMetered(service.isMetered)
    setErrorMessage(null)
  }

  // Save edited service
  const handleSaveEdit = async () => {
    if (!editingService) return
    const trimmedName = editName.trim()
    if (!trimmedName) return
    const parsedPrice = parseFloat(editPrice.replace(/[^\d.]/g, '')) || 0

    setIsActionLoading(true)
    setErrorMessage(null)
    try {
      await updateRoomService(boardingHouseId, roomId, editingService.id, {
        name: trimmedName,
        price: parsedPrice,
        unit: editUnit,
        isMetered: editIsMetered,
      })
      setSuccessMessage(t('landlordRoomDetailServiceUpdateSuccess'))
      setEditingService(null)
      const updated = await loadData()
      if (updated) onServicesChange?.(updated)
      onSuccess?.()
    } catch (err: unknown) {
      setErrorMessage(resolveErrorMessage(err, tErrors, t('landlordRoomDetailServiceUpdateFailed')))
    } finally {
      setIsActionLoading(false)
    }
  }

  // Confirm delete service
  const handleConfirmDelete = async () => {
    if (!deletingService) return

    setIsActionLoading(true)
    setErrorMessage(null)
    try {
      await deleteRoomService(boardingHouseId, roomId, deletingService.id)
      setSuccessMessage(t('landlordRoomDetailServiceRemoveSuccess'))
      setDeletingService(null)
      const updated = await loadData()
      if (updated) onServicesChange?.(updated)
      onSuccess?.()
    } catch (err: unknown) {
      setErrorMessage(resolveErrorMessage(err, tErrors, t('landlordRoomDetailServiceRemoveFailed')))
    } finally {
      setIsActionLoading(false)
    }
  }

  const serviceUnitOptions = SERVICE_UNIT_DEFINITIONS.map(u => ({
    value: u.value,
    label: locale === 'en' ? u.labelEn : u.labelVi,
  }))

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleRequestClose} size="2xl">
        <Modal.Header
          title={t('landlordRoomDetailServiceModalTitle', { roomNumber })}
          icon={
            <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
          }
        />

        <Modal.Body className="space-y-4 max-h-[75vh] overflow-y-auto">
          {/* NOTICE BANNER */}
          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <Text size="xs" weight="black" color="brand">
                {t('landlordRoomDetailServiceNoticeTitle')}
              </Text>
              <Text size="xs" color="secondary" className="leading-relaxed">
                {t('landlordRoomDetailServiceNoticeDesc')}
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

          {/* LIST HEADER BAR WITH ADD SERVICE BUTTON */}
          <div className="flex items-center justify-between gap-3 pb-1 border-b border-line">
            <Text size="sm" weight="black" color="default">
              {t('landlordRoomDetailServiceListTitle', { count: currentServices.length })}
            </Text>
            <Button
              size="sm"
              variant={isAddFormOpen ? 'outline' : 'primary'}
              onClick={() => {
                if (isAddFormOpen) {
                  setIsAddFormOpen(false)
                  setSelectedExistingServiceId('')
                  setNewServiceName('')
                  setNewServicePrice('')
                } else {
                  setIsAddFormOpen(true)
                  setAddSource(availableServices.length > 0 ? 'existing' : 'custom')
                }
              }}
              leftIcon={isAddFormOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            >
              {isAddFormOpen
                ? t('landlordRoomDetailServiceBtnCancel')
                : t('landlordRoomDetailServiceBtnAdd')}
            </Button>
          </div>

          {/* INLINE ADD SERVICE FORM */}
          {isAddFormOpen && (
            <form
              onSubmit={handleAddService}
              className="p-4 bg-surface/60 border border-line rounded-xl space-y-3.5 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <Text size="xs" weight="black" color="default">
                  {t('landlordRoomDetailServiceAddFormTitle')}
                </Text>
              </div>

              {/* Source Selector (Select Existing from House vs Create Custom) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={addSource === 'existing' ? 'primary' : 'outline'}
                  onClick={() => setAddSource('existing')}
                  disabled={availableServices.length === 0}
                  className="w-full text-xs"
                >
                  {t('landlordRoomDetailServiceSourceExisting', {
                    count: availableServices.length,
                  })}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={addSource === 'custom' ? 'primary' : 'outline'}
                  onClick={() => setAddSource('custom')}
                  className="w-full text-xs"
                >
                  {t('landlordRoomDetailServiceSourceCustom')}
                </Button>
              </div>

              {/* Source 1: Existing Service from Boarding House */}
              {addSource === 'existing' ? (
                <div className="space-y-3 pt-1">
                  <SelectInput
                    label={t('landlordRoomDetailServiceSelectExistingLabel')}
                    placeholder={t('landlordRoomDetailServiceSelectExistingPlaceholder')}
                    value={selectedExistingServiceId}
                    onChange={e => setSelectedExistingServiceId(e.target.value)}
                    disabled={isActionLoading || availableServices.length === 0}
                    options={availableServices.map(s => ({
                      value: s.id,
                      label: `${s.name} (${Number(s.price).toLocaleString('vi-VN')} đ/${s.unit})`,
                      description: s.isMetered
                        ? t('landlordRoomDetailServiceMeteredBadge')
                        : t('landlordRoomDetailServiceFixedBadge'),
                    }))}
                  />
                  {availableServices.length === 0 && (
                    <Text size="xs" color="secondary">
                      {t('landlordRoomDetailServiceNoAvailableToAdd')}
                    </Text>
                  )}
                </div>
              ) : (
                /* Source 2: Create New Custom Service */
                <div className="space-y-3 pt-1">
                  <TextInput
                    label={t('landlordRoomDetailServiceNameLabel')}
                    placeholder={t('landlordRoomDetailServiceNameInputPlaceholder')}
                    value={newServiceName}
                    onChange={e => setNewServiceName(e.target.value)}
                    disabled={isActionLoading}
                    required
                    autoFocus
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <TextInput
                      label={t('landlordRoomDetailServicePriceLabel')}
                      placeholder={t('landlordRoomDetailServicePricePlaceholder')}
                      value={newServicePrice}
                      onChange={e => setNewServicePrice(e.target.value)}
                      disabled={isActionLoading}
                      required
                    />

                    <SelectInput
                      label={t('landlordRoomDetailServiceUnitLabel')}
                      value={newServiceUnit}
                      onChange={e => {
                        const val = e.target.value
                        setNewServiceUnit(val)
                        const def = serviceUnitOptions.find(opt => opt.value === val)
                        if (def && (val === 'kWh' || val === 'm³')) {
                          setNewServiceIsMetered(true)
                        }
                      }}
                      disabled={isActionLoading}
                      options={serviceUnitOptions}
                    />
                  </div>

                  <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newServiceIsMetered}
                      onChange={e => setNewServiceIsMetered(e.target.checked)}
                      disabled={isActionLoading}
                      className="w-4 h-4 rounded text-primary focus:ring-primary/20 border-line"
                    />
                    <Text size="xs" weight="bold" color="default">
                      {t('landlordRoomDetailServiceMeteredLabel')}
                    </Text>
                  </label>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setIsAddFormOpen(false)
                    setSelectedExistingServiceId('')
                    setNewServiceName('')
                    setNewServicePrice('')
                  }}
                  disabled={isActionLoading}
                >
                  {t('landlordRoomDetailServiceBtnCancel')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={
                    isActionLoading ||
                    (addSource === 'existing' && !selectedExistingServiceId) ||
                    (addSource === 'custom' && (!newServiceName.trim() || !newServicePrice.trim()))
                  }
                  isLoading={isActionLoading}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  {t('landlordRoomDetailServiceBtnSubmit')}
                </Button>
              </div>
            </form>
          )}

          {/* CURRENT SERVICES LIST */}
          <div className="space-y-3 min-h-[160px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-secondary space-y-2">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <Text size="xs">{t('commonLoading')}</Text>
              </div>
            ) : currentServices.length === 0 ? (
              <EmptyState
                icon={<Banknote className="w-8 h-8 text-secondary" />}
                title={t('landlordRoomDetailServiceEmpty')}
                action={
                  !isAddFormOpen ? (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setIsAddFormOpen(true)
                        setAddSource(availableServices.length > 0 ? 'existing' : 'custom')
                      }}
                      leftIcon={<Plus className="w-4 h-4" />}
                    >
                      {t('landlordRoomDetailServiceBtnAdd')}
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-card">
                {currentServices.map(item => (
                  <div
                    key={item.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-surface/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-surface border border-line flex items-center justify-center text-primary shrink-0">
                        {item.isMetered ? (
                          <Zap className="w-4 h-4 text-warning" />
                        ) : (
                          <Layers className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Text size="sm" weight="bold" color="default" className="truncate">
                          {item.name}
                        </Text>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Text size="xs" weight="black" color="brand">
                            {Number(item.price).toLocaleString('vi-VN')} đ/{item.unit}
                          </Text>
                          {item.isMetered ? (
                            <Chip size="sm" variant="warning" preventHover>
                              {t('landlordRoomDetailServiceMeteredBadge')}
                            </Chip>
                          ) : (
                            <Chip size="sm" variant="info" preventHover>
                              {t('landlordRoomDetailServiceFixedBadge')}
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
                        onClick={() => setDeletingService(item)}
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

      {/* SUB-MODAL 1: EDIT SERVICE */}
      <Modal isOpen={editingService !== null} onClose={handleCloseEditModal} size="md">
        <Modal.Header
          title={t('landlordRoomDetailServiceEditModalTitle')}
          icon={<Edit2 className="w-5 h-5 text-primary" />}
        />
        <Modal.Body className="space-y-4 max-h-[75vh] overflow-y-auto">
          <TextInput
            label={t('landlordRoomDetailServiceNameLabel')}
            value={editName}
            onChange={e => setEditName(e.target.value)}
            disabled={isActionLoading}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextInput
              label={t('landlordRoomDetailServicePriceLabel')}
              value={editPrice}
              onChange={e => setEditPrice(e.target.value)}
              disabled={isActionLoading}
              required
            />

            <SelectInput
              label={t('landlordRoomDetailServiceUnitLabel')}
              value={editUnit}
              onChange={e => {
                const val = e.target.value
                setEditUnit(val)
                if (val === 'kWh' || val === 'm³') {
                  setEditIsMetered(true)
                }
              }}
              disabled={isActionLoading}
              options={serviceUnitOptions}
            />
          </div>

          <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={editIsMetered}
              onChange={e => setEditIsMetered(e.target.checked)}
              disabled={isActionLoading}
              className="w-4 h-4 rounded text-primary focus:ring-primary/20 border-line"
            />
            <Text size="xs" weight="bold" color="default">
              {t('landlordRoomDetailServiceMeteredLabel')}
            </Text>
          </label>
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
          <Button
            variant="primary"
            size="md"
            onClick={handleSaveEdit}
            disabled={!editName.trim() || !editPrice.trim() || isActionLoading}
            isLoading={isActionLoading}
            className="w-full sm:w-auto"
          >
            {t('landlordRoomDetailSaveChangesBtn')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* SUB-MODAL 2: CONFIRM DELETE/DETACH SERVICE */}
      <Modal
        isOpen={deletingService !== null}
        onClose={() => setDeletingService(null)}
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
                {t('landlordRoomDetailServiceDeleteConfirm')}
              </Text>
              <Text size="xs" color="secondary" className="mt-1">
                {deletingService?.name} ({Number(deletingService?.price).toLocaleString('vi-VN')} đ/
                {deletingService?.unit})
              </Text>
              <Text size="2xs" color="secondary" className="mt-1">
                {t('landlordRoomDetailServiceDeleteDesc')}
              </Text>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex-col-reverse sm:flex-row sm:justify-end items-stretch sm:items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => setDeletingService(null)}
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
