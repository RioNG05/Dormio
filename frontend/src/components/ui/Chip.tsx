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
}

/* -------------------------------------------------------------------------- */
/*                                Style Mappings                              */
/* -------------------------------------------------------------------------- */

const activeVariantStyles: Record<ChipVariant, string> = {
  default:
    'bg-primary text-white border-primary shadow-2xs shadow-primary/20 hover:bg-primary-hover hover:border-primary-hover',
  neutral:
    'bg-zinc-900 text-white border-zinc-900 shadow-2xs hover:bg-zinc-800 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100 dark:hover:bg-white dark:hover:text-slate-950',
  success:
    'bg-emerald-600 text-white border-emerald-600 shadow-2xs hover:bg-emerald-700 dark:bg-emerald-600 dark:border-emerald-500 dark:hover:bg-emerald-500',
  warning:
    'bg-amber-500 text-white border-amber-500 shadow-2xs hover:bg-amber-600 dark:bg-amber-500 dark:border-amber-400 dark:hover:bg-amber-400',
  danger:
    'bg-rose-600 text-white border-rose-600 shadow-2xs hover:bg-rose-700 dark:bg-rose-600 dark:border-rose-500 dark:hover:bg-rose-500',
  info:
    'bg-blue-600 text-white border-blue-600 shadow-2xs hover:bg-blue-700 dark:bg-blue-600 dark:border-blue-500 dark:hover:bg-blue-500',
  purple:
    'bg-purple-600 text-white border-purple-600 shadow-2xs hover:bg-purple-700 dark:bg-purple-600 dark:border-purple-500 dark:hover:bg-purple-500',
}

const inactiveVariantStyles: Record<ChipVariant, string> = {
  default:
    'bg-surface text-muted border-line hover:bg-card-hover hover:text-foreground',
  neutral:
    'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200/80 hover:text-zinc-900 dark:bg-surface dark:text-muted dark:border-line dark:hover:bg-card-hover dark:hover:text-foreground',
  success:
    'bg-success-soft text-emerald-700 border-success-subtle hover:bg-emerald-100/70 hover:text-emerald-800 dark:text-success dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300',
  warning:
    'bg-warning-soft text-amber-700 border-warning-subtle hover:bg-amber-100/70 hover:text-amber-800 dark:text-warning dark:hover:bg-amber-950/60 dark:hover:text-amber-300',
  danger:
    'bg-danger-soft text-rose-700 border-danger-subtle hover:bg-rose-100/70 hover:text-rose-800 dark:text-danger dark:hover:bg-rose-950/60 dark:hover:text-rose-300',
  info:
    'bg-info-soft text-blue-700 border-info-subtle hover:bg-blue-100/70 hover:text-blue-800 dark:text-info dark:hover:bg-blue-950/60 dark:hover:text-blue-300',
  purple:
    'bg-deposit-soft text-purple-700 border-deposit-subtle hover:bg-purple-100/70 hover:text-purple-800 dark:text-deposit dark:hover:bg-purple-950/60 dark:hover:text-purple-300',
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
  default: 'bg-zinc-200/80 text-zinc-700 dark:bg-card-hover dark:text-slate-200',
  neutral: 'bg-zinc-200 text-zinc-700 dark:bg-card-hover dark:text-slate-200',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
  danger: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200',
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
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const isSelected = Boolean(active ?? selected)

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        aria-pressed={isSelected}
        className={cn(
          'inline-flex items-center justify-center font-bold border transition-all duration-150 cursor-pointer whitespace-nowrap select-none shrink-0',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          'disabled:pointer-events-none disabled:opacity-50',
          sizeStyles[size],
          isSelected ? activeVariantStyles[variant] : inactiveVariantStyles[variant],
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
              'ml-0.5 -mr-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer',
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

