"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Printer,
  Download,
  X,
  Loader2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  FileDown,
} from "lucide-react";
import {
  getContractPrintHtml,
  exportContract,
} from "@/services/contract.service";

interface ContractPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildingId: string;
  contractId: string;
  roomNumber: string;
  tenantName?: string;
  onExportSuccess?: () => void;
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
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

function generateFallbackContractHtml(contractId: string, roomNumber: string, tenantName?: string): string {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Hợp Đồng Thuê Phòng ${roomNumber}</title>
  <style>
    @page { size: A4; margin: 15mm 20mm; }
    body { font-family: "Times New Roman", Times, Georgia, serif; font-size: 14pt; line-height: 1.5; color: #111; margin: 0; padding: 25px; background: #fff; }
    .header { text-align: center; margin-bottom: 25px; }
    .country { font-size: 13pt; font-weight: bold; text-transform: uppercase; margin: 0; }
    .motto { font-size: 12pt; font-weight: bold; margin: 4px 0; }
    .divider { margin: 6px auto 14px auto; width: 140px; border-bottom: 1.5px solid #111; }
    h1 { text-align: center; font-size: 18pt; text-transform: uppercase; margin: 10px 0; }
    .code { text-align: center; font-size: 11pt; font-style: italic; color: #555; margin-bottom: 20px; }
    .section { font-weight: bold; text-transform: uppercase; margin-top: 18px; border-bottom: 1px solid #ccc; padding-bottom: 3px; font-size: 13pt; }
    p { margin: 6px 0; text-align: justify; }
    .signatures { margin-top: 60px; display: flex; justify-content: space-around; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <p class="country">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
    <p class="motto">Độc lập - Tự do - Hạnh phúc</p>
    <div class="divider"></div>
    <p style="font-style: italic; font-size: 11pt;">Ngày ${day} tháng ${month} năm ${year}</p>
  </div>
  <h1>HỢP ĐỒNG THUÊ PHÒNG TRỌ</h1>
  <p class="code">Mã số HĐ: <strong>${contractId}</strong></p>
  <p>Hôm nay, ngày ${day} tháng ${month} năm ${year}, các bên thống nhất ký kết Hợp đồng thuê phòng trọ với các nội dung sau:</p>
  <div class="section">I. ĐỐI TƯỢNG HỢP ĐỒNG</div>
  <p>Bên cho thuê đồng ý cho Bên thuê: <strong>${tenantName || 'Khách thuê'}</strong> thuê phòng số <strong>${roomNumber}</strong>.</p>
  <div class="section">II. ĐIỀU KHOẢN CHUNG</div>
  <p>Hai bên cam kết thực hiện đúng các điều khoản thuê nhà theo quy định của pháp luật và nội quy tòa nhà.</p>
  <div class="signatures">
    <div><strong>ĐẠI DIỆN BÊN CHO THUÊ</strong><br><br><br><br><br>(Ký và ghi rõ họ tên)</div>
    <div><strong>ĐẠI DIỆN BÊN THUÊ</strong><br><br><br><br><br>${tenantName || 'Khách thuê'}</div>
  </div>
</body>
</html>`;
}

  useEffect(() => {
    if (!isOpen || !contractId || !buildingId) {
      setHtmlContent("");
      setIsLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getContractPrintHtml(buildingId, contractId, false)
      .then((html) => {
        if (isMounted) {
          setHtmlContent(html);
          setIsLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          console.warn("Could not fetch server template, falling back to client preview:", err);
          setHtmlContent(generateFallbackContractHtml(contractId, roomNumber, tenantName));
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, contractId, buildingId, roomNumber, tenantName]);

  if (!isOpen) return null;

  // Direct print trigger from the loaded iframe
  const handlePrint = () => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) {
      window.print();
      return;
    }
    try {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    } catch {
      window.print();
    }
  };

  // Direct download of the current HTML content
  const handleDownloadLocalHtml = () => {
    if (!htmlContent) return;
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hop-dong-phong-${roomNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}-${contractId.substring(0, 8)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Đã tải xuống tệp hợp đồng!", "success");
  };

  // Persist export on backend & download (UC-L-15)
  const handleExportDocument = async () => {
    try {
      setIsExporting(true);
      const res = await exportContract(buildingId, contractId);
      if (res?.data) {
        showToast("Đã xuất và lưu tài liệu hợp đồng thành công!", "success");
        onExportSuccess?.();
        handleDownloadLocalHtml();
      }
    } catch (err: any) {
      console.error("Failed to export contract document:", err);
      showToast(err.message || "Không thể xuất tài liệu hợp đồng.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Toast Notice */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-60 px-4 py-2.5 rounded-xl font-bold text-xs shadow-xl flex items-center gap-2 animate-in slide-in-from-top-3 ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          {toast.message}
        </div>
      )}

      <div className="relative w-full max-w-5xl h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-zinc-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 bg-zinc-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2AC1BC]/10 flex items-center justify-center text-[#2AC1BC]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-zinc-900 leading-tight">
                Văn Bản Hợp Đồng Thuê Phòng {roomNumber}
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                {tenantName ? `Đại diện thuê: ${tenantName} • ` : ""}Mã HĐ:{" "}
                <span className="font-mono font-bold text-zinc-700">{contractId.substring(0, 12)}...</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isLoading || !!error}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer disabled:opacity-50"
              title="In trực tiếp theo định dạng văn bản chuẩn"
            >
              <Printer className="w-3.5 h-3.5 text-[#2AC1BC]" />
              <span className="hidden sm:inline">In hợp đồng</span>
            </button>

            <button
              onClick={handleExportDocument}
              disabled={isLoading || isExporting || !!error}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              title="Lưu tài liệu vào hệ thống và tải xuống"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span>{isExporting ? "Đang xuất..." : "Xuất & Tải về"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 rounded-xl transition-colors cursor-pointer ml-1"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Document Preview */}
        <div className="flex-1 bg-zinc-100/70 p-2 sm:p-4 overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-xs">
              <Loader2 className="w-8 h-8 text-[#2AC1BC] animate-spin" />
              <p className="text-sm font-semibold text-zinc-600">
                Đang chuẩn bị văn bản hợp đồng từ mẫu hệ thống...
              </p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white p-6 text-center">
              <AlertTriangle className="w-10 h-10 text-rose-500" />
              <p className="text-base font-bold text-rose-600">{error}</p>
              <p className="text-xs text-zinc-500 max-w-md">
                Không thể tải mẫu văn bản hợp đồng. Vui lòng kiểm tra lại thông tin phòng hoặc liên hệ hỗ trợ.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 text-xs font-bold text-white bg-[#2AC1BC] rounded-xl hover:bg-[#25ad87]"
              >
                Đóng
              </button>
            </div>
          )}

          {!isLoading && !error && (
            <div className="w-full h-full rounded-xl overflow-hidden shadow-inner border border-zinc-200/80 bg-white">
              <iframe
                ref={iframeRef}
                srcDoc={htmlContent}
                title="Xem trước hợp đồng"
                className="w-full h-full border-0"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-200 bg-white text-xs text-zinc-500 font-medium shrink-0">
          <div>
            Định dạng: <span className="font-bold text-zinc-700">A4 tiêu chuẩn (Hợp đồng thuê nhà Việt Nam)</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadLocalHtml}
              disabled={isLoading || !htmlContent}
              className="text-zinc-600 hover:text-[#2AC1BC] underline font-semibold cursor-pointer disabled:opacity-50"
            >
              Tải file HTML riêng
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-zinc-300 text-zinc-700 font-semibold hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
