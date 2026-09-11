"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Calendar as CalendarIcon,
  X,
  Clock,
  AlertTriangle,
  UserCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { staffService, StaffItem } from "@/services/staff.service";

export default function SchedulePage() {
  const { activeBuilding } = useAuth();
  const buildingId = activeBuilding?.id || "";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);

  // Active staff data for assigning shifts
  const [activeStaffList, setActiveStaffList] = useState<StaffItem[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  // Form states
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedShift, setSelectedShift] = useState("sang");
  const [workDate, setWorkDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [taskNote, setTaskNote] = useState("");

  useEffect(() => {
    if (!buildingId) return;
    setIsLoadingStaff(true);
    staffService
      .getStaffList(buildingId, { status: "active", limit: 100 })
      .then((res) => {
        if (res?.success) {
          setActiveStaffList(res.data || []);
        }
      })
      .catch((err) => {
        console.error("Failed to load staff for schedule:", err);
      })
      .finally(() => {
        setIsLoadingStaff(false);
      });
  }, [buildingId]);

  const handleAttemptCloseModal = () => {
    if (isDirty) {
      setIsConfirmCloseOpen(true);
    } else {
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsDirty(false);
    setSelectedStaffId("");
    setSelectedShift("sang");
    setWorkDate(new Date().toISOString().split("T")[0]);
    setTaskNote("");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            Lịch làm việc
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Phân ca và xếp lịch làm việc cho nhân viên theo ngày và tuần (UC-L-21)
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#2AC1BC] rounded-xl hover:bg-[#25aba6] shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Phân ca mới
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-6 text-center text-zinc-500 py-20 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-[#2AC1BC]/10 rounded-2xl flex items-center justify-center mb-4 text-[#2AC1BC]">
          <CalendarIcon className="w-8 h-8" />
        </div>
        <h3 className="text-base font-extrabold text-zinc-900 mb-1">
          Chưa có lịch làm việc nào được phân
        </h3>
        <p className="max-w-md mx-auto mb-6 text-xs text-zinc-500 leading-relaxed">
          Bạn chưa xếp lịch làm việc cho nhân viên trong tuần này. Bấm vào nút bên dưới để bắt đầu phân ca.
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-xs font-bold text-[#2AC1BC] bg-[#2AC1BC]/10 rounded-xl hover:bg-[#2AC1BC]/20 transition-colors cursor-pointer"
        >
          Bắt đầu phân ca
        </button>
      </div>

      {/* Add Shift Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleAttemptCloseModal();
          }}
        >
          <div
            className="bg-white rounded-3xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] border border-zinc-100 animate-in zoom-in-95 duration-200"
            onInput={() => setIsDirty(true)}
            onChange={() => setIsDirty(true)}
          >
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-zinc-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-zinc-900">
                    Phân ca làm việc mới
                  </h2>
                  <p className="text-[11px] text-zinc-400 font-semibold">
                    Chỉ định nhân viên, ca làm việc và ngày trực
                  </p>
                </div>
              </div>
              <button
                onClick={handleAttemptCloseModal}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 flex items-center gap-1">
                  <span>Chọn nhân viên</span>
                  <span className="text-rose-500">*</span>
                </label>
                {isLoadingStaff ? (
                  <div className="flex items-center gap-2 text-xs text-zinc-500 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#2AC1BC]" />
                    <span>Đang tải danh sách nhân viên đang làm việc...</span>
                  </div>
                ) : activeStaffList.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Chưa có nhân viên đang làm việc. Vui lòng vào mục "Nhân viên" để thêm nhân viên trước.
                    </span>
                  </div>
                ) : (
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-colors bg-white cursor-pointer"
                  >
                    <option value="">-- Chọn nhân viên đang làm việc --</option>
                    {activeStaffList.map((s) => (
                      <option key={s.employeeId} value={s.employeeId}>
                        {s.fullName} — {s.positionName} ({s.phoneNumber})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-700 flex items-center gap-1">
                    <span>Ca làm việc</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedShift}
                    onChange={(e) => setSelectedShift(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-colors bg-white cursor-pointer"
                  >
                    <option value="sang">Ca sáng (06:00 - 14:00)</option>
                    <option value="chieu">Ca chiều (14:00 - 22:00)</option>
                    <option value="dem">Ca đêm (22:00 - 06:00)</option>
                    <option value="hanhchinh">Hành chính (08:00 - 17:00)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-700 flex items-center gap-1">
                    <span>Ngày làm việc</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={workDate}
                    onChange={(e) => setWorkDate(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-colors text-zinc-700 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700">
                  Ghi chú công việc cho ca trực
                </label>
                <textarea
                  rows={3}
                  value={taskNote}
                  onChange={(e) => setTaskNote(e.target.value)}
                  placeholder="Ví dụ: Cần kiểm tra khu vực nhà xe kỹ thuật, bàn giao chìa khóa phòng bảo vệ..."
                  className="w-full px-4 py-2.5 text-xs font-medium border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100 flex items-center justify-end gap-3 bg-zinc-50/60">
              <button
                onClick={handleAttemptCloseModal}
                className="px-5 py-2.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  alert("Tính năng xếp ca làm việc hoàn chỉnh sẽ có trong UC-L-21.");
                  handleCloseModal();
                }}
                className="px-5 py-2.5 text-xs font-bold text-white bg-[#2AC1BC] rounded-xl hover:bg-[#25aba6] shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer"
              >
                Xác nhận xếp ca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal (Rule #10) */}
      {isConfirmCloseOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsConfirmCloseOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-zinc-100 p-6 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-zinc-900">
                Xác nhận đóng form
              </h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Bạn có thông tin phân ca chưa lưu. Nếu đóng bây giờ, các thay đổi sẽ bị hủy bỏ.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmCloseOpen(false)}
                className="flex-1 py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Tiếp tục chỉnh sửa
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmCloseOpen(false);
                  handleCloseModal();
                }}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm shadow-rose-600/20"
              >
                Hủy thay đổi & Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
