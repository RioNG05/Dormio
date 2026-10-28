export interface ServiceUnitDefinition {
  value: string
  labelVi: string
  labelEn: string
  category: 'metered' | 'per_person' | 'per_room' | 'per_quantity' | 'per_usage' | 'monthly'
  isMetered: boolean
}

export const SERVICE_UNIT_DEFINITIONS: ServiceUnitDefinition[] = [
  // Metered Units (isMetered = true)
  {
    value: 'kWh',
    labelVi: 'kWh (Số điện)',
    labelEn: 'kWh (Electricity meter)',
    category: 'metered',
    isMetered: true,
  },
  {
    value: 'm³',
    labelVi: 'm³ (Khối nước)',
    labelEn: 'm³ (Water meter)',
    category: 'metered',
    isMetered: true,
  },
  // Fixed Per Person (isMetered = false)
  {
    value: 'người/tháng',
    labelVi: 'người/tháng (Theo đầu người)',
    labelEn: 'person/month (Per person)',
    category: 'per_person',
    isMetered: false,
  },
  // Fixed Per Room (isMetered = false)
  {
    value: 'phòng/tháng',
    labelVi: 'phòng/tháng (Theo phòng)',
    labelEn: 'room/month (Per room)',
    category: 'per_room',
    isMetered: false,
  },
  // Quantity / Vehicle
  {
    value: 'xe/tháng',
    labelVi: 'xe/tháng (Theo xe)',
    labelEn: 'vehicle/month (Per vehicle)',
    category: 'per_quantity',
    isMetered: false,
  },
  {
    value: 'chiếc/tháng',
    labelVi: 'chiếc/tháng (Theo thiết bị)',
    labelEn: 'item/month (Per item)',
    category: 'per_quantity',
    isMetered: false,
  },
  // Per Usage
  {
    value: 'lần',
    labelVi: 'lần (Theo lượt dùng)',
    labelEn: 'time (Per usage)',
    category: 'per_usage',
    isMetered: false,
  },
  // Monthly Flat
  {
    value: 'tháng',
    labelVi: 'tháng (Trọn gói tháng)',
    labelEn: 'month (Flat monthly)',
    category: 'monthly',
    isMetered: false,
  },
]

export const METERED_UNITS = SERVICE_UNIT_DEFINITIONS.filter(u => u.isMetered)
export const FLAT_UNITS = SERVICE_UNIT_DEFINITIONS.filter(u => !u.isMetered)

/**
 * Check if a unit string represents a per-person pricing service
 */
export function isPerPersonUnit(unit?: string): boolean {
  if (!unit) return false
  const lower = unit.toLowerCase().trim()
  return (
    lower === 'người/tháng' ||
    lower === 'người' ||
    lower.includes('người') ||
    lower.includes('nguoi') ||
    lower.includes('person')
  )
}

/**
 * Get select options formatted for SelectInput based on isMetered toggle and locale
 */
export function getServiceUnitOptions(isMetered: boolean, locale: string = 'vi') {
  const isEn = locale === 'en'
  const list = isMetered ? METERED_UNITS : FLAT_UNITS
  return list.map(u => ({
    value: u.value,
    label: isEn ? u.labelEn : u.labelVi,
  }))
}
