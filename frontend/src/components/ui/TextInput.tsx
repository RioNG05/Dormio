import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  labelClassName?: string;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      required = false,
      error,
      helperText,
      leftIcon,
      rightIcon,
      containerClassName,
      labelClassName,
      className,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    // Generate fallback unique ID if not provided
    const inputId = id || (label ? `input-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

    return (
      <div className={cn("space-y-1.5 w-full", containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
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

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-zinc-400 shrink-0">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            required={required}
            disabled={disabled}
            className={cn(
              "w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all outline-none",
              "placeholder:text-zinc-400 placeholder:font-normal",
              leftIcon ? "pl-9" : "",
              rightIcon ? "pr-9" : "",
              disabled
                ? "bg-zinc-100 text-zinc-500 border-zinc-200 cursor-not-allowed select-none shadow-none"
                : error
                ? "bg-white border-rose-400 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                : "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-300 focus:border-[#2AC1BC] focus:ring-2 focus:ring-[#2AC1BC]/15",
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 flex items-center text-zinc-400 shrink-0">
              {rightIcon}
            </div>
          )}
        </div>

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

TextInput.displayName = "TextInput";
