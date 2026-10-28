/**
 * ContractTemplateRenderer
 *
 * Implements UC-L-15 server-side template renderer for Vietnamese residential lease contracts.
 * Produces unified, print-ready HTML conforming to Vietnamese legal conventions and A4 print layout.
 * Both direct-print triggers and downloadable-file exports use this exact template so they never drift apart.
 */

import { renderContractTemplate } from './contract-template'

export interface ContractTemplateData {
  contract: {
    id: string
    startDate: Date
    endDate: Date
    rentPrice: number
    monthlyPaymentDate: number
    rentPaymentCycle?: number | null
    status: string
    note?: string | null
    createdAt: Date
  }
  boardingHouse: {
    id: string
    name: string
    address: string
    owner: {
      id: string
      fullName: string
      phoneNumber: string
      email?: string | null
    }
  }
  room: {
    id: string
    roomNumber: string
    floor: number
    area?: number | null
    maxOccupants?: number | null
    roomTypeName?: string | null
    services: Array<{
      name: string
      price: number
      unit: string
      isMetered: boolean
    }>
  }
  primaryTenant: {
    id: string
    fullName: string
    phoneNumber: string
    email?: string | null
    identification?: {
      identityNumber: string
      dateOfBirth?: string | Date | null
      gender?: string | null
      placeOfOrigin?: unknown
      placeOfResidence?: unknown
      issueDate?: string | Date | null
      issuePlace?: unknown
    } | null
  }
  coTenants?: Array<{
    id: string
    fullName: string
    phoneNumber?: string | null
  }>
  deposit?: {
    amount: number
    status: string
    type: string
    paidAt?: Date | null
  } | null
  options?: {
    autoPrint?: boolean
    includeToolbar?: boolean
  }
}

export class ContractTemplateRenderer {
  /**
   * Formats identification address data for the rendered contract.
   */
  private static formatAddress(value: unknown): string {
    if (!value) return 'Chưa cập nhật'
    if (typeof value === 'string') return value
    if (typeof value === 'object' && value !== null) {
      const parts = Object.values(value).filter(
        (part): part is string | number => typeof part === 'string' || typeof part === 'number',
      )
      return parts.length > 0 ? parts.join(', ') : 'Chưa cập nhật'
    }
    return String(value)
  }

  /**
   * Formats currency in VND
   */
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ'
  }

  /**
   * Formats Date to dd/mm/yyyy
   */
  private static formatDate(date: Date | string | null | undefined): string {
    if (!date) return '—'
    const d = new Date(date)
    if (isNaN(d.getTime())) return '—'
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  /**
   * Converts amount into Vietnamese spoken words
   */
  private static numberToVietnameseWords(num: number): string {
    if (num === 0) return 'Không đồng'
    const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ']
    const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']

    const readThreeDigits = (n: number, showZeroHundred: boolean): string => {
      let str = ''
      const hundreds = Math.floor(n / 100)
      const tens = Math.floor((n % 100) / 10)
      const ones = n % 10

      if (hundreds > 0 || showZeroHundred) {
        str += digits[hundreds] + ' trăm '
      }
      if (tens > 1) {
        str += digits[tens] + ' mươi '
        if (ones === 1) str += 'mốt '
        else if (ones === 5) str += 'lăm '
        else if (ones > 0) str += digits[ones] + ' '
      } else if (tens === 1) {
        str += 'mười '
        if (ones === 5) str += 'lăm '
        else if (ones > 0) str += digits[ones] + ' '
      } else if (tens === 0 && ones > 0) {
        if (hundreds > 0 || showZeroHundred) str += 'lẻ '
        str += digits[ones] + ' '
      }
      return str.trim()
    }

    let n = Math.floor(Math.abs(num))
    const groups: number[] = []
    while (n > 0) {
      groups.push(n % 1000)
      n = Math.floor(n / 1000)
    }

    let result = ''
    for (let i = groups.length - 1; i >= 0; i--) {
      const g = groups[i]
      if (g > 0) {
        const showZero = i < groups.length - 1 && groups.length > 1
        result += readThreeDigits(g, showZero) + ' ' + units[i] + ' '
      }
    }
    const clean = result.trim() + ' đồng'
    return clean.charAt(0).toUpperCase() + clean.slice(1)
  }

  /**
   * Renders the complete HTML document for the contract
   */
  public static render(data: ContractTemplateData): string {
    const {
      contract,
      boardingHouse,
      room,
      primaryTenant,
      coTenants = [],
      deposit,
      options = {},
    } = data

    const autoPrint = options.autoPrint ?? false
    const includeToolbar = options.includeToolbar ?? true

    const today = new Date()
    const createdDate = contract.createdAt ? new Date(contract.createdAt) : today
    const day = createdDate.getDate()
    const month = createdDate.getMonth() + 1
    const year = createdDate.getFullYear()

    const rentPriceVnd = this.formatCurrency(contract.rentPrice)
    const rentPriceWords = this.numberToVietnameseWords(contract.rentPrice)

    const depositAmount = deposit ? deposit.amount : contract.rentPrice
    const depositVnd = this.formatCurrency(depositAmount)
    const depositWords = this.numberToVietnameseWords(depositAmount)

    const iden = primaryTenant.identification
    const idNumber = iden?.identityNumber || 'Chưa cung cấp'
    const idIssueDate = iden?.issueDate ? this.formatDate(iden.issueDate) : 'Chưa cập nhật'
    const idIssuePlace = this.formatAddress(
      iden?.issuePlace || iden?.placeOfResidence || 'Cục CS QLHC về TTXH',
    )
    const placeOfOrigin = this.formatAddress(iden?.placeOfOrigin)
    const placeOfResidence = this.formatAddress(iden?.placeOfResidence)

    const servicesHtml =
      room.services.length > 0
        ? room.services
            .map(
              (s, index) => `
              <tr>
                <td style="text-align: center; width: 40px;">${index + 1}</td>
                <td><strong>${s.name}</strong></td>
                <td style="text-align: right; width: 120px;">${this.formatCurrency(s.price)}</td>
                <td style="text-align: center; width: 100px;">/${s.unit}</td>
                <td style="width: 140px;">${s.isMetered ? 'Tính theo chỉ số đồng hồ' : 'Cố định hàng tháng'}</td>
              </tr>
            `,
            )
            .join('')
        : `
          <tr>
            <td colspan="5" style="text-align: center; color: #666; font-style: italic; padding: 8px;">
              Không có dịch vụ phụ thu riêng (đã bao gồm trong giá phòng hoặc thỏa thuận riêng).
            </td>
          </tr>
        `

    const coTenantsHtml =
      coTenants.length > 0
        ? `
          <div style="margin-top: 6px; padding-left: 15px; font-size: 13px;">
            <p style="margin: 3px 0; font-style: italic;"><strong>Các thành viên cùng lưu trú:</strong></p>
            <ul style="margin: 4px 0 6px 18px; padding: 0;">
              ${coTenants
                .map(
                  m => `<li>${m.fullName}${m.phoneNumber ? ` - SĐT: ${m.phoneNumber}` : ''}</li>`,
                )
                .join('')}
            </ul>
          </div>
        `
        : ''

    return renderContractTemplate({
      autoPrint,
      day,
      month,
      year,
      contract,
      boardingHouse,
      room,
      primaryTenant,
      coTenantsHtml,
      servicesHtml,
      rentPriceVnd,
      rentPriceWords,
      depositVnd,
      depositWords,
      idNumber,
      idIssueDate,
      idIssuePlace,
      placeOfOrigin,
      placeOfResidence,
      formatDate: this.formatDate,
    })

  }
}
