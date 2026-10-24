import * as React from 'react'
import { Button, ButtonProps } from './Button'

export interface TableActionButtonProps
  extends Omit<ButtonProps, 'size' | 'leftIcon' | 'rightIcon'> {
  title: string
  icon: React.ReactNode
  variant?: ButtonProps['variant']
  danger?: boolean
}

export const TableActionButton = React.forwardRef<any, TableActionButtonProps>(
  ({ title, icon, variant = 'ghost', danger = false, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size="icon-sm"
        variant={danger ? 'ghost-danger' : variant}
        title={title}
        aria-label={title}
        {...props}
      >
        {icon}
      </Button>
    )
  },
)

TableActionButton.displayName = 'TableActionButton'

