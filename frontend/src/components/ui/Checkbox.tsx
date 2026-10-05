import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /**
   * Primary label text or ReactNode. Can include clickable links or badges.
   */
  label?: React.ReactNode;
  /**
   * Secondary description text displayed beneath the label.
   */
  description?: React.ReactNode;
  /**
   * Explanatory helper text displayed below the checkbox.
   */
  helperText?: React.ReactNode;
  /**
   * Error message string to display, or boolean true to indicate error state.
   */
  error?: string | boolean;
  /**
   * Indeterminate (partially checked) state, ideal for table "select all".
   */
  indeterminate?: boolean;
  /**
   * Visual size of the checkbox box.
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
  /**
   * Presentation variant.
   * - "default": standard checkbox with label
   * - "card": interactive card container with border and hover/checked highlight
   * @default "default"
   */
  variant?: "default" | "card";
  /**
   * Additional className for the outermost container.
   */
  containerClassName?: string;
  /**
   * Additional className for the label wrapper.
   */
  labelClassName?: string;
  /**
   * Additional className for the custom checkbox square box.
   */
  boxClassName?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      id,
      checked,
      defaultChecked,
      indeterminate = false,
      disabled = false,
      required = false,
      error,
      label,
      description,
      helperText,
      size = "md",
      variant = "default",
      className,
      containerClassName,
      labelClassName,
      boxClassName,
      onChange,
      ...props
    },
    forwardedRef
  ) => {
    const innerRef = React.useRef<HTMLInputElement | null>(null);
    const reactGeneratedId = React.useId();
    const inputId = id || reactGeneratedId;

    // Handle indeterminate state on underlying native HTMLInputElement
    React.useEffect(() => {
      if (innerRef.current) {
        innerRef.current.indeterminate = Boolean(indeterminate);
      }
    }, [indeterminate]);

    // Expose inner DOM node to forwardedRef
    React.useImperativeHandle(forwardedRef, () => innerRef.current as HTMLInputElement);

    const isControlled = checked !== undefined;
    const isChecked = isControlled ? checked : undefined;
    const hasError = Boolean(error);
    const errorMessage = typeof error === "string" ? error : undefined;

    const sizeConfig = {
      sm: {
        box: "w-4 h-4 rounded-[4px]",
        icon: "w-3 h-3 stroke-[3]",
        text: "text-xs",
        desc: "text-[11px]",
        offset: "mt-0.5",
      },
      md: {
        box: "w-5 h-5 rounded-md",
        icon: "w-3.5 h-3.5 stroke-[3]",
        text: "text-xs sm:text-sm",
        desc: "text-xs",
        offset: "mt-0.5",
      },
      lg: {
        box: "w-6 h-6 rounded-lg",
        icon: "w-4 h-4 stroke-[3]",
        text: "text-sm sm:text-base",
        desc: "text-xs sm:text-sm",
        offset: "mt-0.5",
      },
    }[size];

    return (
      <div className={cn("flex flex-col gap-1 w-full", containerClassName)}>
        <label
          htmlFor={inputId}
          onClick={(e) => {
            // Prevent toggling checkbox when clicking an interactive link or button inside label
            if ((e.target as HTMLElement).closest("a, button")) {
              e.stopPropagation();
            }
          }}
          className={cn(
            "group inline-flex items-start gap-2.5 select-none transition-all",
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            variant === "card" &&
              cn(
                "p-3.5 rounded-2xl border transition-all duration-200",
                "border-zinc-200 bg-white hover:border-[#2AC1BC]/60 hover:bg-zinc-50/50",
                isChecked && "border-[#2AC1BC] bg-[#2AC1BC]/5 shadow-xs",
                hasError && "border-rose-300 bg-rose-50/20"
              ),
            labelClassName
          )}
        >
          {/* Custom Checkbox Square + Accessible Hidden Native Input */}
          <div className={cn("relative shrink-0 flex items-center justify-center", sizeConfig.offset)}>
            <input
              ref={innerRef}
              type="checkbox"
              id={inputId}
              checked={checked}
              defaultChecked={defaultChecked}
              disabled={disabled}
              required={required}
              onChange={onChange}
              className="peer sr-only"
              aria-invalid={hasError}
              {...props}
            />

            {/* Visual Box */}
            <div
              className={cn(
                "flex items-center justify-center transition-all duration-200 border",
                sizeConfig.box,
                // Unchecked baseline
                "border-zinc-300 bg-white group-hover:border-[#2AC1BC]",
                // Focus styling
                "peer-focus-visible:ring-2 peer-focus-visible:ring-[#2AC1BC]/40 peer-focus-visible:ring-offset-1",
                // Checked or Indeterminate styling
                "peer-checked:bg-[#2AC1BC] peer-checked:border-[#2AC1BC] peer-checked:text-white",
                indeterminate && "bg-[#2AC1BC] border-[#2AC1BC] text-white",
                isChecked && "bg-[#2AC1BC] border-[#2AC1BC] text-white",
                // Error styling
                hasError &&
                  "border-rose-400 bg-rose-50/20 peer-checked:bg-rose-500 peer-checked:border-rose-500",
                // Disabled styling
                disabled &&
                  "bg-zinc-100 border-zinc-200 text-zinc-400 group-hover:border-zinc-200 cursor-not-allowed peer-checked:bg-zinc-400 peer-checked:border-zinc-400",
                boxClassName,
                className
              )}
            >
              {indeterminate ? (
                <Minus className={cn(sizeConfig.icon, "text-white animate-in zoom-in-75 duration-150")} />
              ) : (
                <Check
                  className={cn(
                    sizeConfig.icon,
                    "text-white transition-all duration-150",
                    // If controlled checked is true, show directly; otherwise rely on peer-checked
                    isChecked === true
                      ? "opacity-100 scale-100"
                      : isChecked === false
                      ? "opacity-0 scale-75"
                      : "opacity-0 scale-75 peer-checked:opacity-100 peer-checked:scale-100"
                  )}
                />
              )}
            </div>
          </div>

          {/* Label and Description */}
          {(label || description) && (
            <div className="flex flex-col text-left flex-1 min-w-0">
              {label && (
                <span
                  className={cn(
                    "font-medium text-zinc-700 leading-snug break-words",
                    sizeConfig.text,
                    disabled && "text-zinc-400",
                    hasError && "text-rose-700"
                  )}
                >
                  {label}
                  {required && <span className="text-rose-500 font-bold ml-1">*</span>}
                </span>
              )}
              {description && (
                <span
                  className={cn(
                    "text-zinc-400 leading-relaxed font-normal mt-0.5 break-words",
                    sizeConfig.desc,
                    disabled && "text-zinc-300"
                  )}
                >
                  {description}
                </span>
              )}
            </div>
          )}
        </label>

        {/* Validation error message or explanatory helper text */}
        {errorMessage ? (
          <p className="text-[11px] font-medium text-rose-600 animate-in fade-in pl-7">
            {errorMessage}
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-zinc-400 pl-7">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
