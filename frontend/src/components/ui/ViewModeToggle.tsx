'use client'

import React, { useMemo } from 'react'
import { LayoutGrid, List, Table, Calendar, Map } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*                                Types                                       */
/* -------------------------------------------------------------------------- */

export type StandardViewMode = 'grid' | 'table' | 'list' | 'calendar' | 'map' | string

export interface ViewModeOption<T extends string = string> {
  /** Giá trị định danh của chế độ xem */
  value: T
  /** Nhãn chữ hiển thị (khi showLabels=true hoặc trên desktop) */
  label?: string
  /** Tooltip hiển thị khi hover và aria-label */
  title?: string
  /** Icon hiển thị (nếu bỏ trống, tự suy luận theo value) */
  icon?: React.ReactNode
}

export interface ViewModeToggleProps<T extends string = string> {
  /** Giá trị viewMode hiện tại */
  value: T
  /** Callback khi người dùng chuyển đổi chế độ xem */
  onChange: (value: T) => void
  /** Danh sách tuỳ chọn (Mặc định: Grid và Table/List) */
  options?: ViewModeOption<T>[]
  /** 
   * Tự động điều chỉnh pageSize theo Rule #9 khi chuyển chế độ:
   * Grid -> 6, Table/List -> 10 (hoặc custom thông qua gridPageSize / tablePageSize)
   */
  onPageSizeChange?: (pageSize: number) => void
  /** Tự động reset trang hiện tại về 1 khi chuyển chế độ */
  onPageChange?: (page: number) => void
  /** Kích thước số dòng mặc định cho Grid (mặc định: 6 theo Rule #9) */
  gridPageSize?: number
  /** Kích thước số dòng mặc định cho Table / List (mặc định: 10 theo Rule #9) */
  tablePageSize?: number
  /** Kích thước nút bấm: 'xs' | 'sm' | 'md' (mặc định: 'sm') */
  size?: 'xs' | 'sm' | 'md'
  /** Có hiển thị chữ nhãn trên màn hình sm+ không (mặc định: false - icon-only với tooltip) */
  showLabels?: boolean
  /** ClassName bổ sung cho container ngoài cùng */
  className?: string
  /** Biến thể giao diện: 'segmented' (mặc định với nền card-hover) hoặc 'outline' */
  variant?: 'segmented' | 'outline'
  /** Vô hiệu hoá tương tác */
  disabled?: boolean
  /** Nhãn accessibility cho cụm điều khiển */
  ariaLabel?: string
}

/* -------------------------------------------------------------------------- */
/*                          ViewModeToggle Component                          */
/* -------------------------------------------------------------------------- */

export function ViewModeToggle<T extends string = string>({
  value,
  onChange,
  options: customOptions,
  onPageSizeChange,
  onPageChange,
  gridPageSize = 6,
  tablePageSize = 10,
  size = 'sm',
  showLabels = false,
  className,
  variant = 'segmented',
  disabled = false,
  ariaLabel,
}: ViewModeToggleProps<T>) {
  const tCommon = useTranslations('common')

  const iconSizeClass = cn(
    size === 'xs' && 'w-3 h-3',
    size === 'sm' && 'w-3.5 h-3.5',
    size === 'md' && 'w-4 h-4',
  )

  // Suy luận danh sách options mặc định nếu không truyền
  const options = useMemo<ViewModeOption<T>[]>(() => {
    if (customOptions && customOptions.length > 0) {
      return customOptions
    }

    // Nếu giá trị hiện tại là 'list', mặc định cặp [grid, list]
    const secondaryValue = (value === 'list' ? 'list' : 'table') as T

    return [
      {
        value: 'grid' as T,
        label: tCommon('gridView'),
        title: tCommon('gridView'),
        icon: <LayoutGrid className={iconSizeClass} />,
      },
      {
        value: secondaryValue,
        label: secondaryValue === 'list' ? tCommon('listView') : tCommon('tableView'),
        title: secondaryValue === 'list' ? tCommon('listView') : tCommon('tableView'),
        icon: <List className={iconSizeClass} />,
      },
    ]
  }, [customOptions, value, tCommon, iconSizeClass])

  const handleSelect = (nextValue: T) => {
    if (nextValue === value || disabled) return
    onChange(nextValue)
  }

  const containerSizes = {
    xs: 'p-0.5 rounded-lg gap-0.5',
    sm: 'p-1 rounded-xl gap-1',
    md: 'p-1 rounded-xl gap-1',
  }

  const buttonSizes = {
    xs: showLabels ? 'h-6 px-2 text-[11px]' : 'h-6 w-6 text-[11px]',
    sm: showLabels ? 'h-7 px-2.5 text-xs' : 'h-7 w-7 text-xs',
    md: showLabels ? 'h-8 px-3 text-sm' : 'h-8 w-8 text-sm',
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel || tCommon('gridView')}
      className={cn(
        'inline-flex items-center shrink-0 transition-colors',
        variant === 'segmented' && 'bg-card-hover border border-line',
        variant === 'outline' && 'border border-line bg-card',
        containerSizes[size],
        disabled && 'opacity-60 pointer-events-none',
        className,
      )}
    >
      {options.map(opt => {
        const isActive = opt.value === value
        const title = opt.title || opt.label

        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={title}
            title={title}
            disabled={disabled}
            onClick={() => handleSelect(opt.value)}
            className={cn(
              'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 select-none cursor-pointer',
              buttonSizes[size],
              isActive
                ? 'bg-card text-foreground shadow-2xs font-bold border border-line/60'
                : 'text-muted hover:text-foreground hover:bg-card/50',
            )}
          >
            {opt.icon || (
              opt.value === 'grid' ? (
                <LayoutGrid className={iconSizeClass} />
              ) : opt.value === 'calendar' ? (
                <Calendar className={iconSizeClass} />
              ) : opt.value === 'map' ? (
                <Map className={iconSizeClass} />
              ) : (
                <List className={iconSizeClass} />
              )
            )}
            {showLabels && opt.label && (
              <span className="hidden sm:inline ml-1.5 whitespace-nowrap">{opt.label}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

