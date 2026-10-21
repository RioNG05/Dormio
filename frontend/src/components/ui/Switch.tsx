'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Text } from './Text'

export type SwitchSize = 'sm' | 'md' | 'lg'
export type SwitchVariant = 'primary' | 'success' | 'accent' | 'neutral'

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'size'> {
  /** Controlled checked state */
  checked?: boolean
  /** Initial checked state when uncontrolled */
  defaultChecked?: boolean
  /** Callback fired when state changes with the next boolean value */
  onCheckedChange?: (checked: boolean) => void
  /** Alternative callback for standard onChange compatibility */
  onChange?: (checked: boolean) => void
  /** Size variant */
  size?: SwitchSize
  /** Color theme variant for checked state */
  variant?: SwitchVariant
  /** Optional label displayed next to the switch */
  label?: React.ReactNode
  /** Secondary description displayed below the label */
  description?: React.ReactNode
  /** Explanatory helper text displayed below */
  helperText?: React.ReactNode
  /** Error message string or boolean error state */
  error?: string | boolean
  /** Placement of label relative to the switch */
  labelPosition?: 'left' | 'right'
  /** Accessible screen-reader label when no visible label is used */
  srLabel?: string
  /** Whether the switch is in a loading/transitioning state */
  isLoading?: boolean
  /** Additional classes for the container wrapper */
  containerClassName?: string
  /** Additional classes for the label text wrapper */
  labelClassName?: string
  /** Additional classes for the sliding thumb */
  thumbClassName?: string
}

const sizeConfig = {
  sm: {
    track: 'w-9 h-5 p-0.5',
    thumb: 'w-4 h-4',
    translate: 'translate-x-4',
    loader: 'w-2.5 h-2.5',
    text: 'xs',
    desc: '2xs',
  },
  md: {
    track: 'w-11 h-6 p-0.5',
    thumb: 'w-5 h-5',
    translate: 'translate-x-5',
    loader: 'w-3 h-3',
    text: 'sm',
    desc: 'xs',
  },
  lg: {
    track: 'w-14 h-7 p-0.5',
    thumb: 'w-6 h-6',
    translate: 'translate-x-7',
    loader: 'w-3.5 h-3.5',
    text: 'base',
    desc: 'xs',
  },
} as const

const variantStyles: Record<SwitchVariant, string> = {
  primary: 'bg-primary hover:bg-primary-hover border-primary/20 shadow-xs shadow-primary/25',
  success: 'bg-success hover:bg-success/90 border-success/20 shadow-xs shadow-success/25',
  accent: 'bg-accent hover:bg-accent-hover border-accent/20 shadow-xs shadow-accent/25',
  neutral: 'bg-foreground hover:bg-foreground/90 border-foreground/20 shadow-xs',
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      id,
      checked,
      defaultChecked = false,
      onCheckedChange,
      onChange,
      onClick,
      disabled = false,
      size = 'md',
      variant = 'primary',
      label,
      description,
      helperText,
      error,
      labelPosition = 'right',
      srLabel,
      isLoading = false,
      title,
      className,
      containerClassName,
      labelClassName,
      thumbClassName,
      ...props
    },
    forwardedRef,
  ) => {
    const generatedId = React.useId()
    const switchId = id || generatedId

    const isControlled = checked !== undefined
    const [internalChecked, setInternalChecked] = React.useState<boolean>(defaultChecked)
    const isChecked = isControlled ? Boolean(checked) : internalChecked

    const hasError = Boolean(error)
    const errorMessage = typeof error === 'string' ? error : undefined
    const config = sizeConfig[size]
    const isDisabled = disabled || isLoading

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) {
        e.preventDefault()
        return
      }

      const nextChecked = !isChecked
      if (!isControlled) {
        setInternalChecked(nextChecked)
      }

      onCheckedChange?.(nextChecked)
      onChange?.(nextChecked)
      onClick?.(e)
    }

    const switchButton = (
      <button
        ref={forwardedRef}
        id={switchId}
        type="button"
        role="switch"
        aria-checked={isChecked}
        aria-disabled={isDisabled}
        disabled={isDisabled}
        onClick={handleClick}
        title={title}
        className={cn(
          'relative inline-flex shrink-0 cursor-pointer rounded-full border transition-colors duration-200 ease-in-out',
          'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background',
          isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          config.track,
          isChecked
            ? variantStyles[variant]
            : 'bg-slate-200 hover:bg-slate-300/80 border-slate-300/70 dark:bg-slate-700/80 dark:hover:bg-slate-600 dark:border-slate-600',
          className,
        )}
        {...props}
      >
        <span className="sr-only">
          {srLabel || title || (typeof label === 'string' ? label : 'Toggle switch')}
        </span>
        <span
          className={cn(
            'pointer-events-none flex items-center justify-center rounded-full bg-white dark:bg-slate-100 shadow-xs ring-0 transition-transform duration-200 ease-in-out',
            config.thumb,
            isChecked ? config.translate : 'translate-x-0',
            thumbClassName,
          )}
        >
          {isLoading && (
            <Loader2 className={cn('animate-spin text-muted', config.loader)} />
          )}
        </span>
      </button>
    )

    if (!label && !description && !helperText && !error) {
      return switchButton
    }

    return (
      <div className={cn('flex flex-col gap-1', containerClassName)}>
        <label
          htmlFor={switchId}
          onClick={e => {
            // Prevent toggling when clicking inside nested interactive elements
            if ((e.target as HTMLElement).closest('a, button:not([role="switch"])')) {
              e.stopPropagation()
            }
          }}
          className={cn(
            'group inline-flex select-none transition-all',
            description ? 'items-start gap-2.5' : 'items-center gap-2.5',
            isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
            labelPosition === 'left' && 'flex-row-reverse justify-between w-full',
            labelClassName,
          )}
        >
          {switchButton}
          {(label || description) && (
            <div className="flex flex-col">
              {label && (
                <Text
                  as="span"
                  size={config.text as any}
                  weight="semibold"
                  className={cn(
                    'text-foreground group-hover:text-foreground/90 transition-colors',
                    isDisabled && 'text-muted',
                  )}
                >
                  {label}
                </Text>
              )}
              {description && (
                <Text
                  as="span"
                  size={config.desc as any}
                  color="muted"
                  className="mt-0.5"
                >
                  {description}
                </Text>
              )}
            </div>
          )}
        </label>
        {hasError && errorMessage && (
          <Text as="span" size="xs" color="danger" className="mt-0.5">
            {errorMessage}
          </Text>
        )}
        {!hasError && helperText && (
          <Text as="span" size="xs" color="muted" className="mt-0.5">
            {helperText}
          </Text>
        )}
      </div>
    )
  },
)

Switch.displayName = 'Switch'
