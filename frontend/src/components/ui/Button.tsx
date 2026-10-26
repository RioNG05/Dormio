import * as React from 'react'
import Link from 'next/link'
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
  /** Left icon. Button automatically manages sizing (w-* / h-*) and shrink-0. DO NOT pass manual size classes. */
  leftIcon?: React.ReactNode
  /** Right icon. Button automatically manages sizing (w-* / h-*) and shrink-0. DO NOT pass manual size classes. */
  rightIcon?: React.ReactNode
  fullWidth?: boolean | 'responsive'
  rounded?: 'default' | 'full'
  justify?: 'start' | 'center' | 'between' | 'end'
  /** Prevents a button click from triggering interactive parent elements. */
  preventPropagation?: boolean
  /** Prevents the browser default action. Defaults to false. */
  preventDefault?: boolean
  /** Next.js navigation route or external URL. When present, renders as Next.js Link. */
  href?: string
  target?: string
  rel?: string
  replace?: boolean
  scroll?: boolean
  prefetch?: boolean
}

const iconSizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
  'icon-xs': 'w-3.5 h-3.5',
  'icon-sm': 'w-4 h-4',
  icon: 'w-5 h-5',
  'icon-lg': 'w-6 h-6',
}

const cleanIconClassName = (className?: string): string => {
  if (!className) return ''
  return className
    .split(/\s+/)
    .filter(cls => !/^(w-|h-|size-)/.test(cls))
    .join(' ')
}

export const Button = React.forwardRef<any, ButtonProps>(
  (
    {
      className,
      href,
      variant = 'primary',
      size = 'sm',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      rounded = 'default',
      justify = 'center',
      preventPropagation = true,
      preventDefault = false,
      onClick,
      children,
      disabled,
      type = 'button',
      target,
      rel,
      replace,
      scroll,
      prefetch,
      ...props
    },
    ref,
  ) => {
    const isIconSize =
      size === 'icon' || size === 'icon-xs' || size === 'icon-sm' || size === 'icon-lg'

    const buttonClasses = cn(
      'relative inline-flex items-center font-bold transition-all duration-150 active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
      {
        // Justify
        'justify-center': justify === 'center',
        'justify-start': justify === 'start',
        'justify-between': justify === 'between',
        'justify-end': justify === 'end',

        // Variants
        'bg-primary text-white hover:bg-primary-hover active:opacity-90 shadow-2xs shadow-primary/20':
          variant === 'primary',
        'bg-surface text-foreground border border-line hover:bg-card-hover active:opacity-80':
          variant === 'secondary',
        'border border-line bg-transparent text-foreground hover:bg-card-hover active:bg-surface':
          variant === 'outline',
        'bg-transparent hover:bg-card-hover active:bg-surface text-foreground':
          variant === 'ghost',
        'bg-transparent hover:bg-danger-soft active:opacity-80 text-danger':
          variant === 'ghost-danger',
        'bg-danger text-white hover:bg-danger-hover active:opacity-90 shadow-2xs shadow-danger/20':
          variant === 'danger',
        'bg-accent text-white hover:bg-accent-hover active:opacity-90 shadow-2xs shadow-accent/20':
          variant === 'accent' || variant === 'orange',
        'bg-success text-white hover:opacity-90 active:opacity-80 shadow-2xs shadow-success/20':
          variant === 'success',
        'bg-warning text-white hover:opacity-90 active:opacity-80 shadow-2xs shadow-warning/20':
          variant === 'warning',
        'bg-foreground text-background hover:opacity-90 active:opacity-80 dark:bg-primary dark:text-white dark:hover:bg-primary-hover':
          variant === 'dark',
        'bg-card text-foreground border border-line hover:bg-card-hover shadow-xs active:bg-surface':
          variant === 'white',

        // Sizes (default rounded applied per size if rounded !== 'full')
        'h-6 px-2.5 text-[11px] leading-none gap-2 rounded-lg': size === 'xs',
        'h-7 px-2.5 text-xs gap-1.5 rounded-lg': size === 'sm',
        'h-9 px-3 text-xs sm:text-sm gap-2 rounded-xl': size === 'md',
        'h-10 px-4 py-2 text-base sm:text-base gap-2 rounded-xl': size === 'lg',
        'h-12 px-6 text-base gap-2.5 rounded-2xl': size === 'xl',
        'h-6 w-6 p-0 shrink-0 rounded-full': size === 'icon-xs',
        'h-8 w-8 p-0 shrink-0 rounded-full': size === 'icon-sm',
        'h-10 w-10 p-0 shrink-0 rounded-full': size === 'icon',
        'h-12 w-12 p-0 shrink-0 rounded-full': size === 'icon-lg',

        // Full width & Pill shape
        'w-full': fullWidth === true,
        'w-full sm:w-auto': fullWidth === 'responsive',
        'rounded-full': rounded === 'full' || isIconSize,
      },
      className,
    )

    const targetIconSize = iconSizeClasses[size] || 'w-4 h-4'

    const renderIcon = (icon: React.ReactNode, isStandalone = false) => {
      if (!icon) return null

      if (React.isValidElement(icon)) {
        const iconElement = icon as React.ReactElement<any>

        // If it's a custom container element (e.g. badge wrapper with its own children)
        if (
          typeof iconElement.type === 'string' &&
          iconElement.type !== 'svg' &&
          Boolean(iconElement.props?.children)
        ) {
          return (
            <span className="shrink-0 inline-flex items-center justify-center pointer-events-none">
              {iconElement}
            </span>
          )
        }

        const baseClass = cleanIconClassName(iconElement.props?.className)
        const cloned = React.cloneElement(iconElement, {
          className: cn(baseClass, targetIconSize, 'shrink-0'),
        })

        if (isStandalone) {
          return cloned
        }

        return (
          <span className="shrink-0 inline-flex items-center justify-center pointer-events-none">
            {cloned}
          </span>
        )
      }

      return <span className="shrink-0 inline-flex items-center justify-center pointer-events-none">{icon}</span>
    }

    const loaderIcon = <Loader2 className={cn('animate-spin shrink-0', targetIconSize)} />

    const content = (
      <>
        {justify === 'between' ? (
          <span className="inline-flex items-center gap-2 min-w-0">
            {isLoading ? loaderIcon : renderIcon(leftIcon)}
            {children}
          </span>
        ) : isIconSize ? (
          isLoading ? (
            loaderIcon
          ) : leftIcon ? (
            renderIcon(leftIcon, true)
          ) : React.isValidElement(children) ? (
            renderIcon(children, true)
          ) : (
            children
          )
        ) : (
          <>
            {isLoading ? loaderIcon : renderIcon(leftIcon)}
            {children}
          </>
        )}
        {!isLoading && !isIconSize && renderIcon(rightIcon)}
      </>
    )

    if (href) {
      return (
        <Link
          ref={ref}
          href={href}
          target={target}
          rel={rel}
          replace={replace}
          scroll={scroll}
          prefetch={prefetch}
          className={cn(buttonClasses, (disabled || isLoading) && 'pointer-events-none opacity-50')}
          onClick={event => {
            if (preventPropagation) event.stopPropagation()
            if (preventDefault) event.preventDefault()
            onClick?.(event as any)
          }}
          {...(props as any)}
        >
          {content}
        </Link>
      )
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={buttonClasses}
        onClick={event => {
          const isInsideLink = Boolean((event.currentTarget as HTMLElement).closest('a'))
          if (preventDefault) event.preventDefault()
          if (preventPropagation && !isInsideLink) event.stopPropagation()
          onClick?.(event)
        }}
        {...props}
      >
        {content}
      </button>
    )
  },
)

Button.displayName = 'Button'
