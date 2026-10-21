'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*                                Types                                       */
/* -------------------------------------------------------------------------- */

export type AvatarSize = '3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
export type AvatarShape = 'circle' | 'rounded' | 'square'
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away'
export type AvatarFallbackType = 'auto' | 'initials' | 'icon' | 'placeholder'

export const DEFAULT_AVATAR_PLACEHOLDER = '/avatar-placeholder.png'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Avatar image URL */
  src?: string | null
  /** Custom placeholder image URL when src is missing or fails to load (defaults to /avatar-placeholder.png) */
  placeholderSrc?: string
  /** Alternative text for accessibility */
  alt?: string | null
  /** User's full name or username for generating initials & hash color */
  name?: string | null
  /** Standardized size token */
  size?: AvatarSize
  /** Shape of the avatar */
  shape?: AvatarShape
  /** Online status indicator badge */
  status?: AvatarStatus
  /** Priority strategy for fallback when image is missing or fails to load */
  fallbackType?: AvatarFallbackType
  /** Custom fallback element */
  fallback?: React.ReactNode
  /** Whether to show a border outline (defaults to true) */
  bordered?: boolean | string
  /** Ring highlight effect around avatar */
  ring?: boolean | 'brand' | 'accent' | 'line'
  /** Slight scale-up animation on parent hover */
  zoomOnHover?: boolean
  /** Class name for the outer container */
  className?: string
  /** Class name for the inner img tag */
  imageClassName?: string
}

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Max number of avatars to display before showing +N */
  max?: number
  /** Size for all avatars in group */
  size?: AvatarSize
  /** Spacing between avatars (default: -space-x-2) */
  spacing?: string
  children: React.ReactNode
}

/* -------------------------------------------------------------------------- */
/*                            Color & Size Config                             */
/* -------------------------------------------------------------------------- */

const AVATAR_PALETTES = [
  { bg: 'bg-primary', text: 'text-white' }, // Brand Teal
  { bg: 'bg-accent', text: 'text-white' }, // Brand Orange
  { bg: 'bg-emerald-500', text: 'text-white' }, // Success Emerald
  { bg: 'bg-indigo-500', text: 'text-white' }, // Indigo
  { bg: 'bg-purple-500', text: 'text-white' }, // Purple
  { bg: 'bg-amber-500', text: 'text-white' }, // Warning Amber
  { bg: 'bg-sky-500', text: 'text-white' }, // Vacant Sky
  { bg: 'bg-rose-500', text: 'text-white' }, // Danger Rose
  { bg: 'bg-teal-600', text: 'text-white' }, // Dark Teal
  { bg: 'bg-blue-600', text: 'text-white' }, // Blue
]

const sizeStyles: Record<
  AvatarSize,
  {
    container: string
    text: string
    icon: string
    status: string
    roundedShape: string
  }
> = {
  '3xs': {
    container: 'w-4.5 h-4.5 min-w-[18px]',
    text: 'text-[9px] font-black',
    icon: 'w-2.5 h-2.5',
    status: 'w-1.5 h-1.5 ring-[1px] -bottom-0.5 -right-0.5',
    roundedShape: 'rounded-md',
  },
  '2xs': {
    container: 'w-6 h-6 min-w-[24px]',
    text: 'text-[10px] font-bold',
    icon: 'w-3 h-3',
    status: 'w-2 h-2 ring-[1.5px] -bottom-0.5 -right-0.5',
    roundedShape: 'rounded-lg',
  },
  xs: {
    container: 'w-7 h-7 min-w-[28px]',
    text: 'text-xs font-bold',
    icon: 'w-3.5 h-3.5',
    status: 'w-2 h-2 ring-[1.5px] -bottom-0.5 -right-0.5',
    roundedShape: 'rounded-lg',
  },
  sm: {
    container: 'w-8 h-8 min-w-[32px]',
    text: 'text-xs font-extrabold',
    icon: 'w-4 h-4',
    status: 'w-2.5 h-2.5 ring-2 -bottom-0.5 -right-0.5',
    roundedShape: 'rounded-xl',
  },
  md: {
    container: 'w-10 h-10 min-w-[40px]',
    text: 'text-sm font-extrabold',
    icon: 'w-5 h-5',
    status: 'w-3 h-3 ring-2 bottom-0 right-0',
    roundedShape: 'rounded-2xl',
  },
  lg: {
    container: 'w-12 h-12 min-w-[48px]',
    text: 'text-base font-black',
    icon: 'w-6 h-6',
    status: 'w-3.5 h-3.5 ring-2 bottom-0 right-0',
    roundedShape: 'rounded-2xl',
  },
  xl: {
    container: 'w-14 h-14 min-w-[56px]',
    text: 'text-lg font-black',
    icon: 'w-7 h-7',
    status: 'w-4 h-4 ring-2 bottom-0.5 right-0.5',
    roundedShape: 'rounded-2xl',
  },
  '2xl': {
    container: 'w-20 h-20 min-w-[80px]',
    text: 'text-2xl font-black',
    icon: 'w-10 h-10',
    status: 'w-5 h-5 ring-2 bottom-1 right-1',
    roundedShape: 'rounded-3xl',
  },
  '3xl': {
    container: 'w-24 h-24 sm:w-28 sm:h-28 min-w-[96px]',
    text: 'text-3xl font-black',
    icon: 'w-12 h-12',
    status: 'w-6 h-6 ring-4 bottom-1.5 right-1.5',
    roundedShape: 'rounded-3xl',
  },
}

const statusColors: Record<AvatarStatus, string> = {
  online: 'bg-emerald-500',
  offline: 'bg-zinc-400',
  busy: 'bg-rose-500',
  away: 'bg-amber-500',
}

/* -------------------------------------------------------------------------- */
/*                                Helpers                                     */
/* -------------------------------------------------------------------------- */

/**
 * Extracts 1-2 uppercase initials from a name string
 */
export function getInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return ''
  const trimmed = name.trim()
  if (!trimmed) return ''

  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  // First letter of first word + first letter of last word
  const first = parts[0][0]
  const last = parts[parts.length - 1][0]
  return `${first}${last}`.toUpperCase()
}

/**
 * Deterministically picks a palette based on string hash
 */
export function getAvatarColor(str?: string | null): { bg: string; text: string } {
  if (!str) return AVATAR_PALETTES[0]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length
  return AVATAR_PALETTES[index]
}

/* -------------------------------------------------------------------------- */
/*                           Default Vector Silhouette                        */
/* -------------------------------------------------------------------------- */

function DefaultUserIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M12 2a5 5 0 100 10 5 5 0 000-10zM4 20a8 8 0 0116 0v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-1z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Component                                   */
/* -------------------------------------------------------------------------- */

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      placeholderSrc = DEFAULT_AVATAR_PLACEHOLDER,
      alt,
      name,
      size = 'md',
      shape = 'circle',
      status,
      fallbackType = 'auto',
      fallback,
      bordered = true,
      ring,
      zoomOnHover = false,
      className,
      imageClassName,
      ...props
    },
    ref,
  ) => {
    const [hasError, setHasError] = useState(false)
    const [placeholderError, setPlaceholderError] = useState(false)

    // Reset error state whenever src changes
    useEffect(() => {
      setHasError(false)
      setPlaceholderError(false)
    }, [src])

    const config = sizeStyles[size] || sizeStyles.md
    const initials = getInitials(name)
    const palette = getAvatarColor(name || alt || 'dormio')

    // Determine shape styling
    const shapeClass =
      shape === 'circle'
        ? 'rounded-full'
        : shape === 'square'
          ? 'rounded-lg'
          : config.roundedShape

    // Ring highlight styling
    const ringClass =
      ring === true || ring === 'brand'
        ? 'ring-2 ring-primary ring-offset-2 ring-offset-card'
        : ring === 'accent'
          ? 'ring-2 ring-accent ring-offset-2 ring-offset-card'
          : ring === 'line'
            ? 'ring-1 ring-line'
            : ''

    // Border styling (defaults to true: border border-line)
    const borderClass =
      bordered === false
        ? ''
        : typeof bordered === 'string'
          ? bordered
          : 'border border-line'

    // Decide if primary image should be rendered
    const shouldRenderImage = Boolean(src && !hasError)

    // Render fallback element
    const renderFallback = () => {
      if (fallback) return fallback

      // If caller explicitly requested initials fallback and initials exist
      if (fallbackType === 'initials' && initials) {
        return (
          <div
            className={cn(
              'w-full h-full flex items-center justify-center select-none shadow-2xs',
              palette.bg,
              palette.text,
              config.text,
              shapeClass,
            )}
          >
            {initials}
          </div>
        )
      }

      if (fallbackType === 'icon') {
        return (
          <div
            className={cn(
              'w-full h-full flex items-center justify-center bg-card-hover text-muted',
              shapeClass,
            )}
          >
            <DefaultUserIcon className={config.icon} />
          </div>
        )
      }

      // Default fallback: static placeholder image (/avatar-placeholder.png)
      if (!placeholderError && placeholderSrc) {
        return (
          <img
            src={placeholderSrc}
            alt={alt || name || 'Avatar placeholder'}
            onError={() => setPlaceholderError(true)}
            className={cn('w-full h-full object-cover', imageClassName)}
            loading="lazy"
            decoding="async"
          />
        )
      }

      // Final fallback if placeholder image fails to load
      return (
        <div
          className={cn(
            'w-full h-full flex items-center justify-center bg-card-hover text-muted',
            shapeClass,
          )}
        >
          <DefaultUserIcon className={config.icon} />
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex shrink-0 select-none overflow-visible',
          config.container,
          className,
        )}
        {...props}
      >
        {/* Main avatar wrapper */}
        <div
          className={cn(
            'w-full h-full overflow-hidden flex items-center justify-center transition-transform duration-200 bg-card-hover',
            shapeClass,
            borderClass,
            ringClass,
            zoomOnHover && 'group-hover:scale-105',
          )}
        >
          {shouldRenderImage ? (
            <img
              src={src as string}
              alt={alt || name || 'User avatar'}
              onError={() => setHasError(true)}
              className={cn('w-full h-full object-cover', imageClassName)}
              loading="lazy"
              decoding="async"
            />
          ) : (
            renderFallback()
          )}

        </div>

        {/* Status Indicator */}
        {status && (
          <span
            className={cn(
              'absolute rounded-full ring-card',
              config.status,
              statusColors[status],
            )}
            title={`Trạng thái: ${status}`}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    )
  },
)

Avatar.displayName = 'Avatar'

/* -------------------------------------------------------------------------- */
/*                               Avatar Group                                 */
/* -------------------------------------------------------------------------- */

export function AvatarGroup({
  max = 4,
  size = 'md',
  spacing = '-space-x-2',
  children,
  className,
  ...props
}: AvatarGroupProps) {
  const childArray = React.Children.toArray(children).filter(Boolean)
  const total = childArray.length
  const visibleAvatars = max ? childArray.slice(0, max) : childArray
  const remainingCount = max && total > max ? total - max : 0

  const config = sizeStyles[size] || sizeStyles.md

  return (
    <div
      className={cn('inline-flex items-center flex-row-reverse justify-end', spacing, className)}
      {...props}
    >
      {remainingCount > 0 && (
        <div
          className={cn(
            'relative inline-flex items-center justify-center rounded-full bg-card-hover text-muted ring-2 ring-card font-extrabold select-none shrink-0 z-0',
            config.container,
            config.text,
          )}
        >
          +{remainingCount}
        </div>
      )}

      {visibleAvatars.map((child, index) => {
        if (!React.isValidElement(child)) return child
        return React.cloneElement(child as React.ReactElement<AvatarProps>, {
          key: child.key || index,
          size: (child.props as AvatarProps).size || size,
          className: cn(
            'ring-2 ring-card',
            (child.props as AvatarProps).className,
          ),
        })
      })}
    </div>
  )
}
