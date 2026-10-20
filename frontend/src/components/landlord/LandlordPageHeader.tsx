import React from 'react'
import { Text } from '@/components/ui'
import { cn } from '@/lib/utils'

export interface LandlordPageHeaderProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function LandlordPageHeader({
  title,
  subtitle,
  actions,
  className,
}: LandlordPageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4',
        className,
      )}
    >
      <div>
        {typeof title === 'string' ? (
          <Text as="h1" size="4xl" weight="black" className="tracking-tight">
            {title}
          </Text>
        ) : (
          title
        )}
        {subtitle &&
          (typeof subtitle === 'string' ? (
            <Text variant="subtitle" size="sm" color="secondary" className="mt-0.5">
              {subtitle}
            </Text>
          ) : (
            subtitle
          ))}
      </div>
      {actions && (
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  )
}
