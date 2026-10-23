'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Text } from '@/components/ui'
import { ChevronDown, ChevronRight } from 'lucide-react'

export interface DashboardNavItemProps {
  /** Target URL. If provided, renders Next.js Link; otherwise renders <button type="button"> */
  href?: string
  /** Click handler */
  onClick?: (e: React.MouseEvent) => void
  /** Navigation icon (Lucide component or React element) */
  icon?: React.ElementType | React.ReactNode
  /** Display label / title */
  label: React.ReactNode
  /** Whether the nav item is currently active */
  isActive?: boolean
  /** Unread notification count or badge text/number */
  badge?: React.ReactNode | number | string
  /** Color theme: 'brand' (default teal) or 'orange' (admin) */
  theme?: 'brand' | 'orange'
  /** Optional custom right element (e.g. Chevron icon for collapsible groups) */
  rightElement?: React.ReactNode
  /** Optional className */
  className?: string
  /** Accessible title attribute */
  title?: string
  /** Prevents page scroll jump on Next.js Link click */
  scroll?: boolean
}

export const DashboardNavItem = React.forwardRef<
  HTMLAnchorElement | HTMLButtonElement,
  DashboardNavItemProps
>(
  (
    {
      href,
      onClick,
      icon,
      label,
      isActive = false,
      badge,
      theme = 'brand',
      rightElement,
      className,
      title,
      scroll = false,
    },
    ref,
  ) => {
    const isOrange = theme === 'orange'

    const itemClasses = cn(
      'relative flex items-center justify-between w-full px-3 py-2.5 text-sm rounded-xl font-medium transition-all duration-150 select-none group',
      isActive
        ? isOrange
          ? 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 font-bold shadow-2xs'
          : 'bg-primary/10 text-primary dark:bg-primary/15 font-bold shadow-2xs'
        : 'text-muted hover:bg-card-hover hover:text-foreground',
      className,
    )

    const renderIcon = () => {
      if (!icon) return null
      const iconClass = cn(
        'w-4.5 h-4.5 shrink-0 transition-colors',
        isActive
          ? isOrange
            ? 'text-orange-600 dark:text-orange-400'
            : 'text-primary'
          : 'text-muted group-hover:text-foreground',
      )

      if (React.isValidElement(icon)) {
        return React.cloneElement(icon as React.ReactElement<any>, {
          className: cn(iconClass, (icon.props as any)?.className),
          strokeWidth: (icon.props as any)?.strokeWidth ?? (isActive ? 2.2 : 1.75),
        })
      }

      const IconComp = icon as React.ElementType
      return <IconComp className={iconClass} strokeWidth={isActive ? 2.2 : 1.75} />
    }

    const renderBadge = () => {
      if (badge === undefined || badge === null || badge === false) return null
      const badgeContent = typeof badge === 'number' && badge > 99 ? '99+' : badge
      return (
        <span
          className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-black text-white bg-danger shadow-2xs animate-in zoom-in-75 duration-150 shrink-0"
          aria-label={`${badge} unread`}
        >
          {badgeContent}
        </span>
      )
    }

    const content = (
      <>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {isActive && (
            <span
              className={cn(
                'absolute left-0 top-1/2 -translate-y-1/2 w-[3.5px] h-5 rounded-r-full transition-colors',
                isOrange ? 'bg-orange-500' : 'bg-primary',
              )}
              aria-hidden="true"
            />
          )}
          {renderIcon()}
          <Text
            as="span"
            size="sm"
            weight={isActive ? 'bold' : 'medium'}
            color="inherit"
            className="truncate"
          >
            {label}
          </Text>
        </div>

        {(badge !== undefined && badge !== null && badge !== false) || rightElement ? (
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {renderBadge()}
            {rightElement}
          </div>
        ) : null}
      </>
    )

    if (href) {
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          scroll={scroll}
          className={itemClasses}
          title={title}
        >
          {content}
        </Link>
      )
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        onClick={onClick}
        className={itemClasses}
        title={title}
      >
        {content}
      </button>
    )
  },
)

DashboardNavItem.displayName = 'DashboardNavItem'

/* -------------------------------------------------------------------------- */
/*                        DashboardNavSectionHeader                           */
/* -------------------------------------------------------------------------- */

export interface DashboardNavSectionHeaderProps {
  icon?: React.ElementType | React.ReactNode
  title: string
  color?: 'brand' | 'orange' | 'subtle'
  className?: string
}

export function DashboardNavSectionHeader({
  icon: Icon,
  title,
  color = 'brand',
  className,
}: DashboardNavSectionHeaderProps) {
  const isOrange = color === 'orange'

  const renderSectionIcon = () => {
    if (!Icon) return null
    if (React.isValidElement(Icon)) return Icon
    if (
      typeof Icon === 'function' ||
      (typeof Icon === 'object' && Icon !== null && '$$typeof' in (Icon as any))
    ) {
      const IconComp = Icon as React.ElementType
      return (
        <IconComp
          className={cn(
            'w-3.5 h-3.5 shrink-0',
            isOrange ? 'text-orange-600' : 'text-primary',
          )}
        />
      )
    }
    return null
  }

  return (
    <div className={cn('px-3 pt-1 pb-2 flex items-center gap-1.5', className)}>
      {renderSectionIcon()}
      <Text as="span" variant="overline" color={isOrange ? 'orange' : 'brand'}>
        {title}
      </Text>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                         DashboardNavGroupToggle                            */
/* -------------------------------------------------------------------------- */

export interface DashboardNavGroupToggleProps {
  label: string
  isOpen: boolean
  onToggle: () => void
  badge?: number | string
  className?: string
}

export function DashboardNavGroupToggle({
  label,
  isOpen,
  onToggle,
  badge,
  className,
}: DashboardNavGroupToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold text-muted hover:text-foreground hover:bg-card-hover/60 transition-colors cursor-pointer select-none group',
        className,
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Text
          as="span"
          variant="overline"
          weight="bold"
          color="subtle"
          className="group-hover:text-foreground transition-colors"
        >
          {label}
        </Text>
        {!isOpen && Boolean(badge) && (
          <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[9px] font-black text-white bg-danger shadow-2xs">
            {typeof badge === 'number' && badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <div className="text-muted group-hover:text-foreground transition-transform duration-200">
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5" />
        )}
      </div>
    </button>
  )
}
