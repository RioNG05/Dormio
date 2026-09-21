"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  User,
  Phone,
  CreditCard,
  Home,
  Clock,
  Image as ImageIcon,
  FileSignature,
  AlertTriangle,
  CheckCircle2,
  X,
  ExternalLink,
  Loader2,
  MessageCircle,
  Info,
  PhoneCall,
} from "lucide-react";
import { Customer } from "../data";
import { getLandlordContracts, getContractById } from "@/services/contract.service";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LanguageContext";
import {
  Button,
  TextInput,
  DateInput,
  SelectInput,
  TextareaInput,
} from "@/components/ui";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const t = useTranslations("landlord");
  const { activeBuilding } = useAuth();

  const getCustomerStatusLabel = (status: string) => {
    switch (status) {
      case "Đang ở":
        return t("landlordCustomersStaying");
      case "Sắp hết hợp đồng":
        return t("landlordCustomersExpiringSoon");
      case "Đã rời":
        return t("landlordCustomersLeft");
      default:
        return status;
    }
  };

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "warning" | "error" | "success";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  // Edit form states
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCccd, setEditCccd] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editJob, setEditJob] = useState("");
  const [editWorkplace, setEditWorkplace] = useState("");
  const [editNote, setEditNote] = useState("");

  const showAlert = (message: string, type: "info" | "warning" | "error" | "success" = "info", title: string = "Thông báo") => {
    setAlertModal({ isOpen: true, title, message, type });
  };

  useEffect(() => {
    setIsMounted(true);

    async function loadCustomerDetail() {
      const rawId = decodeURIComponent(resolvedParams.id || "");
      if (!rawId || !activeBuilding?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await getLandlordContracts(activeBuilding.id, { limit: 100 });
        const contracts: any[] = res?.data || [];

        let matchedContract: any = null;
        let matchedTenantUser: any = null;

        const cleanRawId = rawId.replace(/^cust_/, "");

        for (const c of contracts) {
          // Check tenantContracts list
          const tContracts = c.tenantContracts || [];
          for (const tc of tContracts) {
            const tu = tc.tenant;
            if (
              tu &&
              (tu.id === rawId ||
                tu.id === cleanRawId ||
                tu.phoneNumber === rawId ||
                tu.userIdentification?.identityNumber === rawId ||
                tc.id === rawId)
            ) {
              matchedContract = c;
              matchedTenantUser = tu;
              break;
            }
          }
          if (matchedContract) break;

          // Check primary tenant
          if (
            c.tenant &&
            (c.tenant.id === rawId ||
              c.tenant.id === cleanRawId ||
              c.tenant.phoneNumber === rawId ||
              c.tenant.userIdentification?.identityNumber === rawId)
          ) {
            matchedContract = c;
            matchedTenantUser = c.tenant;
            break;
          }

          // Check contract ID
          if (c.id === cleanRawId || c.id === rawId || `cust_${c.id}` === rawId) {
            matchedContract = c;
            matchedTenantUser = c.tenant || c.tenantContracts?.[0]?.tenant || null;
            break;
          }
        }

        if (matchedContract) {
          // Fetch complete contract detail to obtain room services, deposit, invoices, docs
          let fullContract = matchedContract;
          try {
            const detailRes = await getContractById(activeBuilding.id, matchedContract.id);
            if (detailRes?.data) {
              fullContract = detailRes.data;
              if (!matchedTenantUser && fullContract.tenant) {
                matchedTenantUser = fullContract.tenant;
              }
            }
          } catch (detailErr) {
            console.warn("Could not load full contract detail, using list aggregate:", detailErr);
          }

          const ident = matchedTenantUser?.userIdentification;
          const daysRemaining = fullContract.endDate
            ? Math.max(0, Math.ceil((new Date(fullContract.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
            : undefined;
          const contractStatus = fullContract.status === "active"
            ? (daysRemaining !== undefined && daysRemaining <= 30 ? "Sắp hết hợp đồng" : "Đang ở")
            : fullContract.status === "draft"
              ? "Sắp hết hợp đồng"
              : "Đã rời";

          // Format address from Json or string
          let formattedAddress = "";
          if (ident?.placeOfResidence) {
            if (typeof ident.placeOfResidence === "string") {
              formattedAddress = ident.placeOfResidence;
            } else if (typeof ident.placeOfResidence === "object") {
              formattedAddress = Object.values(ident.placeOfResidence).filter(Boolean).join(", ");
            }
          } else if (ident?.permanentAddress) {
            formattedAddress = ident.permanentAddress;
          }

          const mappedCustomer: Customer = {
            id: matchedTenantUser?.id || `cust_${fullContract.id}`,
            userId: matchedTenantUser?.id,
            contractId: fullContract.id,
            name: ident?.fullName || matchedTenantUser?.fullName || matchedTenantUser?.username || t("landlordCustomersDefaultName"),
            phone: matchedTenantUser?.phoneNumber || "—",
            room: fullContract.room?.roomNumber || "—",
            roomId: fullContract.room?.id,
            floor: fullContract.room?.floor,
            building: activeBuilding.name || activeBuilding.id,
            cccd: ident?.identityNumber || "—",
            joinDate: fullContract.startDate ? new Date(fullContract.startDate).toLocaleDateString("vi-VN") : "—",
            endDate: fullContract.endDate ? new Date(fullContract.endDate).toLocaleDateString("vi-VN") : undefined,
            rentPrice: fullContract.rentPrice,
            depositAmount: fullContract.deposit?.amount || fullContract.depositAmount || 0,
            daysRemaining,
            status: contractStatus,
            email: matchedTenantUser?.email,
            dob: ident?.dateOfBirth ? new Date(ident.dateOfBirth).toLocaleDateString("vi-VN") : undefined,
            gender: ident?.gender === "male" || ident?.gender === "nam" ? "nam" : "nu",
            address: formattedAddress || undefined,
            cardFrontUrl: ident?.cardFrontUrl,
            cardBackUrl: ident?.cardBackUrl,
            note: fullContract.note || undefined,
            hasAccount: !!matchedTenantUser?.id,
            recentInvoices: fullContract.recentInvoices || [],
          };

          setCustomer(mappedCustomer);
          setEditName(mappedCustomer.name);
          setEditPhone(mappedCustomer.phone !== "—" ? mappedCustomer.phone : "");
          setEditCccd(mappedCustomer.cccd !== "—" ? mappedCustomer.cccd : "");
          setEditDob(mappedCustomer.dob || "");
          setEditGender(mappedCustomer.gender || "nam");
          setEditAddress(mappedCustomer.address || "");
          setEditEmail(mappedCustomer.email || "");
          setEditJob("");
          setEditWorkplace("");
          setEditNote(mappedCustomer.note || "");
        } else {
          setCustomer(null);
        }
      } catch (err) {
        console.error("Failed to load customer detail:", err);
        setCustomer(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadCustomerDetail();
  }, [resolvedParams.id, activeBuilding?.id]);

  if (!isMounted) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-3 bg-white rounded-2xl border border-zinc-200/80 shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#2AC1BC]" />
        <p className="text-sm font-bold text-zinc-600">{t("landlordCustomersLoading")}</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-zinc-200 text-zinc-500 my-6 space-y-3 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
          <User className="w-6 h-6" />
        </div>
        <p className="font-bold text-lg text-zinc-800">{t("landlordCustomersTenantNotFound")}</p>
        <p className="text-xs text-zinc-500">
          {t("landlordCustomersCccdOrCode")}: <span className="font-mono font-bold text-zinc-700">{resolvedParams.id}</span>
        </p>
        <Link
          href="/landlord/customers"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2AC1BC] text-white text-xs font-bold rounded-xl hover:bg-[#25ad87] transition-colors shadow-2xs"
        >
          &larr; {t("landlordCustomersBackToList")}
        </Link>
      </div>
    );
  }

  const isStaying = customer.status === "Đang ở" || customer.status === "Sắp hết hợp đồng";

  const handleOpenChat = () => {
    const targetUserId = customer.userId || (customer.id && !customer.id.startsWith("cust_") ? customer.id : "");
    if (!targetUserId && !customer.hasAccount) {
      showAlert(
        `Khách thuê ${customer.name} chưa có tài khoản trên hệ thống Dormio để nhắn tin trực tiếp. Vui lòng liên hệ qua số điện thoại ${customer.phone !== "—" ? customer.phone : "đã lưu"}.`,
        "info",
        "Chưa có tài khoản liên kết"
      );
      return;
    }
    const query = new URLSearchParams();
    if (targetUserId) {
      query.set("userId", targetUserId);
    }
    if (customer.name) {
      query.set("tenant", customer.name);
    }
    if (customer.room && customer.room !== "—") {
      query.set("room", customer.room);
    }
    router.push(`/landlord/messages?${query.toString()}`);
  };

  const handleSaveCustomer = () => {
    setCustomer((prev) =>
      prev
        ? {
            ...prev,
            name: editName || prev.name,
            phone: editPhone || prev.phone,
            cccd: editCccd || prev.cccd,
            dob: editDob || prev.dob,
            gender: editGender || prev.gender,
            address: editAddress || prev.address,
            email: editEmail || prev.email,
            job: editJob || prev.job,
            workplace: editWorkplace || prev.workplace,
            note: editNote || prev.note,
            updatedAt: new Date().toLocaleDateString("vi-VN"),
          }
        : null
    );
    setIsEditModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link
            href="/landlord/customers"
            className="p-2 -ml-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 rounded-full transition-colors cursor-pointer shrink-0"
            title={t("landlordCustomersBackToList")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#2AC1BC] text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">
              {customer.name.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">{customer.name}</h1>
                <span
                  className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full uppercase tracking-wider border shrink-0 ${
                    customer.status === "Đang ở"
                      ? "bg-[#2AC1BC]/10 text-[#2AC1BC] border-[#2AC1BC]/30"
                      : customer.status === "Sắp hết hợp đồng"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-zinc-100 text-zinc-600 border-zinc-200"
                  }`}
                >
                  {getCustomerStatusLabel(customer.status)}
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-semibold mt-0.5">
                {t("landlordCustomersPhone")}: <span className="font-bold text-zinc-800">{customer.phone}</span>
                {customer.cccd && customer.cccd !== "—" && (
                  <>
                    {" "}• {t("landlordCustomersCccd")}: <span className="font-bold text-zinc-800">{customer.cccd}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100">
          <a
            href={`tel:${customer.phone}`}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer whitespace-nowrap"
          >
            <PhoneCall className="w-3.5 h-3.5" /> {t("landlordCustomersCallBtn")}
          </a>
          <button
            type="button"
            onClick={handleOpenChat}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer whitespace-nowrap"
          >
            <MessageCircle className="w-3.5 h-3.5" /> {t("landlordCustomersMessageBtn")}
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="flex-1 sm:flex-initial gap-1.5 text-zinc-700 bg-white border-zinc-200 hover:bg-zinc-50 whitespace-nowrap"
          >
            <Edit2 className="w-3.5 h-3.5 text-[#2AC1BC]" /> {t("landlordCustomersEditInfo")}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setConfirmModal({
                isOpen: true,
                title: t("landlordCustomersConfirmDeleteTitle"),
                message: t("landlordCustomersConfirmDeleteMsg")
                  .replace("{name}", customer.name)
                  .replace("{cccd}", customer.phone !== "—" ? customer.phone : customer.name),
                onConfirm: () => {
                  router.push("/landlord/customers");
                  setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                },
              });
            }}
            className="flex-1 sm:flex-initial gap-1.5 text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 shadow-none whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" /> {t("landlordCustomersDeleteBtn")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* CARD 1: THÔNG TIN CÁ NHÂN */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <h3 className="font-black text-zinc-900 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
              <User className="w-4 h-4 text-[#2AC1BC]" /> {t("landlordCustomersPersonalInfo")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">{t("landlordCustomersFullNameLabel")}</span>
                <p className="font-extrabold text-zinc-900 text-sm">{customer.name}</p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">{t("landlordCustomersCccdLabel")}</span>
                <p className="font-black text-[#2AC1BC] text-sm tracking-wide">
                  {customer.cccd && customer.cccd !== "—" ? customer.cccd : "Chưa cập nhật"}
                </p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">{t("landlordCustomersDobLabel")}</span>
                <p className="font-bold text-zinc-800">{customer.dob || "Chưa cập nhật"}</p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">{t("landlordCustomersGenderLabel")}</span>
                <p className="font-bold text-zinc-800">
                  {customer.gender === "nam" ? t("landlordCustomersGenderMale") : t("landlordCustomersGenderFemale")}
                </p>
              </div>

              <div className="sm:col-span-2 p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">{t("landlordCustomersPermanentAddressLabel")}</span>
                <p className="font-bold text-zinc-800">{customer.address || "Chưa cập nhật"}</p>
              </div>
            </div>
          </div>

          {/* CARD 2: THÔNG TIN LIÊN HỆ & NGHỀ NGHIỆP */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <h3 className="font-black text-zinc-900 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Phone className="w-4 h-4 text-[#2AC1BC]" /> {t("landlordCustomersContactAndWork")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">{t("landlordCustomersPhoneLabel")}</span>
                <p className="font-black text-zinc-900 text-sm">{customer.phone}</p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">{t("landlordCustomersEmailLabel")}</span>
                <p className="font-bold text-zinc-800">{customer.email || "Chưa cập nhật"}</p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">{t("landlordCustomersJobLabel")}</span>
                <p className="font-bold text-zinc-800">{customer.job || "Chưa cập nhật"}</p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">{t("landlordCustomersWorkplaceLabel")}</span>
                <p className="font-bold text-zinc-800">{customer.workplace || "Chưa cập nhật"}</p>
              </div>
            </div>
          </div>

          {/* CARD 3: HÌNH ẢNH GIẤY TỜ CCCD */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="font-black text-zinc-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#2AC1BC]" /> {t("landlordCustomersIdCardsSection")}
              </h3>
              {customer.cardFrontUrl && customer.cardBackUrl ? (
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                  ✓ {t("landlordCustomersOcrVerified")}
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 border border-zinc-200 rounded-full text-[10px] font-bold">
                  Chưa tải đủ ảnh
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-zinc-600 block">{t("landlordCustomersFrontIdCard")}</span>
                {customer.cardFrontUrl ? (
                  <div
                    onClick={() => setIsImagePreviewOpen(customer.cardFrontUrl!)}
                    className="group relative border-2 border-dashed border-zinc-200 rounded-2xl h-44 overflow-hidden bg-zinc-50 flex items-center justify-center cursor-pointer hover:border-[#2AC1BC] transition-all"
                  >
                    <img
                      src={customer.cardFrontUrl}
                      alt={t("landlordCustomersFrontIdCard")}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1">
                      {t("landlordCustomersClickToEnlarge")}
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-zinc-200 rounded-2xl h-44 bg-zinc-50/50 flex flex-col items-center justify-center text-zinc-400 gap-2">
                    <ImageIcon className="w-8 h-8 text-zinc-300" />
                    <span className="text-xs font-semibold">Chưa cập nhật ảnh mặt trước</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-zinc-600 block">{t("landlordCustomersBackIdCard")}</span>
                {customer.cardBackUrl ? (
                  <div
                    onClick={() => setIsImagePreviewOpen(customer.cardBackUrl!)}
                    className="group relative border-2 border-dashed border-zinc-200 rounded-2xl h-44 overflow-hidden bg-zinc-50 flex items-center justify-center cursor-pointer hover:border-[#2AC1BC] transition-all"
                  >
                    <img
                      src={customer.cardBackUrl}
                      alt={t("landlordCustomersBackIdCard")}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1">
                      🔍 {t("landlordCustomersClickToEnlarge")}
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-zinc-200 rounded-2xl h-44 bg-zinc-50/50 flex flex-col items-center justify-center text-zinc-400 gap-2">
                    <ImageIcon className="w-8 h-8 text-zinc-300" />
                    <span className="text-xs font-semibold">Chưa cập nhật ảnh mặt sau</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6">
          {/* CARD: PHÒNG ĐANG Ở & HỢP ĐỒNG */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-black text-zinc-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Home className="w-4 h-4 text-[#2AC1BC]" /> {t("landlordCustomersContractAndCurrentRoom")}
            </h3>

            {isStaying ? (
              <div className="space-y-3">
                <div className="p-3.5 bg-[#2AC1BC]/10 rounded-2xl border border-[#2AC1BC]/30 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-600">{t("landlordCustomersCurrentlyRenting")}</span>
                    {customer.roomId ? (
                      <Link
                        href={`/landlord/rooms/${customer.roomId}`}
                        className="text-base font-black text-[#2AC1BC] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {t("landlordCustomersRoomWord")} {customer.room} <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <span className="text-base font-black text-[#2AC1BC]">
                        {t("landlordCustomersRoomWord")} {customer.room}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-semibold border-t border-[#2AC1BC]/20 pt-2 flex justify-between">
                    <span>
                      {t("landlordCustomersBuilding")}: {customer.building}
                    </span>
                    <span>
                      {t("landlordCustomersFloorPrefix")} {customer.floor || customer.room.charAt(0) || "1"}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1.5 text-xs">
                  {customer.contractId && (
                    <div className="flex justify-between items-center font-bold text-zinc-700">
                      <span>{t("landlordCustomersContractCodeLabel")}</span>
                      <Link
                        href={`/landlord/contracts`}
                        className="text-[#2AC1BC] hover:underline font-black flex items-center gap-1 cursor-pointer"
                        title={t("landlordCustomersViewContractDetail")}
                      >
                        {customer.contractId.slice(0, 8).toUpperCase()} <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px] text-zinc-500 font-semibold">
                    <span>{t("landlordCustomersContractTermLabel")}</span>
                    <span>
                      {customer.joinDate} - {customer.endDate || "—"}
                    </span>
                  </div>
                  {customer.rentPrice !== undefined && customer.rentPrice > 0 && (
                    <div className="flex justify-between text-[11px] text-zinc-700 font-semibold">
                      <span>Giá thuê:</span>
                      <span className="font-bold text-zinc-900">
                        {Number(customer.rentPrice).toLocaleString("vi-VN")} ₫/tháng
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px] text-emerald-700 font-bold pt-1 border-t border-zinc-200/60">
                    <span>{t("landlordCustomersHoldingDepositLabel")}</span>
                    <span className="font-black text-purple-600">
                      {customer.depositAmount ? Number(customer.depositAmount).toLocaleString("vi-VN") + " ₫" : "0 ₫"}
                    </span>
                  </div>
                </div>

                {customer.roomId && (
                  <Link
                    href={`/landlord/rooms/${customer.roomId}`}
                    className="w-full py-2.5 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <Home className="w-4 h-4" /> {t("landlordCustomersViewRoomDetailBtn").replace("{room}", customer.room)} &rarr;
                  </Link>
                )}
              </div>
            ) : (
              <div className="p-4 text-center bg-zinc-50 rounded-xl border border-zinc-100 text-xs text-zinc-500 font-bold">
                {t("landlordCustomersContractEndedDesc")}
              </div>
            )}
          </div>

          {/* CARD: LỊCH SỬ THUÊ & THANH TOÁN */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-black text-zinc-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Clock className="w-4 h-4 text-[#2AC1BC]" /> {t("landlordCustomersStayHistoryTitle")}
            </h3>

            <div className="space-y-2.5">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-xs space-y-1">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-zinc-900">
                    {t("landlordCustomersRoomWord")} {customer.room} ({customer.building})
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[9px] font-black rounded-full ${
                      customer.status === "Đang ở"
                        ? "bg-emerald-100 text-emerald-700"
                        : customer.status === "Sắp hết hợp đồng"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {getCustomerStatusLabel(customer.status)}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500">
                  {t("landlordCustomersFromDate")} {customer.joinDate} - {customer.endDate || t("landlordCustomersToDate")}
                </p>
              </div>

              {customer.recentInvoices && customer.recentInvoices.length > 0 && (
                <div className="p-3 bg-zinc-50/80 rounded-xl border border-zinc-100 text-xs space-y-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block">Hóa đơn gần nhất</span>
                  {customer.recentInvoices.slice(0, 2).map((inv: any) => (
                    <div key={inv.id} className="flex justify-between items-center text-[11px]">
                      <span className="text-zinc-600 font-medium">HĐ {inv.id.slice(0, 6)}</span>
                      <span className="font-bold text-zinc-800">
                        {Number(inv.totalAmount).toLocaleString("vi-VN")} ₫
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CARD: GHI CHÚ CHỦ TRỌ */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="font-black text-zinc-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
              <FileSignature className="w-4 h-4 text-[#2AC1BC]" /> {t("landlordCustomersLandlordNotesTitle")}
            </h3>
            <p className="text-xs text-zinc-600 font-medium italic bg-zinc-50 p-3 rounded-xl border border-zinc-100 leading-relaxed">
              {customer.note ? `"${customer.note}"` : "Không có ghi chú nào."}
            </p>
          </div>
        </div>
      </div>

      {/* MODAL 1: CHỈNH SỬA THÔNG TIN KHÁCH THUÊ */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsEditModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-900">
                    {t("landlordCustomersEditTenantTitlePrefix")} {customer.name}
                  </h2>
                  <p className="text-xs text-zinc-500 font-medium">{t("landlordCustomersEditTenantSubtitle")}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[75vh] space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput
                  label={t("landlordCustomersFullNameLabel")}
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />

                <TextInput
                  label={t("landlordCustomersPhoneLabel")}
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />

                <TextInput
                  label={t("landlordCustomersCccdLabel")}
                  value={editCccd}
                  onChange={(e) => setEditCccd(e.target.value)}
                  className="font-bold text-[#2AC1BC]"
                />

                <DateInput
                  label={t("landlordCustomersDobLabel")}
                  value={editDob}
                  onChange={(e) => setEditDob(e.target.value)}
                />

                <SelectInput
                  label={t("landlordCustomersGenderLabel")}
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value)}
                  options={[
                    { value: "nam", label: t("landlordCustomersGenderMale") },
                    { value: "nu", label: t("landlordCustomersGenderFemale") },
                  ]}
                />

                <TextInput
                  label={t("landlordCustomersEmailLabel")}
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />

                <div className="md:col-span-2">
                  <TextInput
                    label={t("landlordCustomersPermanentAddressLabel")}
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                  />
                </div>

                <TextInput
                  label={t("landlordCustomersJobLabel")}
                  value={editJob}
                  onChange={(e) => setEditJob(e.target.value)}
                />

                <TextInput
                  label={t("landlordCustomersWorkplaceLabel")}
                  value={editWorkplace}
                  onChange={(e) => setEditWorkplace(e.target.value)}
                />

                <div className="md:col-span-2">
                  <TextareaInput
                    label={t("landlordCustomersNotesLabel")}
                    rows={3}
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(false)}
                className="px-5 py-2 text-xs font-bold text-zinc-700 bg-white border-zinc-200 rounded-xl hover:bg-zinc-50"
              >
                {t("landlordCustomersCancelBtn")}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveCustomer}
                className="px-6 py-2 text-xs font-black text-white bg-[#2AC1BC] rounded-xl hover:bg-[#25ad87] shadow-md shadow-[#2AC1BC]/20"
              >
                {t("landlordCustomersSaveChangesBtn")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: XEM ẢNH CCCD PHÓNG TO */}
      {isImagePreviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsImagePreviewOpen(null);
          }}
        >
          <div className="relative max-w-3xl w-full bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl p-2 flex flex-col items-center">
            <button
              onClick={() => setIsImagePreviewOpen(null)}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors cursor-pointer z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={isImagePreviewOpen}
              alt={t("landlordCustomersCccdEnlargedAlt")}
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRM DELETE */}
      {confirmModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-zinc-900">{confirmModal.title}</h3>
            </div>
            <p className="text-xs text-zinc-500 font-medium">{confirmModal.message}</p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl"
              >
                {t("landlordCustomersCancelBtn")}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={confirmModal.onConfirm}
                className="px-5 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                {t("landlordCustomersConfirmDeleteBtn")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ALERT NOTIFICATION */}
      {alertModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setAlertModal((prev) => ({ ...prev, isOpen: false }));
          }}
        >
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-100 p-6 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border bg-orange-50 text-[#FF6B35] border-orange-200">
              <Info className="w-7 h-7 text-[#FF6B35]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-zinc-900">{alertModal.title}</h3>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">{alertModal.message}</p>
            </div>

            <Button
              onClick={() => setAlertModal((prev) => ({ ...prev, isOpen: false }))}
              className="w-full py-2.5 text-xs font-black rounded-xl transition-all shadow-md cursor-pointer bg-[#2AC1BC] hover:bg-[#25ad87] text-white shadow-[#2AC1BC]/20"
            >
              {t("landlordCustomersUnderstood")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
