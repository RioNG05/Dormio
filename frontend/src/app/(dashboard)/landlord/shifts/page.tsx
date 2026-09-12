"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Clock,
  Plus,
  Edit3,
  Trash2,
  Search,
  Loader2,
  X,
  Check,
  AlertTriangle,
  CheckCircle2,
  Sun,
  Moon,
  Sunrise,
  Layers,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { scheduleService, ShiftItem } from "@/services/schedule.service";

export default function ShiftsPage() {
  const { activeBuilding } = useAuth();
  const buildingId = activeBuilding?.id || "";

  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftItem | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);

  const [formName, setFormName] = useState("");
  const [formStart, setFormStart] = useState("08:00");
  const [formEnd, setFormEnd] = useState("17:00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchShifts = useCallback(async () => {
    if (!buildingId) return;
    setIsLoading(true);
    try {
      const res = await scheduleService.getShifts(buildingId);
      setShifts(res || []);
    } catch (err) {
      console.error("Failed to fetch shifts:", err);
      showToast("error", "Không thể tải danh sách ca mẫu.");
    } finally {
      setIsLoading(false);
    }
  }, [buildingId]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const resetForm = () => {
    setFormName("");
    setFormStart("08:00");
    setFormEnd("17:00");
    setFormError("");
    setIsDirty(false);
    setEditingShift(null);
  };

  const handleAttemptClose = () => {
    if (isDirty) {
      setIsConfirmCloseOpen(true);
    } else {
      setIsModalOpen(false);
      resetForm();
    }
  };

  const handleConfirmClose = () => {
    setIsConfirmCloseOpen(false);
    setIsModalOpen(false);
    resetForm();
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (shift: ShiftItem) => {
    setEditingShift(shift);
    setFormName(shift.name);
    setFormStart(shift.startTime);
    setFormEnd(shift.endTime);
    setFormError("");
    setIsDirty(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Tên ca làm việc không được để trống.");
      return;
    }
    if (formStart >= formEnd) {
      setFormError("Giờ bắt đầu phải trước giờ kết thúc.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");
    try {
      if (editingShift) {
        await scheduleService.updateShift(buildingId, editingShift.id, {
          name: formName.trim(),
          startTime: formStart,
          endTime: formEnd,
        });
        showToast("success", `Đã cập nhật ca mẫu "${formName.trim()}" thành công!`);
      } else {
        await scheduleService.createShift(buildingId, {
          name: formName.trim(),
          startTime: formStart,
          endTime: formEnd,
        });
        showToast("success", `Đã tạo ca mẫu "${formName.trim()}" thành công!`);
      }
      setIsModalOpen(false);
      resetForm();
      fetchShifts();
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message || err?.message || "Có lỗi xảy ra. Vui lòng thử lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (shift: ShiftItem) => {
    if (!confirm(`Xác nhận xóa ca mẫu "${shift.name}"? Thao tác này không thể hoàn tác.`)) return;
    try {
      await scheduleService.deleteShift(buildingId, shift.id);
      showToast("success", `Đã xóa ca mẫu "${shift.name}" thành công.`);
      fetchShifts();
    } catch (err: any) {
      showToast(
        "error",
        err?.response?.data?.message || "Không thể xóa ca đang có lịch làm việc liên kết."
      );
    }
  };

  const getShiftCategory = (startTime: string) => {
    const hour = parseInt(startTime.split(":")[0], 10);
    if (hour >= 5 && hour < 12) return { label: "Ca sáng", icon: Sunrise, color: "text-amber-600 bg-amber-50 border-amber-200" };
    if (hour >= 12 && hour < 18) return { label: "Ca chiều", icon: Sun, color: "text-blue-600 bg-blue-50 border-blue-200" };
    return { label: "Ca tối / đêm", icon: Moon, color: "text-purple-600 bg-purple-50 border-purple-200" };
  };

  const getDurationHours = (start: string, end: string) => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const totalMins = (eh * 60 + em) - (sh * 60 + sm);
    if (totalMins <= 0) return "—";
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return m > 0 ? `${h}h${m}m` : `${h}h`;
  };

  const filteredShifts = shifts.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[80] px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold animate-in slide-in-from-bottom-5 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#2AC1BC] uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>UC-L-21 · Quản lý nhân sự</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">
            Ca làm việc mẫu
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Quản lý các ca mẫu (sáng, chiều, tối) dùng để phân ca nhân viên tại{" "}
            <strong className="text-zinc-800">{activeBuilding?.name || "tòa nhà"}</strong>
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#2AC1BC] hover:bg-[#25aba6] rounded-xl shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Thêm ca mẫu mới
        </button>
      </div>

      <div className="bg-zinc-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-zinc-800">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <Layers className="w-64 h-64" />
        </div>
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex flex-col p-3.5 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Tổng ca mẫu</span>
            <span className="font-black text-white text-xl sm:text-2xl mt-1">{shifts.length}</span>
          </div>
          <div className="flex flex-col p-3.5 bg-amber-500/10 rounded-2xl border border-amber-500/30">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Ca sáng</span>
            <span className="font-black text-amber-400 text-xl sm:text-2xl mt-1">
              {shifts.filter((s) => { const h = parseInt(s.startTime.split(":")[0]); return h >= 5 && h < 12; }).length}
            </span>
          </div>
          <div className="flex flex-col p-3.5 bg-blue-500/10 rounded-2xl border border-blue-500/30">
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Ca chiều</span>
            <span className="font-black text-blue-400 text-xl sm:text-2xl mt-1">
              {shifts.filter((s) => { const h = parseInt(s.startTime.split(":")[0]); return h >= 12 && h < 18; }).length}
            </span>
          </div>
          <div className="flex flex-col p-3.5 bg-purple-500/10 rounded-2xl border border-purple-500/30">
            <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Ca tối / đêm</span>
            <span className="font-black text-purple-400 text-xl sm:text-2xl mt-1">
              {shifts.filter((s) => { const h = parseInt(s.startTime.split(":")[0]); return h < 5 || h >= 18; }).length}
            </span>
          </div>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Tìm kiếm ca mẫu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all"
        />
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-2 bg-white rounded-3xl border border-zinc-200">
          <Loader2 className="w-8 h-8 text-[#2AC1BC] animate-spin" />
          <p className="text-xs text-zinc-500 font-medium">Đang tải danh sách ca mẫu...</p>
        </div>
      ) : filteredShifts.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center">
            <Clock className="w-8 h-8" />
          </div>
          <div className="max-w-sm space-y-1">
            <h3 className="text-base font-extrabold text-zinc-900">
              {searchQuery ? "Không tìm thấy ca mẫu phù hợp" : "Chưa có ca mẫu nào"}
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {searchQuery
                ? "Thử thay đổi từ khóa tìm kiếm."
                : "Tạo ca sáng, ca chiều hoặc ca tối để bắt đầu phân ca cho nhân viên."}
            </p>
          </div>
          {!searchQuery && (
            <button
              onClick={openCreateModal}
              className="px-4 py-2 text-xs font-bold text-white bg-[#2AC1BC] hover:bg-[#25aba6] rounded-xl transition-all shadow-sm cursor-pointer"
            >
              + Thêm ca mẫu ngay
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredShifts.map((shift) => {
            const cat = getShiftCategory(shift.startTime);
            const CategoryIcon = cat.icon;
            const duration = getDurationHours(shift.startTime, shift.endTime);
            return (
              <div
                key={shift.id}
                className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${cat.color}`}>
                        <CategoryIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-zinc-900 text-base group-hover:text-[#2AC1BC] transition-colors line-clamp-1">
                          {shift.name}
                        </h3>
                        <span className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 text-[11px] font-bold rounded-full border ${cat.color}`}>
                          <CategoryIcon className="w-3 h-3" />
                          {cat.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 space-y-2.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-0.5">Bắt đầu</p>
                        <p className="text-lg font-black text-zinc-900">{shift.startTime}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-0.5">Kết thúc</p>
                        <p className="text-lg font-black text-zinc-900">{shift.endTime}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-xs">
                      <span className="text-zinc-500 font-medium">Thời lượng</span>
                      <span className="font-extrabold text-zinc-800">{duration}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-100">
                  <button
                    onClick={() => openEditModal(shift)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer flex-1 justify-center"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa
                  </button>
                  <button
                    onClick={() => handleDelete(shift)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer flex-1 justify-center border border-rose-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={handleAttemptClose}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-black text-zinc-900">
                  {editingShift ? "Chỉnh sửa ca mẫu" : "Thêm ca làm việc mới"}
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {editingShift ? "Cập nhật tên và khung giờ của ca mẫu" : "Định nghĩa tên và khung giờ làm việc"}
                </p>
              </div>
              <button
                onClick={handleAttemptClose}
                className="p-2 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Tên ca làm việc <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => { setFormName(e.target.value); setIsDirty(true); }}
                  placeholder="VD: Ca sáng, Ca chiều, Ca đêm bảo vệ..."
                  className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                    Giờ bắt đầu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formStart}
                    onChange={(e) => { setFormStart(e.target.value); setIsDirty(true); }}
                    className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                    Giờ kết thúc <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formEnd}
                    onChange={(e) => { setFormEnd(e.target.value); setIsDirty(true); }}
                    className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all"
                  />
                </div>
              </div>

              {formStart && formEnd && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[#2AC1BC]/5 border border-[#2AC1BC]/20 rounded-xl text-xs font-semibold text-[#2AC1BC]">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Thời lượng: <strong>{getDurationHours(formStart, formEnd)}</strong></span>
                </div>
              )}

              {formError && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleAttemptClose}
                  className="flex-1 py-2.5 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-white bg-[#2AC1BC] hover:bg-[#25aba6] disabled:opacity-60 rounded-xl transition-all shadow-sm shadow-[#2AC1BC]/20 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {editingShift ? "Lưu thay đổi" : "Tạo ca mẫu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isConfirmCloseOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-black text-zinc-900 mb-1">Xác nhận đóng form</h3>
            <p className="text-xs text-zinc-500 mb-5">
              Bạn có thay đổi chưa được lưu. Bạn có muốn hủy bỏ và đóng form không?
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setIsConfirmCloseOpen(false)}
                className="flex-1 py-2.5 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer"
              >
                Tiếp tục chỉnh sửa
              </button>
              <button
                onClick={handleConfirmClose}
                className="flex-1 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
              >
                Hủy thay đổi &amp; Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}