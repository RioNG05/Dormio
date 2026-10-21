'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { Text } from './Text'

/* -------------------------------------------------------------------------- */
/*                                Types                                       */
/* -------------------------------------------------------------------------- */

export type ModalSize =
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | 'full'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  header?: React.ReactNode
  zIndex?: number
  size?: ModalSize
  closeOnOverlayClick?: boolean
  closeOnEsc?: boolean
  preventScroll?: boolean
  showCloseButton?: boolean
  headerClassName?: string
  bodyClassName?: string
  footerClassName?: string
  className?: string
  overlayClassName?: string
  footer?: React.ReactNode
  asForm?: boolean
  onSubmit?: (e: React.FormEvent) => void
}

export interface ModalHeaderProps {
  title?: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  showCloseButton?: boolean
  onClose?: () => void
  className?: string
  children?: React.ReactNode
}

export interface ModalBodyProps {
  className?: string
  children: React.ReactNode
}

export interface ModalFooterProps {
  className?: string
  children: React.ReactNode
}

/* -------------------------------------------------------------------------- */
/*                                Context                                     */
/* -------------------------------------------------------------------------- */

interface ModalContextValue {
  onClose: () => void
  showCloseButton?: boolean
}

const ModalContext = React.createContext<ModalContextValue | null>(null)

/* -------------------------------------------------------------------------- */
/*                              Size Styles                                   */
/* -------------------------------------------------------------------------- */

const sizeClasses: Record<ModalSize, string> = {
  xs: 'w-full max-w-xs',
  sm: 'w-full max-w-sm',
  md: 'w-full max-w-md',
  lg: 'w-full max-w-lg',
  xl: 'w-full max-w-xl',
  '2xl': 'w-full max-w-2xl',
  '3xl': 'w-full max-w-3xl',
  '4xl': 'w-full max-w-4xl',
  '5xl': 'w-full max-w-5xl',
  full: 'w-full max-w-[calc(100vw-1.5rem)] sm:max-w-[calc(100vw-2rem)] h-[calc(100dvh-1.5rem)] sm:h-[calc(100dvh-2rem)]',
}

/* -------------------------------------------------------------------------- */
/*                              Subcomponents                                 */
/* -------------------------------------------------------------------------- */

export function ModalHeader({
  title,
  description,
  icon,
  showCloseButton,
  onClose,
  className,
  children,
}: ModalHeaderProps) {
  const context = React.useContext(ModalContext)
  const handleClose = onClose || context?.onClose
  const canShowClose =
    showCloseButton !== undefined ? showCloseButton : context?.showCloseButton ?? true

  if (children) {
    return (
      <div
        className={cn(
          'flex items-center justify-between p-4 sm:p-5 border-b border-line shrink-0 bg-card',
          className,
        )}
      >
        <div className="flex-1 min-w-0">{children}</div>
        {canShowClose && handleClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            rounded="full"
            onClick={handleClose}
            aria-label="Đóng"
            className="shrink-0 ml-2 sm:ml-3"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 sm:p-5 border-b border-line shrink-0 bg-card',
        className,
      )}
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {icon && <div className="shrink-0">{icon}</div>}
        <div className="min-w-0">
          {title &&
            (typeof title === 'string' ? (
              <Text as="h2" weight="black" color="default" size="base" className="truncate">
                {title}
              </Text>
            ) : (
              title
            ))}
          {description &&
            (typeof description === 'string' ? (
              <Text size="xs" color="secondary" weight="medium" className="mt-0.5 line-clamp-2">
                {description}
              </Text>
            ) : (
              description
            ))}
        </div>
      </div>
      {canShowClose && handleClose && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          rounded="full"
          onClick={handleClose}
          aria-label="Đóng"
          className="shrink-0 ml-2 sm:ml-3"
        >
          <X className="w-5 h-5" />
        </Button>
      )}
    </div>
  )
}

export function ModalBody({ className, children }: ModalBodyProps) {
  return (
    <div
      className={cn(
        'p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0 overscroll-contain',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function ModalFooter({ className, children }: ModalFooterProps) {
  return (
    <div
      className={cn(
        'p-3.5 sm:p-4 border-t border-line flex flex-col-reverse sm:flex-row sm:justify-end items-stretch sm:items-center gap-2 sm:gap-3 bg-surface shrink-0',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                               Modal Root                                   */
/* -------------------------------------------------------------------------- */

function ModalRoot({
  isOpen,
  onClose,
  children,
  title,
  description,
  icon,
  header,
  zIndex,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  preventScroll = true,
  showCloseButton = true,
  headerClassName,
  bodyClassName,
  footerClassName,
  className,
  overlayClassName,
  footer,
  asForm = false,
  onSubmit,
}: ModalProps) {
  const [isMounted, setIsMounted] = React.useState(false)
  const [isVisible, setIsVisible] = React.useState(false)
  const [portalNode, setPortalNode] = React.useState<HTMLElement | null>(null)

  // Initialize portal container after client mount
  React.useEffect(() => {
    setPortalNode(document.body)
  }, [])

  // Handle open / close animation transition
  React.useEffect(() => {
    if (isOpen) {
      setIsMounted(true)
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 20)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
      const timer = setTimeout(() => {
        setIsMounted(false)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Handle Escape key press
  React.useEffect(() => {
    if (!isMounted || !closeOnEsc) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMounted, closeOnEsc, onClose])

  // Lock body scroll when open
  React.useEffect(() => {
    if (!isMounted || !preventScroll) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isMounted, preventScroll])

  if (!isMounted || !portalNode) return null

  // Check if shorthand header/footer should be rendered
  const hasShorthandHeader = Boolean(header || title || description || icon)
  const hasShorthandFooter = Boolean(footer)

  const modalDialog = (
    <div
      role="dialog"
      aria-modal="true"
      onClick={e => e.stopPropagation()}
      className={cn(
        'bg-card rounded-2xl w-full shadow-2xl overflow-hidden border border-line transition-all duration-200 ease-out max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] flex flex-col',
        sizeClasses[size],
        isVisible
          ? 'opacity-100 scale-100 translate-y-0'
          : 'opacity-0 scale-95 translate-y-2 pointer-events-none',
        className,
      )}
    >
      {header ? (
        <div
          className={cn(
            'p-4 sm:p-5 border-b border-line flex items-center justify-between bg-card shrink-0 z-10',
            headerClassName,
          )}
        >
          <div className="flex-1 min-w-0">{header}</div>
          {showCloseButton && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              rounded="full"
              onClick={onClose}
              aria-label="Đóng"
              className="shrink-0 ml-2 sm:ml-3"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      ) : hasShorthandHeader ? (
        <ModalHeader
          title={title}
          description={description}
          icon={icon}
          showCloseButton={showCloseButton}
          className={headerClassName}
        />
      ) : null}

      {hasShorthandHeader || hasShorthandFooter ? (
        <ModalBody className={bodyClassName}>{children}</ModalBody>
      ) : (
        children
      )}

      {hasShorthandFooter && <ModalFooter className={footerClassName}>{footer}</ModalFooter>}
    </div>
  )

  const content = (
    <ModalContext.Provider value={{ onClose, showCloseButton }}>
      <div
        style={zIndex !== undefined ? { zIndex } : undefined}
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs transition-opacity duration-200 ease-out overflow-y-auto',
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
          overlayClassName,
        )}
        onMouseDown={e => {
          if (closeOnOverlayClick && e.target === e.currentTarget) {
            onClose()
          }
        }}
      >
        {asForm || onSubmit ? (
          <form
            onSubmit={onSubmit}
            className={cn('w-full max-h-full flex flex-col items-center justify-center', sizeClasses[size])}
            onClick={e => e.stopPropagation()}
          >
            {modalDialog}
          </form>
        ) : (
          modalDialog
        )}
      </div>
    </ModalContext.Provider>
  )

  return createPortal(content, portalNode)
}

export const Modal = Object.assign(ModalRoot, {
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
})
