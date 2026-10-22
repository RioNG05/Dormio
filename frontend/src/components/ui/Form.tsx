import * as React from 'react'
import { cn } from '@/lib/utils'
import { AlertTriangle, CheckCircle2, AlertCircle, Info, ChevronDown, X } from 'lucide-react'
import { Button } from './Button'
import { Text } from './Text'

/* -------------------------------------------------------------------------- */
/*                               Form Context                                 */
/* -------------------------------------------------------------------------- */

export interface FormContextValue {
  isLoading?: boolean
  disabled?: boolean
  readOnly?: boolean
  variant?: 'plain' | 'card' | 'modal' | 'compact'
  size?: 'sm' | 'md' | 'lg'
}

const FormContext = React.createContext<FormContextValue>({
  isLoading: false,
  disabled: false,
  readOnly: false,
  variant: 'plain',
  size: 'md',
})

export const useFormContext = () => React.useContext(FormContext)

/* -------------------------------------------------------------------------- */
/*                                Form Root                                   */
/* -------------------------------------------------------------------------- */

export interface FormProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  variant?: 'plain' | 'card' | 'modal' | 'compact'
  isLoading?: boolean
  disabled?: boolean
  readOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
  autoPreventDefault?: boolean
  preventEnterSubmit?: boolean
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>
}

const formVariantClasses: Record<NonNullable<FormProps['variant']>, string> = {
  plain: 'space-y-5 w-full',
  card: 'bg-card rounded-3xl p-5 sm:p-8 border border-line shadow-xs space-y-6 w-full',
  modal: 'space-y-5 w-full',
  compact: 'space-y-3.5 w-full',
}

export const FormRoot = React.forwardRef<HTMLFormElement, FormProps>(
  (
    {
      children,
      className,
      variant = 'plain',
      isLoading = false,
      disabled = false,
      readOnly = false,
      size = 'md',
      autoPreventDefault = true,
      preventEnterSubmit = false,
      onSubmit,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      if (autoPreventDefault) {
        e.preventDefault()
      }
      if (disabled || isLoading) {
        e.preventDefault()
        return
      }
      onSubmit?.(e)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
      if (
        preventEnterSubmit &&
        e.key === 'Enter' &&
        (e.target as HTMLElement).tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
      }
      onKeyDown?.(e)
    }

    const contextValue = React.useMemo<FormContextValue>(
      () => ({
        isLoading,
        disabled,
        readOnly,
        variant,
        size,
      }),
      [isLoading, disabled, readOnly, variant, size],
    )

    return (
      <FormContext.Provider value={contextValue}>
        <form
          ref={ref}
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          className={cn(formVariantClasses[variant], className)}
          {...props}
        >
          {children}
        </form>
      </FormContext.Provider>
    )
  },
)

FormRoot.displayName = 'Form'

/* -------------------------------------------------------------------------- */
/*                               Form Header                                  */
/* -------------------------------------------------------------------------- */

export interface FormHeaderProps {
  title?: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  actions?: React.ReactNode
  bordered?: boolean
  className?: string
  children?: React.ReactNode
}

export const FormHeader: React.FC<FormHeaderProps> = ({
  title,
  description,
  icon,
  actions,
  bordered = true,
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-3',
        bordered && 'border-b border-line pb-4',
        className,
      )}
    >
      <div className="flex items-start sm:items-center gap-3">
        {icon && (
          <div className="p-2 sm:p-2.5 rounded-2xl bg-primary/10 text-primary shrink-0 flex items-center justify-center">
            {icon}
          </div>
        )}
        <div className="space-y-0.5">
          {title &&
            (typeof title === 'string' ? (
              <Text as="h3" size="base" weight="black" color="default" className="sm:text-lg tracking-tight">
                {title}
              </Text>
            ) : (
              title
            ))}
          {description &&
            (typeof description === 'string' ? (
              <Text as="p" size="xs" color="secondary" weight="medium" className="leading-relaxed">
                {description}
              </Text>
            ) : (
              description
            ))}
          {children}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">{actions}</div>
      )}
    </div>
  )
}

FormHeader.displayName = 'FormHeader'

/* -------------------------------------------------------------------------- */
/*                               Form Section                                 */
/* -------------------------------------------------------------------------- */

export interface FormSectionProps {
  title?: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  actions?: React.ReactNode
  divider?: boolean
  collapsible?: boolean
  defaultOpen?: boolean
  className?: string
  headerClassName?: string
  contentClassName?: string
  children: React.ReactNode
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  icon,
  actions,
  divider = false,
  collapsible = false,
  defaultOpen = true,
  className,
  headerClassName,
  contentClassName,
  children,
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  return (
    <section
      className={cn('space-y-4 w-full', divider && 'pt-5 border-t border-line', className)}
    >
      {(title || description || actions || collapsible) && (
        <div
          className={cn(
            'flex items-center justify-between gap-3',
            collapsible && 'cursor-pointer select-none',
            headerClassName,
          )}
          onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}
        >
          <div className="flex items-center gap-2.5">
            {icon && <div className="text-muted shrink-0 flex items-center">{icon}</div>}
            <div>
              {title &&
                (typeof title === 'string' ? (
                  <Text as="h4" size="xs" weight="extrabold" color="default" className="sm:text-sm tracking-tight text-foreground">
                    {title}
                  </Text>
                ) : (
                  title
                ))}
              {description &&
                (typeof description === 'string' ? (
                  <Text as="p" size="2xs" color="subtle" weight="normal">
                    {description}
                  </Text>
                ) : (
                  description
                ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {actions && <div onClick={e => e.stopPropagation()}>{actions}</div>}
            {collapsible && (
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-muted transition-transform duration-200',
                  isOpen && 'transform rotate-180',
                )}
              />
            )}
          </div>
        </div>
      )}

      {(!collapsible || isOpen) && (
        <div className={cn('space-y-4 animate-in fade-in duration-200', contentClassName)}>
          {children}
        </div>
      )}
    </section>
  )
}

FormSection.displayName = 'FormSection'

/* -------------------------------------------------------------------------- */
/*                                Form Grid                                   */
/* -------------------------------------------------------------------------- */

export interface FormGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

const gridColsMap: Record<NonNullable<FormGridProps['cols']>, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
  6: 'grid-cols-1 sm:grid-cols-3 lg:grid-cols-6',
}

const gapMap: Record<NonNullable<FormGridProps['gap']>, string> = {
  none: 'gap-0',
  sm: 'gap-2.5 sm:gap-3',
  md: 'gap-3.5 sm:gap-4.5',
  lg: 'gap-4 sm:gap-6',
  xl: 'gap-6 sm:gap-8',
}

export const FormGrid = React.forwardRef<HTMLDivElement, FormGridProps>(
  ({ cols = 2, gap = 'md', className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('grid w-full items-start', gridColsMap[cols], gapMap[gap], className)}
        {...props}
      >
        {children}
      </div>
    )
  },
)

FormGrid.displayName = 'FormGrid'

/* -------------------------------------------------------------------------- */
/*                                Form Field                                  */
/* -------------------------------------------------------------------------- */

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  colSpan?: 1 | 2 | 3 | 4 | 'full'
  label?: React.ReactNode
  labelRight?: React.ReactNode
  required?: boolean
  error?: string
  helperText?: string
  labelClassName?: string
}

const colSpanMap: Record<NonNullable<FormFieldProps['colSpan']>, string> = {
  1: 'col-span-1',
  2: 'col-span-1 md:col-span-2',
  3: 'col-span-1 md:col-span-2 lg:col-span-3',
  4: 'col-span-1 md:col-span-2 lg:col-span-4',
  full: 'col-span-full',
}

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      colSpan = 1,
      label,
      labelRight,
      required = false,
      error,
      helperText,
      labelClassName,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const hasStandaloneLabel = Boolean(label || labelRight)

    return (
      <div
        ref={ref}
        className={cn(
          'w-full',
          colSpanMap[colSpan],
          hasStandaloneLabel && 'space-y-1.5',
          className,
        )}
        {...props}
      >
        {hasStandaloneLabel && (
          <div className="flex items-center justify-between gap-2">
            {label && (
              <label
                className={cn('block text-xs font-bold text-foreground select-none', labelClassName)}
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

        {children}

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

FormField.displayName = 'FormField'

/* -------------------------------------------------------------------------- */
/*                               Form Actions                                 */
/* -------------------------------------------------------------------------- */

export interface FormActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end' | 'between'
  sticky?: boolean
  stackedOnMobile?: boolean
  bordered?: boolean
}

const alignMap: Record<NonNullable<FormActionsProps['align']>, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
}

export const FormActions = React.forwardRef<HTMLDivElement, FormActionsProps>(
  (
    {
      align = 'end',
      sticky = false,
      stackedOnMobile = true,
      bordered = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-stretch sm:items-center gap-3 pt-2 w-full',
          stackedOnMobile ? 'flex-col-reverse sm:flex-row' : 'flex-row',
          alignMap[align],
          bordered && 'border-t border-line pt-4 mt-2',
          sticky &&
            'sticky bottom-0 bg-card/95 backdrop-blur-xs py-3 border-t border-line -mx-5 px-5 sm:-mx-8 sm:px-8 z-10 shadow-xs',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)

FormActions.displayName = 'FormActions'

/* -------------------------------------------------------------------------- */
/*                                Form Alert                                  */
/* -------------------------------------------------------------------------- */

export interface FormAlertProps {
  variant?: 'error' | 'success' | 'warning' | 'info'
  title?: React.ReactNode
  message?: React.ReactNode
  onClose?: () => void
  className?: string
  children?: React.ReactNode
}

const alertVariantStyles: Record<
  NonNullable<FormAlertProps['variant']>,
  { container: string; icon: string }
> = {
  error: {
    container: 'bg-danger-soft border-danger-subtle text-danger',
    icon: 'text-danger',
  },
  success: {
    container: 'bg-success-soft border-success-subtle text-success',
    icon: 'text-success',
  },
  warning: {
    container: 'bg-warning-soft border-warning-subtle text-warning',
    icon: 'text-warning',
  },
  info: {
    container: 'bg-info-soft border-info-subtle text-info',
    icon: 'text-info',
  },
}

const alertIcons = {
  error: AlertTriangle,
  success: CheckCircle2,
  warning: AlertCircle,
  info: Info,
}

export const FormAlert: React.FC<FormAlertProps> = ({
  variant = 'error',
  title,
  message,
  onClose,
  className,
  children,
}) => {
  const IconComponent = alertIcons[variant]
  const styles = alertVariantStyles[variant]

  return (
    <div
      role="alert"
      className={cn(
        'p-4 border rounded-2xl flex items-start justify-between gap-3 text-xs font-bold animate-in fade-in duration-200',
        styles.container,
        className,
      )}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <IconComponent className={cn('w-4 h-4 shrink-0 mt-0.5', styles.icon)} />
        <div className="space-y-0.5">
          {title &&
            (typeof title === 'string' ? (
              <Text as="p" size="xs" weight="extrabold" color="inherit" className="tracking-tight">
                {title}
              </Text>
            ) : (
              title
            ))}
          {(message || children) && (
            <Text as="div" size="2xs" weight="medium" color="inherit" className="leading-relaxed opacity-90">
              {message || children}
            </Text>
          )}
        </div>
      </div>

      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="shrink-0 -mt-1 -mr-1"
        >
          <X />
        </Button>
      )}
    </div>
  )
}

FormAlert.displayName = 'FormAlert'

/* -------------------------------------------------------------------------- */
/*                        Compound Component Assembly                         */
/* -------------------------------------------------------------------------- */

export const Form = Object.assign(FormRoot, {
  Header: FormHeader,
  Section: FormSection,
  Grid: FormGrid,
  Field: FormField,
  Item: FormField,
  Actions: FormActions,
  Footer: FormActions,
  Alert: FormAlert,
})

export default Form
