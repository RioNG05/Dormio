"use client";

import React, { useState } from "react";
import {
  Building,
  MapPin,
  Phone,
  User,
  Calendar,
  Info,
  Zap,
  Droplets,
  Trash2,
  Wifi,
  Speaker,
  FileText,
  Download,
  FileSignature,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations, useLanguage } from "@/context/LanguageContext";
import { formatCurrency } from "@/utils";

export default function TenantInfoPage() {
  const t = useTranslations("tenantPortal");
  const tCommon = useTranslations("common");
  const { locale } = useLanguage();

  // Mock Data
  const roomInfo = {
    roomNumber: "101",
    buildingName: "Khu trọ cao cấp An Bình",
    address: "123 Đường An Bình, Phường 4, Quận 5, TP.HCM",
    landlord: "Nguyễn Văn Rio",
    phone: "0901234567",
    phoneDisplay: "0901.234.567",
    contractStart: "01/01/2026",
    contractEnd: "31/12/2026",
    rentPrice: 4500000,
    deposit: 4500000,
  };

  const services = [
    {
      name: t("serviceElectricity"),
      price: "3.500đ / kWh",
      icon: Zap,
      color: "text-amber-500",
      bg: "bg-amber-100",
    },
    {
      name: t("serviceWater"),
      price: "20.000đ / m³",
      icon: Droplets,
      color: "text-blue-500",
      bg: "bg-blue-100",
    },
    {
      name: t("serviceTrash"),
      price: `50.000đ ${t("monthUnit")}`,
      icon: Trash2,
      color: "text-emerald-500",
      bg: "bg-emerald-100",
    },
    {
      name: t("serviceWifi"),
      price: `100.000đ ${t("monthUnit")}`,
      icon: Wifi,
      color: "text-purple-500",
      bg: "bg-purple-100",
    },
  ];

  // Generate 15 announcements for pagination demo
  const allAnnouncements = Array.from({ length: 15 }).map((_, i) => ({
    id: i + 1,
    title:
      i === 0
        ? locale === "en"
          ? "Scheduled Power Outage Notice"
          : "Thông báo lịch cắt điện định kỳ"
        : i === 1
        ? locale === "en"
          ? "Reminder: Keep Common Areas Clean"
          : "Nhắc nhở giữ gìn vệ sinh chung"
        : t("noticePrefix", { num: 15 - i }),
    date: `1${Math.max(0, 9 - (i % 10))}/07/2026`,
    content:
      i === 0
        ? locale === "en"
          ? "District 5 Power Company announces maintenance power cut from 08:00 - 12:00 AM on July 16."
          : "Điện lực Quận 5 thông báo cắt điện từ 08:00 - 12:00 sáng ngày 16/07 để bảo trì lưới điện."
        : locale === "en"
        ? "Please review announcement details carefully and comply with building management guidelines."
        : "Chi tiết nội dung thông báo... Vui lòng đọc kỹ và thực hiện theo đúng quy định của ban quản lý toà nhà.",
    isNew: i < 2,
  }));

  // Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(allAnnouncements.length / itemsPerPage);
  const currentAnnouncements = allAnnouncements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const [downloadNotice, setDownloadNotice] = useState(false);
  const handleExportContract = () => {
    setDownloadNotice(true);
    setTimeout(() => setDownloadNotice(false), 3000);
  };

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            {t("title")}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2 rounded-xl h-11 border-zinc-200 bg-white font-semibold cursor-pointer"
          >
            <FileText className="w-4 h-4" /> {t("downloadContract")}
          </Button>
          <Button
            onClick={handleExportContract}
            className="gap-2 rounded-xl h-11 bg-[#2AC1BC] hover:bg-[#23a8a3] text-white font-bold shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export PDF
          </Button>
        </div>
      </div>

      {downloadNotice && (
        <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold animate-in fade-in">
          {locale === "en"
            ? "Preparing contract file (mockup.pdf)..."
            : "Đang chuẩn bị tải file hợp đồng (mockup.pdf)..."}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Room & Building Info */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Card: Thông tin phòng & hợp đồng */}
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#2AC1BC]/5 rounded-bl-full -mr-10 -mt-10 z-0"></div>

            <div className="p-6 relative z-10 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#2AC1BC]/10 rounded-xl text-[#2AC1BC] shrink-0">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-zinc-900">
                    {t("roomNumber")} {roomInfo.roomNumber}
                  </h2>
                  <div className="text-sm font-medium text-zinc-500 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" /> {roomInfo.buildingName}
                  </div>
                </div>
              </div>
              <div className="md:text-right">
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  {t("rentPrice")}
                </div>
                <div className="text-xl font-bold text-[#2AC1BC]">
                  {formatCurrency(roomInfo.rentPrice, locale)}
                </div>
              </div>
            </div>

            <div className="p-6 bg-zinc-50/50 relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-zinc-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-zinc-500">{t("landlord")}</div>
                    <div className="text-sm font-semibold text-zinc-900">
                      {roomInfo.landlord}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 group">
                  <Phone className="w-4 h-4 text-[#2AC1BC] mt-0.5" />
                  <div>
                    <div className="text-xs text-zinc-500">{t("phone")}</div>
                    <a
                      href={`tel:${roomInfo.phone}`}
                      className="text-sm font-bold text-[#2AC1BC] hover:underline transition-all"
                    >
                      {roomInfo.phoneDisplay}
                    </a>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <FileSignature className="w-4 h-4 text-zinc-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-zinc-500">
                      {t("contractDuration")}
                    </div>
                    <div className="text-sm font-semibold text-zinc-900">
                      {roomInfo.contractStart} - {roomInfo.contractEnd}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-zinc-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-zinc-500">{t("deposit")}</div>
                    <div className="text-sm font-semibold text-zinc-900">
                      {formatCurrency(roomInfo.deposit, locale)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Dịch vụ */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-zinc-900 mb-6">
              {t("servicesTitle")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((svc, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 rounded-xl border border-zinc-100 bg-zinc-50 hover:bg-white hover:border-zinc-200 transition-colors"
                >
                  <div
                    className={`p-2.5 rounded-lg ${svc.bg} ${svc.color} shrink-0`}
                  >
                    <svc.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900">
                      {svc.name}
                    </div>
                    <div className="text-xs font-semibold text-zinc-500 mt-0.5">
                      {svc.price}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Announcements */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm flex flex-col h-[700px]">
            <div className="p-6 pb-4 border-b border-zinc-100 flex items-center gap-2">
              <Speaker className="w-5 h-5 text-[#2AC1BC]" />
              <h3 className="text-base font-bold text-zinc-900">
                {t("announcementsTitle")}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pr-4 custom-scrollbar">
              <div className="flex flex-col gap-5">
                {currentAnnouncements.map((item) => (
                  <div
                    key={item.id}
                    className="relative pl-6 pb-2 border-l-2 border-zinc-100 last:border-transparent"
                  >
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-[-9px] top-1 w-4 h-4 rounded-full border-4 border-white ${
                        item.isNew ? "bg-[#2AC1BC]" : "bg-zinc-300"
                      }`}
                    ></div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-400">
                          {item.date}
                        </span>
                        {item.isNew && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-[#FF6B35] text-[10px] font-extrabold uppercase tracking-wide">
                            {locale === "en" ? "New" : "Mới"}
                          </span>
                        )}
                      </div>
                      <h4
                        className={`text-sm font-bold ${
                          item.isNew ? "text-zinc-900" : "text-zinc-700"
                        }`}
                      >
                        {item.title}
                      </h4>
                      <p className="text-sm text-zinc-500 leading-relaxed">
                        {item.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/50 rounded-b-2xl">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-2 text-zinc-500 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs font-semibold text-zinc-500">
                  {locale === "en"
                    ? `Page ${currentPage} of ${totalPages}`
                    : `Trang ${currentPage} / ${totalPages}`}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2 text-zinc-500 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
