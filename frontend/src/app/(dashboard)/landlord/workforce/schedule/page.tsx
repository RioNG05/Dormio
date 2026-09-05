"use client";
import React, { useState } from "react";
import { Plus, Calendar as CalendarIcon, X, Clock, AlertTriangle } from "lucide-react";
import { useTranslations, useLanguage } from "@/context/LanguageContext";

export default function SchedulePage() {
  const t = useTranslations("workforce");
  const { locale } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Form State
  const initialFormState = {
    staffId: "",
    shift: "sang",
    date: "",
    notes: ""
  };
  const [formState, setFormState] = useState(initialFormState);

  const resetForm = () => {
    setFormState(initialFormState);
    setIsDirty(false);
  };

  const handleRequestClose = () => {
    if (isDirty) {
      setShowConfirmClose(true);
    } else {
      setIsModalOpen(false);
      resetForm();
    }
  };

  const handleConfirmDiscard = () => {
    setShowConfirmClose(false);
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsModalOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{t("scheduleTitle")}</h1>
          <p className="text-sm text-zinc-500">{t("scheduleSubtitle")}</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#FF6B35] rounded-lg hover:bg-[#ff5518] shadow-sm shadow-[#FF6B35]/20 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" /> {t("newShiftBtn")}
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6 text-center text-zinc-500 py-20 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
          <CalendarIcon className="w-8 h-8 text-zinc-300" />
        </div>
        <h3 className="text-lg font-bold text-zinc-900 mb-2">{t("noScheduleTitle")}</h3>
        <p className="max-w-md mx-auto mb-6">{t("noScheduleDesc")}</p>
        <button 
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="px-4 py-2 text-sm font-bold text-[#FF6B35] bg-[#FF6B35]/10 rounded-lg hover:bg-[#FF6B35]/20 cursor-pointer transition-colors"
        >
          {t("startAssignShift")}
        </button>
      </div>

      {/* Add Shift Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleRequestClose();
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#FF6B35]/10 text-[#FF6B35] rounded-lg">
                  <Clock className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900">{t("modalShiftTitle")}</h2>
              </div>
              <button 
                onClick={handleRequestClose}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">{t("selectStaffLabel")} <span className="text-red-500">*</span></label>
                  <select 
                    value={formState.staffId}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormState((prev) => ({ ...prev, staffId: e.target.value }));
                    }}
                    required
                    className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-colors bg-white cursor-pointer"
                  >
                    <option value="">{t("selectStaffPlaceholder")}</option>
                    <option value="nv1">{locale === "en" ? "Tran Bao Ve - Security Guard" : "Trần Bảo Vệ - Bảo vệ"}</option>
                    <option value="nv2">{locale === "en" ? "Le Quan Ly - Building Manager" : "Lê Quản Lý - Quản lý"}</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">{t("shiftLabel")} <span className="text-red-500">*</span></label>
                    <select 
                      value={formState.shift}
                      onChange={(e) => {
                        setIsDirty(true);
                        setFormState((prev) => ({ ...prev, shift: e.target.value }));
                      }}
                      className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-colors bg-white cursor-pointer"
                    >
                      <option value="sang">{t("shiftMorning")}</option>
                      <option value="chieu">{t("shiftAfternoon")}</option>
                      <option value="dem">{t("shiftNight")}</option>
                      <option value="hanhchinh">{t("shiftAdmin")}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">{t("workDateLabel")} <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      value={formState.date}
                      onChange={(e) => {
                        setIsDirty(true);
                        setFormState((prev) => ({ ...prev, date: e.target.value }));
                      }}
                      required
                      className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-colors text-zinc-700 cursor-pointer" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">{t("taskNoteLabel")}</label>
                  <textarea 
                    rows={3} 
                    value={formState.notes}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormState((prev) => ({ ...prev, notes: e.target.value }));
                    }}
                    placeholder={t("taskNotePlaceholder")} 
                    className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-colors resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="p-6 border-t border-zinc-100 flex items-center justify-end gap-3 bg-zinc-50/50">
                <button 
                  type="button"
                  onClick={handleRequestClose}
                  className="px-6 py-2.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 cursor-pointer transition-colors"
                >
                  {t("cancelBtn")}
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 text-sm font-bold text-white bg-[#FF6B35] hover:bg-[#ff5518] rounded-xl shadow-sm shadow-[#FF6B35]/20 cursor-pointer transition-all"
                >
                  {t("confirmShiftBtn")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pop-up Confirmation Modal (Rule #10) */}
      {showConfirmClose && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4 animate-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-black text-zinc-900">{t("confirmCloseTitle")}</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">{t("confirmCloseMessage")}</p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmClose(false)}
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                {t("btnContinueEditing")}
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                {t("btnDiscardAndClose")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
