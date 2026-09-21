import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaInputProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  labelClassName?: string;
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
    ref
  ) => {
    const textareaId = id || (label ? `area-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

    return (
      <div className={cn("space-y-1.5 w-full", containerClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              "block text-xs font-bold text-zinc-700 select-none",
              disabled && "text-zinc-400 cursor-not-allowed",
              labelClassName
            )}
          >
            <span>{label}</span>
            {required && <span className="text-rose-500 font-bold ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          required={required}
          disabled={disabled}
          rows={rows}
          className={cn(
            "w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all outline-none resize-y",
            "placeholder:text-zinc-400 placeholder:font-normal",
            disabled
              ? "bg-zinc-100 text-zinc-500 border-zinc-200 cursor-not-allowed select-none shadow-none"
              : error
              ? "bg-white border-rose-400 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              : "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-300 focus:border-[#2AC1BC] focus:ring-2 focus:ring-[#2AC1BC]/15",
            className
          )}
          {...props}
        />

        {error ? (
          <p className="text-[11px] font-medium text-rose-600 animate-in fade-in">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-zinc-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

TextareaInput.displayName = "TextareaInput";
