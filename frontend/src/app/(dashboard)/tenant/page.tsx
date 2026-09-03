"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building,
  MapPin,
  Phone,
  User,
  Calendar,
  Zap,
  Droplets,
  Trash2,
  Wifi,
  Speaker,
  FileSignature,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Printer,
  X,
  AlertCircle,
  Bike,
  CreditCard,
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations, useLanguage } from "@/context/LanguageContext";
import { formatCurrency } from "@/utils";

export default function TenantOverviewPage() {
  const t = useTranslations("tenantPortal");
  const { locale } = useLanguage();

  // Mock Tenancy Data
  const roomInfo = {
    roomNumber: "101",
    buildingName: "Dormio Premier Quận 1",
    address: "123 Đường An Bình, Phường 4, Quận 5, TP.HCM",
    landlord: "Nguyễn Văn Rio",
    landlordIdCard: "079098001234",
    landlordBank: "Vietcombank - 0123456789 (NGUYEN VAN RIO)",
    tenantName: "Nguyễn Văn A",
    tenantIdCard: "079199005678",
    phone: "0901234567",
    phoneDisplay: "0901.234.567",
    hotline: "1900 8899",
    contractCode: "HĐ-AB-101-2026",
    contractStart: "01/01/2026",
    contractEnd: "31/12/2026",
    rentPrice: 4500000,
    deposit: 4500000,
    daysElapsed: 67,
    totalDays: 365,
    daysRemaining: 298,
    roomImage:
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
    amenities: [
      locale === "en" ? "Inverter AC" : "Máy lạnh Inverter",
      locale === "en" ? "180L Refrigerator" : "Tủ lạnh 180L",
      locale === "en" ? "Hot Water Shower" : "Bình nóng lạnh",
      locale === "en" ? "Private Balcony" : "Ban công thoáng mát",
      locale === "en" ? "Smart Fingerprint Lock" : "Khóa từ vân tay",
      locale === "en" ? "Kitchen Counter" : "Kệ bếp nấu ăn riêng",
    ],
  };

  // Mock Quick Invoice Widget
  const latestInvoice = {
    id: "INV-2026-07",
    period: locale === "en" ? "July 2026" : "Tháng 07/2026",
    amount: 4850000,
    dueDate: "05/08/2026",
    status: "unpaid",
  };

  const services = [
    {
      name: t("serviceElectricity"),
      price: "3.500 ₫ / kWh",
      type: locale === "en" ? "Metered reading" : "Theo chỉ số công tơ",
      icon: Zap,
      color: "text-amber-500",
      bg: "bg-amber-50 border-amber-100",
    },
    {
      name: t("serviceWater"),
      price: "20.000 ₫ / m³",
      type: locale === "en" ? "Metered reading" : "Theo đồng hồ nước",
      icon: Droplets,
      color: "text-sky-500",
      bg: "bg-sky-50 border-sky-100",
    },
    {
      name: t("serviceTrash"),
      price: `50.000 ₫ ${t("monthUnit")}`,
      type: locale === "en" ? "Fixed monthly" : "Cố định hàng tháng",
      icon: Trash2,
      color: "text-emerald-500",
      bg: "bg-emerald-50 border-emerald-100",
    },
    {
      name: t("serviceWifi"),
      price: `100.000 ₫ ${t("monthUnit")}`,
      type: locale === "en" ? "High-speed optical" : "Cố định tốc độ cao",
      icon: Wifi,
      color: "text-purple-500",
      bg: "bg-purple-50 border-purple-100",
    },
    {
      name: locale === "en" ? "Motorbike Parking" : "Giữ xe máy",
      price: `100.000 ₫ ${t("monthUnit")}`,
      type: locale === "en" ? "Per registered bike" : "Theo đầu xe đăng ký",
      icon: Bike,
      color: "text-teal-500",
      bg: "bg-teal-50 border-teal-100",
    },
  ];

  // Announcements List (Bilingual content & tags)
  const allAnnouncements = [
    {
      id: 1,
      title:
        locale === "en"
          ? "Scheduled Power Outage Notice for Maintenance"
          : "Thông báo lịch cắt điện bảo trì lưới điện",
      date: "16/07/2026",
      tag: locale === "en" ? "Urgent" : "Khẩn",
      color: "bg-rose-100 text-rose-700 border-rose-200",
      content:
        locale === "en"
          ? "District 5 Power Company announces grid maintenance from 08:00 - 11:30 AM this Sunday. Elevator will operate on backup generator."
          : "Điện lực Quận 5 thông báo bảo trì lưới điện từ 08:00 - 11:30 sáng Chủ nhật này. Thang máy sẽ chạy máy phát điện dự phòng.",
      isNew: true,
    },
    {
      id: 2,
      title:
        locale === "en"
          ? "Monthly Routine Pest Control & Disinfection"
          : "Lịch phun khử trùng & diệt côn trùng định kỳ",
      date: "12/07/2026",
      tag: locale === "en" ? "Building" : "Tòa nhà",
      color: "bg-teal-100 text-teal-700 border-teal-200",
      content:
        locale === "en"
          ? "Scheduled pest control for common hallways and bike basement at 02:00 PM Saturday. Please keep windows and room doors closed."
          : "Ban quản lý sẽ tiến hành phun thuốc diệt muỗi khu vực hành lang và hầm xe vào 14:00 thứ Bảy. Quý khách vui lòng đóng cửa sổ.",
      isNew: true,
    },
    {
      id: 3,
      title:
        locale === "en"
          ? "Utility Meter Reading Window Opens (July 2026)"
          : "Mở cổng chụp ảnh chốt chỉ số điện nước T7/2026",
      date: "10/07/2026",
      tag: locale === "en" ? "Billing" : "Hóa đơn",
      color: "bg-amber-100 text-amber-700 border-amber-200",
      content:
        locale === "en"
          ? "Please take a clear photo of your room's electric and water meters via the Invoices tab before July 12 to generate accurate billing."
          : "Vui lòng chụp ảnh đồng hồ điện nước phòng mình tại tab Hóa đơn trước ngày 12/07 để hệ thống tính toán chi phí chính xác.",
      isNew: false,
    },
    {
      id: 4,
      title:
        locale === "en"
          ? "Reminder: Fire Safety & Quiet Hours Regulations"
          : "Nhắc nhở nội quy phòng cháy chữa cháy & giờ giấc",
      date: "05/07/2026",
      tag: locale === "en" ? "Rules" : "Nội quy",
      color: "bg-purple-100 text-purple-700 border-purple-200",
      content:
        locale === "en"
          ? "Please do not block hallway fire exits and observe quiet hours strictly from 11:00 PM to 06:00 AM."
          : "Vui lòng không để vật dụng cản trở lối thoát hiểm hành lang và giữ yên tĩnh chung sau 23:00 đêm.",
      isNew: false,
    },
    {
      id: 5,
      title:
        locale === "en"
          ? "Water Tank Cleaning & Filter Replacement"
          : "Vệ sinh bể nước ngầm & thay mới lõi lọc thô",
      date: "28/06/2026",
      tag: locale === "en" ? "Maintenance" : "Bảo trì",
      color: "bg-blue-100 text-blue-700 border-blue-200",
      content:
        locale === "en"
          ? "Annual rooftop and underground water reservoir deep clean completed successfully. Water quality tested safe."
          : "Đã hoàn thành thau rửa bể nước và thay mới toàn bộ lõi lọc thô. Nguồn nước sinh hoạt đảm bảo tiêu chuẩn an toàn.",
      isNew: false,
    },
    {
      id: 6,
      title:
        locale === "en"
          ? "Vehicle Parking Sticker Inspection"
          : "Kiểm tra thẻ xe ra vào hầm giữ xe",
      date: "20/06/2026",
      tag: locale === "en" ? "Security" : "An ninh",
      color: "bg-zinc-100 text-zinc-700 border-zinc-200",
      content:
        locale === "en"
          ? "Security team is issuing RFID cards to replace paper cards. Please contact guard desk to swap your card."
          : "Đội bảo vệ đang cấp phát thẻ từ RFID thay thế vé giấy cũ. Khách thuê vui lòng liên hệ bàn trực để đổi thẻ.",
      isNew: false,
    },
    {
      id: 7,
      title:
        locale === "en"
          ? "Quarterly Air Conditioner Maintenance Schedule"
          : "Lịch bảo trì và vệ sinh máy lạnh các phòng",
      date: "15/06/2026",
      tag: locale === "en" ? "Maintenance" : "Bảo trì",
      color: "bg-blue-100 text-blue-700 border-blue-200",
      content:
        locale === "en"
          ? "Free quarterly AC cleaning service. Technicians will visit on June 18. Please register your preferred time slot."
          : "Bảo dưỡng vệ sinh lưới lọc máy lạnh miễn phí ngày 18/06. Vui lòng đăng ký khung giờ thuận tiện với ban quản lý.",
      isNew: false,
    },
    {
      id: 8,
      title:
        locale === "en"
          ? "Temporary Residence Declaration Update"
          : "Cập nhật thông tin đăng ký tạm trú định kỳ",
      date: "01/06/2026",
      tag: locale === "en" ? "Legal" : "Pháp lý",
      color: "bg-emerald-100 text-emerald-700 border-emerald-200",
      content:
        locale === "en"
          ? "Management is submitting residence reports to local Ward Police. If you recently renewed your ID, please notify us."
          : "Ban quản lý nộp danh sách tạm trú tháng mới tới Công an Phường. Khách thuê mới đổi CCCD vui lòng cập nhật lại.",
      isNew: false,
    },
  ];

  // Pagination (4 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const totalPages = Math.ceil(allAnnouncements.length / itemsPerPage);
  const currentAnnouncements = allAnnouncements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // States
  const [isContractOpen, setIsContractOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [copiedBank, setCopiedBank] = useState(false);

  const handleCopyBank = () => {
    navigator.clipboard.writeText(roomInfo.landlordBank);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-12 animate-in fade-in duration-300 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t("roomStatusActive")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            {t("title")}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => setIsContractOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs sm:text-sm font-bold shadow-xs cursor-pointer transition-all"
          >
            <FileSignature className="w-4 h-4 text-[#2AC1BC]" />
            <span>{t("viewContract")}</span>
          </Button>

          <Link href="/tenant/messages">
            <Button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2AC1BC] hover:bg-[#23a8a3] text-white text-xs sm:text-sm font-bold shadow-sm shadow-[#2AC1BC]/20 cursor-pointer transition-all">
              <MessageCircle className="w-4 h-4" />
              <span>{t("chatWithLandlord")}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Billing Alert Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-white border border-orange-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#FF6B35] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#FF6B35]/30">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-900">
                {t("currentInvoiceReady")}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase">
                {t("unpaid")}
              </span>
            </div>
            <div className="text-sm sm:text-base font-black text-zinc-900 mt-0.5">
              {latestInvoice.period} &bull; {formatCurrency(latestInvoice.amount, locale)}
              <span className="text-xs font-normal text-zinc-500 ml-2">
                ({t("dueDate")}: {latestInvoice.dueDate})
              </span>
            </div>
          </div>
        </div>

        <Link href="/tenant/invoices" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#e85a26] text-white text-xs font-bold shadow-xs cursor-pointer transition-all">
            <span>{t("payNow")}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Hero Room Details Card */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white shadow-xs overflow-hidden">
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-zinc-100 bg-gradient-to-r from-zinc-50/80 via-white to-teal-50/20">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-zinc-200 shrink-0 shadow-xs">
                  <img
                    src={roomInfo.roomImage}
                    alt={roomInfo.roomNumber}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
                      {t("roomNumber")} {roomInfo.roomNumber}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] text-[11px] font-extrabold uppercase">
                      Studio
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-zinc-500 flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>
                      {roomInfo.buildingName} &bull; {roomInfo.address}
                    </span>
                  </div>
                </div>
              </div>

              <div className="sm:text-right bg-teal-50/60 sm:bg-transparent p-4 sm:p-0 rounded-2xl w-full sm:w-auto border border-teal-100 sm:border-0">
                <div className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider">
                  {t("rentPrice")}
                </div>
                <div className="text-2xl font-black text-[#2AC1BC] mt-0.5">
                  {formatCurrency(roomInfo.rentPrice, locale)}
                  <span className="text-xs font-normal text-zinc-400">
                    {" "}
                    {t("monthUnit")}
                  </span>
                </div>
              </div>
            </div>

            {/* Room Lease Progress Bar */}
            <div className="px-6 sm:px-8 py-4 bg-zinc-50/70 border-b border-zinc-100 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-zinc-600 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#2AC1BC]" />
                  {t("contractDuration")}: {roomInfo.contractStart} &ndash;{" "}
                  {roomInfo.contractEnd}
                </span>
                <span className="text-emerald-700">
                  {t("daysRemaining", { days: roomInfo.daysRemaining })}
                </span>
              </div>
              <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#2AC1BC] h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round(
                      (roomInfo.daysElapsed / roomInfo.totalDays) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Room Details Grid */}
            <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white">
              {/* Landlord Contact */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-400">
                      {t("landlord")}
                    </div>
                    <div className="text-sm font-bold text-zinc-900 mt-0.5">
                      {roomInfo.landlord}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-400">
                      {t("phone")}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <a
                        href={`tel:${roomInfo.phone}`}
                        className="text-sm font-bold text-[#2AC1BC] hover:underline"
                      >
                        {roomInfo.phoneDisplay}
                      </a>
                      <button
                        onClick={handleCopyBank}
                        className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                        title={t("stkLabel")}
                      >
                        {copiedBank ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedBank ? t("copied") : t("stkLabel")}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deposit & Escrow */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-400">
                      {t("deposit")}
                    </div>
                    <div className="text-sm font-bold text-zinc-900 mt-0.5">
                      {formatCurrency(roomInfo.deposit, locale)}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {t("escrowProtected")}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertCircle className="w-4 h-4 text-[#2AC1BC]" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-400">
                      {t("hotlineSupport")}
                    </div>
                    <div className="text-sm font-bold text-zinc-900 mt-0.5">
                      {roomInfo.hotline}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Room Amenities Chips */}
            <div className="p-6 sm:p-8 pt-0 bg-white border-t border-zinc-100/80">
              <div className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3">
                {t("roomAmenitiesTitle")}
              </div>
              <div className="flex flex-wrap gap-2">
                {roomInfo.amenities.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs font-semibold text-zinc-700 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2AC1BC]" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Card: Services & Utility Rates */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-zinc-900 tracking-tight">
                  {t("servicesTitle")}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {t("servicesSubtitle")}
                </p>
              </div>
              <span className="text-xs font-bold text-[#2AC1BC] bg-[#2AC1BC]/10 px-3 py-1 rounded-full">
                {t("activeServices", { count: 5 })}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((svc, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-100 bg-zinc-50/50 hover:bg-white hover:border-zinc-200/80 hover:shadow-xs transition-all duration-200"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${svc.bg} ${svc.color} shrink-0 border`}
                  >
                    <svc.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-zinc-900 truncate">
                      {svc.name}
                    </div>
                    <div className="text-xs font-extrabold text-zinc-700 mt-0.5">
                      {svc.price}
                    </div>
                    <div className="text-[11px] font-medium text-zinc-400 mt-0.5">
                      {svc.type}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Announcements (Compact, 4 per page) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="rounded-3xl border border-zinc-200/80 bg-white shadow-xs flex flex-col h-fit">
            <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 rounded-t-3xl">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-[#2AC1BC]/10 text-[#2AC1BC]">
                  <Speaker className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-black text-zinc-900">
                  {t("announcementsTitle")}
                </h3>
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-zinc-500 bg-white px-2.5 py-0.5 rounded-full border border-zinc-200">
                {t("noticesCount", { count: allAnnouncements.length })}
              </span>
            </div>

            {/* List of 4 announcements */}
            <div className="p-4 space-y-2.5">
              {currentAnnouncements.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedNotice(item)}
                  className="p-3 rounded-2xl bg-zinc-50/70 border border-zinc-100 hover:border-[#2AC1BC]/50 hover:bg-white hover:shadow-xs transition-all cursor-pointer space-y-1.5 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.date}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider border ${item.color}`}
                    >
                      {item.tag}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900 leading-snug group-hover:text-[#2AC1BC] transition-colors line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-zinc-500 leading-relaxed line-clamp-1">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>

            {/* Pagination Controls - 4 items per page */}
            <div className="px-4 py-2.5 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/50 rounded-b-3xl">
              <div className="text-[11px] font-semibold text-zinc-400">
                {locale === "en"
                  ? `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
                      currentPage * itemsPerPage,
                      allAnnouncements.length
                    )} of ${allAnnouncements.length}`
                  : `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
                      currentPage * itemsPerPage,
                      allAnnouncements.length
                    )} trên ${allAnnouncements.length}`}
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0 rounded-lg text-zinc-500 hover:text-zinc-900 cursor-pointer disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === i + 1
                        ? "bg-[#2AC1BC] text-white shadow-xs"
                        : "text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0 rounded-lg text-zinc-500 hover:text-zinc-900 cursor-pointer disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: View Full Notice Detail */}
      {selectedNotice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedNotice(null);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-zinc-200 p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-4">
              <div>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border mb-2 ${selectedNotice.color}`}
                >
                  {selectedNotice.tag}
                </span>
                <h3 className="text-base font-bold text-zinc-900 leading-snug">
                  {selectedNotice.title}
                </h3>
                <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> {selectedNotice.date} &bull;{" "}
                  {t("sentByManagement")}
                </div>
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs sm:text-sm text-zinc-600 leading-relaxed pt-2">
              {selectedNotice.content}
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                onClick={() => setSelectedNotice(null)}
                className="px-5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold cursor-pointer"
              >
                {t("btnClose")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Electronic Tenancy Agreement */}
      {isContractOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsContractOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-zinc-200">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center shrink-0">
                  <FileSignature className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-zinc-900">
                    {t("contractModalTitle")}
                  </h3>
                  <div className="text-xs font-semibold text-zinc-400">
                    {t("contractCode")}:{" "}
                    <span className="text-zinc-700 font-bold">
                      {roomInfo.contractCode}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsContractOpen(false)}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs sm:text-sm text-zinc-700 custom-scrollbar leading-relaxed">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-black text-emerald-800 text-xs sm:text-sm">
                      {t("digitallySignedBadge")}
                    </div>
                    <div className="text-[11px] text-emerald-600 font-medium">
                      {t("signedAt")}: {roomInfo.contractStart} 08:30 GMT+7
                      &bull; SHA-256: 9f8a...4b12
                    </div>
                  </div>
                </div>
                <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-emerald-200/60 text-emerald-900 text-[10px] font-black uppercase">
                  Verified
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                <div className="space-y-1.5">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
                    {t("partyA")}
                  </div>
                  <div className="font-bold text-zinc-900">
                    {roomInfo.landlord}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {t("idCard")}: {roomInfo.landlordIdCard}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {t("phone")}: {roomInfo.phoneDisplay}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
                    {t("partyB")}
                  </div>
                  <div className="font-bold text-zinc-900">
                    {roomInfo.tenantName}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {t("idCard")}: {roomInfo.tenantIdCard}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {t("phone")}: 0987.654.321
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 border-b border-zinc-100 pb-2">
                  {t("termsTitle")}
                </h4>
                <div className="space-y-2 text-xs text-zinc-600">
                  <p className="flex items-start gap-2">
                    <span className="font-bold text-[#2AC1BC]">1.</span>
                    <span>{t("term1")}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="font-bold text-[#2AC1BC]">2.</span>
                    <span>{t("term2")}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="font-bold text-[#2AC1BC]">3.</span>
                    <span>{t("term3")}</span>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <tbody className="divide-y divide-zinc-200">
                    <tr className="bg-zinc-50/50">
                      <td className="px-4 py-2.5 font-bold text-zinc-500">
                        {t("rentPrice")}
                      </td>
                      <td className="px-4 py-2.5 font-black text-[#2AC1BC]">
                        {formatCurrency(roomInfo.rentPrice, locale)}{" "}
                        {t("monthUnit")}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-bold text-zinc-500">
                        {t("deposit")}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-zinc-900">
                        {formatCurrency(roomInfo.deposit, locale)}
                      </td>
                    </tr>
                    <tr className="bg-zinc-50/50">
                      <td className="px-4 py-2.5 font-bold text-zinc-500">
                        {t("contractDuration")}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-zinc-900">
                        {roomInfo.contractStart} &ndash; {roomInfo.contractEnd}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-zinc-100 flex items-center justify-between gap-3 bg-zinc-50/50">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl cursor-pointer transition-colors shadow-2xs"
              >
                <Printer className="w-4 h-4" />
                <span>{t("btnPrintContract")}</span>
              </button>

              <button
                onClick={() => setIsContractOpen(false)}
                className="px-5 py-2 text-xs font-bold text-white bg-[#2AC1BC] hover:bg-[#23a8a3] rounded-xl cursor-pointer transition-all shadow-sm shadow-[#2AC1BC]/20"
              >
                {t("btnClose")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
