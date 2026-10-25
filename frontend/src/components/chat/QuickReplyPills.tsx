'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui'

export interface QuickReplyPillsProps {
  replies: string[]
  onSelect: (reply: string) => void
  disabled?: boolean
  label?: string
}

export const QuickReplyPills: React.FC<QuickReplyPillsProps> = ({
  replies,
  onSelect,
  disabled = false,
  label = 'Gợi ý nhanh',
}) => {
  if (!replies || replies.length === 0) return null

  return (
    <div className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-card-hover/80 border-t border-line flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar shrink-0">
      <span className="text-[10px] font-black text-muted uppercase tracking-wider shrink-0 flex items-center gap-1">
        <Sparkles className="w-3.5 h-3.5 text-accent" />
        {label}:
      </span>
      {replies.map((reply, idx) => (
        <Button
          key={idx}
          variant="ghost"
          onClick={() => onSelect(reply)}
          disabled={disabled}
          className="shrink-0 text-xs font-semibold py-1 px-2.5 rounded-lg border border-line bg-card hover:bg-card-hover"
        >
          {reply}
        </Button>
      ))}
    </div>
  )
}

