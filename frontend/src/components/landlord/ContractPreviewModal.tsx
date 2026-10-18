'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Printer,
  X,
  Loader2,
  FileText,
  AlertTriangle,
  FileDown,
  RefreshCw,
} from 'lucide-react'
import { getContractPrintHtml, exportContract } from '@/services/contract.service'
import { useTranslations } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { Button, Modal, Text } from '@/components/ui'

interface ContractPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  buildingId: string
  contractId: string
  roomNumber: string
  tenantName?: string
  onExportSuccess?: () => void
}

export default function ContractPreviewModal({
  isOpen,
  onClose,
  buildingId,
  contractId,
  roomNumber,
  tenantName,
  onExportSuccess,
}: ContractPreviewModalProps) {
  const t = useTranslations('landlord')
  const { toast } = useToast()

  const [htmlContent, setHtmlContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Resolve the active boarding house context if not directly passed
  const currentBuildingId = useMemo(() => {
    if (buildingId && buildingId.trim()) return buildingId.trim()
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dormio_active_building_id')
      if (stored && stored.trim()) return stored.trim()
    }
    return ''
  }, [buildingId])

  const fetchContractHtml = async () => {
    if (!contractId) {
      setError(t('landlordContractsExportErrorTitle') || 'Thiếu mã hợp đồng.')
      setIsLoading(false)
      return
    }

    if (!currentBuildingId) {
      setError('Vui lòng chọn nhà trọ/cơ sở để tải văn bản hợp đồng.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const html = await getContractPrintHtml(currentBuildingId, contractId, false)
      setHtmlContent(html)
    } catch (err: any) {
      console.error('Failed to load contract print HTML from backend:', err)
      if (err?.code === 'SUBSCRIPTION_TIER_REQUIRED' || err?.requiredTier) {
        onClose()
        return
      }
      const errorMsg =
        err?.message ||
        t('landlordContractsExportErrorTitle') ||
        'Không thể tải văn bản hợp đồng từ máy chủ.'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isOpen) {
      setHtmlContent('')
      setIsLoading(false)
      setError(null)
      return
    }

    fetchContractHtml()
  }, [isOpen, contractId, currentBuildingId])

  if (!isOpen) return null

  // Direct print trigger from the loaded iframe
  const handlePrint = () => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) {
      window.print()
      return
    }
    try {
      iframeRef.current.contentWindow.focus()
      iframeRef.current.contentWindow.print()
    } catch {
      window.print()
    }
  }

  // Direct download of HTML content
  const handleDownloadHtml = (contentToDownload?: string) => {
    const rawContent = contentToDownload || htmlContent
    if (!rawContent) return
    const blob = new Blob([rawContent], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hop-dong-phong-${roomNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}-${contractId.substring(0, 8)}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(t('landlordContractsExportToastDownloadSuccess'))
  }

  // Persist export on backend & download
  const handleExportDocument = async () => {
    if (!currentBuildingId) {
      toast.error('Thiếu thông tin nhà trọ để xuất tài liệu hợp đồng.')
      return
    }

    try {
      setIsExporting(true)
      const res = await exportContract(currentBuildingId, contractId)
      if (res?.data) {
        toast.success(t('landlordContractsExportToastExportSuccess'))
        onExportSuccess?.()
        if (res.data.html) {
          setHtmlContent(res.data.html)
        }
        handleDownloadHtml(res.data.html || htmlContent)
      }
    } catch (err: any) {
      console.error('Failed to export contract document:', err)
      if (err?.code === 'SUBSCRIPTION_TIER_REQUIRED' || err?.requiredTier) {
        onClose()
      } else {
        toast.error(err.message || t('landlordContractsExportToastExportFailed'))
      }
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
      className="h-[90vh] flex flex-col"
      header={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2AC1BC]/10 flex items-center justify-center text-[#2AC1BC]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <Text as="h2" size="lg" weight="black" className="text-zinc-900 leading-tight">
                {t('landlordContractsExportTitle', { roomNumber })}
              </Text>
              <Text size="xs" color="subtle" weight="medium">
                {tenantName ? `${t('landlordContractsExportRep', { tenantName })} • ` : ''}
                <span className="font-mono font-bold text-zinc-700">
                  {contractId.substring(0, 12)}...
                </span>
              </Text>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={isLoading || !!error}
              leftIcon={<Printer className="w-3.5 h-3.5 text-[#2AC1BC]" />}
              title={t('landlordContractsExportPrintTooltip')}
            >
              <span className="hidden sm:inline">{t('landlordContractsExportPrintBtn')}</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleExportDocument}
              disabled={isLoading || isExporting || !!error}
              isLoading={isExporting}
              leftIcon={<FileDown className="w-3.5 h-3.5" />}
              title={t('landlordContractsExportExportTooltip')}
            >
              <span>
                {isExporting
                  ? t('landlordContractsExportExporting')
                  : t('landlordContractsExportExportBtn')}
              </span>
            </Button>
          </div>
        </div>
      }
      bodyClassName="flex-1 bg-zinc-100/70 p-2 sm:p-4 overflow-hidden relative min-h-0"
      footer={
        <div className="flex items-center justify-between w-full text-xs text-zinc-500 font-medium">
          <div>
            <Text as="span" size="xs" weight="bold" className="text-zinc-700">
              {t('landlordContractsExportFormatStandard')}
            </Text>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownloadHtml()}
              disabled={isLoading || !htmlContent}
              className="underline"
            >
              {t('landlordContractsExportDownloadHtml')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              {t('landlordContractsExportCloseBtn')}
            </Button>
          </div>
        </div>
      }
    >
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-xs">
          <Loader2 className="w-8 h-8 text-[#2AC1BC] animate-spin" />
          <Text size="sm" weight="semibold" className="text-zinc-600">
            {t('landlordContractsExportPreparing')}
          </Text>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <Text size="base" weight="bold" className="text-rose-600">{error}</Text>
          <Text size="xs" color="secondary" className="max-w-md mx-auto">
            {t('landlordContractsExportErrorTitle')}
          </Text>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchContractHtml}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Thử lại
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onClose}
            >
              {t('landlordContractsExportCloseBtn')}
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !error && htmlContent && (
        <div className="w-full h-full rounded-xl overflow-hidden shadow-inner border border-zinc-200/80 bg-white">
          <iframe
            ref={iframeRef}
            srcDoc={htmlContent}
            title={t('landlordContractsExportIframeTitle')}
            className="w-full h-full border-0"
          />
        </div>
      )}
    </Modal>
  )
}
