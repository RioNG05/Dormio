'use client'

import React, { useState } from 'react'
import { Wrench } from 'lucide-react'
import { Button, TextInput, TextareaInput, SelectInput, Text, Modal } from '@/components/ui'
import { useTranslations } from '@/context/LanguageContext'

interface ReportIncidentModalProps {
  isOpen: boolean
  roomNumber: string
  onClose: () => void
  onSubmit: (data: {
    title: string
    description?: string
    priority: 'Mức độ cao' | 'Mức độ trung bình' | 'Mức độ nhẹ'
  }) => void
}

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  isOpen,
  roomNumber,
  onClose,
  onSubmit,
}) => {
  const t = useTranslations('landlord')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'Mức độ cao' | 'Mức độ trung bình' | 'Mức độ nhẹ'>(
    'Mức độ trung bình',
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
    })

    setTitle('')
    setDescription('')
    setPriority('Mức độ trung bình')
  }

  const handleClose = () => {
    setTitle('')
    setDescription('')
    setPriority('Mức độ trung bình')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      asForm
      onSubmit={handleSubmit}
    >
      <Modal.Header
        title={t('landlordRoomDetailModalIncidentTitle')}
        description={t('landlordRoomDetailModalIncidentDesc').replace(
          '{roomNumber}',
          roomNumber,
        )}
        icon={
          <div className="p-2 bg-accent rounded-xl text-white">
            <Wrench className="w-5 h-5" />
          </div>
        }
        className="bg-accent/10"
      />

      <Modal.Body className="space-y-4">
        <TextInput
          label={t('landlordRoomDetailIncidentNameLabel')}
          required
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={t('landlordRoomDetailIncidentNamePlaceholder')}
        />

        <TextareaInput
          label={t('landlordRoomDetailIncidentDescLabel')}
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={t('landlordRoomDetailIncidentDescPlaceholder')}
        />

        <SelectInput
          label={t('landlordRoomDetailPriorityLabel')}
          value={priority}
          onChange={e =>
            setPriority(e.target.value as 'Mức độ cao' | 'Mức độ trung bình' | 'Mức độ nhẹ')
          }
          options={[
            { value: 'Mức độ nhẹ', label: t('landlordRoomDetailPriorityLow') },
            { value: 'Mức độ trung bình', label: t('landlordRoomDetailPriorityMedium') },
            { value: 'Mức độ cao', label: t('landlordRoomDetailPriorityHighUrgent') },
          ]}
        />
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline" onClick={handleClose}>
          <Text as="span" size="xs" weight="bold" color="inherit">
            {t('landlordRoomDetailModalCancelBtn')}
          </Text>
        </Button>
        <Button variant="orange" type="submit">
          <Text as="span" size="xs" weight="bold" color="inherit">
            {t('landlordRoomDetailSendIncidentBtn')}
          </Text>
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

