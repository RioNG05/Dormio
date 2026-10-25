'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface FilterToolbarProps {
  /** Fixed-width search input component (placed on the left) */
  search?: React.ReactNode
  /** Filter controls: Select inputs, ChipGroups, date pickers, etc. (placed in center/right) */
  filters?: React.ReactNode
  /** View mode switch toggle component (placed at the far right) */
  viewMode?: React.ReactNode
  /** Optional action buttons (e.g. Refresh, Export, etc.) placed before or next to viewMode */
  actions?: React.ReactNode
  /** Optional secondary row for status tabs, pill filters, or additional controls */
  subRow?: React.ReactNode
  /** Optional custom children if overriding default layout */
  children?: React.ReactNode
  /** Additional container class names */
  className?: string
  /** Class name for the main row */
  mainRowClassName?: string
}

/**
 * Standardized Dashboard Filter & Control Toolbar.
 * Layout rules:
 * - Left side: Search input with fixed width (`w-full sm:w-64 lg:w-72 shrink-0`).
 * - Center / Right: Filter controls (Select inputs, Chip groups).
 * - Far Right: View mode toggle and quick actions (`shrink-0`).
 * - SubRow: Optional secondary row for status tabs or category pills with top divider.
 */
export function FilterToolbar({
  search,
  filters,
  viewMode,
  actions,
  subRow,
  children,
  className,
  mainRowClassName,
}: FilterToolbarProps) {
  return (
    <div
      className={cn(
        'bg-card border border-line rounded-2xl p-3 sm:p-4 shadow-2xs space-y-3',
        className,
      )}
    >
      {children ? (
        children
      ) : (
        <>
          {/* Main Controls Row */}
          <div
            className={cn(
              'flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3',
              mainRowClassName,
            )}
          >
            {/* Left: Fixed-width Search */}
            {search && (
              <div className="w-full sm:w-64 lg:w-72 shrink-0">
                {search}
              </div>
            )}

            {/* Right: Filters, Actions, and ViewMode Toggle */}
            {(filters || actions || viewMode) && (
              <div className="flex flex-wrap items-center justify-start lg:justify-end gap-2.5 flex-1 min-w-0">
                {filters}
                {actions}
                {viewMode && (
                  <div className="shrink-0 ml-auto lg:ml-0">
                    {viewMode}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Optional SubRow (e.g. Status Tabs, Filter Pills) */}
          {subRow && (
            <div className="pt-2.5 border-t border-line flex flex-wrap items-center gap-2">
              {subRow}
            </div>
          )}
        </>
      )}
    </div>
  )
}
