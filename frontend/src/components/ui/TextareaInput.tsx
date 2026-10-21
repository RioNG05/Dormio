import * as React from 'react'
import { cn } from '@/lib/utils'
import { Text } from './Text'

export interface TextareaInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  required?: boolean
  error?: string
  helperText?: string
  containerClassName?: string
  labelClassName?: string
}

export const TextareaInput = React.forwardRef<HTMLTextAreaElement, TextareaInputProps>(
  (
    {
      label,
      required = false,
      error,
      helperText,
      containerClassName,
      labelClassName,
      className,
      disabled,
      rows = 3,
      id,
      ...props
    },
    ref,
  ) => {
    const textareaId =
      id || (label ? `area-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined)

    return (
      <div className={cn('space-y-1.5 w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
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

        <textarea
          ref={ref}
          id={textareaId}
          required={required}
          disabled={disabled}
          rows={rows}
          className={cn(
            'w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all outline-none resize-y',
            'placeholder:text-muted dark:placeholder:text-slate-500 placeholder:font-normal',
            disabled
              ? 'bg-zinc-100 dark:bg-surface text-zinc-500 dark:text-slate-500 border-zinc-200 dark:border-line cursor-not-allowed select-none shadow-none'
              : error
                ? 'bg-input border-rose-400 dark:border-rose-500/80 text-rose-900 dark:text-rose-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                : 'bg-input border-zinc-200 dark:border-line text-zinc-800 dark:text-foreground hover:border-zinc-300 dark:hover:border-primary/50 focus:border-primary dark:focus:border-primary focus:ring-2 focus:ring-primary/20',
            className,
          )}
          {...props}
        />

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

TextareaInput.displayName = 'TextareaInput'
