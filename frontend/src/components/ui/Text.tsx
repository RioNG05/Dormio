import * as React from "react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                                Types                                       */
/* -------------------------------------------------------------------------- */

export type TextVariant =
  | "body"
  | "lead"
  | "heading"
  | "subtitle"
  | "caption"
  | "overline"
  | "badge"
  | "code"
  | "quote";

export type TextSize =
  | "3xs"
  | "2xs"
  | "xs"
  | "sm"
  | "base"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl";

export type TextWeight =
  | "normal"
  | "medium"
  | "semibold"
  | "bold"
  | "extrabold"
  | "black";

export type TextColor =
  | "default"
  | "secondary"
  | "subtle"
  | "brand"
  | "brand-dark"
  | "success"
  | "warning"
  | "danger"
  | "orange"
  | "white"
  | "inherit";

export type TextAlign = "left" | "center" | "right" | "justify";
export type TextClamp = 1 | 2 | 3 | 4 | 5 | 6;

export interface TextCustomProps {
  variant?: TextVariant;
  size?: TextSize;
  weight?: TextWeight;
  color?: TextColor;
  align?: TextAlign;
  truncate?: boolean;
  clamp?: TextClamp;
  uppercase?: boolean;
  lowercase?: boolean;
  capitalize?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  mono?: boolean;
  gutterBottom?: boolean;
}

export type TextProps<E extends React.ElementType = "p"> = TextCustomProps & {
  as?: E;
} & Omit<React.ComponentPropsWithoutRef<E>, keyof TextCustomProps | "as">;

/* -------------------------------------------------------------------------- */
/*                                Style Mappings                              */
/* -------------------------------------------------------------------------- */

const variantStyles: Record<TextVariant, string> = {
  body: "text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed",
  lead: "text-base sm:text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal",
  heading: "text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight",
  subtitle: "text-xs font-medium text-zinc-500 dark:text-zinc-400 leading-normal",
  caption: "text-[11px] text-zinc-400 dark:text-zinc-500 leading-tight",
  overline: "text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500",
  badge: "text-[10px] font-extrabold uppercase tracking-wide",
  code: "font-mono text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-1.5 py-0.5 rounded-md",
  quote: "text-sm italic border-l-2 border-[#2AC1BC] pl-3 py-1 text-zinc-600 dark:text-zinc-300",
};

const sizeStyles: Record<TextSize, string> = {
  "3xs": "text-[10px]",
  "2xs": "text-[11px]",
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
};

const weightStyles: Record<TextWeight, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
  extrabold: "font-extrabold",
  black: "font-black",
};

const colorStyles: Record<TextColor, string> = {
  default: "text-zinc-900 dark:text-zinc-100",
  secondary: "text-zinc-600 dark:text-zinc-400",
  subtle: "text-zinc-400 dark:text-zinc-500",
  brand: "text-[#2AC1BC]",
  "brand-dark": "text-[#138e89]",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-rose-600 dark:text-rose-400",
  orange: "text-orange-600 dark:text-orange-400",
  white: "text-white",
  inherit: "text-inherit",
};

const alignStyles: Record<TextAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
  justify: "text-justify",
};

const clampStyles: Record<TextClamp, string> = {
  1: "line-clamp-1",
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
  5: "line-clamp-5",
  6: "line-clamp-6",
};

/* -------------------------------------------------------------------------- */
/*                                Component                                   */
/* -------------------------------------------------------------------------- */

function TextComponent<E extends React.ElementType = "p">(
  {
    as,
    variant = "body",
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
  ref: any
) {
  const Component = (as || "p") as any;

  return (
    <Component
      ref={ref}
      className={cn(
        // Base variant styling
        variant && variantStyles[variant],
        // Overrides
        size && sizeStyles[size],
        weight && weightStyles[weight],
        color && colorStyles[color],
        align && alignStyles[align],
        clamp && clampStyles[clamp],
        truncate && !clamp && "truncate",
        uppercase && "uppercase tracking-wider",
        lowercase && "lowercase",
        capitalize && "capitalize",
        italic && "italic",
        underline && "underline underline-offset-2",
        strikethrough && "line-through",
        mono && "font-mono",
        gutterBottom && "mb-3",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export const TextRoot = React.forwardRef(TextComponent) as <
  E extends React.ElementType = "p"
>(
  props: TextProps<E> & { ref?: React.Ref<Element> }
) => React.ReactElement | null;

/* -------------------------------------------------------------------------- */
/*                            Compound Presets                                */
/* -------------------------------------------------------------------------- */

export const Paragraph: React.FC<TextProps<"p">> = (props) => (
  <TextRoot as="p" variant="body" {...props} />
);

export const Heading: React.FC<TextProps<"h2">> = ({
  as = "h2",
  variant = "heading",
  ...props
}) => <TextRoot as={as} variant={variant} {...props} />;

export const Caption: React.FC<TextProps<"span">> = (props) => (
  <TextRoot as="span" variant="caption" {...props} />
);

export const Overline: React.FC<TextProps<"span">> = (props) => (
  <TextRoot as="span" variant="overline" {...props} />
);

export const BadgeText: React.FC<TextProps<"span">> = (props) => (
  <TextRoot as="span" variant="badge" {...props} />
);

export const CodeText: React.FC<TextProps<"code">> = (props) => (
  <TextRoot as="code" variant="code" {...props} />
);

export const Text = Object.assign(TextRoot, {
  Paragraph,
  Heading,
  Caption,
  Overline,
  Badge: BadgeText,
  Code: CodeText,
});

export default Text;
