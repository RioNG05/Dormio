import * as React from 'react'
import { cn } from '@/lib/utils'
import { Text } from './Text'

export interface NumberInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size'
> {
  label?: string
  required?: boolean
  error?: string
  helperText?: string
  prefixText?: string
  suffixText?: string
  containerClassName?: string
  labelClassName?: string
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      label,
      required = false,
      error,
      helperText,
      prefixText,
      suffixText,
      containerClassName,
      labelClassName,
      className,
      disabled,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || (label ? `num-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined)

    return (
      <div className={cn('space-y-1.5 w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
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

        <div className="relative flex items-center">
          {prefixText && (
            <div className="absolute left-3 flex items-center pointer-events-none shrink-0">
              <Text as="span" size="xs" weight="bold" color="subtle">
                {prefixText}
              </Text>
            </div>
          )}

          <input
            ref={ref}
            type="number"
            id={inputId}
            required={required}
            disabled={disabled}
            className={cn(
              'w-full rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-all outline-none',
              prefixText ? 'pl-8' : '',
              suffixText ? 'pr-14' : '',
              disabled
                ? 'bg-surface text-muted border-line cursor-not-allowed select-none shadow-none'
                : error
                  ? 'bg-input border-danger text-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
                  : 'bg-input border-line text-foreground hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20',
              className,
            )}
            {...props}
          />

          {suffixText && (
            <div className="absolute right-3 flex items-center pointer-events-none shrink-0">
              <Text as="span" size="xs" weight="medium" color="subtle">
                {suffixText}
              </Text>
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

NumberInput.displayName = 'NumberInput'
