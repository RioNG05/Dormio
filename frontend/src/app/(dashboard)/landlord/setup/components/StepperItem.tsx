'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Text, Button } from '@/components/ui'
import type { WizardStep } from '../types'

export interface StepperItemProps {
  stepNumber: WizardStep
  currentStep: WizardStep
  stepLabel: string
  title: string
  desc: string
  icon: React.ReactNode
  onClick: () => void
}

export function StepperItem({
  stepNumber,
  currentStep,
  stepLabel,
  title,
  desc,
  icon,
  onClick,
}: StepperItemProps) {
  const isCompleted = currentStep > stepNumber
  const isActive = currentStep === stepNumber

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        'flex items-center justify-start gap-3 p-3 rounded-2xl border text-left transition-all h-auto cursor-pointer',
        isActive
          ? 'border-primary bg-primary/5 hover:bg-primary/10 shadow-xs'
          : isCompleted
            ? 'border-line bg-card hover:bg-card-hover'
            : 'border-line bg-surface/50 hover:bg-zinc-50/50 opacity-60',
      )}
    >
      <div
        className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
          isCompleted
            ? 'bg-success text-white'
            : isActive
              ? 'bg-primary text-white shadow-sm'
              : 'bg-line text-muted',
        )}
      >
        {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : icon}
      </div>
      <div className="min-w-0 hidden sm:block">
        <div className="flex items-center gap-1.5">
          <Text as="span" variant="overline" size="3xs" color="subtle">
            {stepLabel} {stepNumber}
          </Text>
        </div>
        <Text as="p" size="xs" weight="black" truncate color={isActive ? 'default' : 'secondary'}>
          {title}
        </Text>
        <Text as="p" size="3xs" color="subtle" weight="medium" truncate>
          {desc}
        </Text>
      </div>
    </Button>
  )
}
