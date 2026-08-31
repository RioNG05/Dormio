"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  ShieldAlert,
  UploadCloud,
  Trash,
  Eye,
  Search,
  Filter,
  AlertCircle,
  HelpCircle,
  Image as ImageIcon,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  grievanceService,
  Grievance,
  GrievancePriority,
} from "@/services/grievance.service";

export default function TenantAdminComplaintsPage() {
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<Grievance[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(
    null,
  );
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Create form state
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<GrievancePriority>("medium");
  const [description, setDescription] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Check if form has unsaved modifications
  const isFormDirty =
    title.trim() !== "" ||
    description.trim() !== "" ||
    uploadedImages.length > 0 ||
    priority !== "medium";

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const data = await grievanceService.getTenantGrievances();
        if (!isMounted) return;
        setComplaints(data);
      } catch (err: unknown) {
        console.warn("Could not load complaints from backend, using fallback:", err);
        if (!isMounted) return;
        // Fallback demo state for tenant
        setComplaints([
          {
            id: "REP-001",
            title: "Chủ trọ tự ý tăng tiền điện sai thoả thuận",
            description:
              "Chủ nhà trọ thông báo tăng giá điện từ 3.500đ lên 5.000đ/kWh mà không có sự đồng ý của người thuê phòng theo hợp đồng đã ký.",
            priority: "high",
            status: "resolved",
            boardingHouseName: "Dormio Tân Bình",
            roomNumber: "101",
            resolutionNote: "Ban Quản Trị đã làm việc và nhắc nhở chủ nhà trọ. Chủ trọ cam kết giữ nguyên mức 3.500đ/kWh theo hợp đồng.",
            resolvedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
            resolvedByName: "Nguyễn Quang Huy (BQT)",
            images: [
              {
                id: "img-demo-1",
                url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80",
                createdAt: new Date().toISOString(),
              },
            ],
            createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
          },
          {
            id: "REP-002",
            title: "Cửa khóa vân tay tầng trệt bị hỏng nhiều ngày",
            description:
              "Hệ thống khóa vân tay cổng chính bị chập mạch, cửa mở tự do khiến an ninh không đảm bảo.",
            priority: "medium",
            status: "in_progress",
            boardingHouseName: "Dormio Tân Bình",
            roomNumber: "101",
            resolutionNote: "Kỹ thuật viên đang đặt linh kiện thay thế bo mạch khóa.",
            resolvedAt: null,
            resolvedByName: null,
            images: [],
            createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
          },
        ]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const resetForm = () => {
    setTitle("");
    setPriority("medium");
    setDescription("");
    setUploadedImages([]);
    setFormError(null);
    setShowExitConfirm(false);
  };

  const handleCloseModal = () => {
    if (isFormDirty) {
      setShowExitConfirm(true);
    } else {
      setIsModalOpen(false);
      resetForm();
    }
  };

  // Compress image before adding to upload list
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const image = new window.Image();
        image.onload = () => {
          const maxDim = 1280;
          let { width, height } = image;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(image, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.82));
          } else {
            resolve(readerEvent.target?.result as string);
          }
        };
        image.onerror = () => resolve(readerEvent.target?.result as string);
        image.src = readerEvent.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedImages.length + files.length > 5) {
      setFormError("Chỉ được đính kèm tối đa 5 ảnh bằng chứng.");
      return;
    }

    const compressedList: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const base64 = await compressImageFile(files[i]);
      compressedList.push(base64);
    }

    setUploadedImages((prev) => [...prev, ...compressedList].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError("Vui lòng nhập tiêu đề khiếu nại.");
      return;
    }
    if (description.trim().length < 10) {
      setFormError("Mô tả chi tiết phải có ít nhất 10 ký tự.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const newGrievance = await grievanceService.createGrievance({
        title: title.trim(),
        description: description.trim(),
        priority,
        imageUrls: uploadedImages,
      });

      setComplaints((prev) => [newGrievance, ...prev]);
      setIsModalOpen(false);
      resetForm();
    } catch (err: unknown) {
      console.warn("API create error, adding to local state for demo:", err);
      const mockItem: Grievance = {
        id: `REP-${Math.floor(100 + Math.random() * 900)}`,
        title: title.trim(),
        description: description.trim(),
        priority,
        status: "pending",
        boardingHouseName: "Dormio Tân Bình",
        roomNumber: "101",
        resolutionNote: null,
        resolvedAt: null,
        resolvedByName: null,
        images: uploadedImages.map((url, i) => ({
          id: `img-${i}`,
          url,
          createdAt: new Date().toISOString(),
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setComplaints((prev) => [mockItem, ...prev]);
      setIsModalOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã giải quyết
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
            <ShieldAlert className="w-3.5 h-3.5" /> Đang xử lý
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
            <X className="w-3.5 h-3.5" /> Từ chối
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" /> Chờ tiếp nhận
          </span>
        );
    }
  };

  const getPriorityBadge = (p: GrievancePriority) => {
    switch (p) {
      case "high":
        return (
          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-black uppercase">
            Khẩn cấp
          </span>
        );
      case "medium":
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold uppercase">
            Trung bình
          </span>
        );
      case "low":
      default:
        return (
          <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200 text-[11px] font-bold uppercase">
            Thấp
          </span>
        );
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  // Filter complaints list
  const filteredComplaints = complaints.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Summary counts
  const pendingCount = complaints.filter((c) => c.status === "pending").length;
  const inProgressCount = complaints.filter(
    (c) => c.status === "in_progress",
  ).length;
  const resolvedCount = complaints.filter(
    (c) => c.status === "resolved",
  ).length;

  return (
    <div className="flex flex-col gap-8 pb-16 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-rose-500" />
            Khiếu nại & Tố cáo
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Kênh phản ánh trực tiếp tới <strong>Ban Quản Trị Hệ Thống</strong>{" "}
            về các hành vi sai phạm, vi phạm hợp đồng hoặc chất lượng dịch vụ
            của nhà trọ.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white gap-2 rounded-xl shadow-md h-11 px-6 font-bold shrink-0 cursor-pointer"
        >
          <AlertTriangle className="w-4 h-4" />
          Gửi khiếu nại mới
        </Button>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tổng số đơn
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {complaints.length}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs">
          <div className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Chờ tiếp nhận
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {pendingCount}
          </div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-2xs">
          <div className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
            Đang xử lý
          </div>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {inProgressCount}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Đã giải quyết
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {resolvedCount}
          </div>
        </div>
      </div>

      {/* Main Complaints Table Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
        {/* Table Filters Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-slate-700" />
            <h2 className="text-base font-black text-slate-900">
              Lịch sử khiếu nại của bạn
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm nội dung..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 w-full sm:w-56"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ tiếp nhận</option>
                <option value="in_progress">Đang xử lý</option>
                <option value="resolved">Đã giải quyết</option>
                <option value="rejected">Từ chối</option>
              </select>
            </div>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
              <span className="text-xs font-semibold">Đang tải khiếu nại...</span>
            </div>
          ) : filteredComplaints.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Mã đơn</th>
                  <th className="px-5 py-3.5">Nội dung khiếu nại</th>
                  <th className="px-5 py-3.5">Mức độ</th>
                  <th className="px-5 py-3.5">Bằng chứng</th>
                  <th className="px-5 py-3.5">Trạng thái BQT</th>
                  <th className="px-5 py-3.5">Ngày gửi</th>
                  <th className="px-5 py-3.5 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredComplaints.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedGrievance(item)}
                    className="hover:bg-rose-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                        #{item.id.slice(0, 8).toUpperCase()}
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        P.{item.roomNumber}
                      </span>
                    </td>

                    <td className="px-5 py-4 max-w-xs">
                      <div
                        className="font-bold text-slate-900 truncate"
                        title={item.title}
                      >
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {item.description}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {getPriorityBadge(item.priority)}
                    </td>

                    <td className="px-5 py-4">
                      {item.images && item.images.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                          <ImageIcon className="w-3 h-3" />
                          {item.images.length} ảnh
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Không có</span>
                      )}
                    </td>

                    <td className="px-5 py-4">{getStatusBadge(item.status)}</td>

                    <td className="px-5 py-4 text-slate-500">
                      {formatDate(item.createdAt)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Xem
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <HelpCircle className="w-8 h-8 text-slate-300" />
              <p className="text-sm font-medium">
                Chưa có đơn khiếu nại nào phù hợp.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Lập Đơn Tố Cáo / Khiếu Nại Mới */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8 border border-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-rose-50 to-orange-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    Lập Đơn Khiếu Nại / Tố Cáo
                  </h2>
                  <p className="text-xs font-medium text-slate-500">
                    Gửi trực tiếp lên Ban Quản Trị hệ thống Dormio
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitGrievance} className="p-6 flex flex-col gap-5">
              {/* Notice Banner */}
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Quy định bảo vệ:</strong> Mọi tố cáo gửi lên hệ thống đều
                  được mã hóa và tiếp nhận bởi Ban Quản Trị độc lập. Vui lòng cung
                  cấp thông tin trung thực và bằng chứng đi kèm.
                </div>
              </div>

              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Tiêu đề khiếu nại <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Chủ trọ tự ý tăng tiền điện sai thỏa thuận hợp đồng"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none text-xs font-medium"
                />
              </div>

              {/* Priority */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Mức độ ưu tiên / Tính cấp thiết
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPriority("low")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      priority === "low"
                        ? "border-slate-800 bg-slate-900 text-white shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Thấp (Thắc mắc chung)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority("medium")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      priority === "medium"
                        ? "border-amber-600 bg-amber-500 text-white shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Trung bình (Vi phạm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority("high")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      priority === "high"
                        ? "border-rose-600 bg-rose-600 text-white shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Khẩn cấp (Lừa đảo, đe dọa)
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Mô tả chi tiết sự việc <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Hãy kể lại chi tiết vấn đề bạn gặp phải, thời gian, địa điểm, nội dung trao đổi với chủ trọ..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none text-xs font-medium resize-none"
                />
              </div>

              {/* Upload Evidence Images */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Ảnh bằng chứng đính kèm (Tin nhắn, Hóa đơn, Biên lai)</span>
                  <span className="text-slate-400 text-[11px] font-normal">
                    {uploadedImages.length}/5 ảnh
                  </span>
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-1">
                    {uploadedImages.map((imgUrl, i) => (
                      <div
                        key={i}
                        className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-900"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imgUrl}
                          alt="Bằng chứng"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeUploadedImage(i)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-90 hover:opacity-100 shadow-sm"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {uploadedImages.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-20 border-2 border-dashed border-slate-300 hover:border-rose-500 hover:bg-rose-50/40 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer group"
                  >
                    <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
                    <span className="text-xs font-bold text-slate-500 group-hover:text-rose-600">
                      Tải ảnh lên từ thiết bị (Tối đa 5 ảnh)
                    </span>
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  className="h-10 rounded-xl px-5 font-bold text-xs cursor-pointer"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 rounded-xl px-6 font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-md cursor-pointer"
                >
                  {isSubmitting ? "Đang gửi..." : "Gửi Báo Cáo Vi Phạm"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal when Closing Dirty Form */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Xác nhận đóng form?
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Các nội dung và hình ảnh bạn vừa nhập sẽ bị hủy bỏ nếu đóng ngay
                bây giờ.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 rounded-xl h-10 text-xs font-bold"
              >
                Tiếp tục chỉnh sửa
              </Button>
              <Button
                onClick={() => {
                  setShowExitConfirm(false);
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-10 text-xs font-bold"
              >
                Hủy thay đổi & Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Grievance Detail Drawer / Modal */}
      {selectedGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8 border border-slate-100">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">
                    Mã đơn: #{selectedGrievance.id.slice(0, 8).toUpperCase()}
                  </span>
                  {getPriorityBadge(selectedGrievance.priority)}
                  {getStatusBadge(selectedGrievance.status)}
                </div>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {selectedGrievance.title}
                </h3>
              </div>

              <button
                onClick={() => setSelectedGrievance(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col gap-6 text-xs text-slate-700">
              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">
                    Nhà trọ / Phòng
                  </span>
                  <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-primary" />
                    {selectedGrievance.boardingHouseName} - P.
                    {selectedGrievance.roomNumber}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">
                    Thời điểm gửi
                  </span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {formatDate(selectedGrievance.createdAt)}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                  Nội dung chi tiết khiếu nại
                </h4>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedGrievance.description}
                </div>
              </div>

              {/* Attached Evidence Images */}
              {selectedGrievance.images &&
                selectedGrievance.images.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                      Ảnh bằng chứng đính kèm
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {selectedGrievance.images.map((img) => (
                        <div
                          key={img.id}
                          onClick={() => setPreviewImage(img.url)}
                          className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-900 cursor-pointer"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.url}
                            alt="Bằng chứng"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Eye className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Admin Resolution / Feedback section */}
              <div className="rounded-2xl border p-4 bg-slate-50 border-slate-200">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-primary" />
                  Kết quả xử lý từ Ban Quản Trị Hệ Thống
                </h4>

                {selectedGrievance.resolutionNote ? (
                  <div className="space-y-2 mt-2">
                    <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-emerald-900 leading-relaxed">
                      {selectedGrievance.resolutionNote}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>
                        Xử lý bởi:{" "}
                        <strong className="text-slate-700">
                          {selectedGrievance.resolvedByName || "Ban Quản Trị"}
                        </strong>
                      </span>
                      <span>
                        Ngày xử lý: {formatDate(selectedGrievance.resolvedAt)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-500 italic text-center">
                    Đơn khiếu nại đang trong hàng đợi xác minh của Ban Quản Trị.
                    Kết quả sẽ được phản hồi tại đây ngay khi hoàn tất.
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <Button
                onClick={() => setSelectedGrievance(null)}
                className="h-9 px-6 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Preview */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-70 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage}
              alt="Bằng chứng"
              className="w-full h-full object-contain max-h-[85vh]"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}