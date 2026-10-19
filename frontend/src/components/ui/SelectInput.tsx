'use client'

import * as React from 'react'
import { ChevronDown, Check, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Text } from './Text'

function normalizeVi(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim()
}

function extractTextFromChildren(children: React.ReactNode): string {
  if (children === null || children === undefined || typeof children === 'boolean') {
    return ''
  }
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children)
  }
  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join('')
  }
  if (React.isValidElement(children)) {
    const props = children.props as { children?: React.ReactNode }
    return extractTextFromChildren(props.children)
  }
  return ''
}

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
  description?: string
  icon?: React.ReactNode
}

export interface SelectInputProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  required?: boolean
  error?: string
  helperText?: string
  options?: SelectOption[]
  containerClassName?: string
  labelClassName?: string
  placeholder?: string
  leftIcon?: React.ReactNode
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
      value,
      defaultValue,
      onChange,
      placeholder,
      leftIcon,
      name,
      ...props
    },
    ref,
  ) => {
    const internalSelectRef = React.useRef<HTMLSelectElement>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [isOpen, setIsOpen] = React.useState(false)

    // Merge external ref and internalSelectRef so consumer components can inspect/call methods on the native element
    React.useImperativeHandle(ref, () => internalSelectRef.current as HTMLSelectElement)

    // Extract options from props.options OR from <option> children (including React.Fragment and arrays)
    const parsedOptions = React.useMemo<SelectOption[]>(() => {
      if (options && options.length > 0) return options

      const result: SelectOption[] = []

      const traverse = (node: React.ReactNode) => {
        React.Children.forEach(node, child => {
          if (!React.isValidElement(child)) return

          // If child is a React.Fragment, recursively unwrap its children
          if (child.type === React.Fragment) {
            const fragmentProps = child.props as { children?: React.ReactNode }
            traverse(fragmentProps.children)
            return
          }

          const childProps = child.props as React.OptionHTMLAttributes<HTMLOptionElement> & {
            label?: string
          }
          const rawVal = childProps.value
          let optVal: string | number = ''
          if (typeof rawVal === 'string' || typeof rawVal === 'number') {
            optVal = rawVal
          } else if (Array.isArray(rawVal) && rawVal.length > 0) {
            optVal = String(rawVal[0])
          }

          let optLabel = ''
          if (childProps.label) {
            optLabel = childProps.label
          } else if (childProps.children !== undefined && childProps.children !== null) {
            optLabel = extractTextFromChildren(childProps.children)
            if (!optLabel.trim() && optVal) {
              optLabel = String(optVal)
            }
          } else {
            optLabel = String(optVal)
          }

          result.push({
            value: optVal,
            label: optLabel,
            disabled: Boolean(childProps.disabled),
          })
        })
      }

      traverse(children)
      return result
    }, [options, children])

    // Current selected value (controlled or uncontrolled fallback)
    const [internalValue, setInternalValue] = React.useState<
      string | number | readonly string[]
    >(value !== undefined ? value : defaultValue ?? '')

    React.useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value)
      }
    }, [value])

    const currentValue = value !== undefined ? value : internalValue

    // Find currently selected option
    const selectedOption = React.useMemo(() => {
      return parsedOptions.find(opt => String(opt.value) === String(currentValue))
    }, [parsedOptions, currentValue])

    // Search and filter for dropdowns with many items (>10 items like wards, provinces)
    const [searchQuery, setSearchQuery] = React.useState('')
    const searchInputRef = React.useRef<HTMLInputElement>(null)
    const listContainerRef = React.useRef<HTMLDivElement>(null)

    // Reset search query when dropdown closes, focus search when opened with >10 items
    React.useEffect(() => {
      if (!isOpen) {
        setSearchQuery('')
      } else if (parsedOptions.length > 10) {
        const timer = setTimeout(() => {
          searchInputRef.current?.focus()
        }, 50)
        return () => clearTimeout(timer)
      }
    }, [isOpen, parsedOptions.length])

    // Auto-scroll to selected item on open
    React.useEffect(() => {
      if (isOpen && listContainerRef.current) {
        const timer = setTimeout(() => {
          const selectedEl = listContainerRef.current?.querySelector('[data-selected="true"]') as HTMLElement
          if (selectedEl) {
            selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
          }
        }, 40)
        return () => clearTimeout(timer)
      }
    }, [isOpen])

    const filteredOptions = React.useMemo(() => {
      if (!searchQuery.trim()) return parsedOptions
      const q = normalizeVi(searchQuery)
      return parsedOptions.filter(opt => {
        if (!opt.value && !opt.label) return false
        return normalizeVi(opt.label).includes(q)
      })
    }, [parsedOptions, searchQuery])

    const [dropPosition, setDropPosition] = React.useState<'bottom' | 'top'>('bottom')
    const [alignPosition, setAlignPosition] = React.useState<'left' | 'right'>('left')

    // Smart positioning calculation: auto-flip when close to viewport edges
    React.useEffect(() => {
      if (!isOpen) return

      const updatePlacement = () => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const viewportWidth = window.innerWidth
        const spaceBelow = viewportHeight - rect.bottom
        const spaceAbove = rect.top
        const estimatedDropdownHeight = 250

        // Vertical auto-flip
        if (spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow) {
          setDropPosition('top')
        } else {
          setDropPosition('bottom')
        }

        // Horizontal auto-align
        if (rect.right > viewportWidth - 24 && rect.left > 140) {
          setAlignPosition('right')
        } else {
          setAlignPosition('left')
        }
      }

      updatePlacement()
      window.addEventListener('resize', updatePlacement)
      window.addEventListener('scroll', updatePlacement, true)
      return () => {
        window.removeEventListener('resize', updatePlacement)
        window.removeEventListener('scroll', updatePlacement, true)
      }
    }, [isOpen])

    // Close on click outside or Escape
    React.useEffect(() => {
      if (!isOpen) return

      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false)
        }
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsOpen(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }, [isOpen])

    const handleSelectOption = (opt: SelectOption) => {
      if (opt.disabled) return

      setInternalValue(opt.value)
      setIsOpen(false)

      // Update hidden native select and trigger synthetic change event for React & native handlers
      const nativeSelect = internalSelectRef.current
      if (nativeSelect) {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLSelectElement.prototype,
          'value',
        )?.set
        nativeSetter?.call(nativeSelect, String(opt.value))

        const event = new Event('change', { bubbles: true })
        nativeSelect.dispatchEvent(event)
      }

      if (onChange) {
        const syntheticEvent = {
          target: { value: String(opt.value), name: name || '' },
          currentTarget: { value: String(opt.value), name: name || '' },
          bubbles: true,
          cancelable: true,
          defaultPrevented: false,
          stopPropagation: () => {},
          preventDefault: () => {},
        } as unknown as React.ChangeEvent<HTMLSelectElement>

        onChange(syntheticEvent)
      }
    }

    const selectId =
      id || (label ? `select-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined)

    const displayLabel = selectedOption
      ? selectedOption.label
      : placeholder || (parsedOptions[0]?.label ?? '')

    return (
      <div ref={containerRef} className={cn('relative space-y-1.5 w-full', containerClassName)}>
        {/* Hidden native select for HTML form submission and ref support */}
        <select
          ref={internalSelectRef}
          id={selectId}
          name={name}
          value={currentValue}
          required={required}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          onChange={e => {
            setInternalValue(e.target.value)
            onChange?.(e)
          }}
          {...props}
        >
          {parsedOptions.map((opt, index) => (
            <option key={`${String(opt.value)}-${index}`} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        {label && (
          <label
            onClick={() => !disabled && setIsOpen(prev => !prev)}
            className={cn(
              'block text-xs font-bold text-zinc-700 dark:text-slate-200 select-none cursor-pointer',
              disabled && 'text-zinc-400 dark:text-slate-500 cursor-not-allowed',
              labelClassName,
            )}
          >
            <Text as="span" size="xs" weight="bold" color="inherit">
              {label}
            </Text>
            {required && (
              <Text as="span" size="xs" weight="bold" color="danger" className="ml-1">
                *
              </Text>
            )}
          </label>
        )}

        <div className="relative">
          {/* Custom Trigger Button */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => !disabled && setIsOpen(prev => !prev)}
            className={cn(
              'w-full flex items-center justify-between rounded-xl border pl-3.5 pr-3 py-2.5 text-xs font-semibold transition-all duration-200 outline-none text-left cursor-pointer select-none',
              disabled
                ? 'bg-zinc-100 dark:bg-surface text-zinc-400 dark:text-slate-500 border-zinc-200 dark:border-line cursor-not-allowed shadow-none'
                : error
                  ? 'bg-white dark:bg-input border-rose-400 dark:border-rose-500/80 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/15'
                  : isOpen
                    ? 'bg-white dark:bg-input border-[#2AC1BC] ring-3 ring-[#2AC1BC]/20 text-zinc-900 dark:text-foreground shadow-sm'
                    : 'bg-white dark:bg-input border-zinc-200 dark:border-line text-zinc-800 dark:text-foreground hover:border-zinc-300 dark:hover:border-primary/50 hover:bg-zinc-50/50 dark:hover:bg-card-hover/50 shadow-2xs',
              className,
            )}
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              {leftIcon && <span className="shrink-0 text-zinc-400 dark:text-slate-400">{leftIcon}</span>}
              <Text
                as="span"
                size="xs"
                weight={!selectedOption && placeholder ? 'normal' : 'semibold'}
                color={!selectedOption && placeholder ? 'subtle' : 'inherit'}
                className="truncate"
              >
                {displayLabel}
              </Text>
            </div>

            <ChevronDown
              className={cn(
                'w-4 h-4 text-zinc-400 dark:text-slate-400 shrink-0 transition-transform duration-200 ease-in-out',
                isOpen && 'rotate-180 text-[#2AC1BC]',
              )}
            />
          </button>

          {/* Animated Custom Floating Dropdown Menu */}
          {isOpen && (
            <div
              className={cn(
                'absolute z-50 rounded-2xl border border-zinc-200/90 dark:border-line bg-white/95 dark:bg-card/95 backdrop-blur-md shadow-xl shadow-zinc-950/10 dark:shadow-black/50 p-1.5 flex flex-col',
                'w-full min-w-full',
                alignPosition === 'right' ? 'right-0' : 'left-0',
                dropPosition === 'top'
                  ? 'bottom-full mb-1.5 origin-bottom animate-in fade-in slide-in-from-bottom-2 zoom-in-95 duration-150 ease-out'
                  : 'top-full mt-1.5 origin-top animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-150 ease-out',
              )}
            >
              {/* Search Bar for large lists (> 10 items) */}
              {parsedOptions.length > 10 && (
                <div className="p-1 pb-1.5 border-b border-zinc-100 dark:border-line">
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-slate-400 absolute left-2.5 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm..."
                      onClick={e => e.stopPropagation()}
                      className="w-full pl-8 pr-7 py-1.5 text-xs bg-zinc-100/80 dark:bg-surface hover:bg-zinc-100 dark:hover:bg-card-hover focus:bg-white dark:focus:bg-input border border-transparent focus:border-[#2AC1BC] rounded-xl outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-slate-500 text-foreground font-medium"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation()
                          setSearchQuery('')
                          searchInputRef.current?.focus()
                        }}
                        className="absolute right-2 p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-200 rounded-md cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Scrollable Options List */}
              <div
                ref={listContainerRef}
                className="max-h-56 overflow-y-auto custom-scrollbar flex flex-col gap-0.5 pt-1"
              >
                {filteredOptions.length === 0 ? (
                  <Text as="div" size="xs" color="subtle" weight="medium" align="center" className="px-3 py-3">
                    {searchQuery ? 'Không tìm thấy kết quả' : placeholder || 'Không có tùy chọn'}
                  </Text>
                ) : (
                  filteredOptions.map((opt, index) => {
                    const isSelected = String(opt.value) === String(currentValue)
                    return (
                      <button
                        key={`${String(opt.value)}-${index}`}
                        type="button"
                        data-selected={isSelected}
                        disabled={opt.disabled}
                        onClick={() => handleSelectOption(opt)}
                        className={cn(
                          'w-full flex items-center justify-between px-3.5 py-2.5 sm:py-2 rounded-xl text-xs text-left transition-all duration-150 cursor-pointer',
                          opt.disabled
                            ? 'opacity-40 cursor-not-allowed pointer-events-none'
                            : isSelected
                              ? 'bg-[#2AC1BC]/15 text-[#2AC1BC] font-extrabold shadow-2xs'
                              : 'text-zinc-700 dark:text-slate-200 hover:bg-zinc-100 dark:hover:bg-card-hover hover:text-zinc-900 dark:hover:text-white font-semibold',
                        )}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                          <Text as="span" size="xs" color="inherit" className="truncate">
                            {opt.label}
                          </Text>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#2AC1BC] shrink-0 ml-1.5 animate-in zoom-in-75 duration-100" />
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {error ? (
          <Text as="p" size="2xs" weight="medium" color="danger" className="animate-in fade-in">
            {error}
          </Text>
        ) : helperText ? (
          <Text as="p" size="2xs" color="subtle">
            {helperText}
          </Text>
        ) : null}
      </div>
    )
  },
)

SelectInput.displayName = 'SelectInput'
