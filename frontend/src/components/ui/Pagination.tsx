'use client'

import React, { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { Button } from './Button'
import { Text } from './Text'
import { NumberInput } from './NumberInput'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*                                Types                                       */
/* -------------------------------------------------------------------------- */

export interface PaginationProps {
  /** Trang hiện tại (1-based index) */
  currentPage: number
  /** Tổng số bản ghi dữ liệu */
  totalItems: number
  /** Số bản ghi trên mỗi trang */
  pageSize: number
  /** Callback khi người dùng chuyển trang */
  onPageChange: (page: number) => void
  /** Callback khi người dùng thay đổi số dòng / trang (nếu bỏ trống, ẩn ô nhập số dòng) */
  onPageSizeChange?: (pageSize: number) => void
  /** Giới hạn số dòng / trang nhỏ nhất (mặc định: 1) */
  pageSizeMin?: number
  /** Giới hạn số dòng / trang lớn nhất (mặc định: 500) */
  pageSizeMax?: number
  /** Kích thước cửa sổ nhảy trang (mặc định: 5 theo Quy tắc #9) */
  windowSize?: number
  /** Tên đơn vị bản ghi tuỳ biến (VD: "hợp đồng", "phòng", "khách thuê", mặc định: "mục") */
  unitLabel?: string
  /** Có hiển thị dải bản ghi X - Y trên Z không (mặc định: true) */
  showItemRange?: boolean
  /** Có hiển thị ô nhập số dòng trên trang không (mặc định: true) */
  showPageSizeInput?: boolean
  /** Có hiển thị các nút nhảy cửa sổ lùi/tiến 5 trang («, ») không (mặc định: true) */
  showWindowJumping?: boolean
  /** ClassName bổ sung cho container ngoài cùng */
  className?: string
  /** Kiểu dáng hiển thị: 'card' (có nền card + viền) hoặc 'flat' (trong suốt) */
  variant?: 'card' | 'flat'
}

/* -------------------------------------------------------------------------- */
/*                             Pagination Component                           */
/* -------------------------------------------------------------------------- */

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeMin = 1,
  pageSizeMax = 500,
  windowSize = 5,
  unitLabel,
  showItemRange = true,
  showPageSizeInput = true,
  showWindowJumping = true,
  className,
  variant = 'card',
}: PaginationProps) {
  const t = useTranslations('common')

  const totalPages = Math.max(1, Math.ceil(totalItems / (pageSize || 1)))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)

  // 5-page window jumping calculation (Rule #9)
  const windowStart = Math.floor((safeCurrentPage - 1) / windowSize) * windowSize + 1
  const windowEnd = Math.min(windowStart + windowSize - 1, totalPages)
  const visiblePages = useMemo(() => {
    return Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i)
  }, [windowStart, windowEnd])

  const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1
  const endIndex = Math.min(safeCurrentPage * pageSize, totalItems)
  const displayUnit = unitLabel || t('items')

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3 text-xs',
        variant === 'card' && 'p-4 bg-card border border-line rounded-2xl shadow-xs mt-4',
        variant === 'flat' && 'py-2 px-1 mt-2',
        className,
      )}
    >
      {/* Cụm trái: Số dòng trên trang & Dải bản ghi */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-muted font-semibold w-full sm:w-auto justify-between sm:justify-start">
        {showPageSizeInput && onPageSizeChange && (
          <div className="flex items-center gap-1.5 bg-surface px-2.5 py-1 rounded-xl border border-line">
            <Text as="span" size="xs" weight="semibold" color="secondary">
              {t('showing')}
            </Text>
            <NumberInput
              min={pageSizeMin}
              max={pageSizeMax}
              value={pageSize || ''}
              onChange={e => {
                const val = parseInt(e.target.value)
                const safeVal = isNaN(val) || val < pageSizeMin ? pageSizeMin : Math.min(val, pageSizeMax)
                onPageSizeChange(safeVal)
                onPageChange(1)
              }}
              containerClassName="w-14 space-y-0"
              className="text-center font-extrabold text-foreground bg-card border border-line rounded-lg px-1 py-0.5 text-xs h-7"
            />
            <Text as="span" size="xs" weight="semibold" color="secondary">
              {t('perPage')}
            </Text>
          </div>
        )}

        {showPageSizeInput && onPageSizeChange && showItemRange && (
          <span className="hidden sm:inline text-line">|</span>
        )}

        {showItemRange && (
          <div className="text-xs font-semibold text-muted">
            <Text as="span" weight="extrabold" color="default">
              {startIndex}
            </Text>
            {' - '}
            <Text as="span" weight="extrabold" color="default">
              {endIndex}
            </Text>
            {' '}{t('of')}{' '}
            <Text as="span" weight="extrabold" color="default">
              {totalItems}
            </Text>
            {' '}{displayUnit}
          </div>
        )}
      </div>

      {/* Cụm phải: Điều khiển trang */}
      <div className="flex items-center gap-1 sm:gap-1.5 w-full sm:w-auto justify-center sm:justify-end overflow-x-auto pb-1 sm:pb-0">
        {/* Nút lùi 1 trang */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={safeCurrentPage <= 1}
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          className="px-2 sm:px-2.5 gap-1 shrink-0"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{t('prev')}</span>
        </Button>

        {/* Nút nhảy lùi 5 trang (Rule #9 window jump) */}
        {showWindowJumping && windowStart > 1 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, windowStart - windowSize))}
            title={t('jumpPrev5')}
            className="w-8 h-8 px-0 font-bold shrink-0"
          >
            &laquo;
          </Button>
        )}

        {/* Dãy số trang trong cửa sổ 5 trang */}
        {visiblePages.map(page => {
          const isActive = page === safeCurrentPage
          return (
            <Button
              key={page}
              type="button"
              variant={isActive ? 'primary' : 'outline'}
              size="sm"
              onClick={() => onPageChange(page)}
              className={cn(
                'min-w-8 h-8 px-2 font-bold shrink-0',
                isActive && 'shadow-xs',
              )}
            >
              {page}
            </Button>
          )
        })}

        {/* Nút nhảy tiến 5 trang (Rule #9 window jump) */}
        {showWindowJumping && windowStart + windowSize <= totalPages && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, windowStart + windowSize))}
            title={t('jumpNext5')}
            className="w-8 h-8 px-0 font-bold shrink-0"
          >
            &raquo;
          </Button>
        )}

        {/* Nút tiến 1 trang */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={safeCurrentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
          className="px-2 sm:px-2.5 gap-1 shrink-0"
        >
          <span className="hidden md:inline">{t('next')}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Hook usePagination                          */
/* -------------------------------------------------------------------------- */

export interface UsePaginationOptions<T> {
  items?: T[]
  totalRecords?: number
  initialPage?: number
  initialPageSize?: number
  viewMode?: 'grid' | 'table' | 'list'
  gridPageSize?: number
  tablePageSize?: number
}

export function usePagination<T = any>({
  items,
  totalRecords,
  initialPage = 1,
  initialPageSize,
  viewMode,
  gridPageSize = 6,
  tablePageSize = 10,
}: UsePaginationOptions<T> = {}) {
  const defaultPageSize = initialPageSize ?? (viewMode === 'table' || viewMode === 'list' ? tablePageSize : gridPageSize)
  const [currentPage, setCurrentPage] = React.useState<number>(initialPage)
  const [pageSize, setPageSize] = React.useState<number>(defaultPageSize)

  // Sync pageSize when viewMode switches between Grid (6) and Table/List (10)
  React.useEffect(() => {
    if (viewMode) {
      const targetSize = viewMode === 'table' || viewMode === 'list' ? tablePageSize : gridPageSize
      setPageSize(targetSize)
      setCurrentPage(1)
    }
  }, [viewMode, gridPageSize, tablePageSize])

  const total = totalRecords !== undefined ? totalRecords : (items?.length ?? 0)
  const totalPages = Math.max(1, Math.ceil(total / (pageSize || 1)))

  // Paginated slice for client-side arrays
  const paginatedItems = useMemo(() => {
    if (!items) return []
    const start = (currentPage - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, currentPage, pageSize])

  const startIndex = total === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, total)

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems: total,
    totalPages,
    paginatedItems,
    startIndex,
    endIndex,
  }
}

export default Pagination

