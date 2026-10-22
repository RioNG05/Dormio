'use client'

import React, { forwardRef, type HTMLAttributes, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

function handleKeyboardActivation(
  event: KeyboardEvent<HTMLDivElement>,
  onClick: CardProps['onClick'],
) {
  if (!onClick || event.defaultPrevented || (event.key !== 'Enter' && event.key !== ' ')) return

  event.preventDefault()
  event.currentTarget.click()
}

const CardRoot = forwardRef<HTMLDivElement, CardProps>(function Card(
  { interactive, className, onClick, onKeyDown, ...props },
  ref,
) {
  const isInteractive = interactive ?? Boolean(onClick)

  return (
    <div
      ref={ref}
      {...props}
      onClick={onClick}
      onKeyDown={event => {
        onKeyDown?.(event)
        handleKeyboardActivation(event, onClick)
      }}
      role={isInteractive ? 'button' : props.role}
      tabIndex={isInteractive ? (props.tabIndex ?? 0) : props.tabIndex}
      className={cn(
        'rounded-2xl border border-line bg-card shadow-2xs transition-all duration-200',
        isInteractive &&
          'cursor-pointer hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        className,
      )}
    />
  )
})

export const Card = Object.assign(CardRoot, {
  Header: forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardHeader(
    { className, ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        {...props}
        className={cn('flex items-start justify-between gap-3 border-b border-line pb-3', className)}
      />
    )
  }),
  Body: forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardBody(
    { className, ...props },
    ref,
  ) {
    return <div ref={ref} {...props} className={cn('py-3', className)} />
  }),
  Footer: forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardFooter(
    { className, ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        {...props}
        className={cn('border-t border-line pt-3', className)}
      />
    )
  }),
})
