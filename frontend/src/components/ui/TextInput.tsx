import * as React from 'react'
import { cn } from '@/lib/utils'
import { Text } from './Text'

export interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: React.ReactNode
  labelRight?: React.ReactNode
  required?: boolean
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  containerClassName?: string
  labelClassName?: string
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      labelRight,
      required = false,
      error,
      helperText,
      leftIcon,
      rightIcon,
      containerClassName,
      labelClassName,
      className,
      disabled,
      id,
      ...props
    },
    ref,
  ) => {
    // Generate fallback unique ID if not provided
    const reactGeneratedId = React.useId()
    const inputId = id || reactGeneratedId

    return (
      <div className={cn('space-y-1.5 w-full', containerClassName)}>
        {(label || labelRight) && (
          <div className="flex items-center justify-between gap-2">
            {label && (
              <label
                htmlFor={inputId}
                className={cn(
                  'block text-xs font-bold text-zinc-700 dark:text-slate-200 select-none',
                  disabled && 'text-zinc-400 dark:text-slate-500 cursor-not-allowed',
                  labelClassName,
                )}
              >
                <Text as="span" size="xs" weight="bold" color="inherit">
                  {label}
                </Text>
                {required && (
                  <Text as="span" size="xs" weight="bold" color="danger" className="ml-1">
                    *
                  </Text>
                )}
              </label>
            )}
            {labelRight && <div className="shrink-0">{labelRight}</div>}
          </div>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-zinc-400 dark:text-slate-400 shrink-0">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            required={required}
            disabled={disabled}
            className={cn(
              'w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all outline-none',
              'placeholder:text-muted dark:placeholder:text-slate-500 placeholder:font-normal',
              leftIcon ? 'pl-9' : '',
              rightIcon ? 'pr-9' : '',
              disabled
                ? 'bg-zinc-100 dark:bg-surface text-zinc-500 dark:text-slate-500 border-zinc-200 dark:border-line cursor-not-allowed select-none shadow-none'
                : error
                  ? 'bg-white dark:bg-input border-rose-400 dark:border-rose-500/80 text-rose-900 dark:text-rose-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'bg-white dark:bg-input border-zinc-200 dark:border-line text-zinc-800 dark:text-foreground hover:border-zinc-300 dark:hover:border-primary/50 focus:border-[#2AC1BC] dark:focus:border-[#2AC1BC] focus:ring-2 focus:ring-[#2AC1BC]/20',
              className,
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 flex items-center text-muted shrink-0">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <Text as="p" size="2xs" weight="medium" color="danger" className="animate-in fade-in">
            {error}
          </Text>
        ) : helperText ? (
          <Text as="p" size="2xs" color="subtle">
            {helperText}
          </Text>
        ) : null}
      </div>
    )
  },
)

TextInput.displayName = 'TextInput'
