import * as React from 'react'
import { cn } from '@/lib/utils'

import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
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
  fullWidth?: boolean
  rounded?: 'default' | 'full'
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
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-bold transition-all duration-150 active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
          {
            // Variants
            'bg-primary text-white hover:bg-primary-hover active:opacity-90 shadow-2xs shadow-primary/20':
              variant === 'primary',
            'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 active:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700':
              variant === 'secondary',
            'border border-zinc-200 bg-transparent text-zinc-900 hover:bg-zinc-100 active:bg-zinc-200 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900':
              variant === 'outline',
            'bg-transparent hover:bg-zinc-100 active:bg-zinc-200 text-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900':
              variant === 'ghost',
            'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-2xs shadow-rose-600/20':
              variant === 'danger',
            'bg-[#FF6B35] text-white hover:bg-[#e85a26] active:opacity-90 shadow-2xs shadow-[#FF6B35]/20':
              variant === 'accent' || variant === 'orange',
            'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-2xs shadow-emerald-600/20':
              variant === 'success',
            'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 shadow-2xs shadow-amber-500/20':
              variant === 'warning',
            'bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-950 dark:bg-zinc-100 dark:text-zinc-900':
              variant === 'dark',
            'bg-white text-zinc-900 border border-zinc-200/80 hover:bg-zinc-50 shadow-xs active:bg-zinc-100':
              variant === 'white',

            // Sizes (default rounded applied per size if rounded !== 'full')
            'h-7 px-2.5 text-xs gap-1.5 rounded-lg': size === 'xs',
            'h-9 px-3 text-xs sm:text-sm gap-2 rounded-xl': size === 'sm',
            'h-10 px-4 py-2 text-sm sm:text-base gap-2 rounded-xl': size === 'md',
            'h-12 px-6 text-base gap-2.5 rounded-2xl': size === 'lg',
            'h-14 px-8 text-base sm:text-lg gap-3 rounded-2xl': size === 'xl',
            'h-6 w-6 p-0 shrink-0 rounded-lg': size === 'icon-xs',
            'h-8 w-8 p-0 shrink-0 rounded-lg': size === 'icon-sm',
            'h-10 w-10 p-0 shrink-0 rounded-xl': size === 'icon',
            'h-12 w-12 p-0 shrink-0 rounded-2xl': size === 'icon-lg',

            // Full width & Pill shape
            'w-full': fullWidth,
            'rounded-full': rounded === 'full',
          },
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    )
  },
)

Button.displayName = 'Button'
