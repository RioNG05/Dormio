'use client'

import React from 'react'
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Shield,
  Camera,
  Eye,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import {
  Shift,
  JobPosition,
  WorkScheduleItem,
  AttendanceRecord,
  AttendanceWatermark,
  getLocalizedPlace,
  getLocalizedStaffName,
  getLocalizedExplanation,
} from '../data'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { Button, Text, Chip } from '@/components/ui'

interface TodayShiftCardProps {
  todaySchedule: WorkScheduleItem
  attendance: AttendanceRecord | null
  checkInEval: { allowed: boolean; isLate: boolean; reason?: string }
  checkOutEval: { allowed: boolean; isEarly: boolean; reason?: string }
  getShiftName: (s: Shift) => string
  getPositionName: (posOrName: string | JobPosition) => string
  onOpenCheckIn: () => void
  onOpenCheckOut: () => void
  onPreviewPhoto: (data: {
    isOpen: boolean
    title: string
    imageUrl: string
    watermark?: AttendanceWatermark
    note?: string
  }) => void
  children?: React.ReactNode
}

export function TodayShiftCard({
  todaySchedule,
  attendance,
  checkInEval,
  checkOutEval,
  getShiftName,
  getPositionName,
  onOpenCheckIn,
  onOpenCheckOut,
  onPreviewPhoto,
  children,
}: TodayShiftCardProps) {
  const t = useTranslations('staffPortal')
  const { locale } = useLanguage()

  return (
    <div className="bg-card rounded-3xl border border-line shadow-2xs p-6 sm:p-7 space-y-6">
      {/* Header of Shift Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-line">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
            <Text as="span" size="xs" weight="black" color="brand" uppercase className="tracking-wider">
              {t('todayShiftTitle')}
            </Text>
          </div>
          <Text as="h2" size={{ base: 'xl', sm: '2xl' }} weight="black">
            {getShiftName(todaySchedule.shift)} ({todaySchedule.shift.startTime} -{' '}
            {todaySchedule.shift.endTime})
          </Text>
        </div>

        {/* Status Badge */}
        <div>
          {attendance?.checkOut ? (
            <Chip
              variant="success"
              size="md"
              preventHover
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              className="font-black"
            >
              {t('badgeShiftCompleted')}
            </Chip>
          ) : attendance?.checkIn ? (
            <Chip
              variant="primary"
              size="md"
              preventHover
              leftIcon={<Clock className="w-4 h-4 animate-spin" />}
              className="font-black"
            >
              {t('badgeOnDuty')}
            </Chip>
          ) : (
            <Chip
              variant="warning"
              size="md"
              preventHover
              leftIcon={<AlertCircle className="w-4 h-4" />}
              className="font-black"
            >
              {t('badgeNotCheckedIn')}
            </Chip>
          )}
        </div>
      </div>

      {/* Shift Metadata Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-surface border border-line space-y-1">
          <Text as="span" size="2xs" weight="bold" color="secondary" uppercase className="block">
            {t('shiftLocationLabel')}
          </Text>
          <div className="flex items-center gap-2 font-black text-foreground text-xs sm:text-sm">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="truncate">{todaySchedule.boardingHouseName}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-line space-y-1">
          <Text as="span" size="2xs" weight="bold" color="secondary" uppercase className="block">
            {t('assignedRoleLabel')}
          </Text>
          <div className="flex items-center gap-2 font-black text-foreground text-xs sm:text-sm">
            <Shield className="w-4 h-4 text-primary" />
            <span className="truncate">{getPositionName(todaySchedule.position)}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-line space-y-1">
          <Text as="span" size="2xs" weight="bold" color="secondary" uppercase className="block">
            {t('shiftDurationLabel')}
          </Text>
          <div className="flex items-center gap-2 font-black text-foreground text-xs sm:text-sm">
            <Clock className="w-4 h-4 text-primary" />
            <span>
              {t('shiftDurationHours', { hours: todaySchedule.shift.durationHours })}
            </span>
          </div>
        </div>
      </div>

      {/* TIMEKEEPING ACTION CONTAINER */}
      <div className="p-5 sm:p-6 rounded-2xl border border-line space-y-4">
        <div className="flex items-center justify-between">
          <Text as="h3" size="xs" weight="black" uppercase className="tracking-wider flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-primary" />
            <span>{t('attendanceTitle')}</span>
          </Text>
          <Text as="span" size="2xs" weight="semibold" color="secondary">
            {t('attendanceSubtitle')}
          </Text>
        </div>

        {/* Status details line */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Check In info */}
          <div className="p-3.5 rounded-xl bg-card border border-line flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between">
              <div>
                <Text as="span" size="3xs" weight="bold" color="secondary" className="block">
                  {t('checkInTime')}
                </Text>
                <span className="font-black text-foreground text-sm">
                  {attendance?.checkIn ? `${attendance.checkIn}` : '--:--:--'}
                </span>
              </div>
              <div>
                {attendance?.checkIn ? (
                  <Chip
                    variant={attendance.status === 'late' ? 'warning' : 'success'}
                    size="xs"
                    preventHover
                    className="font-black"
                  >
                    {attendance.status === 'late' ? t('statusLate') : t('statusOnTime')}
                  </Chip>
                ) : (
                  <Text as="span" size="3xs" color="secondary" weight="bold">
                    {t('windowCheckIn')}
                  </Text>
                )}
              </div>
            </div>

            {/* Photo & Watermark pill if checked in */}
            {attendance?.checkIn && attendance?.checkInPhoto && (
              <div className="pt-2 border-t border-line flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={attendance.checkInPhoto}
                    alt="Check-in proof"
                    className="w-8 h-8 rounded-lg object-cover border border-line cursor-pointer hover:opacity-80"
                    onClick={() =>
                      onPreviewPhoto({
                        isOpen: true,
                        title: t('checkInPhotoTitle'),
                        imageUrl: attendance.checkInPhoto!,
                        watermark: attendance.checkInWatermark
                          ? {
                              ...attendance.checkInWatermark,
                              place: getLocalizedPlace(
                                attendance.checkInWatermark.place,
                                locale === 'en',
                              ),
                              staffName: getLocalizedStaffName(
                                attendance.checkInWatermark.staffName,
                                locale === 'en',
                              ),
                            }
                          : undefined,
                        note: getLocalizedExplanation(
                          attendance.checkInExplanation,
                          locale === 'en',
                        ),
                      })
                    }
                  />
                  <div className="text-[10px] text-muted font-medium">
                    <span
                      className="text-foreground font-bold block truncate max-w-[150px]"
                      title={getLocalizedPlace(
                        attendance.checkInWatermark?.place ||
                          todaySchedule.boardingHouseName,
                        locale === 'en',
                      )}
                    >
                      📍{' '}
                      {getLocalizedPlace(
                        attendance.checkInWatermark?.place ||
                          todaySchedule.boardingHouseName,
                        locale === 'en',
                      )}
                    </span>
                    <span className="text-muted block truncate max-w-[150px]">
                      🕒 {attendance.checkInWatermark?.time || t('timePlaceStamped')}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() =>
                    onPreviewPhoto({
                      isOpen: true,
                      title: t('checkInPhotoTitle'),
                      imageUrl: attendance.checkInPhoto!,
                      watermark: attendance.checkInWatermark
                        ? {
                            ...attendance.checkInWatermark,
                            place: getLocalizedPlace(
                              attendance.checkInWatermark.place,
                              locale === 'en',
                            ),
                            staffName: getLocalizedStaffName(
                              attendance.checkInWatermark.staffName,
                              locale === 'en',
                            ),
                          }
                        : undefined,
                      note: getLocalizedExplanation(
                        attendance.checkInExplanation,
                        locale === 'en',
                      ),
                    })
                  }
                  leftIcon={<Eye />}
                  className="hover:underline"
                >
                  {t('viewPhoto')}
                </Button>
              </div>
            )}

            {/* Explanation snippet if present */}
            {attendance?.checkInExplanation && (
              <div className="p-2 rounded-lg bg-warning-soft border border-warning-subtle text-[11px] text-warning">
                <span className="font-bold block">
                  {attendance.status === 'late'
                    ? t('explanationLate')
                    : t('explanationCheckIn')}
                </span>
                <Text size="xs" italic className="text-foreground/90 truncate">
                  &quot;
                  {getLocalizedExplanation(attendance.checkInExplanation, locale === 'en')}
                  &quot;
                </Text>
              </div>
            )}
          </div>

          {/* Check Out info */}
          <div className="p-3.5 rounded-xl bg-card border border-line flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between">
              <div>
                <Text as="span" size="3xs" weight="bold" color="secondary" className="block">
                  {t('checkOutTime')}
                </Text>
                <span className="font-black text-foreground text-sm">
                  {attendance?.checkOut ? `${attendance.checkOut}` : '--:--:--'}
                </span>
              </div>
              <div>
                {attendance?.checkOut ? (
                  <Chip
                    variant={attendance.isEarlyCheckOut ? 'warning' : 'success'}
                    size="xs"
                    preventHover
                    className="font-black"
                  >
                    {attendance.isEarlyCheckOut ? t('statusEarly') : t('statusCompleted')}
                  </Chip>
                ) : (
                  <Text as="span" size="3xs" color="secondary" weight="bold">
                    {t('windowCheckOut')}
                  </Text>
                )}
              </div>
            </div>

            {/* Photo & Watermark pill if checked out */}
            {attendance?.checkOut && attendance?.checkOutPhoto && (
              <div className="pt-2 border-t border-line flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={attendance.checkOutPhoto}
                    alt="Check-out proof"
                    className="w-8 h-8 rounded-lg object-cover border border-line cursor-pointer hover:opacity-80"
                    onClick={() =>
                      onPreviewPhoto({
                        isOpen: true,
                        title: t('checkOutPhotoTitle'),
                        imageUrl: attendance.checkOutPhoto!,
                        watermark: attendance.checkOutWatermark
                          ? {
                              ...attendance.checkOutWatermark,
                              place: getLocalizedPlace(
                                attendance.checkOutWatermark.place,
                                locale === 'en',
                              ),
                              staffName: getLocalizedStaffName(
                                attendance.checkOutWatermark.staffName,
                                locale === 'en',
                              ),
                            }
                          : undefined,
                        note: getLocalizedExplanation(
                          attendance.checkOutExplanation,
                          locale === 'en',
                        ),
                      })
                    }
                  />
                  <div className="text-[10px] text-muted font-medium">
                    <span
                      className="text-foreground font-bold block truncate max-w-[150px]"
                      title={getLocalizedPlace(
                        attendance.checkOutWatermark?.place ||
                          todaySchedule.boardingHouseName,
                        locale === 'en',
                      )}
                    >
                      📍{' '}
                      {getLocalizedPlace(
                        attendance.checkOutWatermark?.place ||
                          todaySchedule.boardingHouseName,
                        locale === 'en',
                      )}
                    </span>
                    <span className="text-muted block truncate max-w-[150px]">
                      🕒 {attendance.checkOutWatermark?.time || t('timePlaceStamped')}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() =>
                    onPreviewPhoto({
                      isOpen: true,
                      title: t('checkOutPhotoTitle'),
                      imageUrl: attendance.checkOutPhoto!,
                      watermark: attendance.checkOutWatermark
                        ? {
                            ...attendance.checkOutWatermark,
                            place: getLocalizedPlace(
                              attendance.checkOutWatermark.place,
                              locale === 'en',
                            ),
                            staffName: getLocalizedStaffName(
                              attendance.checkOutWatermark.staffName,
                              locale === 'en',
                            ),
                          }
                        : undefined,
                      note: getLocalizedExplanation(
                        attendance.checkOutExplanation,
                        locale === 'en',
                      ),
                    })
                  }
                  leftIcon={<Eye />}
                  className="hover:underline"
                >
                  {t('viewPhoto')}
                </Button>
              </div>
            )}

            {/* Explanation snippet if early check-out */}
            {attendance?.checkOutExplanation && (
              <div className="p-2 rounded-lg bg-warning-soft border border-warning-subtle text-[11px] text-warning">
                <span className="font-bold block">{t('explanationEarly')}</span>
                <Text size="xs" italic className="text-foreground/90 truncate">
                  &quot;
                  {getLocalizedExplanation(attendance.checkOutExplanation, locale === 'en')}
                  &quot;
                </Text>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Check In Button */}
          {attendance?.checkIn ? (
            <Button
              variant="outline"
              size="md"
              onClick={() =>
                onPreviewPhoto({
                  isOpen: true,
                  title: t('checkInPhotoLockedTitle'),
                  imageUrl: attendance.checkInPhoto || '',
                  watermark: attendance.checkInWatermark
                    ? {
                        ...attendance.checkInWatermark,
                        place: getLocalizedPlace(
                          attendance.checkInWatermark.place,
                          locale === 'en',
                        ),
                        staffName: getLocalizedStaffName(
                          attendance.checkInWatermark.staffName,
                          locale === 'en',
                        ),
                      }
                    : undefined,
                  note: getLocalizedExplanation(
                    attendance.checkInExplanation,
                    locale === 'en',
                  ),
                })
              }
              leftIcon={<CheckCircle2 />}
              className="sm:text-sm"
            >
              {t('btnCheckInLocked')}
            </Button>
          ) : (
            <Button
              size="md"
              disabled={!checkInEval.allowed}
              onClick={onOpenCheckIn}
              leftIcon={<Camera />}
            >
              {checkInEval.isLate ? t('btnCheckInLate') : t('btnCheckInOnTime')}
            </Button>
          )}

          {/* Check Out Button */}
          {attendance?.checkOut ? (
            <Button
              variant="outline"
              size="md"
              onClick={() =>
                onPreviewPhoto({
                  isOpen: true,
                  title: t('checkOutPhotoLockedTitle'),
                  imageUrl: attendance.checkOutPhoto || '',
                  watermark: attendance.checkOutWatermark
                    ? {
                        ...attendance.checkOutWatermark,
                        place: getLocalizedPlace(
                          attendance.checkOutWatermark.place,
                          locale === 'en',
                        ),
                        staffName: getLocalizedStaffName(
                          attendance.checkOutWatermark.staffName,
                          locale === 'en',
                        ),
                      }
                    : undefined,
                  note: getLocalizedExplanation(
                    attendance.checkOutExplanation,
                    locale === 'en',
                  ),
                })
              }
              leftIcon={<CheckCircle2 />}
              className="sm:text-sm"
            >
              {t('btnCheckOutLocked')}
            </Button>
          ) : (
            <Button
              size="md"
              disabled={!checkOutEval.allowed}
              onClick={onOpenCheckOut}
              leftIcon={<LogOut />}
            >
              {checkOutEval.isEarly ? t('btnCheckOutEarly') : t('btnCheckOutNormal')}
            </Button>
          )}
        </div>

        {/* Explanatory Notice */}
        <div className="p-3 rounded-xl bg-card border border-line text-[11px] text-muted space-y-1">
          <div className="font-bold text-foreground/90 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>{t('rulesTitle')}</span>
          </div>
          <Text size="2xs" color="secondary" className="leading-relaxed">{t('rule1')}</Text>
          <Text size="2xs" color="secondary" className="leading-relaxed">{t('rule2')}</Text>
        </div>
      </div>

      {/* Embedded Checklist or Children */}
      {children}
    </div>
  )
}
