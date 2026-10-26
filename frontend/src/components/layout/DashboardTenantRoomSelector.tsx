'use client'

import React, { useState } from 'react'
import { Home, Check, ChevronDown } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { Button, Text } from '@/components/ui'

export function DashboardTenantRoomSelector() {
  const tNav = useTranslations('nav')
  const { tenancies, activeTenancyId, activeTenancy, selectTenancy } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const displayName = activeTenancy
    ? `${activeTenancy.roomNumber} — ${activeTenancy.boardingHouseName}`
    : tNav('selectRoomPlaceholder')

  return (
    <div className="relative px-3 py-2.5 border-b border-line bg-surface/60">
      <div className="flex items-center justify-between mb-1.5">
        <Text as="span" variant="overline" color="subtle" className="block">
          {tNav('rentingRoomBadge')}
        </Text>
        <Text
          as="span"
          variant="badge"
          color="brand"
          className="bg-primary-soft px-1.5 py-0.5 rounded-md"
        >
          {tNav('rentingRoomsCount', { count: tenancies.length })}
        </Text>
      </div>

      <Button
        fullWidth
        variant="ghost"
        size="md"
        onClick={() => setDropdownOpen(prev => !prev)}
        className="justify-between h-auto py-1.5"
        title={tNav('switchRoomTooltip')}
        disabled={tenancies.length === 0}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-1.5 text-left">
          <Home className="w-3.5 h-3.5 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <Text as="p" size="xs" weight="black" color="default" truncate className="block">
              {displayName}
            </Text>
            {activeTenancy?.boardingHouseAddress && (
              <Text as="p" size="3xs" weight="medium" color="subtle" truncate className="mt-0.5 block">
                {activeTenancy.boardingHouseAddress}
              </Text>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted shrink-0 transition-transform duration-200 ${
            dropdownOpen ? 'rotate-180 text-primary' : ''
          }`}
        />
      </Button>

      {dropdownOpen && tenancies.length > 0 && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
          <div className="absolute left-2 right-2 top-full mt-1 bg-card border border-line rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2 py-1 flex items-center justify-between">
              <Text as="span" variant="overline" color="subtle">
                {tNav('switchRoomTitle')}
              </Text>
            </div>
            <div className="max-h-56 overflow-y-auto space-y-1">
              {tenancies.map(t => {
                const tenancyKey = t.contractId || t.roomId
                const isActive = tenancyKey === activeTenancyId
                return (
                  <Button
                    fullWidth
                    key={tenancyKey}
                    variant="ghost"
                    size="xl"
                    className="px-2"
                    onClick={() => {
                      selectTenancy(tenancyKey)
                      setDropdownOpen(false)
                    }}
                  >
                    <div className="min-w-0 flex-1 pr-2 text-left flex items-center gap-1.5">
                      <Home
                        className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted'}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Text as="p" size="xs" weight="black" color="default" truncate>
                            {t.roomNumber}
                          </Text>
                          {t.roomTypeName && (
                            <span className="text-3xs px-1.5 py-0.5 rounded bg-muted/10 text-muted leading-none">
                              {t.roomTypeName}
                            </span>
                          )}
                        </div>
                        <Text as="p" size="3xs" weight="medium" color="subtle" truncate className="mt-0.5 block">
                          {t.boardingHouseName} • {tNav('roomFloorBadge', { floor: t.floor })}
                        </Text>
                      </div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </Button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default DashboardTenantRoomSelector
