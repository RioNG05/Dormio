'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Text } from '@/components/ui'
import { ChevronDown, ChevronRight } from 'lucide-react'

export type DashboardNavTheme = 'brand' | 'orange' | 'accent'

export const navItemThemeStyles: Record<
  DashboardNavTheme,
  {
    active: string
    indicator: string
    icon: string
  }
> = {
  brand: {
    active: 'bg-primary-soft text-primary font-bold shadow-2xs',
    indicator: 'bg-primary',
    icon: 'text-primary',
  },
  orange: {
    active: 'bg-accent-soft text-accent font-bold shadow-2xs',
    indicator: 'bg-accent',
    icon: 'text-accent',
  },
  accent: {
    active: 'bg-accent-soft text-accent font-bold shadow-2xs',
    indicator: 'bg-accent',
    icon: 'text-accent',
  },
}

export const navRoleTagStyles: Record<
  DashboardNavTheme,
  {
    badge: string
    icon: string
  }
> = {
  brand: {
    badge: 'flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-soft border border-primary-subtle',
    icon: 'w-3.5 h-3.5 text-primary',
  },
  orange: {
    badge: 'flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-soft border border-accent-subtle',
    icon: 'w-3.5 h-3.5 text-accent',
  },
  accent: {
    badge: 'flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-soft border border-accent-subtle',
    icon: 'w-3.5 h-3.5 text-accent',
  },
}

export const navBadgeStyles = {
  default:
    'inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-3xs font-black text-white bg-danger shadow-2xs shrink-0',
  small:
    'inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-3xs font-black text-white bg-danger shadow-2xs shrink-0',
}

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
  /** Color theme: 'brand' (default teal) or 'orange' / 'accent' (admin) */
  theme?: DashboardNavTheme
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
    const themeConfig = navItemThemeStyles[theme] || navItemThemeStyles.brand

    const itemClasses = cn(
      'relative flex items-center justify-between w-full px-3 py-2.5 text-sm rounded-xl font-medium transition-all duration-150 select-none group',
      isActive
        ? themeConfig.active
        : 'text-muted hover:bg-card-hover hover:text-foreground',
      className,
    )

    const renderIcon = () => {
      if (!icon) return null
      const iconClass = cn(
        'w-4.5 h-4.5 shrink-0 transition-colors',
        isActive ? themeConfig.icon : 'text-muted group-hover:text-foreground',
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
          className={cn(navBadgeStyles.default, 'animate-in zoom-in-75 duration-150')}
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
                'absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full transition-colors',
                themeConfig.indicator,
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
  color?: DashboardNavTheme | 'subtle'
  className?: string
}

export function DashboardNavSectionHeader({
  icon: Icon,
  title,
  color = 'brand',
  className,
}: DashboardNavSectionHeaderProps) {
  const isAccent = color === 'orange' || color === 'accent'
  const isSubtle = color === 'subtle'
  const iconColor = isSubtle
    ? 'text-muted'
    : isAccent
      ? 'text-accent'
      : 'text-primary'
  const textColor = isSubtle ? 'subtle' : isAccent ? 'orange' : 'brand'

  const renderSectionIcon = () => {
    if (!Icon) return null
    if (React.isValidElement(Icon)) return Icon
    if (
      typeof Icon === 'function' ||
      (typeof Icon === 'object' && Icon !== null && '$$typeof' in (Icon as any))
    ) {
      const IconComp = Icon as React.ElementType
      return <IconComp className={cn('w-3.5 h-3.5 shrink-0', iconColor)} />
    }
    return null
  }

  return (
    <div className={cn('px-3 pt-1 pb-2 flex items-center gap-1.5', className)}>
      {renderSectionIcon()}
      <Text as="span" variant="overline" color={textColor}>
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
          <span className={navBadgeStyles.small}>
            {typeof badge === 'number' && badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <div className="text-muted group-hover:text-foreground transition-transform duration-200">
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </div>
    </button>
  )
}
