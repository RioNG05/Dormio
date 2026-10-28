import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  /** Display label for the breadcrumb step */
  label: React.ReactNode
  /** Target link href. If omitted, item is rendered as the current inactive/terminal text */
  href?: string
  /** Custom icon (defaults to ArrowLeft for the first item with an href) */
  icon?: React.ReactNode
  /** Tooltip or title attribute */
  title?: string
  /** Custom class for this individual item */
  className?: string
  /** Click handler for this item (e.g. to intercept navigation when form is dirty) */
  onClick?: (e: React.MouseEvent) => void
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  /** Structured array of breadcrumb items (ideal for 2, 3+ level hierarchies) */
  items?: BreadcrumbItem[]

  /** Shorthand for standard 2-level detail pages: URL of parent list */
  backHref?: string
  /** Shorthand: Label of parent back link */
  backLabel?: React.ReactNode
  /** Shorthand: Current / active item text */
  current?: React.ReactNode

  /** Custom separator icon (defaults to ChevronRight w-3.5 h-3.5) */
  separator?: React.ReactNode
  /** Whether to render ArrowLeft icon on the primary back link (default: true) */
  showBackIcon?: boolean

  /**
   * Layout behavior on mobile screens:
   * - 'wrap' (default): Wraps naturally onto multiple lines
   * - 'scroll': Stays single-line and scrolls horizontally on small screens
   */
  overflowMode?: 'wrap' | 'scroll'

  /** Click handler for the back link (e.g. to show unsaved changes confirmation) */
  onBack?: (e: React.MouseEvent) => void
}

/**
 * Standardized Breadcrumb navigation component for Dormio detail and wizard pages.
 * Handles responsive wrapping/scrolling, touch targets, and dark/light mode themes.
 */
export function Breadcrumb({
  items,
  backHref,
  backLabel,
  current,
  separator,
  showBackIcon = true,
  overflowMode = 'wrap',
  onBack,
  className,
  ...props
}: BreadcrumbProps) {
  // Normalize items from either shorthand or explicit items array
  const resolvedItems: BreadcrumbItem[] = React.useMemo(() => {
    if (items && items.length > 0) {
      return items
    }
    const list: BreadcrumbItem[] = []
    if (backHref && backLabel) {
      list.push({
        label: backLabel,
        href: backHref,
        icon: showBackIcon ? <ArrowLeft className="w-3.5 h-3.5 shrink-0" /> : undefined,
      })
    }
    if (current) {
      list.push({
        label: current,
      })
    }
    return list
  }, [items, backHref, backLabel, current, showBackIcon])

  if (resolvedItems.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'text-xs font-bold text-muted dark:text-muted min-w-0',
        overflowMode === 'scroll'
          ? 'overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'
          : 'w-full',
        className,
      )}
      {...props}
    >
      <ol
        className={cn(
          'flex items-center gap-1.5 sm:gap-2 list-none p-0 m-0 min-w-0',
          overflowMode === 'wrap' ? 'flex-wrap' : 'flex-nowrap shrink-0',
        )}
      >
        {resolvedItems.map((item, index) => {
          const isLast = index === resolvedItems.length - 1
          const isFirst = index === 0

          // Default back icon on first item if it has an href and no custom icon was provided
          const itemIcon =
            item.icon !== undefined
              ? item.icon
              : isFirst && item.href && showBackIcon
                ? <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                : null

          // Derive fallback title for native tooltips if label is string
          const tooltipTitle =
            item.title || (typeof item.label === 'string' ? item.label : undefined)

          return (
            <React.Fragment key={index}>
              {index > 0 && (
                <li
                  aria-hidden="true"
                  className="flex items-center text-line dark:text-muted/60 shrink-0 select-none"
                >
                  {separator || (
                    <ChevronRight className="w-3.5 h-3.5 text-line dark:text-muted/60 shrink-0" />
                  )}
                </li>
              )}
              <li className={cn('flex items-center min-w-0', item.className)}>
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    title={tooltipTitle}
                    onClick={e => {
                      if (item.onClick) {
                        item.onClick(e)
                      }
                      if (isFirst && onBack) {
                        onBack(e)
                      }
                    }}
                    className={cn(
                      'hover:text-primary dark:hover:text-primary flex items-center gap-1 transition-colors cursor-pointer',
                      'py-1 -my-1 px-1 -mx-1 sm:p-0 rounded-xs',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background dark:focus-visible:ring-offset-card',
                      'min-w-0',
                    )}
                  >
                    {itemIcon}
                    <span className="truncate max-w-[120px] xs:max-w-[160px] sm:max-w-none">
                      {item.label}
                    </span>
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? 'page' : undefined}
                    title={tooltipTitle}
                    className="text-foreground dark:text-foreground font-extrabold truncate min-w-0 max-w-[180px] xs:max-w-[240px] sm:max-w-md md:max-w-lg lg:max-w-xl"
                  >
                    {item.label}
                  </span>
                )}
              </li>
            </React.Fragment>
          )
        })}
      </ol>
    </nav>
  )
}

Breadcrumb.displayName = 'Breadcrumb'

export default Breadcrumb
