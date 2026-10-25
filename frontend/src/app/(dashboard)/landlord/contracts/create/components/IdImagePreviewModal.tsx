'use client'

import React from 'react'
import { IdCard } from 'lucide-react'
import { Modal } from '@/components/ui'
import { useContractCreate } from '../context/ContractCreateContext'

export function IdImagePreviewModal() {
  const { previewModalImg, setPreviewModalImg } = useContractCreate()

  if (!previewModalImg) return null

  return (
    <Modal
      isOpen={Boolean(previewModalImg)}
      onClose={() => setPreviewModalImg(null)}
      size="2xl"
      title={previewModalImg.title}
      icon={<IdCard className="w-5 h-5 text-primary" />}
      bodyClassName="p-2 sm:p-4"
    >
      <div className="flex items-center justify-center bg-surface border border-line rounded-2xl overflow-hidden min-h-[240px] max-h-[70vh]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewModalImg.url}
          alt={previewModalImg.title}
          className="w-full h-full object-contain max-h-[68vh] rounded-xl"
        />
      </div>
    </Modal>
  )
}
