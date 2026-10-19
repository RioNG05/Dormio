import * as React from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { TextInput, TextInputProps } from './TextInput'

export interface SearchInputProps
  extends Omit<TextInputProps, 'onChange' | 'value'> {
  /**
   * Controlled search value from parent
   */
  value?: string
  /**
   * Default uncontrolled search value
   */
  defaultValue?: string
  /**
   * Callback fired with the debounced search value (after debounceMs of inactivity or Enter key)
   */
  onChange?: (value: string) => void
  /**
   * Alias for onChange for semantic clarity
   */
  onSearch?: (value: string) => void
  /**
   * Immediate callback fired synchronously on every keystroke
   */
  onImmediateChange?: (value: string) => void
  /**
   * Debounce delay in milliseconds. Defaults to 700ms (0.7s) as requested.
   */
  debounceMs?: number
  /**
   * Whether to display a clear (X) button when the input is non-empty. Defaults to true.
   */
  clearable?: boolean
  /**
   * Whether an async search operation is currently in flight
   */
  isLoading?: boolean
}

/**
 * Reusable debounced search input component.
 * Features:
 * - 0.7s (700ms) debounce by default
 * - Instant update of input field (no typing lag)
 * - Enter key immediately flushes the search without waiting for timer
 * - Escape key or clear button immediately clears search and flushes empty string
 * - Automatically provides Search icon on the left and clear button on the right
 * - Syncs external controlled value changes
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value: controlledValue,
      defaultValue = '',
      onChange,
      onSearch,
      onImmediateChange,
      debounceMs = 700,
      clearable = true,
      isLoading = false,
      leftIcon,
      rightIcon,
      placeholder = 'Search...',
      disabled,
      className,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const isControlled = controlledValue !== undefined
    const [localValue, setLocalValue] = React.useState<string>(
      isControlled ? controlledValue ?? '' : defaultValue,
    )
    const isMounted = React.useRef(false)
    const timerRef = React.useRef<NodeJS.Timeout | null>(null)
    const lastEmittedValueRef = React.useRef<string>(
      isControlled ? controlledValue ?? '' : defaultValue,
    )

    // Synchronize local input state when controlledValue changes from parent externally
    React.useEffect(() => {
      if (isControlled && controlledValue !== undefined && controlledValue !== lastEmittedValueRef.current) {
        setLocalValue(controlledValue)
        lastEmittedValueRef.current = controlledValue
      }
    }, [isControlled, controlledValue])

    const emitSearch = React.useCallback(
      (val: string) => {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
        if (val !== lastEmittedValueRef.current) {
          lastEmittedValueRef.current = val
          onChange?.(val)
          onSearch?.(val)
        }
      },
      [onChange, onSearch],
    )

    // Handle debouncing: triggers emitSearch after debounceMs of inactivity
    React.useEffect(() => {
      // Skip emitting on initial mount
      if (!isMounted.current) {
        isMounted.current = true
        return
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      timerRef.current = setTimeout(() => {
        emitSearch(localValue)
      }, debounceMs)

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
        }
      }
    }, [localValue, debounceMs, emitSearch])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setLocalValue(val)
      onImmediateChange?.(val)
    }

    const handleClear = () => {
      setLocalValue('')
      onImmediateChange?.('')
      emitSearch('')
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        emitSearch(localValue)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleClear()
      }
      onKeyDown?.(e)
    }

    // Default left icon is Search
    const resolvedLeftIcon =
      leftIcon !== undefined ? (
        leftIcon
      ) : (
        <Search className="w-4 h-4 text-muted shrink-0" />
      )

    // Resolved right icon: loading spinner > clear button > custom rightIcon
    const resolvedRightIcon =
      rightIcon !== undefined ? (
        rightIcon
      ) : isLoading ? (
        <Loader2 className="w-4 h-4 text-muted animate-spin shrink-0" />
      ) : clearable && localValue ? (
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          tabIndex={-1}
          className="p-1 -mr-1 text-muted hover:text-foreground focus:outline-none rounded-md transition-colors cursor-pointer"
          title="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : null

    return (
      <TextInput
        ref={ref}
        type="text"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        leftIcon={resolvedLeftIcon}
        rightIcon={resolvedRightIcon}
        className={className}
        {...props}
      />
    )
  },
)

SearchInput.displayName = 'SearchInput'

