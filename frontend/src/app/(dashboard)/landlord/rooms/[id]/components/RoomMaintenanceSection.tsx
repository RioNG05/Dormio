'use client'

import React from 'react'
import { Wrench } from 'lucide-react'
import { Button, Text } from '@/components/ui'
import { useTranslations } from '@/context/LanguageContext'
import { MaintenanceRecord } from './types'

interface RoomMaintenanceSectionProps {
  maintenanceHistory: MaintenanceRecord[]
  maintPage: number
  onPageChange: (page: number) => void
  onReportIncident: () => void
  itemsPerPage?: number
}

export const RoomMaintenanceSection: React.FC<RoomMaintenanceSectionProps> = ({
  maintenanceHistory,
  maintPage,
  onPageChange,
  onReportIncident,
  itemsPerPage = 2,
}) => {
  const t = useTranslations('landlord')

  const priorityLabels: Record<string, string> = {
    'Mức độ cao': t('landlordRoomDetailPriorityHigh'),
    'Mức độ trung bình': t('landlordRoomDetailPriorityMedium'),
    'Mức độ nhẹ': t('landlordRoomDetailPriorityLow'),
  }

  const totalPages = Math.ceil(maintenanceHistory.length / itemsPerPage)
  const currentItems = maintenanceHistory.slice(
    (maintPage - 1) * itemsPerPage,
    maintPage * itemsPerPage,
  )

  return (
    <div className="bg-card rounded-2xl border border-line shadow-xs p-5 space-y-4 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center border-b border-line pb-3">
          <Text as="h2" weight="black" color="default" size="sm" className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-accent" />{' '}
            {t('landlordRoomDetailMaintenanceTitle').replace(
              '{count}',
              String(maintenanceHistory.length),
            )}
          </Text>
          <Button
            variant="accent"
            size="sm"
            onClick={onReportIncident}
          >
            <Text as="span" size="xs" weight="bold" color="inherit">
              {t('landlordRoomDetailReportIncidentBtn')}
            </Text>
          </Button>
        </div>

        <div className="space-y-3 min-h-[195px] pt-2">
          {maintenanceHistory.length === 0 ? (
            <div className="p-4 text-center bg-surface rounded-xl">
              <Text size="xs" color="subtle" weight="bold">
                {t('landlordRoomDetailNoMaintenance')}
              </Text>
            </div>
          ) : (
            currentItems.map(item => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border min-h-[86px] flex flex-col justify-between ${
                  item.status === 'Đang xử lý'
                    ? 'bg-amber-500/5 border-amber-500/20'
                    : 'bg-surface border-line'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <Text as="span" size="xs" weight="black" color="default" className="line-clamp-1">
                    {item.title}
                  </Text>
                  <span
                    className={`px-2 py-0.5 rounded-full shrink-0 ${
                      item.status === 'Đang xử lý'
                        ? 'bg-warning-soft'
                        : 'bg-success-soft'
                    }`}
                  >
                    <Text
                      as="span"
                      size="2xs"
                      weight="black"
                      color={item.status === 'Đang xử lý' ? 'warning' : 'success'}
                    >
                      {item.status === 'Đang xử lý'
                        ? t('landlordRoomDetailMaintenanceProcessing')
                        : t('landlordRoomDetailMaintenanceDone')}
                    </Text>
                  </span>
                </div>

                {item.description ? (
                  <Text size="xs" color="secondary" weight="medium" className="leading-tight line-clamp-1 my-1">
                    {item.description}
                  </Text>
                ) : (
                  <div className="my-1" />
                )}

                <div className="flex items-center justify-between pt-0.5 border-t border-line">
                  <Text as="span" size="2xs" color="secondary" weight="bold">
                    {item.completedDate
                      ? t('landlordRoomDetailMaintenanceCompletedDate').replace(
                          '{date}',
                          item.completedDate,
                        )
                      : t('landlordRoomDetailMaintenanceReportDate').replace(
                          '{date}',
                          item.reportDate,
                        )}
                  </Text>
                  <Text
                    as="span"
                    size="2xs"
                    weight={item.priority === 'Mức độ cao' ? 'black' : 'bold'}
                    color={item.priority === 'Mức độ cao' ? 'danger' : 'secondary'}
                  >
                    {priorityLabels[item.priority] || item.priority}
                  </Text>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Maintenance Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-line text-xs mt-auto">
          <Text as="span" size="2xs" color="subtle" weight="bold">
            Trang {maintPage} / {totalPages}
          </Text>
          <div className="flex gap-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(Math.max(1, maintPage - 1))}
              disabled={maintPage === 1}
            >
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('landlordRoomDetailPaginationPrev')}
              </Text>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, maintPage + 1))}
              disabled={maintPage === totalPages}
            >
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('landlordRoomDetailPaginationNext')}
              </Text>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

