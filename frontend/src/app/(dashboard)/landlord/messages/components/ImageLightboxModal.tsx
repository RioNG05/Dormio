'use client'

import React from 'react'
import { X } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { Button } from '@/components/ui'

interface ImageLightboxModalProps {
  imageUrl: string | null
  onClose: () => void
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({ imageUrl, onClose }) => {
  const t = useTranslations('landlord')

  if (!imageUrl) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
        <Button
          rounded="full"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="absolute -top-10 right-0"
        >
          <X />
        </Button>
        <img
          src={imageUrl}
          alt={t('landlordMessagesImagePreviewAlt')}
          className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
        />
      </div>
    </div>
  )
}

