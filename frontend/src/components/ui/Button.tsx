import * as React from 'react'
import { cn } from '@/lib/utils'

import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'ghost-danger'
    | 'danger'
    | 'accent'
    | 'orange'
    | 'success'
    | 'warning'
    | 'dark'
    | 'white'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean | 'responsive'
  rounded?: 'default' | 'full'
  justify?: 'start' | 'center' | 'between' | 'end'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'sm',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      rounded = 'default',
      justify = 'center',
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const buttonClasses = cn(
      'inline-flex items-center font-bold transition-all duration-150 active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
      {
        // Justify
        'justify-center': justify === 'center',
        'justify-start': justify === 'start',
        'justify-between': justify === 'between',
        'justify-end': justify === 'end',

        // Variants
        'bg-primary text-white hover:bg-primary-hover active:opacity-90 shadow-2xs shadow-primary/20':
          variant === 'primary',
        'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 active:bg-zinc-300 dark:bg-surface dark:text-foreground dark:border dark:border-line dark:hover:bg-card-hover':
          variant === 'secondary',
        'border border-zinc-200 bg-transparent text-zinc-900 hover:bg-zinc-100 active:bg-zinc-200 dark:border-line dark:text-foreground dark:hover:bg-card-hover':
          variant === 'outline',
        'bg-transparent hover:bg-zinc-100 active:bg-zinc-200 text-zinc-700 dark:text-slate-200 dark:hover:bg-card-hover':
          variant === 'ghost',
        'bg-transparent hover:bg-rose-50 active:bg-rose-100 text-rose-600 dark:hover:bg-rose-950/20 dark:text-rose-400':
          variant === 'ghost-danger',
        'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-2xs shadow-rose-600/20':
          variant === 'danger',
        'bg-[#FF6B35] text-white hover:bg-[#e85a26] dark:hover:bg-[#ff8252] active:opacity-90 shadow-2xs shadow-[#FF6B35]/20':
          variant === 'accent' || variant === 'orange',
        'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-2xs shadow-emerald-600/20':
          variant === 'success',
        'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 shadow-2xs shadow-amber-500/20':
          variant === 'warning',
        'bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-950 dark:bg-primary dark:text-white dark:hover:bg-primary-hover':
          variant === 'dark',
        'bg-white text-zinc-900 border border-zinc-200/80 hover:bg-zinc-50 shadow-xs active:bg-zinc-100 dark:bg-card dark:text-foreground dark:border-line dark:hover:bg-card-hover':
          variant === 'white',

        // Sizes (default rounded applied per size if rounded !== 'full')
        'h-6 px-2 text-xs gap-1.2 rounded-lg': size === 'xs',
        'h-7 px-2.5 text-xs gap-1.5 rounded-lg': size === 'sm',
        'h-9 px-3 text-xs sm:text-sm gap-2 rounded-xl': size === 'md',
        'h-10 px-4 py-2 text-base sm:text-base gap-2 rounded-xl': size === 'lg',
        'h-12 px-6 text-base gap-2.5 rounded-2xl': size === 'xl',
        'h-6 w-6 p-0 shrink-0 rounded-lg': size === 'icon-xs',
        'h-8 w-8 p-0 shrink-0 rounded-lg': size === 'icon-sm',
        'h-10 w-10 p-0 shrink-0 rounded-xl': size === 'icon',
        'h-12 w-12 p-0 shrink-0 rounded-2xl': size === 'icon-lg',

        // Full width & Pill shape
        'w-full': fullWidth === true,
        'w-full sm:w-auto': fullWidth === 'responsive',
        'rounded-full': rounded === 'full',
      },
      className,
    )

    const content = (
      <>
        {justify === 'between' ? (
          <span className="inline-flex items-center gap-2 min-w-0">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              leftIcon && <span className="shrink-0">{leftIcon}</span>
            )}
            {children}
          </span>
        ) : (
          <>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              leftIcon && <span className="shrink-0">{leftIcon}</span>
            )}
            {children}
          </>
        )}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </>
    )

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={buttonClasses}
        {...props}
      >
        {content}
      </button>
    )
  },
)

Button.displayName = 'Button'
