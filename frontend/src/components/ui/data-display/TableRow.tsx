'use client'

import React, { forwardRef, type KeyboardEvent, type TableHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface TableRowProps extends TableHTMLAttributes<HTMLTableRowElement> {
  interactive?: boolean
}

function handleKeyboardActivation(
  event: KeyboardEvent<HTMLTableRowElement>,
  onClick: TableRowProps['onClick'],
) {
  if (!onClick || event.defaultPrevented || (event.key !== 'Enter' && event.key !== ' ')) return

  event.preventDefault()
  event.currentTarget.click()
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow(
  { interactive, className, onClick, onKeyDown, ...props },
  ref,
) {
  const isInteractive = interactive ?? Boolean(onClick)

  return (
    <tr
      ref={ref}
      {...props}
      onClick={onClick}
      onKeyDown={event => {
        onKeyDown?.(event)
        handleKeyboardActivation(event, onClick)
      }}
      tabIndex={isInteractive ? (props.tabIndex ?? 0) : props.tabIndex}
      className={cn(
        'border-b border-line transition-colors last:border-b-0',
        isInteractive &&
          'cursor-pointer hover:bg-surface/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50',
        className,
      )}
    />
  )
})
