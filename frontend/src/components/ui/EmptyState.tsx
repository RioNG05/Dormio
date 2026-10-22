'use client'

import React from 'react'
import Link from 'next/link'
import { FolderOpen } from 'lucide-react'
import { Text } from './Text'
import { Button } from './Button'

export interface EmptyActionConfig {
  label: React.ReactNode
  onClick?: () => void
  href?: string
  variant?: 'primary' | 'outline' | 'secondary' | 'ghost'
}

export interface EmptyStateProps {
  icon?: React.ReactNode | React.ElementType
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode | EmptyActionConfig
  secondaryAction?: React.ReactNode | EmptyActionConfig
  className?: string
  bordered?: boolean
  size?: 'sm' | 'md' | 'lg'
}

function renderAction(
  act?: React.ReactNode | EmptyActionConfig,
  defaultVariant: 'primary' | 'outline' = 'primary'
) {
  if (!act) return null
  if (React.isValidElement(act)) return act
  if (typeof act === 'object' && act !== null && 'label' in act) {
    const config = act as EmptyActionConfig
    if (config.href) {
      return (
        <Link href={config.href}>
          <Button size="sm" variant={config.variant || defaultVariant} onClick={config.onClick}>
            {config.label}
          </Button>
        </Link>
      )
    }
    return (
      <Button size="sm" variant={config.variant || defaultVariant} onClick={config.onClick}>
        {config.label}
      </Button>
    )
  }
  return act as React.ReactNode
}

function renderIcon(icon?: React.ReactNode | React.ElementType, iconClass = 'w-6 h-6') {
  if (!icon) return <FolderOpen className={iconClass} />
  if (React.isValidElement(icon)) return icon
  if (
    typeof icon === 'function' ||
    (typeof icon === 'object' && icon !== null && ('render' in (icon as any) || '$$typeof' in (icon as any)))
  ) {
    const IconComp = icon as React.ElementType
    return <IconComp className={iconClass} />
  }
  return icon as React.ReactNode
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
  bordered = true,
  size = 'md',
}: EmptyStateProps) {
  const sizeClasses = {
    sm: 'p-6 gap-3',
    md: 'p-8 sm:p-12 gap-4',
    lg: 'p-10 sm:p-16 gap-5',
  }[size]

  const iconSizes = {
    sm: 'w-10 h-10 rounded-xl',
    md: 'w-14 h-14 rounded-2xl',
    lg: 'w-16 h-16 rounded-3xl',
  }[size]

  const iconSvgSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }[size]

  return (
    <div
      className={`w-full flex flex-col items-center justify-center text-center transition-all ${
        bordered ? 'bg-card border border-line rounded-3xl shadow-xs' : ''
      } ${sizeClasses} ${className}`}
    >
      <div
        className={`${iconSizes} bg-card-hover border border-line text-muted flex items-center justify-center shrink-0 mb-1`}
      >
        {renderIcon(icon, iconSvgSizes)}
      </div>

      <div className="space-y-1 max-w-md mx-auto">
        {typeof title === 'string' ? (
          <Text
            as="h3"
            size={size === 'sm' ? 'sm' : 'base'}
            weight="bold"
            className="text-foreground tracking-tight"
          >
            {title}
          </Text>
        ) : (
          title
        )}

        {description &&
          (typeof description === 'string' ? (
            <Text size="xs" color="subtle" className="leading-relaxed">
              {description}
            </Text>
          ) : (
            description
          ))}
      </div>

      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          {renderAction(action, 'primary')}
          {renderAction(secondaryAction, 'outline')}
        </div>
      )}
    </div>
  )
}
