import * as React from 'react'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*                                Types                                       */
/* -------------------------------------------------------------------------- */

export type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export type ResponsiveValue<T> = {
  [K in Breakpoint]?: T
}

export type ResponsiveProp<T> = T | ResponsiveValue<T>

export type TextVariant =
  | 'body'
  | 'lead'
  | 'heading'
  | 'subtitle'
  | 'caption'
  | 'overline'
  | 'badge'
  | 'code'
  | 'quote'

export type TextSize =
  | '3xs'
  | '2xs'
  | 'xs'
  | 'sm'
  | 'base'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | '6xl'

export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black'

export type TextColor =
  | 'default'
  | 'secondary'
  | 'subtle'
  | 'brand'
  | 'brand-dark'
  | 'success'
  | 'warning'
  | 'danger'
  | 'orange'
  | 'white'
  | 'inherit'

export type TextAlign = 'left' | 'center' | 'right' | 'justify'
export type TextClamp = 1 | 2 | 3 | 4 | 5 | 6

export interface TextCustomProps {
  variant?: TextVariant
  size?: ResponsiveProp<TextSize>
  weight?: ResponsiveProp<TextWeight>
  color?: TextColor
  align?: ResponsiveProp<TextAlign>
  truncate?: boolean
  clamp?: TextClamp
  uppercase?: boolean
  lowercase?: boolean
  capitalize?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  mono?: boolean
  gutterBottom?: boolean
}

export type TextProps<E extends React.ElementType = 'p'> = TextCustomProps & {
  as?: E
} & Omit<React.ComponentPropsWithoutRef<E>, keyof TextCustomProps | 'as'>

/* -------------------------------------------------------------------------- */
/*                                Style Mappings                              */
/* -------------------------------------------------------------------------- */

const variantStyles: Record<TextVariant, string> = {
  body: 'text-sm text-foreground/90 leading-relaxed',
  lead: 'text-base sm:text-lg text-muted leading-relaxed font-normal',
  heading: 'text-lg sm:text-xl font-black text-foreground tracking-tight',
  subtitle: 'text-xs sm:text-sm font-medium text-muted leading-normal',
  caption: 'text-[11px] text-muted/80 leading-tight',
  overline: 'text-[10px] font-black uppercase tracking-widest text-muted/80',
  badge: 'text-[10px] font-extrabold uppercase tracking-wide',
  code: 'font-mono text-xs bg-card-hover text-foreground px-1.5 py-0.5 rounded-md',
  quote: 'text-sm italic border-l-2 border-[#2AC1BC] pl-3 py-1 text-muted',
}

const sizeStyles: Record<TextSize, string> = {
  '3xs': 'text-[10px]',
  '2xs': 'text-[11px]',
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
  '6xl': 'text-6xl',
}

const weightStyles: Record<TextWeight, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  extrabold: 'font-extrabold',
  black: 'font-black',
}

const colorStyles: Record<TextColor, string> = {
  default: 'text-foreground',
  secondary: 'text-muted',
  subtle: 'text-muted/80',
  brand: 'text-[#2AC1BC]',
  'brand-dark': 'text-[#138e89]',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-rose-600 dark:text-rose-400',
  orange: 'text-orange-600 dark:text-orange-400',
  white: 'text-white',
  inherit: 'text-inherit',
}

const alignStyles: Record<TextAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
}

const clampStyles: Record<TextClamp, string> = {
  1: 'line-clamp-1',
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  4: 'line-clamp-4',
  5: 'line-clamp-5',
  6: 'line-clamp-6',
}

function resolveResponsiveClasses<T extends string>(
  prop: ResponsiveProp<T> | undefined,
  mapping: Record<T, string>,
): string[] {
  if (!prop) return []
  if (typeof prop === 'string') {
    const cls = mapping[prop as T]
    return cls ? [cls] : []
  }

  const result: string[] = []
  const breakpoints: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl']

  for (const bp of breakpoints) {
    const val = (prop as ResponsiveValue<T>)[bp]
    if (val && mapping[val]) {
      const baseClass = mapping[val]
      if (bp === 'base') {
        result.push(baseClass)
      } else {
        baseClass.split(' ').forEach(c => {
          if (c.trim()) result.push(`${bp}:${c.trim()}`)
        })
      }
    }
  }

  return result
}

/* -------------------------------------------------------------------------- */
/*                                Component                                   */
/* -------------------------------------------------------------------------- */

function TextComponent<E extends React.ElementType = 'p'>(
  {
    as,
    variant = 'body',
    size,
    weight,
    color,
    align,
    truncate,
    clamp,
    uppercase,
    lowercase,
    capitalize,
    italic,
    underline,
    strikethrough,
    mono,
    gutterBottom,
    className,
    children,
    ...props
  }: TextProps<E>,
  ref: any,
) {
  const Component = (as || 'p') as any

  return (
    <Component
      ref={ref}
      className={cn(
        // Base variant styling
        variant && variantStyles[variant],
        // Responsive overrides
        resolveResponsiveClasses(size, sizeStyles),
        resolveResponsiveClasses(weight, weightStyles),
        resolveResponsiveClasses(align, alignStyles),
        color && colorStyles[color],
        clamp && clampStyles[clamp],
        truncate && !clamp && 'truncate',
        uppercase && 'uppercase tracking-wider',
        lowercase && 'lowercase',
        capitalize && 'capitalize',
        italic && 'italic',
        underline && 'underline underline-offset-2',
        strikethrough && 'line-through',
        mono && 'font-mono',
        gutterBottom && 'mb-3',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

export const TextRoot = React.forwardRef(TextComponent) as <E extends React.ElementType = 'p'>(
  props: TextProps<E> & { ref?: React.Ref<Element> },
) => React.ReactElement | null

/* -------------------------------------------------------------------------- */
/*                            Compound Presets                                */
/* -------------------------------------------------------------------------- */

export const Paragraph: React.FC<TextProps<'p'>> = props => (
  <TextRoot as="p" variant="body" {...props} />
)

export const Heading: React.FC<TextProps<'h2'>> = ({
  as = 'h2',
  variant = 'heading',
  ...props
}) => <TextRoot as={as} variant={variant} {...props} />

export const Caption: React.FC<TextProps<'span'>> = props => (
  <TextRoot as="span" variant="caption" {...props} />
)

export const Overline: React.FC<TextProps<'span'>> = props => (
  <TextRoot as="span" variant="overline" {...props} />
)

export const BadgeText: React.FC<TextProps<'span'>> = props => (
  <TextRoot as="span" variant="badge" {...props} />
)

export const CodeText: React.FC<TextProps<'code'>> = props => (
  <TextRoot as="code" variant="code" {...props} />
)

export const Text = Object.assign(TextRoot, {
  Paragraph,
  Heading,
  Caption,
  Overline,
  Badge: BadgeText,
  Code: CodeText,
})

export default Text
