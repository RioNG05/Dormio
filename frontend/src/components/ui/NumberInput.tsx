import * as React from "react";
import { cn } from "@/lib/utils";

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  prefixText?: string;
  suffixText?: string;
  containerClassName?: string;
  labelClassName?: string;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      label,
      required = false,
      error,
      helperText,
      prefixText,
      suffixText,
      containerClassName,
      labelClassName,
      className,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `num-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

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
          {prefixText && (
            <div className="absolute left-3 flex items-center pointer-events-none text-zinc-400 font-bold text-xs shrink-0">
              {prefixText}
            </div>
          )}

          <input
            ref={ref}
            type="number"
            id={inputId}
            required={required}
            disabled={disabled}
            className={cn(
              "w-full rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-all outline-none",
              prefixText ? "pl-8" : "",
              suffixText ? "pr-14" : "",
              disabled
                ? "bg-zinc-100 text-zinc-500 border-zinc-200 cursor-not-allowed select-none shadow-none"
                : error
                ? "bg-white border-rose-400 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                : "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-300 focus:border-[#2AC1BC] focus:ring-2 focus:ring-[#2AC1BC]/15",
              className
            )}
            {...props}
          />

          {suffixText && (
            <div className="absolute right-3 flex items-center pointer-events-none text-zinc-400 font-medium text-xs shrink-0">
              {suffixText}
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

NumberInput.displayName = "NumberInput";
