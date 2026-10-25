'use client'

import React from 'react'
import { Wrench, Layers, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { Button, Checkbox, Form, NumberInput, Text, TextInput } from '@/components/ui'
import type { SetupRoomTypePayload, SetupServicePayload } from '@/services/boarding-house.service'
import type { RoomTypeItem, ServiceItem } from '../types'

export interface Step2ServicesAndRoomTypesProps {
  services: ServiceItem[]
  onAddService: () => void
  onUpdateService: (id: string, field: keyof SetupServicePayload, value: string | boolean) => void
  onRemoveService: (id: string) => void
  roomTypes: RoomTypeItem[]
  onAddRoomType: () => void
  onUpdateRoomType: (id: string, field: keyof SetupRoomTypePayload, value: string) => void
  onRemoveRoomType: (id: string) => void
  isValid: boolean
  onBack: () => void
  onNext: () => void
}

export function Step2ServicesAndRoomTypes({
  services,
  onAddService,
  onUpdateService,
  onRemoveService,
  roomTypes,
  onAddRoomType,
  onUpdateRoomType,
  onRemoveRoomType,
  isValid,
  onBack,
  onNext,
}: Step2ServicesAndRoomTypesProps) {
  const t = useTranslations('landlord')

  return (
    <section className="space-y-6 animate-in fade-in duration-300">
      {/* Services Section */}
      <div className="rounded-3xl border border-line bg-card p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-warning-soft text-warning flex items-center justify-center font-bold">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <Text as="h2" variant="heading">
                {t('landlordSetupSection2aTitle')}
              </Text>
              <Text as="p" variant="subtitle">
                {t('landlordSetupSection2aDesc')}
              </Text>
            </div>
          </div>
          <Button
            variant="outline"
            leftIcon={<Plus />}
            onClick={onAddService}
          >
            {t('landlordSetupAddService')}
          </Button>
        </div>

        <div className="space-y-3">
          {services.length === 0 ? (
            <div className="p-4 rounded-2xl border border-dashed border-line text-center">
              <Text as="p" size="xs" color="subtle">
                {t('landlordSetupNoServices')}
              </Text>
            </div>
          ) : (
            services.map((service, index) => (
              <div
                key={service.id}
                className="p-4 rounded-2xl border border-line bg-surface/50 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-4">
                    <TextInput
                      label={t('landlordSetupServiceNameLabel').replace(
                        '{index}',
                        String(index + 1),
                      )}
                      value={service.name}
                      onChange={e => onUpdateService(service.id, 'name', e.target.value)}
                      placeholder={t('landlordSetupServiceNamePlaceholder')}
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <NumberInput
                      label={t('landlordSetupServicePriceLabel')}
                      min={0}
                      step="0.01"
                      value={service.price}
                      onChange={e => onUpdateService(service.id, 'price', e.target.value)}
                      placeholder="3500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <TextInput
                      label={t('landlordSetupServiceUnitLabel')}
                      value={service.unit}
                      onChange={e => onUpdateService(service.id, 'unit', e.target.value)}
                      placeholder={t('landlordSetupServiceUnitPlaceholder')}
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center gap-4 py-2">
                    <Checkbox
                      size="sm"
                      label={t('landlordSetupServiceMetered')}
                      checked={service.isMetered}
                      onChange={e => onUpdateService(service.id, 'isMetered', e.target.checked)}
                    />
                    <Checkbox
                      size="sm"
                      label={t('landlordSetupServiceAutoApplied')}
                      checked={service.autoApplied}
                      onChange={e => onUpdateService(service.id, 'autoApplied', e.target.checked)}
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end pb-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveService(service.id)}
                      title={t('landlordSetupDeleteService')}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Room Types Section */}
      <div className="rounded-3xl border border-line bg-card p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-info-soft text-indigo-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Text as="h2" variant="heading">
                  {t('landlordSetupSection2bTitle')}
                </Text>
                <Text
                  as="span"
                  variant="badge"
                  color="danger"
                  className="bg-danger-soft px-2 py-0.5 rounded-md border border-danger-subtle"
                >
                  {t('landlordSetupSection2bRequired')}
                </Text>
              </div>
              <Text as="p" variant="subtitle">
                {t('landlordSetupSection2bDesc')}
              </Text>
            </div>
          </div>
          <Button
            variant="outline"
            leftIcon={<Plus />}
            onClick={onAddRoomType}
          >
            {t('landlordSetupAddRoomType')}
          </Button>
        </div>

        <div className="space-y-3">
          {roomTypes.map((rt, index) => (
            <div
              key={rt.id}
              className="p-4 rounded-2xl border border-line bg-surface/50 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-5">
                  <TextInput
                    label={t('landlordSetupRoomTypeNameLabel').replace(
                      '{index}',
                      String(index + 1),
                    )}
                    required
                    value={rt.name}
                    onChange={e => onUpdateRoomType(rt.id, 'name', e.target.value)}
                    placeholder={t('landlordSetupRoomTypeNamePlaceholder')}
                  />
                </div>

                <div className="sm:col-span-6">
                  <TextInput
                    label={t('landlordSetupRoomTypeDescLabel')}
                    value={rt.description ?? ''}
                    onChange={e => onUpdateRoomType(rt.id, 'description', e.target.value)}
                    placeholder={t('landlordSetupRoomTypeDescPlaceholder')}
                  />
                </div>

                <div className="sm:col-span-1 flex justify-end pb-1">
                  {roomTypes.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveRoomType(rt.id)}
                      title={t('landlordSetupDeleteRoomType')}
                    >
                      <Trash2 />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Form.Actions align="between" className="pt-2">
        <Button
          size='md'
          variant="outline"
          onClick={onBack}
          leftIcon={<ChevronLeft />}
        >
          {t('landlordSetupBackToStep1')}
        </Button>
        <Button
          size='md'
          disabled={!isValid}
          onClick={onNext}
          rightIcon={<ChevronRight />}
        >
          {t('landlordSetupNextToStep3')}
        </Button>
      </Form.Actions>
    </section>
  )
}
