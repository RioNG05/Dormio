"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  User, Phone, Mail, MapPin, ShieldCheck, Camera, CheckCircle2, Lock, 
  Building, Calendar, CreditCard, Sparkles, Save, Edit3, KeyRound, QrCode, 
  ExternalLink, Eye, EyeOff, UserCheck, AlertCircle, Building2, Home, X, Upload, 
  FileText, Download, Check, AlertTriangle, RefreshCw
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatVND } from "@/utils";

export default function UniversalProfilePage() {
  const { isLoggedIn, user } = useAuth();

  const [activeTab, setActiveTab] = useState<"info" | "role_data" | "bank" | "security">("info");
  
  // Tab 1 Edit Mode
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [infoSavedSuccess, setInfoSavedSuccess] = useState(false);

  // Tab 3 Edit Mode
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankSavedSuccess, setBankSavedSuccess] = useState(false);

  // Personal Info Form States
  const [fullName, setFullName] = useState(user?.name || "Nguyễn Văn A");
  const [phone, setPhone] = useState(user?.phone || "0987.654.321");
  const [email, setEmail] = useState(user?.email || "nguyenvana@gmail.com");
  const [dob, setDob] = useState("15/08/2002");
  const [gender, setGender] = useState("Nam");
  const [identityCard, setIdentityCard] = useState("079202012345");
  const [idIssueDate, setIdIssueDate] = useState("12/04/2023");
  const [idIssuePlace, setIdIssuePlace] = useState("Cục QLHC về trật tự xã hội");
  const [address, setAddress] = useState("123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. HCM");
  const [cccdEdited, setCccdEdited] = useState(false);

  // Emergency Contact
  const [emergencyName, setEmergencyName] = useState("Nguyễn Văn B (Người thân)");
  const [emergencyPhone, setEmergencyPhone] = useState("0912.345.678");

  // Bank Info for VietQR
  const [bankName, setBankName] = useState("TPBank (Ngân hàng Tiên Phong)");
  const [bankAccount, setBankAccount] = useState("0987654321");
  const [bankAccountName, setBankAccountName] = useState((user?.name || "NGUYEN VAN A").toUpperCase());

  // Password States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSavedSuccess, setPasswordSavedSuccess] = useState(false);

  // Forgot Password Flow States
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);

  const isLandlord = user?.role === "landlord";
  const isAdmin = user?.role === "admin";
  const isTenant = !isLandlord && !isAdmin;

  // Save Personal Info
  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingInfo(false);
    setInfoSavedSuccess(true);
    setTimeout(() => setInfoSavedSuccess(false), 3000);
  };

  // Save Bank Info
  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingBank(false);
    setBankSavedSuccess(true);
    setTimeout(() => setBankSavedSuccess(false), 3000);
  };

  // Save Password
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Mật khẩu mới và xác nhận mật khẩu không trùng khớp!");
      return;
    }
    setPasswordSavedSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordSavedSuccess(false), 3000);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center shadow-inner">
          <Lock className="w-10 h-10" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl font-black text-zinc-900">Yêu Cầu Đăng Nhập</h2>
          <p className="text-xs text-zinc-500 font-medium leading-relaxed">
            Bạn cần đăng nhập tài khoản Dormio để xem và quản lý thông tin hồ sơ cá nhân.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/login" className="px-6 py-3 bg-[#2AC1BC] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#2AC1BC]/20 whitespace-nowrap">
            Đăng nhập ngay &rarr;
          </Link>
          <Link href="/register" className="px-6 py-3 bg-zinc-900 text-white font-extrabold text-xs rounded-2xl whitespace-nowrap">
            Tạo tài khoản mới
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 py-6 sm:py-10 px-3 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Top Profile Banner Hero Spotlight */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 rounded-3xl p-5 sm:p-8 text-white shadow-2xl border border-zinc-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#2AC1BC]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 text-center md:text-left">
            
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Avatar Image with Edit Badge */}
              <div className="relative group shrink-0">
                <img
                  src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"}
                  alt={fullName}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-2 border-[#2AC1BC] shadow-xl group-hover:opacity-90 transition-opacity"
                />
                <button 
                  title="Thay đổi ảnh đại diện"
                  className="absolute bottom-1 right-1 p-2 bg-[#2AC1BC] hover:bg-[#23B3AE] text-white rounded-xl shadow-lg transition-transform hover:scale-110 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="px-3 py-1 bg-[#2AC1BC]/20 text-[#2AC1BC] text-[10px] font-black rounded-full border border-[#2AC1BC]/30 uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
                    <ShieldCheck className="w-3.5 h-3.5" /> eKYC ĐÃ XÁC THỰC
                  </span>

                  <span className={`px-3 py-1 text-[10px] font-black rounded-full border uppercase tracking-wider whitespace-nowrap ${
                    isLandlord ? 'bg-[#FF6B35]/20 text-[#FF6B35] border-[#FF6B35]/30' :
                    isAdmin ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                    'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                    {isLandlord && "🏠 CHỦ NHÀ TRỌ"}
                    {isTenant && "👤 KHÁCH THUÊ PHÒNG"}
                    {isAdmin && "👑 QUẢN TRỊ VIÊN HỆ THỐNG"}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white">{fullName}</h1>
                <p className="text-xs text-zinc-400 font-medium">Tài khoản chính chủ xác thực trên hệ thống Dormio</p>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 pt-1 text-xs text-zinc-300 font-semibold">
                  <span className="flex items-center gap-1.5 whitespace-nowrap"><Phone className="w-3.5 h-3.5 text-[#2AC1BC]" /> {phone}</span>
                  <span className="hidden sm:inline text-zinc-600">•</span>
                  <span className="flex items-center gap-1.5 whitespace-nowrap"><Mail className="w-3.5 h-3.5 text-[#2AC1BC]" /> {email}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 100% Mobile & Desktop Responsive Tab Navigation Bar (Balanced 2-Line Phrases on Mobile, Single Line on Desktop) */}
        <div className="w-full border-b border-zinc-200 pb-3">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap lg:flex-nowrap items-stretch sm:items-center gap-2 w-full">
            
            {/* Tab 1 */}
            <button
              onClick={() => setActiveTab("info")}
              className={`w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-2.5 rounded-2xl font-extrabold text-[11px] sm:text-xs transition-all cursor-pointer inline-flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-center sm:text-left leading-tight ${
                activeTab === "info"
                  ? "bg-[#2AC1BC] text-white shadow-md shadow-[#2AC1BC]/20"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>
                <span className="block sm:inline">Thông tin cá nhân </span>
                <span className="block sm:inline">& eKYC</span>
              </span>
            </button>

            {/* Tab 2 */}
            <button
              onClick={() => setActiveTab("role_data")}
              className={`w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-2.5 rounded-2xl font-extrabold text-[11px] sm:text-xs transition-all cursor-pointer inline-flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-center sm:text-left leading-tight ${
                activeTab === "role_data"
                  ? "bg-[#2AC1BC] text-white shadow-md shadow-[#2AC1BC]/20"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {isLandlord ? <Building2 className="w-4 h-4 shrink-0" /> : <Building className="w-4 h-4 shrink-0" />}
              <span>
                {isLandlord ? (
                  <>
                    <span className="block sm:inline">Thông tin Nhà Trọ </span>
                    <span className="block sm:inline">& Dashboard</span>
                  </>
                ) : (
                  <>
                    <span className="block sm:inline">Phòng thuê & </span>
                    <span className="block sm:inline">Hợp đồng</span>
                  </>
                )}
              </span>
            </button>

            {/* Tab 3 */}
            <button
              onClick={() => setActiveTab("bank")}
              className={`w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-2.5 rounded-2xl font-extrabold text-[11px] sm:text-xs transition-all cursor-pointer inline-flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-center sm:text-left leading-tight ${
                activeTab === "bank"
                  ? "bg-[#2AC1BC] text-white shadow-md shadow-[#2AC1BC]/20"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>
                <span className="block sm:inline">Tài khoản </span>
                <span className="block sm:inline">Ngân hàng VietQR</span>
              </span>
            </button>

            {/* Tab 4 */}
            <button
              onClick={() => setActiveTab("security")}
              className={`w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-2.5 rounded-2xl font-extrabold text-[11px] sm:text-xs transition-all cursor-pointer inline-flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-center sm:text-left leading-tight ${
                activeTab === "security"
                  ? "bg-[#2AC1BC] text-white shadow-md shadow-[#2AC1BC]/20"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <Lock className="w-4 h-4 shrink-0" />
              <span>
                <span className="block sm:inline">Bảo mật & </span>
                <span className="block sm:inline">Đổi mật khẩu</span>
              </span>
            </button>

          </div>
        </div>

        {/* TAB 1: THÔNG TIN CÁ NHÂN & EKYC CCCD */}
        {activeTab === "info" && (
          <form onSubmit={handleSaveInfo} className="space-y-6 animate-in fade-in duration-300">
            
            {/* Success Toast Banner */}
            {infoSavedSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Cập nhật thông tin cá nhân & eKYC thành công!</span>
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl p-5 sm:p-8 border border-zinc-200/80 shadow-sm space-y-6">
              
              {/* Card Header with Edit Buttons (NO TEXT WRAPPING) */}
              <div className="border-b border-zinc-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-zinc-900">Thông Tin Định Danh Cá Nhân</h3>
                  <p className="text-xs text-zinc-500 font-medium">Dữ liệu cá nhân chính chủ sử dụng giao dịch & hợp đồng điện tử trên Dormio.</p>
                </div>

                {/* EDIT BUTTONS INSIDE TAB 1 (whitespace-nowrap) */}
                {!isEditingInfo ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingInfo(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2AC1BC] hover:bg-[#23B3AE] text-white font-extrabold text-xs rounded-2xl shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer hover:scale-105 whitespace-nowrap shrink-0"
                  >
                    <Edit3 className="w-4 h-4 shrink-0" />
                    <span>Chỉnh Sửa Thông Tin</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setIsEditingInfo(false)}
                      className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <X className="w-4 h-4 shrink-0" /> Hủy
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#2AC1BC] hover:bg-[#23B3AE] text-white font-extrabold text-xs rounded-xl shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 hover:scale-105 whitespace-nowrap shrink-0"
                    >
                      <Save className="w-4 h-4 shrink-0" /> Lưu Thay Đổi
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">Họ và tên đầy đủ *</label>
                  <input
                    type="text"
                    disabled={!isEditingInfo}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] disabled:opacity-75"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">Số điện thoại liên hệ *</label>
                  <input
                    type="text"
                    disabled={!isEditingInfo}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] disabled:opacity-75"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">Email cá nhân *</label>
                  <input
                    type="email"
                    disabled={!isEditingInfo}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] disabled:opacity-75"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">Ngày sinh</label>
                  <input
                    type="text"
                    disabled={!isEditingInfo}
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] disabled:opacity-75"
                  />
                </div>

              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">Địa chỉ thường trú (theo CCCD)</label>
                <input
                  type="text"
                  disabled={!isEditingInfo}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] disabled:opacity-75"
                />
              </div>
            </div>

            {/* Editable eKYC CCCD Card Box */}
            <div className="bg-white rounded-3xl p-5 sm:p-8 border border-zinc-200/80 shadow-sm space-y-5">
              <div className="border-b border-zinc-100 pb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-[#2AC1BC] shrink-0" />
                  <h3 className="text-base font-black text-zinc-900">Xác Thực Căn Cước Công Dân (eKYC AI)</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase whitespace-nowrap ${
                  cccdEdited 
                    ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30' 
                    : 'bg-[#2AC1BC]/10 text-[#2AC1BC] border border-[#2AC1BC]/30'
                }`}>
                  {cccdEdited ? "⚠️ Chờ Xác Thực Lại" : "✓ AI Verified"}
                </span>
              </div>

              {/* Warning when editing CCCD */}
              {isEditingInfo && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Lưu ý: Mọi chỉnh sửa số CCCD hoặc ảnh mặt trước/sau sẽ yêu cầu xác thực eKYC lại qua hệ thống AI.</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">SỐ CCCD / MÃ ĐỊNH DANH *</label>
                  <input
                    type="text"
                    disabled={!isEditingInfo}
                    value={identityCard}
                    onChange={(e) => {
                      setIdentityCard(e.target.value);
                      setCccdEdited(true);
                    }}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-black text-zinc-900 font-mono focus:outline-none focus:border-[#2AC1BC] disabled:opacity-80"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">NGÀY CẤP *</label>
                  <input
                    type="text"
                    disabled={!isEditingInfo}
                    value={idIssueDate}
                    onChange={(e) => {
                      setIdIssueDate(e.target.value);
                      setCccdEdited(true);
                    }}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] disabled:opacity-80"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">NƠI CẤP *</label>
                  <input
                    type="text"
                    disabled={!isEditingInfo}
                    value={idIssuePlace}
                    onChange={(e) => {
                      setIdIssuePlace(e.target.value);
                      setCccdEdited(true);
                    }}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] disabled:opacity-80"
                  />
                </div>
              </div>

              {/* Front and Back Upload Simulation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-2 text-center">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-zinc-700">Mặt trước CCCD</span>
                    {isEditingInfo && (
                      <span className="text-[10px] font-bold text-[#2AC1BC] cursor-pointer hover:underline flex items-center gap-1 whitespace-nowrap">
                        <Upload className="w-3 h-3 shrink-0" /> Tải ảnh mới
                      </span>
                    )}
                  </div>
                  <div className="aspect-[16/10] bg-zinc-200 rounded-xl overflow-hidden relative group border border-zinc-300">
                    <img
                      src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80"
                      alt="CCCD mặt trước"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded-md whitespace-nowrap">Đã khớp khuôn mặt</span>
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-2 text-center">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-zinc-700">Mặt sau CCCD</span>
                    {isEditingInfo && (
                      <span className="text-[10px] font-bold text-[#2AC1BC] cursor-pointer hover:underline flex items-center gap-1 whitespace-nowrap">
                        <Upload className="w-3 h-3 shrink-0" /> Tải ảnh mới
                      </span>
                    )}
                  </div>
                  <div className="aspect-[16/10] bg-zinc-200 rounded-xl overflow-hidden relative group border border-zinc-300">
                    <img
                      src="https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80"
                      alt="CCCD mặt sau"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded-md whitespace-nowrap">Vân tay hợp lệ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Emergency Contact */}
            <div className="bg-white rounded-3xl p-5 sm:p-8 border border-zinc-200/80 shadow-sm space-y-5">
              <div className="border-b border-zinc-100 pb-3">
                <h3 className="text-base font-black text-zinc-900">Liên Hệ Người Thân Khẩn Cấp</h3>
                <p className="text-xs text-zinc-500 font-medium">Thông tin liên lạc khi phát sinh các tình huống bất khả kháng.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">Họ tên người thân khẩn cấp *</label>
                  <input
                    type="text"
                    disabled={!isEditingInfo}
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] disabled:opacity-75"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">Số điện thoại người thân *</label>
                  <input
                    type="text"
                    disabled={!isEditingInfo}
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] disabled:opacity-75"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Save Action Button when Editing */}
            {isEditingInfo && (
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingInfo(false)}
                  className="w-full sm:w-auto px-6 py-3.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-extrabold text-xs rounded-2xl transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  Hủy Thao Tác
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#2AC1BC] hover:bg-[#23B3AE] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#2AC1BC]/25 inline-flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-105 whitespace-nowrap shrink-0"
                >
                  <Save className="w-4 h-4 shrink-0" />
                  <span>Lưu Thay Đổi Hồ Sơ &rarr;</span>
                </button>
              </div>
            )}

          </form>
        )}

        {/* TAB 2: PHÒNG THUÊ & HỢP ĐỒNG (NO TEXT WRAPPING ON BUTTONS) */}
        {activeTab === "role_data" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {isLandlord ? (
              <div className="bg-white rounded-3xl p-5 sm:p-8 border border-zinc-200/80 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#FF6B35]/10 text-[#FF6B35] flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-zinc-900">{user?.houseName || "Dormio Premier Quận 1"}</h3>
                      <p className="text-xs text-zinc-500 font-medium">{user?.houseAddress || "123 Nguyễn Huệ, Bến Nghé, Quận 1, TP. HCM"}</p>
                    </div>
                  </div>

                  <Link href="/landlord" className="w-full sm:w-auto">
                    <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#FF6B35] hover:bg-[#ff5518] text-white font-extrabold text-xs rounded-2xl transition-all shadow-md shadow-[#FF6B35]/20 hover:scale-105 whitespace-nowrap shrink-0">
                      <Building2 className="w-4 h-4 shrink-0" />
                      <span>Mở Dashboard Quản Lý Chủ Trọ &rarr;</span>
                    </button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block">SỐ LƯỢNG PHÒNG ĐANG QUẢN LÝ</span>
                    <span className="text-lg font-black text-zinc-900 block">10 Phòng</span>
                  </div>

                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block">DOANH THU THÁNG NÀY</span>
                    <span className="text-lg font-black text-[#2AC1BC] block">45.000.000đ</span>
                  </div>

                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block">GÓI ĐĂNG KÝ HỆ THỐNG</span>
                    <span className="text-xs font-black text-emerald-600 block uppercase">Chủ Trọ Chuyên Nghiệp (Pro Tier)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-5 sm:p-8 border border-zinc-200/80 shadow-sm space-y-6">
                
                {/* Header CTA to Jump to Tenant Dashboard */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-5 gap-4">
                  <div className="space-y-1.5">
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 rounded-full text-xs font-black whitespace-nowrap inline-block">
                      ✓ Đang Thuê Hoạt Động
                    </span>

                    {/* Room Name with clear vertical spacing */}
                    <h3 className="text-2xl font-black text-zinc-900 pt-1">
                      Phòng 302 - Trọ Cao Cấp An Bình
                    </h3>

                    {/* Clickable Address with Google Maps Integration */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <a
                        href="https://maps.google.com/?q=123+Nguyên+Huệ+Bến+Nghé+Quận+1+TP.HCM"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-[#2AC1BC] hover:text-[#23B3AE] hover:underline inline-flex items-center gap-1.5 bg-[#2AC1BC]/10 px-3 py-1.5 rounded-xl border border-[#2AC1BC]/20 transition-all"
                      >
                        <MapPin className="w-4 h-4 text-[#2AC1BC] shrink-0" />
                        <span>123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. HCM</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#2AC1BC] ml-1 shrink-0" />
                      </a>
                    </div>
                  </div>

                  {/* Direct Jump Button to Tenant Dashboard (whitespace-nowrap) */}
                  <Link href="/tenant" className="w-full sm:w-auto">
                    <button className="w-full sm:w-auto px-6 py-3.5 bg-[#2AC1BC] hover:bg-[#23B3AE] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#2AC1BC]/25 inline-flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-105 whitespace-nowrap shrink-0">
                      <Home className="w-4 h-4 shrink-0" />
                      <span>Dashboard Quản Lý Phòng Trọ &rarr;</span>
                    </button>
                  </Link>
                </div>

                {/* Lease Details Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block">GIÁ THUÊ HÀNG THÁNG</span>
                    <span className="text-xl font-black text-rose-500 block">4.500.000đ/tháng</span>
                  </div>

                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block">TIỀN CỌC ĐÃ ĐẶT (ESCROW)</span>
                    <span className="text-xl font-black text-[#2AC1BC] block">1.000.000đ</span>
                    <span className="text-[9px] text-emerald-600 font-bold block">✓ Bảo vệ qua cổng Dormio Escrow</span>
                  </div>

                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block">THỜI HẠN HỢP ĐỒNG</span>
                    <span className="text-sm font-black text-zinc-900 block">01/01/2026 - 31/12/2026</span>
                    <span className="text-[9px] text-zinc-500 font-bold block">Thời gian ở: 8/12 tháng (66%)</span>
                  </div>
                </div>

                {/* Lease Progress Bar */}
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-2">
                  <div className="flex flex-col sm:flex-row justify-between text-xs font-bold text-zinc-700 gap-1">
                    <span>Tiến độ hợp đồng ở thực tế</span>
                    <span>66% (Còn 4 tháng)</span>
                  </div>
                  <div className="w-full h-3 bg-zinc-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#2AC1BC] rounded-full" style={{ width: "66%" }} />
                  </div>
                </div>

                {/* Landlord Contact & Contract Export */}
                <div className="p-5 sm:p-6 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 text-white rounded-3xl space-y-4 shadow-xl border border-zinc-800">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-black text-white">Chủ Trọ Quản Lý Tòa Nhà</h4>
                      <p className="text-xs text-zinc-400 font-medium">Chủ trọ: Nguyễn Văn Rio • SĐT: 0901.234.567</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <a 
                        href="tel:0901234567" 
                        className="px-4 py-2.5 bg-[#FF6B35] hover:bg-[#ff5518] text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-[#FF6B35]/20 inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>Gọi Chủ Trọ</span>
                      </a>

                      <button
                        onClick={() => alert("Đang tải file hợp đồng điện tử PDF...")}
                        className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-extrabold text-xs rounded-xl transition-all border border-zinc-700 inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#2AC1BC] shrink-0" />
                        <span>Tải Hợp Đồng PDF</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* TAB 3: NGÂN HÀNG VIETQR (NO TEXT WRAPPING ON BUTTONS) */}
        {activeTab === "bank" && (
          <form onSubmit={handleSaveBank} className="space-y-6 animate-in fade-in duration-300">
            
            {/* Success Toast */}
            {bankSavedSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Cập nhật tài khoản ngân hàng VietQR thành công!</span>
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl p-5 sm:p-8 border border-zinc-200/80 shadow-sm space-y-6">
              
              <div className="border-b border-zinc-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-zinc-900">Tài Khoản Ngân Hàng VietQR Nhận Giao Dịch</h3>
                  <p className="text-xs text-zinc-500 font-medium">Hệ thống VietQR kết nối trực tiếp tài khoản này để thu tiền nhà hoặc hoàn tiền cọc tự động.</p>
                </div>

                {/* EDIT BUTTONS INSIDE TAB 3 (whitespace-nowrap) */}
                {!isEditingBank ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingBank(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2AC1BC] hover:bg-[#23B3AE] text-white font-extrabold text-xs rounded-2xl shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer hover:scale-105 whitespace-nowrap shrink-0"
                  >
                    <Edit3 className="w-4 h-4 shrink-0" />
                    <span>Chỉnh Sửa Ngân Hàng</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setIsEditingBank(false)}
                      className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <X className="w-4 h-4 shrink-0" /> Hủy
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#2AC1BC] hover:bg-[#23B3AE] text-white font-extrabold text-xs rounded-xl shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 hover:scale-105 whitespace-nowrap shrink-0"
                    >
                      <Save className="w-4 h-4 shrink-0" /> Lưu Tài Khoản VietQR
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700">Tên ngân hàng *</label>
                    <input
                      type="text"
                      disabled={!isEditingBank}
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] disabled:opacity-75"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700">Số tài khoản *</label>
                    <input
                      type="text"
                      disabled={!isEditingBank}
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] disabled:opacity-75"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700">Chủ tài khoản (Không dấu) *</label>
                    <input
                      type="text"
                      disabled={!isEditingBank}
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] disabled:opacity-75 uppercase"
                    />
                  </div>
                </div>

                {/* Live VietQR Card Preview */}
                <div className="p-6 bg-gradient-to-br from-zinc-900 to-zinc-950 text-white rounded-3xl border border-zinc-800 space-y-4 text-center shadow-xl relative overflow-hidden w-full">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#2AC1BC]/10 rounded-full blur-xl" />
                  <QrCode className="w-16 h-16 text-[#2AC1BC] mx-auto relative z-10 animate-pulse" />
                  <div className="relative z-10">
                    <h4 className="text-sm font-black text-white">{bankName || "Tên ngân hàng"}</h4>
                    <p className="text-lg font-black text-[#2AC1BC] font-mono tracking-widest mt-1">{bankAccount || "0000000000"}</p>
                    <p className="text-xs text-zinc-400 uppercase font-bold mt-1">{bankAccountName || "CHỦ TÀI KHOẢN"}</p>
                  </div>
                  <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-full border border-emerald-500/30 relative z-10 whitespace-nowrap">
                    ✓ Thẻ VietQR Khởi Tạo Tự Động
                  </span>
                </div>
              </div>

            </div>

            {/* Bottom Save Action Button when Editing Bank */}
            {isEditingBank && (
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingBank(false)}
                  className="w-full sm:w-auto px-6 py-3.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-extrabold text-xs rounded-2xl transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  Hủy Thao Tác
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#2AC1BC] hover:bg-[#23B3AE] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#2AC1BC]/25 inline-flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-105 whitespace-nowrap shrink-0"
                >
                  <Save className="w-4 h-4 shrink-0" />
                  <span>Lưu Tài Khoản VietQR &rarr;</span>
                </button>
              </div>
            )}

          </form>
        )}

        {/* TAB 4: BẢO MẬT & ĐỔI MẬT KHẨU (FULL WIDTH, NO TEXT WRAPPING) */}
        {activeTab === "security" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Password Toast Success */}
            {passwordSavedSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Đổi mật khẩu tài khoản thành công!</span>
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl p-5 sm:p-8 border border-zinc-200/80 shadow-sm space-y-6 w-full">
              
              <div className="border-b border-zinc-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-zinc-900">Đổi Mật Khẩu Đăng Nhập</h3>
                  <p className="text-xs text-zinc-500 font-medium">Bảo vệ tài khoản với mật khẩu tối thiểu 6 ký tự.</p>
                </div>
                
                {/* Forgot Password Trigger Button (whitespace-nowrap) */}
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(!isForgotPasswordOpen)}
                  className="text-xs font-extrabold text-[#2AC1BC] hover:underline cursor-pointer inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <KeyRound className="w-3.5 h-3.5 shrink-0" />
                  <span>Quên mật khẩu?</span>
                </button>
              </div>

              {/* Forgot Password Recovery Accordion Panel */}
              {isForgotPasswordOpen && (
                <div className="p-5 bg-zinc-900 text-white rounded-2xl space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-[#2AC1BC] shrink-0" />
                      <h4 className="text-xs font-black text-white">Khôi Phục Mật Khẩu Qua Mã OTP</h4>
                    </div>
                    <button
                      onClick={() => setIsForgotPasswordOpen(false)}
                      className="p-1 text-zinc-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {!otpSent ? (
                    <div className="space-y-3">
                      <p className="text-xs text-zinc-300 font-medium">Mã OTP xác thực sẽ được gửi tới số điện thoại/email đăng ký: <strong className="text-[#2AC1BC]">{phone}</strong></p>
                      <button
                        type="button"
                        onClick={() => setOtpSent(true)}
                        className="px-5 py-2.5 bg-[#2AC1BC] hover:bg-[#23B3AE] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        <span>Gửi Mã OTP Xác Thực 6 Chữ Số</span>
                        <span>&rarr;</span>
                      </button>
                    </div>
                  ) : !otpVerified ? (
                    <div className="space-y-3">
                      <p className="text-xs text-emerald-400 font-bold">✓ Mã OTP đã được gửi tới {phone}. Vui lòng nhập mã 6 chữ số:</p>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="123456"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          className="px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-black tracking-widest text-center text-white focus:outline-none focus:border-[#2AC1BC]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (otpCode.length === 6) {
                              setOtpVerified(true);
                            } else {
                              alert("Vui lòng nhập đủ 6 chữ số OTP (Ví dụ: 123456)");
                            }
                          }}
                          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Xác Nhận OTP
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-between">
                      <span>✓ OTP Xác thực thành công! Hãy nhập mật khẩu mới phía dưới.</span>
                      <button
                        onClick={() => {
                          setIsForgotPasswordOpen(false);
                          setOtpSent(false);
                          setOtpVerified(false);
                        }}
                        className="underline text-white text-[10px] whitespace-nowrap ml-2"
                      >
                        Đóng
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Password Change Form */}
              <form onSubmit={handleSavePassword} className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">Mật khẩu hiện tại *</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">Mật khẩu mới *</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex-1 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            newPassword.length > 8 ? "bg-emerald-500 w-full" : "bg-amber-500 w-1/2"
                          }`} 
                        />
                      </div>
                      <span className="text-[10px] font-extrabold text-zinc-500 whitespace-nowrap">
                        {newPassword.length > 8 ? "Độ bảo mật: Mạnh ✓" : "Độ bảo mật: Trung bình"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">Xác nhận mật khẩu mới *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#2AC1BC] hover:bg-[#23B3AE] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#2AC1BC]/25 inline-flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01] whitespace-nowrap"
                  >
                    <span>Cập Nhật Mật Khẩu Mới</span>
                    <span>&rarr;</span>
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}