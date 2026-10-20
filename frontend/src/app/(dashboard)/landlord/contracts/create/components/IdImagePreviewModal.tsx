'use client'

import React from 'react'
import { IdCard, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { useContractCreate } from '../context/ContractCreateContext'

export function IdImagePreviewModal() {
  const { previewModalImg, setPreviewModalImg } = useContractCreate()

  if (!previewModalImg) return null

  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in"
      onClick={() => setPreviewModalImg(null)}
    >
      <div
        className="relative bg-zinc-900 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-zinc-800 animate-in zoom-in-95 p-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-white">
          <div className="flex items-center gap-2">
            <IdCard className="w-5 h-5 text-primary" />
            <span className="text-sm font-bold">{previewModalImg.title}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setPreviewModalImg(null)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="mt-3 flex items-center justify-center bg-zinc-950 rounded-2xl overflow-hidden min-h-[260px] max-h-[70vh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewModalImg.url}
            alt={previewModalImg.title}
            className="w-full h-full object-contain max-h-[68vh]"
          />
        </div>
      </div>
    </div>
  )
}

