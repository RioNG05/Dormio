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
  disabled?: boolean
  className?: string
}

export function StepperItem({
  stepNumber,
  currentStep,
  stepLabel,
  title,
  desc,
  icon,
  onClick,
  disabled,
  className,
}: StepperItemProps) {
  const isCompleted = currentStep > stepNumber
  const isActive = currentStep === stepNumber

  return (
    <Button
      type="button"
      variant={isActive ? 'outline' : isCompleted ? 'white' : 'ghost'}
      size="sm"
      justify="start"
      fullWidth
      disabled={disabled}
      onClick={onClick}
      aria-current={isActive ? 'step' : undefined}
      leftIcon={
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
      }
      className={cn(
        'gap-3 p-3 rounded-2xl border text-left h-auto font-normal',
        isActive
          ? 'border-primary bg-primary-soft/50 hover:bg-primary-soft shadow-xs text-foreground'
          : isCompleted
            ? 'border-line bg-card hover:bg-card-hover text-foreground'
            : 'border-line bg-surface/50 hover:bg-card-hover opacity-60 text-muted',
        className,
      )}
    >
      <div className="min-w-0 hidden sm:block text-left">
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
