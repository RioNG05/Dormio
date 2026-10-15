'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/context/LanguageContext'

export interface DateInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string
  required?: boolean
  error?: string
  helperText?: string
  containerClassName?: string
  labelClassName?: string
  maxDate?: string | 'today'
  minDate?: string
  displayFormat?: 'DD/MM/YYYY' | 'YYYY-MM-DD'
}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
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
      id,
      value,
      defaultValue,
      onChange,
      maxDate,
      minDate,
      name,
      placeholder = 'DD/MM/YYYY',
      displayFormat = 'DD/MM/YYYY',
      ...props
    },
    ref,
  ) => {
    const internalInputRef = React.useRef<HTMLInputElement>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [isOpen, setIsOpen] = React.useState(false)

    const { currentLocale } = useLanguage()
    const isEn = currentLocale === 'en'

    const [mounted, setMounted] = React.useState(false)
    const [isMobile, setIsMobile] = React.useState(false)
    const [dropPosition, setDropPosition] = React.useState<'bottom' | 'top'>('bottom')
    const [alignPosition, setAlignPosition] = React.useState<'left' | 'right'>('left')

    // Calendar view mode: 'days' | 'months' | 'years'
    const [calendarView, setCalendarView] = React.useState<'days' | 'months' | 'years'>('days')
    const yearGridRef = React.useRef<HTMLDivElement>(null)

    // Reset view to 'days' whenever popup closes
    React.useEffect(() => {
      if (!isOpen) {
        setCalendarView('days')
      }
    }, [isOpen])

    React.useEffect(() => {
      setMounted(true)
      const handleResize = () => {
        setIsMobile(window.innerWidth < 640)
      }
      handleResize()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Smart positioning calculation for desktop view
    React.useEffect(() => {
      if (!isOpen || isMobile) return

      const updatePlacement = () => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const viewportWidth = window.innerWidth
        const spaceBelow = viewportHeight - rect.bottom
        const spaceAbove = rect.top
        const calendarHeight = 350
        const calendarWidth = 320

        // Vertical flip
        if (spaceBelow < calendarHeight && spaceAbove > spaceBelow) {
          setDropPosition('top')
        } else {
          setDropPosition('bottom')
        }

        // Horizontal flip: if anchored at left-0 would overflow right edge
        if (rect.left + calendarWidth > viewportWidth - 16 || rect.right > viewportWidth - 60) {
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
    }, [isOpen, isMobile])

    // Forward ref to hidden input
    React.useImperativeHandle(ref, () => internalInputRef.current as HTMLInputElement)

    // Normalized ISO date value (YYYY-MM-DD)
    const [internalValue, setInternalValue] = React.useState<string>(() => {
      const init = value !== undefined ? value : defaultValue ?? ''
      return typeof init === 'string' ? init : ''
    })

    React.useEffect(() => {
      if (value !== undefined) {
        setInternalValue(typeof value === 'string' ? value : '')
      }
    }, [value])

    const currentValue = typeof value === 'string' ? value : internalValue

    // Calculate maximum date string (YYYY-MM-DD)
    const calculatedMax = React.useMemo(() => {
      if (maxDate === 'today') {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      return maxDate || (props.max as string) || undefined
    }, [maxDate, props.max])

    const calculatedMin = React.useMemo(() => {
      return minDate || (props.min as string) || undefined
    }, [minDate, props.min])

    // Derived min and max bounds for year & month navigation
    const minMaxLimits = React.useMemo(() => {
      let minYear: number | undefined
      let minMonth: number | undefined
      let maxYear: number | undefined
      let maxMonth: number | undefined

      if (calculatedMin && !isNaN(Date.parse(calculatedMin))) {
        const [y, m] = calculatedMin.split('-').map(Number)
        minYear = y
        minMonth = m - 1
      }

      if (calculatedMax && !isNaN(Date.parse(calculatedMax))) {
        const [y, m] = calculatedMax.split('-').map(Number)
        maxYear = y
        maxMonth = m - 1
      }

      return { minYear, minMonth, maxYear, maxMonth }
    }, [calculatedMin, calculatedMax])

    // Current view year & month in the calendar popup
    const [viewDate, setViewDate] = React.useState<Date>(() => {
      if (currentValue && !isNaN(Date.parse(currentValue))) {
        return new Date(currentValue)
      }
      return new Date()
    })

    // Sync viewDate when opening or when currentValue changes externally
    React.useEffect(() => {
      if (currentValue && !isNaN(Date.parse(currentValue))) {
        setViewDate(new Date(currentValue))
      }
    }, [currentValue])

    // Format ISO YYYY-MM-DD to display string
    const formatToDisplay = React.useCallback(
      (isoStr: string): string => {
        if (!isoStr || isNaN(Date.parse(isoStr))) return ''
        const [y, m, d] = isoStr.split('-')
        if (!y || !m || !d) return isoStr
        if (displayFormat === 'YYYY-MM-DD') return isoStr
        return `${d}/${m}/${y}`
      },
      [displayFormat],
    )

    // Parse display string (DD/MM/YYYY or YYYY-MM-DD) to ISO YYYY-MM-DD with strict boundary check
    const parseToISO = (str: string): string | null => {
      const trimmed = str.trim()
      if (!trimmed) return ''

      // Matches DD/MM/YYYY or DD-MM-YYYY
      const dmy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
      if (dmy) {
        const day = dmy[1].padStart(2, '0')
        const month = dmy[2].padStart(2, '0')
        const year = dmy[3]
        const d = new Date(Number(year), Number(month) - 1, Number(day))
        if (
          d.getFullYear() === Number(year) &&
          d.getMonth() === Number(month) - 1 &&
          d.getDate() === Number(day)
        ) {
          return `${year}-${month}-${day}`
        }
      }

      // Matches YYYY-MM-DD or YYYY/MM/DD
      const ymd = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/)
      if (ymd) {
        const year = ymd[1]
        const month = ymd[2].padStart(2, '0')
        const day = ymd[3].padStart(2, '0')
        const d = new Date(Number(year), Number(month) - 1, Number(day))
        if (
          d.getFullYear() === Number(year) &&
          d.getMonth() === Number(month) - 1 &&
          d.getDate() === Number(day)
        ) {
          return `${year}-${month}-${day}`
        }
      }

      return null
    }

    const [inputValue, setInputValue] = React.useState<string>(formatToDisplay(currentValue))

    React.useEffect(() => {
      setInputValue(formatToDisplay(currentValue))
    }, [currentValue, formatToDisplay])

    // Close on click outside or Escape
    React.useEffect(() => {
      if (!isOpen) return

      const handleClickOutside = (e: MouseEvent) => {
        if (isMobile) return // Handled by mobile backdrop overlay
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

    // Emit new date selection
    const emitDateChange = (newIso: string) => {
      setInternalValue(newIso)
      setInputValue(formatToDisplay(newIso))

      const nativeInput = internalInputRef.current
      if (nativeInput) {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value',
        )?.set
        nativeSetter?.call(nativeInput, newIso)

        const event = new Event('change', { bubbles: true })
        nativeInput.dispatchEvent(event)
      }

      if (onChange) {
        const syntheticEvent = {
          target: { value: newIso, name: name || '' },
          currentTarget: { value: newIso, name: name || '' },
          bubbles: true,
          cancelable: true,
          defaultPrevented: false,
          stopPropagation: () => {},
          preventDefault: () => {},
        } as unknown as React.ChangeEvent<HTMLInputElement>

        onChange(syntheticEvent)
      }
    }

    const handleSelectDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const iso = `${year}-${month}-${day}`

      if (calculatedMax && iso > calculatedMax) return
      if (calculatedMin && iso < calculatedMin) return

      emitDateChange(iso)
      setIsOpen(false)
    }

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation()
      emitDateChange('')
    }

    const handleSelectToday = () => {
      handleSelectDate(new Date())
    }

    // Manual typing into visible input
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value
      setInputValue(text)

      const parsedIso = parseToISO(text)
      if (parsedIso !== null) {
        if (calculatedMax && parsedIso > calculatedMax) return
        if (calculatedMin && parsedIso < calculatedMin) return
        emitDateChange(parsedIso)
      }
    }

    // Month & Year navigation
    const viewYear = viewDate.getFullYear()
    const viewMonth = viewDate.getMonth()

    // Auto-scroll year grid to active year when opening years view or changing viewYear
    React.useEffect(() => {
      if (calendarView === 'years' && yearGridRef.current) {
        const timeout = setTimeout(() => {
          const activeEl = yearGridRef.current?.querySelector('[data-active="true"]') as HTMLElement
          if (activeEl) {
            activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' })
          }
        }, 20)
        return () => clearTimeout(timeout)
      }
    }, [calendarView, viewYear])

    const handlePrevMonth = () => {
      setViewDate(new Date(viewYear, viewMonth - 1, 1))
    }

    const handleNextMonth = () => {
      setViewDate(new Date(viewYear, viewMonth + 1, 1))
    }

    const handleMonthChange = (newMonth: number) => {
      setViewDate(new Date(viewYear, newMonth, 1))
    }

    const handleYearChange = (newYear: number) => {
      setViewDate(new Date(newYear, viewMonth, 1))
    }

    // Compute Calendar Days
    const calendarDays = React.useMemo(() => {
      const firstDayOfMonth = new Date(viewYear, viewMonth, 1)
      const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0)
      const daysInMonth = lastDayOfMonth.getDate()

      // Days of the week in Vietnam: Monday = 1 ... Sunday = 0
      // Let's use standard Sunday = 0 to Saturday = 6
      const startDay = firstDayOfMonth.getDay()

      // Previous month days to pad
      const prevMonthDaysCount = startDay
      const prevMonthLastDate = new Date(viewYear, viewMonth, 0).getDate()

      const days: Array<{
        date: Date
        isCurrentMonth: boolean
        iso: string
        isDisabled: boolean
        isToday: boolean
        isSelected: boolean
      }> = []

      // Pad previous month
      for (let i = prevMonthDaysCount - 1; i >= 0; i--) {
        const d = new Date(viewYear, viewMonth - 1, prevMonthLastDate - i)
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const dayNum = String(d.getDate()).padStart(2, '0')
        const iso = `${y}-${m}-${dayNum}`
        days.push({
          date: d,
          isCurrentMonth: false,
          iso,
          isDisabled: true,
          isToday: false,
          isSelected: false,
        })
      }

      const todayIso = new Date().toISOString().split('T')[0]

      // Current month days
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(viewYear, viewMonth, i)
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const dayNum = String(d.getDate()).padStart(2, '0')
        const iso = `${y}-${m}-${dayNum}`

        const isDisabled = Boolean(
          (calculatedMax && iso > calculatedMax) || (calculatedMin && iso < calculatedMin),
        )

        days.push({
          date: d,
          isCurrentMonth: true,
          iso,
          isDisabled,
          isToday: iso === todayIso,
          isSelected: iso === currentValue,
        })
      }

      // Pad next month to complete standard 35 or 42 grid
      const totalCells = days.length <= 35 ? 35 : 42
      const remainingCells = totalCells - days.length
      for (let i = 1; i <= remainingCells; i++) {
        const d = new Date(viewYear, viewMonth + 1, i)
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const dayNum = String(d.getDate()).padStart(2, '0')
        const iso = `${y}-${m}-${dayNum}`
        days.push({
          date: d,
          isCurrentMonth: false,
          iso,
          isDisabled: true,
          isToday: false,
          isSelected: false,
        })
      }

      return days
    }, [viewYear, viewMonth, calculatedMax, calculatedMin, currentValue])

    const inputId = id || (label ? `date-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined)

    // Generate years list (from 1940 to 2040)
    const yearOptions = React.useMemo(() => {
      const currentY = new Date().getFullYear()
      const minY = Math.min(1940, currentY - 70)
      const maxY = Math.max(2040, currentY + 20)
      const years: number[] = []
      for (let y = maxY; y >= minY; y--) {
        years.push(y)
      }
      return years
    }, [])

    const monthNames = React.useMemo(() => {
      if (isEn) {
        return [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ]
      }
      return [
        'Tháng 1',
        'Tháng 2',
        'Tháng 3',
        'Tháng 4',
        'Tháng 5',
        'Tháng 6',
        'Tháng 7',
        'Tháng 8',
        'Tháng 9',
        'Tháng 10',
        'Tháng 11',
        'Tháng 12',
      ]
    }, [isEn])

    const dayHeaders = React.useMemo(() => {
      if (isEn) return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
      return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    }, [isEn])

    const textToday = isEn ? 'Today' : 'Hôm nay'
    const textClear = isEn ? 'Clear' : 'Xóa'
    const textClose = isEn ? 'Close' : 'Đóng'
    const textSelectDate = isEn ? 'Select date' : 'Chọn ngày'

    const renderCalendarBody = () => (
      <div className="flex flex-col">
        {/* Calendar Navigation Header */}
        <div className="flex items-center justify-between gap-1 pb-3 mb-2 border-b border-zinc-100">
          <button
            type="button"
            onClick={
              calendarView === 'months'
                ? () => handleYearChange(viewYear - 1)
                : calendarView === 'years'
                  ? () => handleYearChange(viewYear - 12)
                  : handlePrevMonth
            }
            className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
            title={
              calendarView === 'months'
                ? isEn
                  ? 'Previous year'
                  : 'Năm trước'
                : calendarView === 'years'
                  ? isEn
                    ? 'Previous decade'
                    : 'Thập kỷ trước'
                  : isEn
                    ? 'Previous month'
                    : 'Tháng trước'
            }
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Month & Year Trigger Buttons */}
          <div className="flex items-center gap-1.5">
            {/* Month Trigger Button */}
            <button
              type="button"
              onClick={() => setCalendarView(v => (v === 'months' ? 'days' : 'months'))}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none',
                calendarView === 'months'
                  ? 'bg-[#2AC1BC] text-white shadow-xs shadow-[#2AC1BC]/30'
                  : 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 border border-zinc-200/60',
              )}
            >
              <span>{monthNames[viewMonth]}</span>
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 transition-transform duration-200',
                  calendarView === 'months' ? 'rotate-180 text-white' : 'text-zinc-400',
                )}
              />
            </button>

            {/* Year Trigger Button */}
            <button
              type="button"
              onClick={() => setCalendarView(v => (v === 'years' ? 'days' : 'years'))}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none',
                calendarView === 'years'
                  ? 'bg-[#2AC1BC] text-white shadow-xs shadow-[#2AC1BC]/30'
                  : 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 border border-zinc-200/60',
              )}
            >
              <span>{viewYear}</span>
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 transition-transform duration-200',
                  calendarView === 'years' ? 'rotate-180 text-white' : 'text-zinc-400',
                )}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={
              calendarView === 'months'
                ? () => handleYearChange(viewYear + 1)
                : calendarView === 'years'
                  ? () => handleYearChange(viewYear + 12)
                  : handleNextMonth
            }
            className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
            title={
              calendarView === 'months'
                ? isEn
                  ? 'Next year'
                  : 'Năm sau'
                : calendarView === 'years'
                  ? isEn
                    ? 'Next decade'
                    : 'Thập kỷ sau'
                  : isEn
                    ? 'Next month'
                    : 'Tháng sau'
            }
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode: Months Grid */}
        {calendarView === 'months' && (
          <div className="grid grid-cols-3 gap-2 py-2 animate-in fade-in zoom-in-95 duration-150">
            {monthNames.map((name, idx) => {
              const isSelected = idx === viewMonth
              const isDisabled = Boolean(
                (minMaxLimits.maxYear !== undefined &&
                  (viewYear > minMaxLimits.maxYear ||
                    (viewYear === minMaxLimits.maxYear && idx > minMaxLimits.maxMonth!))) ||
                  (minMaxLimits.minYear !== undefined &&
                    (viewYear < minMaxLimits.minYear ||
                      (viewYear === minMaxLimits.minYear && idx < minMaxLimits.minMonth!))),
              )

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    handleMonthChange(idx)
                    setCalendarView('days')
                  }}
                  className={cn(
                    'py-3 px-2 rounded-2xl text-xs font-bold transition-all duration-150 cursor-pointer select-none text-center',
                    isSelected
                      ? 'bg-[#2AC1BC] text-white shadow-md shadow-[#2AC1BC]/30 scale-105 font-black'
                      : isDisabled
                        ? 'text-zinc-300 bg-zinc-50/50 cursor-not-allowed pointer-events-none opacity-40'
                        : 'text-zinc-700 bg-zinc-50 hover:bg-[#2AC1BC]/15 hover:text-[#2AC1BC]',
                  )}
                >
                  {name}
                </button>
              )
            })}
          </div>
        )}

        {/* View Mode: Years Grid */}
        {calendarView === 'years' && (
          <div
            ref={yearGridRef}
            className="grid grid-cols-3 gap-2 py-2 max-h-[240px] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150 pr-1"
          >
            {yearOptions.map(y => {
              const isSelected = y === viewYear
              const isDisabled = Boolean(
                (minMaxLimits.maxYear !== undefined && y > minMaxLimits.maxYear) ||
                  (minMaxLimits.minYear !== undefined && y < minMaxLimits.minYear),
              )

              return (
                <button
                  key={y}
                  type="button"
                  data-active={isSelected}
                  disabled={isDisabled}
                  onClick={() => {
                    handleYearChange(y)
                    setCalendarView('days')
                  }}
                  className={cn(
                    'py-2.5 px-2 rounded-2xl text-xs font-bold transition-all duration-150 cursor-pointer select-none text-center',
                    isSelected
                      ? 'bg-[#2AC1BC] text-white shadow-md shadow-[#2AC1BC]/30 scale-105 font-black'
                      : isDisabled
                        ? 'text-zinc-300 bg-zinc-50/50 cursor-not-allowed pointer-events-none opacity-40'
                        : 'text-zinc-700 bg-zinc-50 hover:bg-[#2AC1BC]/15 hover:text-[#2AC1BC]',
                  )}
                >
                  {y}
                </button>
              )
            })}
          </div>
        )}

        {/* View Mode: Days Calendar */}
        {calendarView === 'days' && (
          <>
            {/* Day of Week Header */}
            <div className="grid grid-cols-7 gap-1 mb-1 text-center">
              {dayHeaders.map(day => (
                <div key={day} className="text-[10px] font-black text-zinc-400 py-1 uppercase">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((dayItem, index) => {
                return (
                  <button
                    key={index}
                    type="button"
                    disabled={dayItem.isDisabled}
                    onClick={() => handleSelectDate(dayItem.date)}
                    className={cn(
                      'h-9 w-9 sm:h-8 sm:w-8 mx-auto flex items-center justify-center text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer select-none',
                      !dayItem.isCurrentMonth && 'text-zinc-300 pointer-events-none opacity-40',
                      dayItem.isCurrentMonth && !dayItem.isSelected && !dayItem.isDisabled && (
                        dayItem.isToday
                          ? 'border-2 border-[#2AC1BC] text-[#2AC1BC] hover:bg-[#2AC1BC]/10'
                          : 'text-zinc-700 hover:bg-[#2AC1BC]/15 hover:text-[#2AC1BC]'
                      ),
                      dayItem.isSelected && (
                        'bg-[#2AC1BC] text-white font-black shadow-md shadow-[#2AC1BC]/30 scale-105'
                      ),
                      dayItem.isDisabled && dayItem.isCurrentMonth && (
                        'text-zinc-300 cursor-not-allowed pointer-events-none opacity-30'
                      ),
                    )}
                  >
                    {dayItem.date.getDate()}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* Bottom Quick Actions Footer */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-100 text-xs">
          {calendarView !== 'days' ? (
            <button
              type="button"
              onClick={() => setCalendarView('days')}
              className="font-bold text-[#2AC1BC] hover:text-[#239f9b] px-2 py-1 rounded-lg hover:bg-[#2AC1BC]/10 transition-colors cursor-pointer"
            >
              {isEn ? '← Back to days' : '← Quay lại ngày'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSelectToday}
              className="font-bold text-[#2AC1BC] hover:text-[#239f9b] px-2 py-1 rounded-lg hover:bg-[#2AC1BC]/10 transition-colors cursor-pointer"
            >
              {textToday}
            </button>
          )}

          <div className="flex items-center gap-1.5">
            {currentValue && calendarView === 'days' && (
              <button
                type="button"
                onClick={handleClear}
                className="font-semibold text-zinc-400 hover:text-zinc-600 px-2 py-1 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                {textClear}
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="font-bold text-zinc-600 hover:text-zinc-900 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              {textClose}
            </button>
          </div>
        </div>
      </div>
    )

    return (
      <div ref={containerRef} className={cn('relative space-y-1.5 w-full', containerClassName)}>
        {/* Hidden input keeping exact ISO YYYY-MM-DD for forms & refs */}
        <input
          ref={internalInputRef}
          type="text"
          id={inputId}
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
        />

        {label && (
          <label
            onClick={() => !disabled && setIsOpen(prev => !prev)}
            className={cn(
              'block text-xs font-bold text-zinc-700 select-none cursor-pointer',
              disabled && 'text-zinc-400 cursor-not-allowed',
              labelClassName,
            )}
          >
            <span>{label}</span>
            {required && <span className="text-rose-500 font-bold ml-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {/* Calendar Icon on Left */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => !disabled && setIsOpen(prev => !prev)}
            className="absolute left-3 flex items-center text-zinc-400 hover:text-[#2AC1BC] transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <CalendarIcon className="w-4 h-4" />
          </button>

          {/* Visible Display Input */}
          <input
            type="text"
            value={inputValue}
            placeholder={placeholder}
            disabled={disabled}
            onClick={() => !disabled && setIsOpen(true)}
            onChange={handleInputChange}
            className={cn(
              'w-full rounded-xl border pl-9 pr-9 py-2.5 text-xs font-semibold transition-all duration-200 outline-none select-none',
              disabled
                ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed shadow-none'
                : error
                  ? 'bg-white border-rose-400 text-rose-900 ring-2 ring-rose-500/15'
                  : isOpen
                    ? 'bg-white border-[#2AC1BC] ring-3 ring-[#2AC1BC]/15 text-zinc-900 shadow-sm'
                    : 'bg-white border-zinc-200 text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50/50 shadow-2xs',
              className,
            )}
          />

          {/* Clear button or dropdown toggle */}
          {currentValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="Xóa ngày"
              className="absolute right-3 p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Desktop Floating Popover */}
          {isOpen && !isMobile && (
            <div
              className={cn(
                'absolute z-50 w-80 max-w-[calc(100vw-2rem)] rounded-3xl border border-zinc-200/90 bg-white/95 backdrop-blur-md shadow-2xl shadow-zinc-950/15 p-4',
                alignPosition === 'right' ? 'right-0' : 'left-0',
                dropPosition === 'top'
                  ? 'bottom-full mb-2 origin-bottom animate-in fade-in slide-in-from-bottom-2 zoom-in-95 duration-150 ease-out'
                  : 'top-full mt-2 origin-top animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-150 ease-out',
              )}
            >
              {renderCalendarBody()}
            </div>
          )}

          {/* Mobile Bottom-sheet Modal rendered via React Portal */}
          {isOpen && isMobile && mounted && typeof document !== 'undefined' && createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200 p-0"
              onClick={() => setIsOpen(false)}
            >
              <div
                className="w-full max-w-sm bg-white rounded-t-3xl p-4 shadow-2xl border-t border-zinc-200 animate-in slide-in-from-bottom duration-200 max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                {/* Mobile Header Handle & Title */}
                <div className="flex flex-col items-center mb-3">
                  <div className="w-10 h-1 bg-zinc-300 rounded-full mb-3" />
                  <div className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-[#2AC1BC]" />
                      <span className="text-xs font-bold text-zinc-800">
                        {label || textSelectDate}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {renderCalendarBody()}
              </div>
            </div>,
            document.body,
          )}
        </div>

        {error ? (
          <p className="text-[11px] font-medium text-rose-600 animate-in fade-in">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-zinc-400">{helperText}</p>
        ) : null}
      </div>
    )
  },
)

DateInput.displayName = 'DateInput'
