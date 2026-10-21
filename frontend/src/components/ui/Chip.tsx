import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*                                Types                                       */
/* -------------------------------------------------------------------------- */

export type ChipVariant =
  | 'default'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'

export type ChipSize = 'sm' | 'md' | 'lg'

export interface ChipOption<T = string> {
  value: T
  label: React.ReactNode
  count?: number | string
  variant?: ChipVariant
  icon?: React.ReactNode
  disabled?: boolean
}

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  selected?: boolean
  variant?: ChipVariant
  size?: ChipSize
  count?: number | string
  countClassName?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  onRemove?: (e: React.MouseEvent) => void
  /**
   * When true, disables hover styling, pointer cursor, and hover actions.
   * Useful when using Chip as a non-interactive badge or static label.
   */
  preventHover?: boolean
  /** Alias for preventHover */
  disableHover?: boolean
}

/* -------------------------------------------------------------------------- */
/*                                Style Mappings                              */
/* -------------------------------------------------------------------------- */

const activeVariantStyles: Record<ChipVariant, string> = {
  default: 'bg-primary text-white border-primary shadow-2xs shadow-primary/20',
  neutral: 'bg-foreground text-background border-foreground shadow-2xs',
  success: 'bg-success text-white border-success shadow-2xs',
  warning: 'bg-warning text-white border-warning shadow-2xs',
  danger: 'bg-danger text-white border-danger shadow-2xs',
  info: 'bg-info text-white border-info shadow-2xs',
  purple: 'bg-deposit text-white border-deposit shadow-2xs',
}

const activeHoverStyles: Record<ChipVariant, string> = {
  default: 'hover:bg-primary-hover hover:border-primary-hover',
  neutral: 'hover:opacity-90',
  success: 'hover:opacity-90',
  warning: 'hover:opacity-90',
  danger: 'hover:opacity-90',
  info: 'hover:opacity-90',
  purple: 'hover:opacity-90',
}

const inactiveVariantStyles: Record<ChipVariant, string> = {
  default: 'bg-surface text-muted border-line',
  neutral: 'bg-surface text-muted border-line',
  success: 'bg-success-soft text-success border-success-subtle',
  warning: 'bg-warning-soft text-warning border-warning-subtle',
  danger: 'bg-danger-soft text-danger border-danger-subtle',
  info: 'bg-info-soft text-info border-info-subtle',
  purple: 'bg-deposit-soft text-deposit border-deposit-subtle',
}

const inactiveHoverStyles: Record<ChipVariant, string> = {
  default: 'hover:bg-card-hover hover:text-foreground',
  neutral: 'hover:bg-card-hover hover:text-foreground',
  success: 'hover:opacity-85',
  warning: 'hover:opacity-85',
  danger: 'hover:opacity-85',
  info: 'hover:opacity-85',
  purple: 'hover:opacity-85',
}

const sizeStyles: Record<ChipSize, string> = {
  sm: 'h-auto px-2.5 py-1 text-xs gap-1.5 rounded-xl',
  md: 'h-auto px-3 py-1.5 text-xs gap-1.5 rounded-xl',
  lg: 'h-auto px-3.5 py-2 text-sm gap-2 rounded-2xl',
}

const badgeSizeStyles: Record<ChipSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-1.5 py-0.5 text-[10px]',
  lg: 'px-2 py-0.5 text-xs',
}

const inactiveBadgeColorStyles: Record<ChipVariant, string> = {
  default: 'bg-card-hover text-muted',
  neutral: 'bg-card-hover text-muted',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  purple: 'bg-deposit-soft text-deposit',
}

/* -------------------------------------------------------------------------- */
/*                                Component                                   */
/* -------------------------------------------------------------------------- */

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
      active,
      selected,
      variant = 'default',
      size = 'md',
      count,
      countClassName,
      leftIcon,
      rightIcon,
      onRemove,
      className,
      disabled,
      preventHover = false,
      disableHover = false,
      children,
      type = 'button',
      tabIndex,
      ...props
    },
    ref,
  ) => {
    const isSelected = Boolean(active ?? selected)
    const isHoverPrevented = Boolean(preventHover || disableHover)

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        tabIndex={tabIndex ?? (isHoverPrevented ? -1 : undefined)}
        aria-pressed={isSelected}
        className={cn(
          'inline-flex items-center justify-center font-bold border transition-all duration-150 whitespace-nowrap select-none shrink-0',
          isHoverPrevented
            ? 'cursor-default pointer-events-none'
            : 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          'disabled:pointer-events-none disabled:opacity-50',
          sizeStyles[size],
          isSelected ? activeVariantStyles[variant] : inactiveVariantStyles[variant],
          !isHoverPrevented && (isSelected ? activeHoverStyles[variant] : inactiveHoverStyles[variant]),
          className,
        )}
        {...props}
      >
        {leftIcon && <span className="shrink-0">{leftIcon}</span>}
        <span className="truncate">{children}</span>
        {count !== undefined && count !== null && (
          <span
            className={cn(
              'font-black rounded-md shrink-0 transition-colors whitespace-nowrap',
              badgeSizeStyles[size],
              isSelected
                ? variant === 'neutral'
                  ? 'bg-white/20 text-white dark:bg-black/15 dark:text-slate-900'
                  : 'bg-white/25 text-white'
                : inactiveBadgeColorStyles[variant],
              countClassName,
            )}
          >
            {count}
          </span>
        )}
        {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        {onRemove && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Remove filter"
            onClick={e => {
              e.stopPropagation()
              onRemove(e)
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation()
                onRemove(e as unknown as React.MouseEvent)
              }
            }}
            className={cn(
              'ml-0.5 -mr-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer pointer-events-auto',
              isSelected &&
                (variant === 'neutral' ? 'hover:bg-white/25 dark:hover:bg-black/15' : 'hover:bg-white/25'),
            )}
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>
    )
  },
)

Chip.displayName = 'Chip'

/* -------------------------------------------------------------------------- */
/*                                ChipGroup                                   */
/* -------------------------------------------------------------------------- */

export interface ChipGroupProps<T = string> {
  value?: T
  onChange?: (value: T) => void
  options?: ChipOption<T>[]
  variant?: ChipVariant
  size?: ChipSize
  scrollable?: boolean
  className?: string
  children?: React.ReactNode
}

export function ChipGroup<T = string>({
  value,
  onChange,
  options,
  variant,
  size,
  scrollable = false,
  className,
  children,
}: ChipGroupProps<T>) {
  return (
    <div
      role="group"
      className={cn(
        'flex items-center gap-1.5',
        scrollable
          ? 'overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0'
          : 'flex-wrap',
        className,
      )}
    >
      {options
        ? options.map(option => (
            <Chip
              key={String(option.value)}
              active={value === option.value}
              onClick={() => onChange?.(option.value)}
              variant={option.variant || variant}
              size={size}
              count={option.count}
              leftIcon={option.icon}
              disabled={option.disabled}
            >
              {option.label}
            </Chip>
          ))
        : children}
    </div>
  )
}

ChipGroup.displayName = 'ChipGroup'

export const ChipWithGroup = Object.assign(Chip, {
  Group: ChipGroup,
})

export default ChipWithGroup

