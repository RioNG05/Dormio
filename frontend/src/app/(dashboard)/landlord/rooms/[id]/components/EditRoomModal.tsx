'use client'

import React, { useState, useEffect } from 'react'
import { Edit, Plus, Trash2, Banknote, AlertTriangle } from 'lucide-react'
import {
  Button,
  TextInput,
  TextareaInput,
  Checkbox,
  Text,
  Modal,
  SelectInput,
} from '@/components/ui'
import { useLanguage, useTranslations } from '@/context/LanguageContext'
import { getServiceUnitOptions } from '@/constants/service-units'
import { Room, defaultRoomServices } from '../../data'
import { RoomCustomServiceItem } from './types'
import { getAmenityLabel } from './RoomSidebar'

interface EditRoomModalProps {
  isOpen: boolean
  room: Room
  initialServices?: RoomCustomServiceItem[]
  onClose: () => void
  onSave: (data: {
    roomNumber: string
    price: string
    area: string
    floor: string
    amenities: string[]
    services: RoomCustomServiceItem[]
    notes: string
  }) => Promise<void>
}

const ALL_AMENITIES = [
  'WiFi',
  'Điều hòa',
  'Nóng lạnh',
  'Tủ quần áo',
  'Giường',
  'Kệ bếp',
  'Ban công',
  'WC riêng',
  'Máy giặt',
  'Tivi',
  'Tủ lạnh',
  'Bảo vệ',
]

export const EditRoomModal: React.FC<EditRoomModalProps> = ({
  isOpen,
  room,
  initialServices,
  onClose,
  onSave,
}) => {
  const t = useTranslations('landlord')
  const { locale } = useLanguage()

  const [roomNumber, setRoomNumber] = useState(room.roomNumber)
  const [price, setPrice] = useState(room.price?.replace(' ₫', '') || '3000000')
  const [area, setArea] = useState(String(room.area || '25'))
  const [floor, setFloor] = useState(String(room.floor || '1'))
  const [amenities, setAmenities] = useState<string[]>(room.amenities || [])
  const [services, setServices] = useState<RoomCustomServiceItem[]>(
    initialServices && initialServices.length > 0 ? initialServices : defaultRoomServices,
  )
  const [notes, setNotes] = useState(room.notes || '')
  const [isSaving, setIsSaving] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  // Sync state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setRoomNumber(room.roomNumber)
      setPrice(room.price?.replace(' ₫', '') || '3000000')
      setArea(String(room.area || '25'))
      setFloor(String(room.floor || '1'))
      setAmenities(room.amenities || [])
      setServices(
        initialServices && initialServices.length > 0 ? initialServices : defaultRoomServices,
      )
      setNotes(room.notes || '')
      setShowDiscardConfirm(false)
    }
  }, [isOpen, room, initialServices])

  // Check if form is dirty
  const isFormDirty = () => {
    const originalPrice = room.price?.replace(' ₫', '') || '3000000'
    const originalArea = String(room.area || '25')
    const originalFloor = String(room.floor || '1')

    return (
      roomNumber !== room.roomNumber ||
      price !== originalPrice ||
      area !== originalArea ||
      floor !== originalFloor ||
      notes !== (room.notes || '') ||
      JSON.stringify(amenities) !== JSON.stringify(room.amenities || [])
    )
  }

  const handleRequestClose = () => {
    if (isFormDirty()) {
      setShowDiscardConfirm(true)
    } else {
      onClose()
    }
  }

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false)
    onClose()
  }

  const handleFormSubmit = async () => {
    try {
      setIsSaving(true)
      await onSave({
        roomNumber: roomNumber.trim(),
        price: price.trim(),
        area: area.trim(),
        floor: floor.trim(),
        amenities,
        services,
        notes: notes.trim(),
      })
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleRequestClose} size="2xl">
        <Modal.Header
          title={t('landlordRoomDetailModalEditRoomTitle').replace(
            '{roomNumber}',
            room.roomNumber,
          )}
          description={t('landlordRoomDetailModalEditRoomDesc')}
          icon={
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Edit className="w-5 h-5" />
            </div>
          }
        />

        <Modal.Body className="overflow-y-auto max-h-[75vh] space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              label={t('landlordRoomDetailRoomNumberLabel')}
              value={roomNumber}
              onChange={e => setRoomNumber(e.target.value)}
            />
            <TextInput
              label={t('landlordRoomDetailRentMonthlyLabel')}
              value={price}
              onChange={e => setPrice(e.target.value)}
            />
            <TextInput
              label={t('landlordRoomDetailAreaLabel')}
              value={area}
              onChange={e => setArea(e.target.value)}
            />
            <TextInput
              label={t('landlordRoomDetailFloorLabel')}
              value={floor}
              onChange={e => setFloor(e.target.value)}
            />
          </div>

          <div>
            <Text as="label" size="xs" weight="bold" color="default" className="block mb-2">
              {t('landlordRoomDetailAmenitiesListLabel')}
            </Text>
            <div className="flex flex-wrap gap-2">
              {ALL_AMENITIES.map(item => (
                <Button
                  key={item}
                  type="button"
                  size="sm"
                  variant={amenities.includes(item) ? 'primary' : 'outline'}
                  className={
                    amenities.includes(item)
                      ? 'bg-primary/10 text-primary border border-primary/40 hover:bg-primary/20 text-xs'
                      : 'bg-card text-muted hover:bg-card-hover text-xs'
                  }
                  onClick={() =>
                    setAmenities(prev =>
                      prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item],
                    )
                  }
                >
                  <Text as="span" size="xs" weight="bold" color="inherit">
                    {getAmenityLabel(item, t)}
                  </Text>
                </Button>
              ))}
            </div>
          </div>

          {/* Cấu hình dịch vụ phòng */}
          <div className="border border-line rounded-xl p-4 bg-surface/50 space-y-3">
            <div className="flex justify-between items-center mb-2">
              <Text
                as="h3"
                weight="bold"
                color="default"
                size="xs"
                className="uppercase tracking-wider flex items-center gap-1.5"
              >
                <Banknote className="w-4 h-4 text-primary" />{' '}
                {t('landlordRoomDetailRecurringServicesTitle')}
              </Text>
              <Text as="span" size="2xs" color="secondary" weight="medium">
                {t('landlordRoomDetailCustomPriceHint')}
              </Text>
            </div>

            <div className="space-y-2.5">
              {services.map(service => (
                <div
                  key={service.id}
                  className="border border-line rounded-xl p-3 bg-card flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    {!service.isRemovable ? (
                      <>
                        <Text as="span" weight="bold" size="xs" color="default">
                          {service.name}
                        </Text>
                        <Text as="span" size="2xs" color="subtle" weight="medium">
                          ({service.unit})
                        </Text>
                      </>
                    ) : (
                      <>
                        <TextInput
                          containerClassName="w-28 space-y-0"
                          className="py-1 text-xs"
                          value={service.name}
                          onChange={e =>
                            setServices(prev =>
                              prev.map(s =>
                                s.id === service.id ? { ...s, name: e.target.value } : s,
                              ),
                            )
                          }
                          placeholder={t('landlordRoomDetailServiceNamePlaceholder')}
                        />
                        <SelectInput
                          containerClassName="w-32 space-y-0"
                          className="py-1 text-xs"
                          value={service.unit}
                          onChange={(e: any) => setServices(prev => prev.map(s => s.id === service.id ? { ...s, unit: e.target.value } : s,
                              ),
                            )
                          }
                          options={getServiceUnitOptions(false, locale)}
                        />
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Checkbox
                      size="sm"
                      label={t('landlordRoomDetailCustomToggle')}
                      checked={Boolean(service.isCustom)}
                      onChange={e =>
                        setServices(prev =>
                          prev.map(s =>
                            s.id === service.id ? { ...s, isCustom: e.target.checked } : s,
                          ),
                        )
                      }
                    />

                    <div className="relative w-28 flex items-center">
                      <TextInput
                        containerClassName="w-full space-y-0"
                        className="py-1 text-xs"
                        value={service.isCustom ? service.customPrice : service.defaultPrice}
                        onChange={e =>
                          setServices(prev =>
                            prev.map(s =>
                              s.id === service.id ? { ...s, customPrice: e.target.value } : s,
                            ),
                          )
                        }
                        disabled={!service.isCustom}
                      />
                    </div>

                    {service.isRemovable && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setServices(prev => prev.filter(s => s.id !== service.id))}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button
              fullWidth
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() =>
                setServices(prev => [
                  ...prev,
                  {
                    id: `custom_${Date.now()}`,
                    name: '',
                    defaultPrice: '0',
                    customPrice: '0',
                    unit: 'phòng/tháng',
                    isCustom: true,
                    isRemovable: true,
                  },
                ])
              }
            >
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('landlordRoomDetailAddCustomService')}
              </Text>
            </Button>
          </div>

          <div>
            <TextareaInput
              label={t('landlordRoomDetailNotesLabel')}
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t('landlordRoomDetailNotesPlaceholder')}
            />
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline" onClick={handleRequestClose}>
            <Text as="span" size="xs" weight="bold" color="inherit">
              {t('landlordRoomDetailModalCancelBtn')}
            </Text>
          </Button>
          <Button onClick={handleFormSubmit} isLoading={isSaving}>
            <Text as="span" size="xs" weight="bold" color="inherit">
              {t('landlordRoomDetailSaveChangesBtn')}
            </Text>
          </Button>
        </Modal.Footer>
      </Modal>

      {/* UNSAVED CHANGES CONFIRMATION MODAL (RULE 10) */}
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
              <Text size="xs" color="secondary" weight="medium">
                {t('landlordRoomDetailConfirmCloseDesc')}
              </Text>
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-2 border-t border-line">
            <Button variant="outline" onClick={() => setShowDiscardConfirm(false)}>
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('landlordRoomDetailConfirmCloseContinue')}
              </Text>
            </Button>
            <Button variant="danger" onClick={handleConfirmDiscard}>
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('landlordRoomDetailConfirmCloseDiscard')}
              </Text>
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  )
}
