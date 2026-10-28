/* eslint-disable @next/next/no-img-element */
'use client'

import React from 'react'
import { Modal, Button } from '@/components/ui'

export interface ImageLightboxModalProps {
  imageUrl: string | null
  onClose: () => void
  altText?: string
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  imageUrl,
  onClose,
  altText = 'Chi tiết hình ảnh',
}) => {
  return (
    <Modal
      isOpen={Boolean(imageUrl)}
      onClose={onClose}
      size="4xl"
      title={altText}
    >
      <Modal.Body className="p-0 bg-zinc-950 flex items-center justify-center overflow-hidden">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={altText}
            className="max-w-full max-h-[75vh] object-contain"
          />
        )}
      </Modal.Body>
      <Modal.Footer className="flex justify-end">
        <Button size="md" variant="secondary" onClick={onClose}>
          Đóng
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
