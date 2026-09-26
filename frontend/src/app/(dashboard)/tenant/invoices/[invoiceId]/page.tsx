"use client";

import React, { useState, useEffect, useRef, useMemo, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  UploadCloud,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Droplets,
  CreditCard,
  Copy,
  Check,
  RefreshCw,
  Receipt,
  ShieldCheck,
  Lock,
  AlertTriangle,
  Info,
  ChevronRight,
  Eye,
  X,
  FileQuestion,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/NumberInput";
import { ImageUpload } from "@/components/ImageUpload";
import { useTranslations, useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import { formatCurrency } from "@/utils";
import {
  meterReadingService,
  ActiveMeteredServicesResponse,
} from "@/services/meter-reading.service";
import {
  tenantInvoiceService,
  TenantInvoice,
} from "@/services/tenant-invoice.service";
import {
  paymentService,
  InvoicePayOsCheckoutResponse,
} from "@/services/payment.service";
import { uploadImageToBackend } from "@/services/upload.service";

/**
 * Bank names mapping by BIN code
 */
const BANK_NAMES: Record<string, string> = {
  "970422": "MB Bank (Quân Đội)",
  "970415": "VietinBank",
  "970436": "Vietcombank (VCB)",
  "970407": "Techcombank",
  "970423": "TPBank",
  "970432": "VPBank",
  "970418": "BIDV",
  "970405": "Agribank",
  "970416": "ACB",
  "970441": "VIB",
  "970403": "Sacombank",
};

/**
 * Helper to ensure valid QR image display
 */
function getQrImageUrl(qrData: string | undefined): string {
  if (!qrData) return "";
  if (
    qrData.startsWith("http://") ||
    qrData.startsWith("https://") ||
    qrData.startsWith("data:image")
  ) {
    return qrData;
  }
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
    qrData
  )}`;
}

interface MeterServiceState {
  serviceId: string;
  serviceName: string;
  readingId?: string;
  currentValue: number | "";
  previousValue: number | null;
  imageUrl: string | null;
  unit: string;
  unitPrice: number;
  isScanning: boolean;
  isExtractedByAi: boolean;
  hasManualEdits: boolean;
  hasPhotoUploaded: boolean;
}

interface PageProps {
  params: Promise<{ invoiceId: string }>;
}

export default function TenantInvoiceDetailPage({ params }: PageProps) {
  const { invoiceId } = use(params);
  const router = useRouter();

  const t = useTranslations("tenantPortal");
  const { locale } = useLanguage();
  const { toast } = useToast();

  // Page level states
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<TenantInvoice | null>(null);
  const [meterData, setMeterData] = useState<ActiveMeteredServicesResponse | null>(null);
  const [serviceStates, setServiceStates] = useState<Record<string, MeterServiceState>>({});

  // PayOS Checkout states
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [payOsData, setPayOsData] = useState<InvoicePayOsCheckoutResponse | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const isPollingRef = useRef(false);

  // Copy indicators
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Image inspection modal
  const [inspectImage, setInspectImage] = useState<string | null>(null);

  // Rule 10: Confirmation modal on uncommitted exit
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  // Per-service validation errors displayed below the two action buttons
  const [uploadErrors, setUploadErrors] = useState<Record<string, string | null>>({});

  // Refs for upload inputs (device vs camera)
  const deviceUploadRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const cameraUploadRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ─── 1. Load Real Invoice and Real Meter Data from Database ──────────────────
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setLoading(true);
      try {
        const [invoiceResult, activeServices] = await Promise.all([
          tenantInvoiceService.getTenantInvoiceById(invoiceId).catch(() => null),
          meterReadingService.getActiveMeteredServices().catch(() => null),
        ]);

        if (!isMounted) return;

        if (invoiceResult) {
          setInvoice(invoiceResult);
        }

        if (activeServices) {
          setMeterData(activeServices);

          // Populate meter state strictly from database values — no mockup data!
          const initialMap: Record<string, MeterServiceState> = {};
          activeServices.meteredServices.forEach((ms) => {
            const hasPrev = ms.previousReading && typeof ms.previousReading.readingValue === "number";
            const currentVal = ms.currentReading?.readingValue ?? "";
            const hasCurrentPhoto = Boolean(ms.currentReading?.imageUrl);

            initialMap[ms.serviceId] = {
              serviceId: ms.serviceId,
              serviceName: ms.serviceName,
              readingId: ms.currentReading?.id,
              currentValue: currentVal,
              previousValue: hasPrev ? ms.previousReading!.readingValue : null,
              imageUrl: ms.currentReading?.imageUrl ?? null,
              unit: ms.unit,
              unitPrice: ms.unitPrice,
              isScanning: false,
              isExtractedByAi: currentVal !== "",
              hasManualEdits: false,
              hasPhotoUploaded: hasCurrentPhoto,
            };
          });
          setServiceStates(initialMap);
        }
      } catch (err) {
        console.error("Failed to load invoice from database:", err);
        toast.error(t("loadInvoiceError"));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (invoiceId) {
      fetchData();
    }

    return () => {
      isMounted = false;
    };
  }, [invoiceId]);

  // ─── 2. Handle Photo Upload / Camera Capture & AI OCR Extraction ─────────────
  const handlePhotoUpload = async (serviceId: string, file: File) => {
    // Clear previous error for this specific service
    setUploadErrors((prev) => ({ ...prev, [serviceId]: null }));

    // Set immediate scanning indicator in the image box (without showing image yet)
    setServiceStates((prev) => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        isScanning: true,
      },
    }));

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;
      if (!base64Data) {
        setServiceStates((prev) => ({
          ...prev,
          [serviceId]: {
            ...prev[serviceId],
            isScanning: false,
          },
        }));
        return;
      }

      const serviceName = serviceStates[serviceId]?.serviceName || "";

      try {
        // Step 1: Send image data directly to AI first (before uploading to Cloudinary)
        const aiResponse = await meterReadingService.scanMeterWithAi(
          base64Data,
          serviceName,
        );

        // Step 2: Check AI result - if success == false or invalid image
        if (!aiResponse?.success || !aiResponse?.data?.isValid) {
          const aiErrorMsg =
            aiResponse?.message ||
            aiResponse?.data?.errorMessage ||
            "Ảnh tải lên không phải là công tơ hợp lệ hoặc không thể đọc được chỉ số.";

          // Turn off scanning, keep existing photo if previously verified, do NOT upload to Cloudinary
          setServiceStates((prev) => ({
            ...prev,
            [serviceId]: {
              ...prev[serviceId],
              isScanning: false,
              imageUrl: prev[serviceId]?.readingId ? prev[serviceId]?.imageUrl : null,
              hasPhotoUploaded: Boolean(prev[serviceId]?.readingId),
            },
          }));

          // Display error message below the buttons without toast error
          setUploadErrors((prev) => ({
            ...prev,
            [serviceId]: aiErrorMsg,
          }));
          return;
        }

        // Step 3: AI returned success == true -> Now upload image to Cloudinary
        const uploadResult = await uploadImageToBackend(
          base64Data,
          "dormio/meter-readings",
        );
        const cloudinaryUrl = uploadResult?.url;

        if (!cloudinaryUrl) {
          throw new Error("Không thể lưu ảnh lên máy chủ Cloudinary.");
        }

        // Step 4: Save validated reading to database with Cloudinary URL
        const readingResult = await meterReadingService.uploadMeterReading({
          serviceId,
          imageUrl: cloudinaryUrl,
          readingValue:
            typeof aiResponse.data.readingValue === "number"
              ? aiResponse.data.readingValue
              : undefined,
        });

        // Step 5: Update state -> Show photo on UI, update readingValue, clear error
        setServiceStates((prev) => ({
          ...prev,
          [serviceId]: {
            ...prev[serviceId],
            readingId: readingResult?.id,
            currentValue:
              typeof aiResponse.data.readingValue === "number"
                ? aiResponse.data.readingValue
                : (typeof readingResult?.readingValue === "number"
                    ? readingResult.readingValue
                    : prev[serviceId]?.currentValue),
            imageUrl: cloudinaryUrl,
            isScanning: false,
            isExtractedByAi: true,
            hasManualEdits: false,
            hasPhotoUploaded: true,
          },
        }));

        setUploadErrors((prev) => ({ ...prev, [serviceId]: null }));
        toast.success(t("aiExtractedBadge"));
      } catch (err: any) {
        console.error("AI Meter scan or upload error:", err);
        const serverMessage =
          err?.message ||
          err?.data?.message ||
          err?.response?.data?.message ||
          "Không thể xử lý hình ảnh qua AI. Vui lòng thử lại.";

        setServiceStates((prev) => ({
          ...prev,
          [serviceId]: {
            ...prev[serviceId],
            isScanning: false,
            imageUrl: prev[serviceId]?.readingId ? prev[serviceId]?.imageUrl : null,
            hasPhotoUploaded: Boolean(prev[serviceId]?.readingId),
          },
        }));

        // Display error message below the action buttons (NO toast error)
        setUploadErrors((prev) => ({
          ...prev,
          [serviceId]: serverMessage,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // ─── 3. Handle Manual Input Editing ─────────────────────────────────────────
  const handleValueChange = (serviceId: string, rawVal: string) => {
    const num = rawVal === "" ? "" : Number(rawVal);
    setServiceStates((prev) => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        currentValue: num,
        hasManualEdits: true,
      },
    }));
  };

  // ─── 4. Dynamic Calculations (Only calculated once photo is uploaded) ───────
  const utilityCalculations = useMemo(() => {
    let totalUtilityCost = 0;
    let hasAnyMeteredService = false;
    let allPhotosUploaded = true;
    const perServiceDetails: Record<
      string,
      {
        hasCalculated: boolean;
        delta: number;
        cost: number;
      }
    > = {};

    const serviceEntries = Object.entries(serviceStates);
    if (serviceEntries.length > 0) {
      hasAnyMeteredService = true;
    }

    serviceEntries.forEach(([sId, state]) => {
      // Calculate ONLY when photo has been uploaded
      if (state.hasPhotoUploaded && typeof state.currentValue === "number") {
        const prev = state.previousValue ?? 0;
        const delta = Math.max(0, state.currentValue - prev);
        const cost = Math.round(delta * state.unitPrice);

        totalUtilityCost += cost;
        perServiceDetails[sId] = {
          hasCalculated: true,
          delta,
          cost,
        };
      } else {
        allPhotosUploaded = false;
        perServiceDetails[sId] = {
          hasCalculated: false,
          delta: 0,
          cost: 0,
        };
      }
    });

    return {
      hasAnyMeteredService,
      allPhotosUploaded: hasAnyMeteredService ? allPhotosUploaded : true,
      totalUtilityCost,
      perServiceDetails,
    };
  }, [serviceStates]);

  // Total payable amount: non-metered base items + calculated utility costs
  const payableAmount = useMemo(() => {
    if (!invoice) return 0;

    // Filter non-metered base line items (Room rent, Garbage, Internet, etc.)
    const nonMeteredDetails = invoice.details.filter((d) => !d.isMetered);
    const nonMeteredBaseTotal = nonMeteredDetails.reduce(
      (sum, item) => sum + item.value,
      0
    );

    // If there are metered services and photos were uploaded, add calculated utilities
    if (utilityCalculations.hasAnyMeteredService) {
      return nonMeteredBaseTotal + utilityCalculations.totalUtilityCost;
    }

    // Fallback to invoice stored amount
    return invoice.amount;
  }, [invoice, utilityCalculations]);

  // ─── 5. Complete & Generate PayOS QR Code ───────────────────────────────────
  const handleCompleteAndPay = async () => {
    if (!invoice) return;

    // If metered services exist and photos have not been uploaded yet
    if (
      utilityCalculations.hasAnyMeteredService &&
      !utilityCalculations.allPhotosUploaded
    ) {
      toast.error(t("photoRequiredToCalculate"));
      return;
    }

    setIsCreatingCheckout(true);
    setIsExpired(false);

    try {
      // Commit any manually edited meter readings
      for (const [sId, state] of Object.entries(serviceStates)) {
        if (
          state.readingId &&
          state.hasManualEdits &&
          typeof state.currentValue === "number"
        ) {
          try {
            await meterReadingService.updateMeterReading(
              state.readingId,
              state.currentValue
            );
          } catch (updateErr) {
            console.warn(`Failed to update reading ${state.readingId}:`, updateErr);
          }
        }
      }

      // Generate 15-minute PayOS checkout session
      const checkoutRes = await paymentService.createInvoicePayOsCheckout(
        invoice.id
      );
      setPayOsData(checkoutRes);
      setCountdown(checkoutRes.expiresIn || 900);

      // Smooth scroll to QR section
      setTimeout(() => {
        const qrEl = document.getElementById("payos-qr-section");
        if (qrEl) {
          qrEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 200);
    } catch (err: any) {
      console.error("PayOS checkout generation failed:", err);
      toast.error(err?.message || t("loadInvoiceError"));
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  // ─── 6. Countdown Timer Effect (15 minutes) ─────────────────────────────────
  useEffect(() => {
    if (!payOsData || isPaidSuccess) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [payOsData?.orderCode, isPaidSuccess]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // ─── 7. Realtime Polling for Payment Status ──────────────────────────────────
  useEffect(() => {
    const orderCode = payOsData?.orderCode;
    if (!orderCode || isPaidSuccess || isExpired) return;

    const checkStatus = async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;
      try {
        const statusRes = await paymentService.getInvoicePaymentStatus(orderCode);
        if (statusRes.isPaid) {
          setIsPaidSuccess(true);
          toast.success(t("paymentSuccessToast"));

          // Redirect back to invoices page after toast
          setTimeout(() => {
            router.push("/tenant/invoices");
          }, 1800);
        }
      } catch (pollErr) {
        // Silent polling error
      } finally {
        isPollingRef.current = false;
      }
    };

    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [payOsData?.orderCode, isPaidSuccess, isExpired, router, t, toast]);

  // ─── 8. Copy Helper ─────────────────────────────────────────────────────────
  const handleCopy = (text: string, key: string) => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success(t("copySuccessTooltip"));
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // ─── 9. Handle Exit Navigation with Unsaved Check (Rule 10) ───────────────────
  const hasUnsavedChanges = () => {
    if (isPaidSuccess) return false;
    return Object.values(serviceStates).some(
      (s) => s.hasManualEdits || s.imageUrl !== null
    );
  };

  const handleBackClick = () => {
    if (hasUnsavedChanges() && !payOsData) {
      setShowDiscardModal(true);
    } else {
      router.push("/tenant/invoices");
    }
  };

  // ─── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="w-8 h-8 text-[#2AC1BC] animate-spin" />
        <span className="text-xs font-semibold text-zinc-400">
          {t("loading")}
        </span>
      </div>
    );
  }

  // ─── Empty State: No Invoice Data Found ─────────────────────────────────────
  if (!invoice) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-5 animate-in fade-in">
        <div className="w-16 h-16 rounded-3xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto border border-zinc-200">
          <FileQuestion className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black text-zinc-800">
            {t("noInvoiceData")}
          </h2>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            {t("loadInvoiceError")}
          </p>
        </div>
        <div>
          <Button
            variant="primary"
            onClick={() => router.push("/tenant/invoices")}
            className="rounded-xl px-5 py-2.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span>{t("backToInvoices")}</span>
          </Button>
        </div>
      </div>
    );
  }

  const meteredServicesList = meterData?.meteredServices || [];

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-16 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleBackClick}
            className="rounded-xl border border-zinc-200"
            title={t("backToInvoices")}
          >
            <ArrowLeft className="w-5 h-5 text-zinc-700" />
          </Button>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
              <Link
                href="/tenant/invoices"
                className="hover:text-zinc-700 transition-colors"
              >
                {t("invoicesTitle")}
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-zinc-700 font-bold">
                {t("paymentPageTitle")}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight mt-0.5">
              {t("paymentPageTitle")}
            </h1>
          </div>
        </div>

        {/* Invoice Summary Pill */}
        <div className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-2xl border border-zinc-200/80 shadow-xs self-start sm:self-auto">
          <Receipt className="w-4 h-4 text-[#FF6B35]" />
          <span className="text-xs font-bold text-zinc-800">
            {invoice.period}
          </span>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 uppercase font-mono">
            {invoice.id}
          </span>
        </div>
      </div>

      {/* ─── SECTION 1: Meter Reading Capture & AI OCR ───────────────────────── */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center font-black text-sm">
              1
            </div>
            <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
              {t("metersSectionTitle")}
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            {t("metersSectionDesc")}
          </p>
        </div>

        {/* If no metered services exist for this invoice/room */}
        {meteredServicesList.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-2xl bg-zinc-50 border border-zinc-200/60 space-y-2">
            <Info className="w-6 h-6 text-zinc-400 mx-auto" />
            <p className="text-xs font-medium text-zinc-500">
              {t("noMeteredServices")}
            </p>
          </div>
        ) : (
          /* Grid of Metered Services (Electricity & Water) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {meteredServicesList.map((service) => {
              const sId = service.serviceId;
              const state = serviceStates[sId] || {
                serviceId: sId,
                serviceName: service.serviceName,
                currentValue: "",
                previousValue: service.previousReading?.readingValue ?? null,
                imageUrl: null,
                unit: service.unit,
                unitPrice: service.unitPrice,
                isScanning: false,
                isExtractedByAi: false,
                hasManualEdits: false,
                hasPhotoUploaded: false,
              };

              const isElec =
                service.serviceName.toLowerCase().includes("điện") ||
                service.serviceName.toLowerCase().includes("elec");

              const serviceCalc = utilityCalculations.perServiceDetails[sId];

              return (
                <div
                  key={sId}
                  className={`rounded-2xl border p-5 transition-all space-y-4 ${
                    isElec
                      ? "border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-white"
                      : "border-sky-200/80 bg-gradient-to-br from-sky-50/40 via-white to-white"
                  }`}
                >
                  {/* Card Title & Unit Price */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isElec
                            ? "bg-amber-500 text-white shadow-xs shadow-amber-500/20"
                            : "bg-sky-500 text-white shadow-xs shadow-sky-500/20"
                        }`}
                      >
                        {isElec ? (
                          <Zap className="w-5 h-5" />
                        ) : (
                          <Droplets className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-zinc-900">
                          {service.serviceName}
                        </h3>
                        <span className="text-[11px] font-bold text-zinc-400">
                          {formatCurrency(service.unitPrice, locale)} /{" "}
                          {service.unit}
                        </span>
                      </div>
                    </div>

                    {/* AI Status Badge */}
                    {state.isScanning ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 text-white text-[10px] font-bold shadow-xs animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin text-[#2AC1BC]" />
                        <span>{t("aiScanningBadge")}</span>
                      </span>
                    ) : state.isExtractedByAi ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>{t("aiExtractedBadge")}</span>
                      </span>
                    ) : null}
                  </div>

                  {/* Full-width Photo Preview & Action Controls */}
                  <div className="space-y-2.5">
                    {/* Reusable ImageUpload Component handling AI scanning loading state & Cloudinary Image display */}
                    <ImageUpload
                      value={state.imageUrl}
                      alt={service.serviceName}
                      isLoading={state.isScanning}
                      loadingText={t("aiScanningBadge") || "AI đang quét số công tơ..."}
                      className="w-full h-48 sm:h-56"
                      aspectRatio="auto"
                      hideActionButtons={true}
                      showInspectButton={true}
                      onInspect={(url) => setInspectImage(url)}
                      onFileSelect={(file) => handlePhotoUpload(sId, file)}
                      emptyPlaceholder={
                        <div className="flex flex-col items-center justify-center p-4 text-center text-zinc-400 space-y-1.5">
                          <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200/80 flex items-center justify-center text-zinc-400 shadow-2xs">
                            <Camera className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-bold text-zinc-600">
                            {t("uploadOrCapture")}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            JPG, PNG, WEBP
                          </span>
                        </div>
                      }
                    />

                    {/* Hidden File Inputs for Device Upload & Camera Capture */}
                    <input
                      ref={(el) => {
                        deviceUploadRefs.current[sId] = el;
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handlePhotoUpload(sId, e.target.files[0]);
                        }
                      }}
                    />
                    <input
                      ref={(el) => {
                        cameraUploadRefs.current[sId] = el;
                      }}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handlePhotoUpload(sId, e.target.files[0]);
                        }
                      }}
                    />

                    {/* Two explicit action buttons: Device Upload & Camera Capture */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        type="button"
                        onClick={() => deviceUploadRefs.current[sId]?.click()}
                        className="h-9 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-zinc-200 hover:bg-zinc-100"
                      >
                        <UploadCloud className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{t("btnUploadFromDevice")}</span>
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        type="button"
                        onClick={() => cameraUploadRefs.current[sId]?.click()}
                        className="h-9 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 bg-[#2AC1BC] hover:bg-[#23a8a3] text-white"
                      >
                        <Camera className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{t("btnCaptureNow")}</span>
                      </Button>
                    </div>

                    {/* Error message displayed right below the two action buttons if AI check failed */}
                    {uploadErrors[sId] && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/90 text-rose-700 flex items-start gap-2.5 animate-in fade-in duration-200 shadow-xs">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-rose-800 leading-tight">
                            Ảnh không hợp lệ
                          </p>
                          <p className="text-[11px] font-medium text-rose-600 leading-relaxed">
                            {uploadErrors[sId]}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reading Inputs & Calculations (Pushed below the photo) */}
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Previous Reading (Disabled from DB) */}
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                          {t("previousReadingLabel")}
                        </span>
                        <div className="px-3.5 py-2.5 rounded-xl bg-zinc-100 border border-zinc-200 text-xs font-bold text-zinc-600 truncate">
                          {state.previousValue !== null
                            ? `${state.previousValue} ${state.unit}`
                            : t("noData")}
                        </div>
                      </div>

                      {/* Current Reading (Base NumberInput Component) */}
                      <div>
                        <NumberInput
                          label={`${t("currentReadingInput")}`}
                          suffixText={state.unit}
                          value={state.currentValue}
                          onChange={(e) => handleValueChange(sId, e.target.value)}
                          placeholder="0"
                          className={`font-black text-xs ${
                            isElec
                              ? "border-amber-300 text-amber-800"
                              : "border-sky-300 text-sky-800"
                          }`}
                          helperText={
                            state.hasManualEdits ? "Đã chỉnh sửa" : undefined
                          }
                        />
                      </div>
                    </div>

                    {/* Calculation Status Banner (Calculated ONLY after photo is uploaded) */}
                    {serviceCalc?.hasCalculated ? (
                      <div className="p-3 rounded-xl bg-white/95 border border-zinc-200/80 shadow-2xs flex items-center justify-between text-xs animate-in fade-in">
                        <div>
                          <span className="text-[10px] text-zinc-400 block font-medium">
                            {t("consumptionDelta")}
                          </span>
                          <span className="font-black text-zinc-800 text-sm">
                            {serviceCalc.delta} {state.unit}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-400 block font-medium">
                            {t("estimatedFee")}
                          </span>
                          <span className="font-black text-[#FF6B35] text-sm">
                            {formatCurrency(serviceCalc.cost, locale)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-zinc-50 border border-dashed border-zinc-300 text-xs text-zinc-500 flex items-center gap-2">
                        <Info className="w-4 h-4 text-zinc-400 shrink-0" />
                        <span>{t("pendingPhotoUpload")}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-zinc-400 flex items-center gap-1 pt-0.5">
                    <Info className="w-3 h-3 text-zinc-400 shrink-0" />
                    <span>{t("aiAccuracyNote")}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── SECTION 2: Cost Breakdown & Summary ────────────────────────────── */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF6B35]/10 text-[#FF6B35] flex items-center justify-center font-black text-sm">
              2
            </div>
            <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
              {t("summarySectionTitle")}
            </h2>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              {t("paymentDueDate")}
            </span>
            <span className="text-xs font-bold text-zinc-700">
              {invoice.dueDate}
            </span>
          </div>
        </div>

        {/* Detailed Line Items */}
        <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 space-y-3">
          {/* Base non-metered items */}
          {invoice.details
            .filter((d) => !d.isMetered)
            .map((item, idx) => (
              <div
                key={`fixed-${idx}`}
                className="flex items-center justify-between pt-2.5 first:pt-0 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-600">{item.name}</span>
                  {item.quantity && item.quantity > 1 && (
                    <span className="text-[10px] text-zinc-400 bg-zinc-200/70 px-1.5 py-0.5 rounded font-bold">
                      x{item.quantity}
                    </span>
                  )}
                </div>
                <span className="font-bold text-zinc-900">
                  {formatCurrency(item.value, locale)}
                </span>
              </div>
            ))}

          {/* Metered services items with photo-dependent calculation */}
          {meteredServicesList.map((service) => {
            const sId = service.serviceId;
            const calc = utilityCalculations.perServiceDetails[sId];

            return (
              <div
                key={`meter-${sId}`}
                className="flex items-center justify-between pt-2.5 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-600">
                    {service.serviceName}
                  </span>
                  {calc?.hasCalculated ? (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                      {calc.delta} {service.unit}
                    </span>
                  ) : null}
                </div>

                {calc?.hasCalculated ? (
                  <span className="font-bold text-zinc-900">
                    {formatCurrency(calc.cost, locale)}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-amber-600 italic">
                    {t("pendingPhotoUpload")}
                  </span>
                )}
              </div>
            );
          })}

          {/* Grand Total */}
          <div className="flex items-center justify-between pt-3 border-t-2 border-zinc-200 text-sm">
            <div>
              <span className="font-black text-zinc-900 uppercase tracking-wider block">
                {t("totalPayment")}
              </span>
              {utilityCalculations.hasAnyMeteredService &&
                !utilityCalculations.allPhotosUploaded && (
                  <span className="text-[10px] text-amber-600 font-bold block">
                    {t("awaitingPhotosNote")}
                  </span>
                )}
            </div>
            <span className="text-xl sm:text-2xl font-black text-[#FF6B35]">
              {formatCurrency(payableAmount, locale)}
            </span>
          </div>
        </div>

        {/* CTA: Complete and Generate PayOS QR */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={handleBackClick}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-zinc-600 hover:text-zinc-900 text-xs font-bold cursor-pointer"
          >
            {t("btnClose")}
          </Button>

          <Button
            variant="primary"
            onClick={handleCompleteAndPay}
            disabled={isCreatingCheckout}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#FF6B35] hover:bg-[#e85a26] text-white text-xs sm:text-sm font-black shadow-md shadow-[#FF6B35]/25 cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            {isCreatingCheckout ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t("btnCreatingQr")}</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>{t("btnCompleteAndPay")}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ─── SECTION 3: PayOS QR Payment (Active when QR is generated) ─────── */}
      {payOsData && (
        <div
          id="payos-qr-section"
          className="rounded-3xl border-2 border-[#2AC1BC]/80 bg-white p-6 sm:p-8 shadow-xl shadow-[#2AC1BC]/10 space-y-6 animate-in fade-in duration-500"
        >
          {/* Section Header with Countdown Timer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-zinc-900">
                  {t("qrSectionTitle")}
                </h2>
                <p className="text-xs text-zinc-400">
                  {t("scanQrGuide")}
                </p>
              </div>
            </div>

            {/* 15-Minute Countdown Badge */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-100 border border-zinc-200 self-start sm:self-auto">
              <Clock className="w-4 h-4 text-amber-600 animate-spin" />
              <span className="text-xs text-zinc-500 font-semibold">
                {t("qrExpiresIn")}
              </span>
              <span
                className={`font-black text-xs font-mono px-2 py-0.5 rounded-md ${
                  countdown <= 60
                    ? "bg-rose-100 text-rose-700 animate-pulse"
                    : "bg-white text-zinc-900 shadow-2xs"
                }`}
              >
                {formatTimer(countdown)}
              </span>
            </div>
          </div>

          {/* ─── Critical Security / Escrow Notice Banner ───────────────────── */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-50 via-sky-50/60 to-white border border-sky-200/80 shadow-xs space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-sky-950 uppercase tracking-wide">
                    {t("systemAccountNoticeTitle")}
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-sky-200/80 text-sky-800">
                    Dormio Escrow
                  </span>
                </div>
                <p className="text-xs text-sky-900 leading-relaxed font-medium">
                  {t("systemAccountNoticeDesc")}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900 font-bold">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{t("lockedInfoWarning")}</span>
            </div>
          </div>

          {/* QR Display & Bank Information Columns */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: PayOS QR Code */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-4">
              <div className="relative w-56 h-56 bg-white p-3 rounded-2xl shadow-xs border border-zinc-200 flex items-center justify-center">
                {isExpired ? (
                  <div className="flex flex-col items-center justify-center text-center p-4 space-y-2">
                    <Clock className="w-10 h-10 text-rose-500" />
                    <p className="text-xs font-bold text-rose-600">
                      {t("qrExpired")}
                    </p>
                  </div>
                ) : (
                  <img
                    src={getQrImageUrl(payOsData.qrCode)}
                    alt="PayOS VietQR Payment"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {isExpired ? (
                <Button
                  variant="primary"
                  onClick={handleCompleteAndPay}
                  className="w-full py-2.5 rounded-xl bg-[#2AC1BC] hover:bg-[#23a8a3] text-white text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{t("btnRegenerateQr")}</span>
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-xs text-zinc-500 font-bold animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 text-[#2AC1BC] animate-spin" />
                  <span>{t("waitingForPayment")}</span>
                </div>
              )}
            </div>

            {/* Right: Bank Transfer Details with 1-Click Copy */}
            <div className="md:col-span-7 space-y-2.5 text-xs">
              {/* Beneficiary Bank */}
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    {t("bankNameLabel")}
                  </span>
                  <span className="font-bold text-zinc-800 text-sm">
                    {BANK_NAMES[payOsData.bin] ||
                      `Ngân hàng (BIN: ${payOsData.bin})`}
                  </span>
                </div>
              </div>

              {/* Account Number with Copy */}
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    {t("accountNumberLabel")}
                  </span>
                  <span className="font-mono font-black text-zinc-900 text-base tracking-wider">
                    {payOsData.accountNumber}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={() => handleCopy(payOsData.accountNumber, "acc")}
                  className="h-8 w-8 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg cursor-pointer"
                  title="Sao chép số tài khoản"
                >
                  {copiedKey === "acc" ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Account Holder */}
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  {t("accountHolderLabel")}
                </span>
                <span className="font-black text-zinc-900 text-sm">
                  {payOsData.accountName}
                </span>
              </div>

              {/* Exact Amount (Locked) */}
              <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/80 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                      {t("transferAmountLabel")}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-200/70 text-amber-900 text-[9px] font-extrabold flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" />
                      {t("lockedBadge")}
                    </span>
                  </div>
                  <span className="font-black text-[#FF6B35] text-lg">
                    {formatCurrency(payOsData.amount, locale)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={() =>
                    handleCopy(payOsData.amount.toString(), "amount")
                  }
                  className="h-8 w-8 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg cursor-pointer"
                  title="Sao chép số tiền"
                >
                  {copiedKey === "amount" ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Transfer Syntax (Locked) */}
              <div className="p-3 rounded-xl bg-sky-50/50 border border-sky-200/80 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">
                      {t("transferSyntaxLabel")}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-sky-200/70 text-sky-900 text-[9px] font-extrabold flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" />
                      {t("lockedBadge")}
                    </span>
                  </div>
                  <span className="font-mono font-black text-[#2AC1BC] text-sm tracking-wide">
                    {payOsData.description}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={() => handleCopy(payOsData.description, "syntax")}
                  className="h-8 w-8 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg cursor-pointer"
                  title="Sao chép cú pháp"
                >
                  {copiedKey === "syntax" ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Image Inspection ─────────────────────────────────────────── */}
      {inspectImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setInspectImage(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-4 overflow-hidden border border-zinc-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-black text-zinc-900">
                {t("meterReadingPhotoTitle")}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setInspectImage(null)}
                className="h-8 w-8 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="h-80 w-full rounded-2xl overflow-hidden bg-zinc-100">
              <img
                src={inspectImage}
                alt="Meter Inspection"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setInspectImage(null)}
                className="rounded-xl font-bold"
              >
                {t("btnClose")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Confirmation on Discard (Rule 10) ────────────────────────── */}
      {showDiscardModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowDiscardModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 overflow-hidden border border-zinc-200 space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900">
                {t("discardPaymentModalTitle")}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                {t("discardPaymentModalDesc")}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowDiscardModal(false)}
                className="px-4 py-2 text-xs font-bold text-zinc-600 hover:text-zinc-900 rounded-xl cursor-pointer"
              >
                {t("btnStay")}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setShowDiscardModal(false);
                  router.push("/tenant/invoices");
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl cursor-pointer shadow-xs"
              >
                {t("btnDiscard")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
