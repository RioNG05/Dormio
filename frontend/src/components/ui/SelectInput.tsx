import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectInputProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  containerClassName?: string;
  labelClassName?: string;
}

export const SelectInput = React.forwardRef<HTMLSelectElement, SelectInputProps>(
  (
    {
      label,
      required = false,
      error,
      helperText,
      options,
      children,
      containerClassName,
      labelClassName,
      className,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? `select-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

    return (
      <div className={cn("space-y-1.5 w-full", containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
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
          <select
            ref={ref}
            id={selectId}
            required={required}
            disabled={disabled}
            className={cn(
              "w-full appearance-none rounded-xl border pl-3.5 pr-10 py-2.5 text-xs font-semibold transition-all outline-none cursor-pointer",
              disabled
                ? "bg-zinc-100 text-zinc-500 border-zinc-200 cursor-not-allowed select-none shadow-none"
                : error
                ? "bg-white border-rose-400 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                : "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-300 focus:border-[#2AC1BC] focus:ring-2 focus:ring-[#2AC1BC]/15",
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option
                    key={String(opt.value)}
                    value={opt.value}
                    disabled={opt.disabled}
                  >
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <div className="pointer-events-none absolute right-3 flex items-center text-zinc-400">
            <ChevronDown className="w-4 h-4" />
          </div>
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

SelectInput.displayName = "SelectInput";
