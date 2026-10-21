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
              'block text-xs font-bold text-foreground select-none',
              disabled && 'text-muted cursor-not-allowed',
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
            'placeholder:text-muted placeholder:font-normal',
            disabled
              ? 'bg-surface text-muted border-line cursor-not-allowed select-none shadow-none'
              : error
                ? 'bg-input border-danger text-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
                : 'bg-input border-line text-foreground hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20',
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
