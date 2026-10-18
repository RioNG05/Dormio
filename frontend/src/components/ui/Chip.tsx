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
    'bg-[#2AC1BC] text-white border-[#2AC1BC] shadow-2xs shadow-[#2AC1BC]/20 hover:bg-[#25ad87] hover:text-white',
  neutral:
    'bg-zinc-900 text-white border-zinc-900 shadow-2xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 hover:text-white',
  success:
    'bg-emerald-600 text-white border-emerald-600 shadow-2xs hover:bg-emerald-700 hover:text-white',
  warning:
    'bg-amber-500 text-white border-amber-500 shadow-2xs hover:bg-amber-600 hover:text-white',
  danger:
    'bg-rose-600 text-white border-rose-600 shadow-2xs hover:bg-rose-700 hover:text-white',
  info:
    'bg-blue-600 text-white border-blue-600 shadow-2xs hover:bg-blue-700 hover:text-white',
  purple:
    'bg-purple-600 text-white border-purple-600 shadow-2xs hover:bg-purple-700 hover:text-white',
}

const inactiveVariantStyles: Record<ChipVariant, string> = {
  default:
    'bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border-zinc-200/80 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700',
  neutral:
    'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900 border-transparent dark:bg-zinc-800 dark:text-zinc-300',
  success:
    'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
  warning:
    'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
  danger:
    'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
  info:
    'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
  purple:
    'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60',
}

const sizeStyles: Record<ChipSize, string> = {
  sm: 'h-auto px-2.5 py-1 text-xs gap-1.5 rounded-xl',
  md: 'h-auto px-3 py-1.5 text-xs gap-1.5 rounded-xl',
  lg: 'h-auto px-3.5 py-2 text-sm gap-2 rounded-2xl',
}

const badgeSizeStyles: Record<ChipSize, string> = {
  sm: 'px-1.5 py-0.2 text-[10px]',
  md: 'px-1.5 py-0.5 text-[10px]',
  lg: 'px-2 py-0.5 text-xs',
}

const inactiveBadgeColorStyles: Record<ChipVariant, string> = {
  default: 'bg-zinc-200/80 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200',
  neutral: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200',
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
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2AC1BC]/40',
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
              isSelected ? 'bg-white/20 text-white' : inactiveBadgeColorStyles[variant],
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
              isSelected && 'hover:bg-white/25',
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

