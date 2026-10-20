import React from 'react'
import { Building2 } from 'lucide-react'
import { Text, type TextColor } from '@/components/ui'
import { cn } from '@/lib/utils'

export interface LandlordStatChipItem {
  key: string
  label: string
  value: React.ReactNode
  icon: React.ReactNode
  containerClassName?: string
  labelColor?: TextColor
  labelClassName?: string
  valueColor?: TextColor
  valueClassName?: string
}

export interface LandlordStatBannerProps {
  chips: LandlordStatChipItem[]
  watermarkIcon?: React.ReactNode
  className?: string
}

export function LandlordStatBanner({
  chips,
  watermarkIcon = <Building2 className="w-64 h-64" />,
  className,
}: LandlordStatBannerProps) {
  return (
    <div
      className={cn(
        'bg-zinc-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden',
        className,
      )}
    >
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
        {watermarkIcon}
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
        {/* Stat Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:justify-end items-center gap-2.5 sm:gap-3 w-full lg:w-auto mt-4 lg:mt-0">
          {chips.map(chip => (
            <div
              key={chip.key}
              className={cn(
                'flex items-center gap-2.5 sm:gap-3 rounded-2xl border transition-colors backdrop-blur-md w-full',
                chip.containerClassName,
              )}
            >
              {chip.icon}
              <div className="flex flex-col min-w-0">
                <Text
                  variant="overline"
                  size="3xs"
                  weight="bold"
                  color={chip.labelColor}
                  className={chip.labelClassName}
                >
                  {chip.label}
                </Text>
                <Text
                  weight="black"
                  color={chip.valueColor}
                  className={cn('leading-none', chip.valueClassName)}
                >
                  {chip.value}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
