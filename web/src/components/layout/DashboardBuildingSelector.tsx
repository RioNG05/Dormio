'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Building, Building2, Check, ChevronDown, Plus } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { Button, Text } from '@/components/ui'

export function DashboardBuildingSelector() {
  const tNav = useTranslations('nav')
  const { buildings, activeBuildingId, activeBuilding, selectBuilding } = useAuth()
  const [buildingDropdownOpen, setBuildingDropdownOpen] = useState(false)

  return (
    <div className="relative px-3 py-2.5 border-b border-line bg-surface/60">
      <div className="flex items-center justify-between mb-1.5">
        <Text as="span" variant="overline" color="subtle" className="block">
          {tNav('managingBuilding')}
        </Text>
        <Text
          as="span"
          variant="badge"
          color="brand"
          className="bg-primary-soft px-1.5 py-0.5 rounded-md"
        >
          {tNav('managingPropertiesCount', { count: buildings.length })}
        </Text>
      </div>

      <Button
        fullWidth
        variant="ghost"
        size="md"
        onClick={() => setBuildingDropdownOpen(prev => !prev)}
        className="justify-between h-auto py-1.5"
        title={tNav('switchPropertyTooltip')}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-1.5 text-left">
          <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <Text as="p" size="xs" weight="black" color="default" truncate className="block">
              {activeBuilding?.name || tNav('selectBuildingPlaceholder')}
            </Text>
            {activeBuilding?.address && (
              <Text as="p" size="3xs" weight="medium" color="subtle" truncate className="mt-0.5 block">
                {activeBuilding.address}
              </Text>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted shrink-0 transition-transform duration-200 ${buildingDropdownOpen ? 'rotate-180 text-primary' : ''
            }`}
        />
      </Button>

      {buildingDropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setBuildingDropdownOpen(false)} />
          <div className="absolute left-2 right-2 top-full mt-1 bg-card border border-line rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2 py-1 flex items-center justify-between">
              <Text as="span" variant="overline" color="subtle">
                {tNav('switchProperty')}
              </Text>
            </div>
            <div className="max-h-56 overflow-y-auto space-y-1">
              {buildings.map(b => {
                const isActive = b.id === activeBuildingId
                return (
                  <Button
                    fullWidth
                    key={b.id}
                    variant="ghost"
                    size="xl"
                    className='px-2'
                    onClick={() => {
                      selectBuilding(b.id)
                      setBuildingDropdownOpen(false)
                    }}
                  >
                    <div className="min-w-0 flex-1 pr-2 text-left flex items-center gap-1.5">
                      <Building className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted'}`} />
                      <div className="min-w-0 flex-1">
                        <Text as="p" size="xs" weight="black" color="default" truncate className="block">
                          {b.name}
                        </Text>
                        <Text as="p" size="3xs" weight="medium" color="subtle" truncate className="mt-0.5 block">
                          {b.address || tNav('roomsCount', { count: b.totalRooms })}
                        </Text>
                      </div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </Button>
                )
              })}
            </div>
            <div className="pt-1.5 border-t border-line">
              <Link
                href="/landlord/setup"
                onClick={() => setBuildingDropdownOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-black text-primary hover:bg-primary-soft rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <Text as="span" size="xs" weight="black" color="brand">
                  {tNav('addNewPropertyBtn')}
                </Text>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
export default DashboardBuildingSelector

