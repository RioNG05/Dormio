"use client";

import React, { useState, useEffect } from "react";
import {
  Building,
  MapPin,
  Phone,
  User,
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
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";

interface TenancyApiResponse {
  success: boolean;
  data: {
    contract: {
      id: string;
      startDate: string;
      endDate: string;
      rentPrice: number;
      monthlyPaymentDate: number;
      depositAmount: number;
      note?: string;
      documents: Array<{ id: string; url: string; createdAt: string }>;
    };
    room: {
      id: string;
      roomNumber: string;
      floor: number;
      area?: number;
      maxOccupants?: number;
      roomTypeName?: string;
    };
    boardingHouse: {
      id: string;
      name: string;
      address: string;
      landlord: {
        name: string;
        phoneNumber: string;
        email?: string;
      };
    };
    services: Array<{
      id: string;
      name: string;
      price: number;
      unit: string;
      isMetered: boolean;
    }>;
    announcements: Array<{
      id: string;
      title: string;
      content: string;
      createdAt: string;
      isNew: boolean;
    }>;
  } | null;
}

export default function TenantInfoPage() {
  const [loading, setLoading] = useState(true);
  const [tenancyData, setTenancyData] = useState<TenancyApiResponse["data"] | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchTenancyDetails() {
      try {
        const response = await api.get<TenancyApiResponse>("/v1/tenant/tenancy");
        if (isMounted && response?.data) {
          setTenancyData(response.data);
        }
      } catch (err) {
        console.warn("Could not load tenancy from backend:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchTenancyDetails();

    return () => {
      isMounted = false;
    };
  }, []);

  // Format phone number into dot separated groups: 0901.234.567
  const formatPhoneDisplay = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 4)}.${cleaned.slice(4, 7)}.${cleaned.slice(7)}`;
    }
    return phone;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  // Service icon & color resolver
  const getServiceStyle = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("điện")) {
      return { icon: Zap, color: "text-amber-500", bg: "bg-amber-100" };
    }
    if (lower.includes("nước")) {
      return { icon: Droplets, color: "text-blue-500", bg: "bg-blue-100" };
    }
    if (lower.includes("rác") || lower.includes("vệ sinh")) {
      return { icon: Trash2, color: "text-emerald-500", bg: "bg-emerald-100" };
    }
    if (lower.includes("wifi") || lower.includes("mạng") || lower.includes("internet")) {
      return { icon: Wifi, color: "text-purple-500", bg: "bg-purple-100" };
    }
    return { icon: Sparkles, color: "text-indigo-500", bg: "bg-indigo-100" };
  };

  // Pagination Logic for announcements
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const announcementsList = tenancyData?.announcements || [];
  const totalPages = Math.max(1, Math.ceil(announcementsList.length / itemsPerPage));
  const currentAnnouncements = announcementsList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleViewContract = () => {
    const docUrl = tenancyData?.contract.documents?.[0]?.url;
    if (docUrl) {
      window.open(docUrl, "_blank");
    } else {
      alert("Hợp đồng điện tử đã được xác nhận trực tuyến.");
    }
  };

  const handleExportContract = () => {
    const docUrl = tenancyData?.contract.documents?.[0]?.url;
    if (docUrl) {
      window.open(docUrl, "_blank");
    } else {
      alert("Đang tải file hợp đồng...");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 text-zinc-500 text-sm font-medium">
        Đang tải thông tin trọ...
      </div>
    );
  }

  if (!tenancyData) {
    return (
      <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Thông tin trọ</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Chi tiết về phòng trọ, dịch vụ và các thông báo mới nhất từ chủ nhà.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-16 text-center shadow-sm flex flex-col items-center justify-center gap-3">
          <div className="p-4 bg-zinc-100 rounded-full text-zinc-400">
            <Building className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-zinc-800">Chưa có thông tin thuê phòng</h3>
          <p className="text-sm text-zinc-500 max-w-md">
            Bạn hiện chưa có hợp đồng thuê phòng nào đang hoạt động trong hệ thống.
          </p>
        </div>
      </div>
    );
  }

  const roomInfo = {
    roomNumber: tenancyData.room.roomNumber,
    buildingName: tenancyData.boardingHouse.name,
    address: tenancyData.boardingHouse.address,
    landlord: tenancyData.boardingHouse.landlord.name,
    phone: tenancyData.boardingHouse.landlord.phoneNumber,
    phoneDisplay: formatPhoneDisplay(tenancyData.boardingHouse.landlord.phoneNumber),
    contractStart: formatDate(tenancyData.contract.startDate),
    contractEnd: formatDate(tenancyData.contract.endDate),
    rentPrice: tenancyData.contract.rentPrice,
    deposit: tenancyData.contract.depositAmount,
  };

  const services = (tenancyData.services || []).map((svc) => {
    const style = getServiceStyle(svc.name);
    return {
      name: svc.name,
      price: `${new Intl.NumberFormat("vi-VN").format(svc.price)}đ / ${svc.unit}`,
      ...style,
    };
  });

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Thông tin trọ</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Chi tiết về phòng trọ, dịch vụ và các thông báo mới nhất từ chủ nhà.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleViewContract}
            className="gap-2 rounded-xl h-11 border-zinc-200 bg-white font-semibold cursor-pointer"
          >
            <FileText className="w-4 h-4" /> Xem hợp đồng
          </Button>
          <Button
            onClick={handleExportContract}
            className="gap-2 rounded-xl h-11 bg-primary hover:bg-primary-hover text-white font-bold shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" /> Xuất PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Room & Building Info */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Card: Thông tin phòng & hợp đồng */}
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-bl-full -mr-10 -mt-10 z-0"></div>

            <div className="p-6 relative z-10 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-zinc-900">Phòng {roomInfo.roomNumber}</h2>
                  <div className="text-sm font-medium text-zinc-500 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" /> {roomInfo.buildingName}
                  </div>
                </div>
              </div>
              <div className="md:text-right">
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Giá thuê</div>
                <div className="text-xl font-bold text-primary">
                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(roomInfo.rentPrice)}
                </div>
              </div>
            </div>

            <div className="p-6 bg-zinc-50/50 relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-zinc-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-zinc-500">Chủ nhà</div>
                    <div className="text-sm font-semibold text-zinc-900">{roomInfo.landlord}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 group">
                  <Phone className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <div className="text-xs text-zinc-500">Hotline hỗ trợ</div>
                    <a
                      href={`tel:${roomInfo.phone}`}
                      className="text-sm font-bold text-primary hover:text-primary-hover hover:underline transition-all"
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
                    <div className="text-xs text-zinc-500">Thời hạn hợp đồng</div>
                    <div className="text-sm font-semibold text-zinc-900">
                      {roomInfo.contractStart} - {roomInfo.contractEnd}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-zinc-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-zinc-500">Tiền cọc</div>
                    <div className="text-sm font-semibold text-zinc-900">
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(roomInfo.deposit)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Dịch vụ */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-zinc-900 mb-6">Biểu phí dịch vụ đang áp dụng</h3>
            {services.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.map((svc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 rounded-xl border border-zinc-100 bg-zinc-50 hover:bg-white hover:border-zinc-200 transition-colors"
                  >
                    <div className={`p-2.5 rounded-lg ${svc.bg} ${svc.color} shrink-0`}>
                      <svc.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-zinc-900">{svc.name}</div>
                      <div className="text-xs font-semibold text-zinc-500 mt-0.5">{svc.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Không có dịch vụ bổ sung nào.</p>
            )}
          </div>
        </div>

        {/* Right Column: Announcements */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm flex flex-col h-[700px]">
            <div className="p-6 pb-4 border-b border-zinc-100 flex items-center gap-2">
              <Speaker className="w-5 h-5 text-primary" />
              <h3 className="text-base font-bold text-zinc-900">Thông báo từ chủ trọ</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pr-4 custom-scrollbar">
              {currentAnnouncements.length > 0 ? (
                <div className="flex flex-col gap-5">
                  {currentAnnouncements.map((item) => (
                    <div key={item.id} className="relative pl-6 pb-2 border-l-2 border-zinc-100 last:border-transparent">
                      {/* Timeline dot */}
                      <div
                        className={`absolute left-[-9px] top-1 w-4 h-4 rounded-full border-4 border-white ${
                          item.isNew ? "bg-primary" : "bg-zinc-300"
                        }`}
                      ></div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-400">{formatDate(item.createdAt)}</span>
                          {item.isNew && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-extrabold uppercase tracking-wide">
                              Mới
                            </span>
                          )}
                        </div>
                        <h4 className={`text-sm font-bold ${item.isNew ? "text-zinc-900" : "text-zinc-700"}`}>
                          {item.title}
                        </h4>
                        <p className="text-sm text-zinc-500 leading-relaxed">{item.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400 gap-2">
                  <Speaker className="w-6 h-6 text-zinc-300" />
                  <p className="text-sm font-medium">Chưa có thông báo nào từ chủ trọ.</p>
                </div>
              )}
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
                  Trang {currentPage} / {totalPages}
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
