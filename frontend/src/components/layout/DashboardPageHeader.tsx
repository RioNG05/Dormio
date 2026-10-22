import React from 'react'
import { Text } from '@/components/ui'
import { cn } from '@/lib/utils'

export interface DashboardPageHeaderProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  badge?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function DashboardPageHeader({
  title,
  subtitle,
  badge,
  actions,
  className,
}: DashboardPageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4',
        className,
      )}
    >
      <div>
        {badge && <div className="mb-2">{badge}</div>}
        {typeof title === 'string' ? (
          <Text as="h1" size="3xl" weight="black" className="tracking-tight sm:text-4xl">
            {title}
          </Text>
        ) : (
          title
        )}
        {subtitle &&
          (typeof subtitle === 'string' ? (
            <Text variant="subtitle" size="sm" color="secondary" className="mt-0.5 leading-relaxed">
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

// Backward-compatibility alias
export { DashboardPageHeader as LandlordPageHeader }
export type { DashboardPageHeaderProps as LandlordPageHeaderProps }
export default DashboardPageHeader

