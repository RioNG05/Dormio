"use client";
import { useTranslations } from "@/context/LanguageContext";

import React, { useState } from "react";
import { MessageSquare, Plus, AlertTriangle, CheckCircle2, Clock, X, ShieldAlert, UploadCloud, File, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TenantAdminComplaintsPage() {
  const t = useTranslations("tenantPortal");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, size: string}[]>([]);

  // Mock Data: Khiếu nại Admin
  const complaints = [
    { id: "REP-001", title: "Chủ trọ tự ý tăng tiền điện sai thoả thuận", category: "Tự ý tăng giá sai quy định", status: "resolved", date: "05/07/2026", result: "Cảnh cáo chủ trọ, yêu cầu hoàn tiền." },
    { id: "REP-002", title: "Nhà trọ không có cửa sắt an toàn như quảng cáo", category: "Dịch vụ quá kém", status: "investigating", date: "12/07/2026", result: "Đang cử nhân viên hệ thống xác minh." },
    { id: "REP-003", title: "Có dấu hiệu lừa đảo tiền cọc", category: "Lừa đảo / Chiếm đoạt tài sản", status: "pending", date: "15/07/2026", result: null },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> Đã giải quyết</span>;
      case "investigating":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold"><ShieldAlert className="w-3.5 h-3.5" /> Đang điều tra</span>;
      case "pending":
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold"><Clock className="w-3.5 h-3.5" /> Chờ tiếp nhận</span>;
    }
  };

  const handleFileUpload = () => {
    if (uploadedFiles.length >= 3) return alert("Chỉ được tải lên tối đa 3 file.");
    setUploadedFiles([...uploadedFiles, { name: `bang-chung-${uploadedFiles.length + 1}.jpg`, size: "2.5 MB" }]);
  };

  const removeFile = (idx: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            Khiếu nại & Tố cáo <ShieldAlert className="w-6 h-6 text-danger" />
          </h1>
          <p className="text-sm text-zinc-500 mt-1 max-w-2xl leading-relaxed">
            Khu vực này dùng để báo cáo các hành vi sai trái của chủ nhà trọ lên <strong>Ban Quản Trị Hệ Thống</strong>. 
            Nếu xác minh có vi phạm nghiêm trọng (lừa đảo, chất lượng tồi tệ), nhà trọ sẽ bị cấm khỏi hệ thống.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-danger hover:bg-danger-hover text-white gap-2 rounded-xl shadow-sm h-11 px-6 font-bold shrink-0 border-0">
          <AlertTriangle className="w-5 h-5" /> Gửi Tố cáo Mới
        </Button>
      </div>

      {/* Danh sách yêu cầu */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-zinc-600" /> Lịch sử khiếu nại của bạn
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 font-bold uppercase tracking-wider text-xs">
                <th className="px-6 py-4">Mã TC</th>
                <th className="px-6 py-4">Nội dung tóm tắt</th>
                <th className="px-6 py-4">Phân loại vi phạm</th>
                <th className="px-6 py-4">Trạng thái BQT</th>
                <th className="px-6 py-4">Kết quả / Phản hồi</th>
                <th className="px-6 py-4">Ngày gửi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {complaints.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50 transition-colors cursor-pointer group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-zinc-900 group-hover:text-danger transition-colors">{item.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-zinc-900 max-w-[200px] truncate" title={item.title}>{item.title}</div>
                  </td>
                  <td className="px-6 py-4 text-zinc-600 font-medium">
                    {item.category}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="px-6 py-4">
                    {item.result ? (
                      <span className="text-sm font-semibold text-emerald-600 max-w-[200px] truncate block" title={item.result}>{item.result}</span>
                    ) : (
                      <span className="text-sm text-zinc-400 italic">Chưa có phản hồi</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-zinc-500 text-sm">
                    {item.date}
                  </td>
                </tr>
              ))}
              {complaints.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    Chưa có khiếu nại nào được ghi nhận.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Dialog tạo mới */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 bg-danger-bg">
              <h2 className="text-lg font-bold text-danger flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Lập Đơn Tố Cáo
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-danger hover:text-danger-hover hover:bg-danger/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-6">
              
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div className="text-sm text-orange-800 leading-relaxed">
                  <strong>Lưu ý:</strong> Mọi tố cáo gửi lên hệ thống đều được lưu lại và điều tra bởi Ban Quản Trị. Xin vui lòng cung cấp thông tin trung thực và bằng chứng đi kèm. Nếu phát hiện lừa đảo hoặc vi phạm nghiêm trọng, tài khoản chủ trọ sẽ bị khoá vĩnh viễn.
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-zinc-900">Tiêu đề tố cáo <span className="text-danger">*</span></label>
                <input type="text" placeholder="VD: Chủ trọ thu tiền điện sai mức quy định của nhà nước" className="w-full h-11 px-4 rounded-xl border border-zinc-200 focus:border-danger focus:ring-2 focus:ring-danger/20 outline-none transition-all text-sm" />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-zinc-900">Loại vi phạm <span className="text-danger">*</span></label>
                <select className="w-full h-11 px-4 rounded-xl border border-zinc-200 focus:border-danger focus:ring-2 focus:ring-danger/20 outline-none transition-all text-sm bg-white font-medium text-zinc-700">
                  <option value="">-- Chọn lý do tố cáo --</option>
                  <option value="Lừa đảo / Chiếm đoạt tài sản">Lừa đảo / Chiếm đoạt tài sản</option>
                  <option value="Vi phạm hợp đồng">Vi phạm hợp đồng đã ký</option>
                  <option value="Dịch vụ quá kém (An ninh, Vệ sinh)">Dịch vụ quá kém (An ninh, Vệ sinh, Điện nước)</option>
                  <option value="Tự ý tăng giá sai quy định">Tự ý tăng giá sai quy định</option>
                  <option value="Thái độ/Hành vi quấy rối">Thái độ không chuẩn mực / Quấy rối</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-zinc-900">Mô tả chi tiết sự việc <span className="text-danger">*</span></label>
                <textarea rows={5} placeholder="Hãy kể lại chi tiết vấn đề bạn gặp phải, thời gian, địa điểm, thiệt hại (nếu có)..." className="w-full p-4 rounded-xl border border-zinc-200 focus:border-danger focus:ring-2 focus:ring-danger/20 outline-none transition-all text-sm resize-none"></textarea>
              </div>

              {/* Upload Bằng chứng */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-bold text-zinc-900">Bằng chứng đính kèm (Ảnh / Video / Ghi âm)</label>
                
                {uploadedFiles.length > 0 && (
                  <div className="flex flex-col gap-2 mb-2">
                    {uploadedFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border border-zinc-200 rounded-lg bg-zinc-50">
                        <div className="flex items-center gap-3">
                          <File className="w-4 h-4 text-zinc-400" />
                          <div className="text-sm font-medium text-zinc-700">{f.name}</div>
                          <div className="text-xs text-zinc-400">({f.size})</div>
                        </div>
                        <button onClick={() => removeFile(i)} className="text-zinc-400 hover:text-danger p-1">
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {uploadedFiles.length < 3 && (
                  <button onClick={handleFileUpload} className="w-full h-24 border-2 border-dashed border-zinc-300 hover:border-danger hover:bg-danger-bg/50 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors group">
                    <div className="p-2 bg-zinc-100 group-hover:bg-danger/10 rounded-full text-zinc-400 group-hover:text-danger transition-colors">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-zinc-500 group-hover:text-danger">Nhấn để tải tệp lên (Tối đa 3 tệp)</span>
                  </button>
                )}
              </div>
              
            </div>
            <div className="p-5 border-t border-zinc-100 bg-zinc-50 flex items-center justify-end gap-3">
              <Button onClick={() => setIsModalOpen(false)} variant="outline" className="h-10 rounded-lg px-6 font-semibold bg-white">Huỷ bỏ</Button>
              <Button onClick={() => setIsModalOpen(false)} className="h-10 rounded-lg px-6 font-bold bg-danger hover:bg-danger-hover text-white shadow-sm border-0">Gửi Báo Cáo Vi Phạm</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}