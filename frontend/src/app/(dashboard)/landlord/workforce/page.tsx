"use client";

import React, { useState } from "react";
import {
  Plus,
  Search,
  UserCircle,
  MoreHorizontal,
  X,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";
import { useTranslations, useLanguage } from "@/context/LanguageContext";

export default function WorkforcePage() {
  const t = useTranslations("workforce");
  const { locale } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const handleCloseModal = () => {
    if (isDirty) {
      setShowConfirmClose(true);
    } else {
      setIsModalOpen(false);
    }
  };

  const staff = [
    {
      id: "NV-001",
      name: "Trần Bảo Vệ",
      role: t("roleGuard"),
      phone: "0911222333",
      building: locale === "en" ? "Building A" : "Tòa A",
      status: t("activeStaff"),
    },
    {
      id: "NV-002",
      name: "Lê Quản Lý",
      role: t("roleManager"),
      phone: "0922333444",
      building: locale === "en" ? "All Buildings" : "Tất cả",
      status: t("activeStaff"),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{t("title")}</h1>
          <p className="text-sm text-zinc-500">{t("subtitle")}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#FF6B35] rounded-lg hover:bg-[#ff5518] shadow-sm shadow-[#FF6B35]/20 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" /> {t("addStaff")}
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 bg-zinc-50 border-b border-zinc-200 uppercase">
              <tr>
                <th className="px-6 py-3 font-medium">{t("colName")}</th>
                <th className="px-6 py-3 font-medium">{t("colRole")}</th>
                <th className="px-6 py-3 font-medium">{t("colPhone")}</th>
                <th className="px-6 py-3 font-medium">
                  {locale === "en" ? "Assigned Building" : "Phụ trách"}
                </th>
                <th className="px-6 py-3 font-medium">{t("colStatus")}</th>
                <th className="px-6 py-3 font-medium text-right">
                  {t("colActions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#FF6B35]/10 flex items-center justify-center text-[#FF6B35]">
                        <UserCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-zinc-900">{s.name}</div>
                        <div className="text-xs text-zinc-500">{s.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-[#2AC1BC]">
                    {s.role}
                  </td>
                  <td className="px-6 py-4 text-zinc-600">{s.phone}</td>
                  <td className="px-6 py-4 text-zinc-600">{s.building}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700 border border-green-200">
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1 text-zinc-400 hover:text-[#FF6B35] cursor-pointer transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Confirmation Modal for Form Close */}
      {showConfirmClose && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base text-zinc-900">
                {t("confirmCloseTitle")}
              </h3>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              {t("confirmCloseMessage")}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmClose(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl cursor-pointer"
              >
                {t("btnContinueEditing")}
              </button>
              <button
                onClick={() => {
                  setShowConfirmClose(false);
                  setIsModalOpen(false);
                  setIsDirty(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer"
              >
                {t("btnDiscardAndClose")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
            onInput={() => setIsDirty(true)}
            onChange={() => setIsDirty(true)}
          >
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#FF6B35]/10 text-[#FF6B35] rounded-lg">
                  <UserCircle className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900">
                  {locale === "en" ? "Add New Staff Member" : "Thêm nhân viên mới"}
                </h2>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">
                    {t("colName")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">
                    {t("colPhone")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="09xxxxxxxxx"
                    className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">
                    {t("colRole")}
                  </label>
                  <select className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-colors bg-white">
                    <option value="quanly">{t("roleManager")}</option>
                    <option value="baove">{t("roleGuard")}</option>
                    <option value="vesinh">{t("roleJanitor")}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">
                    {locale === "en" ? "Assigned Building" : "Phụ trách tòa nhà"}
                  </label>
                  <select className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-colors bg-white">
                    <option value="tatca">
                      {locale === "en" ? "All Buildings" : "Tất cả"}
                    </option>
                    <option value="toaa">Tòa A</option>
                    <option value="toab">Tòa B</option>
                  </select>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3 text-orange-800 text-sm">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold">
                    {locale === "en" ? "Access Permissions" : "Quyền truy cập"}
                  </p>
                  <p className="mt-1 opacity-90 text-xs">
                    {locale === "en"
                      ? "This account can log in to the Staff Mobile App. Initial credentials will be dispatched via SMS."
                      : "Tài khoản này sẽ có thể đăng nhập vào ứng dụng dành cho nhân viên (Staff App). Mật khẩu mặc định sẽ được gửi qua SMS."}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100 flex items-center justify-end gap-3 bg-zinc-50/50">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 cursor-pointer transition-colors"
              >
                {t("btnDiscardAndClose")}
              </button>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setIsDirty(false);
                }}
                className="px-6 py-2.5 text-sm font-bold text-white bg-[#FF6B35] hover:bg-[#ff5518] rounded-xl shadow-sm shadow-[#FF6B35]/20 cursor-pointer transition-all"
              >
                {locale === "en" ? "Save Staff" : "Lưu nhân viên"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
