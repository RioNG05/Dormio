"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus, Search, Filter, PiggyBank, Building2, ChevronDown, MapPin,
  Eye, Calendar, DollarSign, CheckCircle2, Clock, AlertTriangle,
  ChevronLeft, ChevronRight, LayoutGrid, List, Send, RefreshCw,
  ShieldCheck, User, Phone, ArrowUpRight, Check, X, AlertCircle, FileText,
  RotateCcw, Scissors, Sparkles, Smartphone, HelpCircle, ArrowRight
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";

// Deposit Item Interface (Strict 2 Deposit Types & Dual Status Display Support)
export interface DepositItem {
  id: string;
  roomId: string;
  roomName: string;
  buildingName: string;
  tenantName: string;
  tenantPhone: string;
  depositType: "Cọc giữ chỗ" | "Cọc hợp đồng"; // Exactly 2 Deposit Types
  amount: number; // Current active deposit amount held
  originalAmount: number; // Initial deposit amount
  depositDate: string;
  expiryDate: string;
  status: "Đang giữ" | "Đã hoàn" | "Đã khấu trừ"; // Base status category
  isDeductedPartially?: boolean; // Flag indicating if any deduction occurred (triggers parallel "Đã khấu trừ" badge)
  deductedAmount?: number; // Total amount deducted
  refundAmount?: number; // Final amount refunded to tenant
  deductionReason?: string;
  convertedAt?: string; // Date upgraded from Hold -> Contract Deposit
  additionalPaidAmount?: number; // Additional deposit collected during upgrade to Contract Deposit
  note?: string;
}

// Exactly 20 Mock Deposit Data Items (10 Items for Cọc giữ chỗ, 10 Items for Cọc hợp đồng)
const initialDeposits: DepositItem[] = [
  // ================= 10 ITEMS FOR "CỌC GIỮ CHỖ" =================
  {
    id: "DEP-202608-102",
    roomId: "102",
    roomName: "Phòng 102",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Trần Thị Mai",
    tenantPhone: "0977234567",
    depositType: "Cọc giữ chỗ",
    amount: 1000000,
    originalAmount: 1000000,
    depositDate: "15/08/2026",
    expiryDate: "25/08/2026",
    status: "Đang giữ",
    isDeductedPartially: false,
    note: "Cọc giữ chỗ hẹn chốt hợp đồng. Cần thu bổ sung 2.000.000 ₫ để nâng lên Cọc Hợp Đồng.",
  },
  {
    id: "DEP-202608-104",
    roomId: "104",
    roomName: "Phòng 104",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Bùi Phương Thảo",
    tenantPhone: "0935888999",
    depositType: "Cọc giữ chỗ",
    amount: 1500000,
    originalAmount: 1500000,
    depositDate: "20/08/2026",
    expiryDate: "02/09/2026",
    status: "Đang giữ",
    isDeductedPartially: false,
    note: "Cọc giữ chỗ hẹn dọn vào đầu tháng 9. Dự kiến cọc HĐ: 4.500.000 ₫",
  },
  {
    id: "DEP-202608-202",
    roomId: "202",
    roomName: "Phòng 202",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Phạm Minh Anh",
    tenantPhone: "0933456789",
    depositType: "Cọc giữ chỗ",
    amount: 0,
    originalAmount: 2000000,
    depositDate: "01/08/2026",
    expiryDate: "10/08/2026",
    status: "Đã hoàn",
    isDeductedPartially: false,
    refundAmount: 2000000,
    note: "Đã hoàn cọc 100% (2.000.000 ₫) do khách không dọn vào đúng cam kết",
  },
  {
    id: "DEP-202608-204",
    roomId: "204",
    roomName: "Phòng 204",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Võ Gia Huy",
    tenantPhone: "0912333444",
    depositType: "Cọc giữ chỗ",
    amount: 2000000,
    originalAmount: 2000000,
    depositDate: "22/08/2026",
    expiryDate: "30/08/2026",
    status: "Đang giữ",
    isDeductedPartially: false,
    note: "Cọc giữ chỗ trực tuyến qua Sàn BHRP. Chờ ký hợp đồng trực tiếp.",
  },
  {
    id: "DEP-202608-302",
    roomId: "302",
    roomName: "Phòng 302",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Ngô Thanh Hương",
    tenantPhone: "0966677889",
    depositType: "Cọc giữ chỗ",
    amount: 0,
    originalAmount: 3000000,
    depositDate: "05/08/2026",
    expiryDate: "12/08/2026",
    status: "Đã khấu trừ",
    isDeductedPartially: true,
    deductedAmount: 3000000,
    refundAmount: 0,
    deductionReason: "Bỏ cọc sau quá hạn 10 ngày không đến ký hợp đồng. Khấu trừ 100% tiền cọc.",
    note: "Khách bùng cọc",
  },
  {
    id: "DEP-202608-304",
    roomId: "304",
    roomName: "Phòng 304",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Phan Văn Việt",
    tenantPhone: "0903444555",
    depositType: "Cọc giữ chỗ",
    amount: 0,
    originalAmount: 1500000,
    depositDate: "10/07/2026",
    expiryDate: "17/07/2026",
    status: "Đã hoàn",
    isDeductedPartially: false,
    refundAmount: 1500000,
    note: "Hoàn cọc giữ chỗ 100% do phòng bận sửa chữa ống nước",
  },
  {
    id: "DEP-202608-402",
    roomId: "402",
    roomName: "Phòng 402",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Dương Minh Triết",
    tenantPhone: "0938555666",
    depositType: "Cọc giữ chỗ",
    amount: 2000000,
    originalAmount: 2500000,
    depositDate: "25/08/2026",
    expiryDate: "05/09/2026",
    status: "Đang giữ",
    isDeductedPartially: true,
    deductedAmount: 500000,
    deductionReason: "Trừ 500.000 ₫ tiền vi phạm đổi ngày hẹn giữ phòng quá 2 lần (Vẫn giữ 2.000.000 ₫ còn lại)",
    note: "Cọc giữ chỗ (Hiển thị 2 nhãn: Đang giữ + Đã khấu trừ)",
  },
  {
    id: "DEP-202608-502",
    roomId: "502",
    roomName: "Phòng 502",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Lâm Hoài Thương",
    tenantPhone: "0909123456",
    depositType: "Cọc giữ chỗ",
    amount: 0,
    originalAmount: 1800000,
    depositDate: "28/08/2026",
    expiryDate: "10/09/2026",
    status: "Đã hoàn",
    isDeductedPartially: true,
    deductedAmount: 500000,
    refundAmount: 1300000,
    deductionReason: "Trừ 500.000 ₫ chi phí hủy giữ chỗ sát giờ. Hoàn trả 1.300.000 ₫ còn lại.",
    note: "Cọc giữ chỗ (Hiển thị 2 nhãn: Đã hoàn + Đã khấu trừ)",
  },
  {
    id: "DEP-202608-504",
    roomId: "504",
    roomName: "Phòng 504",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Trương Tấn Sang",
    tenantPhone: "0988777666",
    depositType: "Cọc giữ chỗ",
    amount: 0,
    originalAmount: 2000000,
    depositDate: "15/07/2026",
    expiryDate: "22/07/2026",
    status: "Đã hoàn",
    isDeductedPartially: false,
    refundAmount: 2000000,
    note: "Khách đổi lịch công tác không thuê nữa. Đã hoàn 100% tiền cọc giữ chỗ.",
  },
  {
    id: "DEP-202608-602",
    roomId: "602",
    roomName: "Phòng 602",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Cao Thùy Trang",
    tenantPhone: "0934111222",
    depositType: "Cọc giữ chỗ",
    amount: 0,
    originalAmount: 2500000,
    depositDate: "02/08/2026",
    expiryDate: "10/08/2026",
    status: "Đã khấu trừ",
    isDeductedPartially: true,
    deductedAmount: 2500000,
    refundAmount: 0,
    deductionReason: "Quá hạn 15 ngày không tới ký hợp đồng và không liên lạc được. Khấu trừ 100% cọc.",
    note: "Khách hủy lịch không thông báo",
  },

  // ================= 10 ITEMS FOR "CỌC HỢP ĐỒNG" =================
  {
    id: "DEP-202608-101",
    roomId: "101",
    roomName: "Phòng 101",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Nguyễn Văn Tuấn",
    tenantPhone: "0988123456",
    depositType: "Cọc hợp đồng",
    amount: 3500000,
    originalAmount: 3500000,
    depositDate: "10/08/2026",
    expiryDate: "10/08/2027",
    status: "Đang giữ",
    isDeductedPartially: false,
    note: "Tiền cọc bảo đảm hợp đồng 12 tháng chính thức",
  },
  {
    id: "DEP-202608-103",
    roomId: "103",
    roomName: "Phòng 103",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Đỗ Quốc Bảo",
    tenantPhone: "0905123987",
    depositType: "Cọc hợp đồng",
    amount: 4000000,
    originalAmount: 1500000,
    depositDate: "05/08/2026",
    expiryDate: "05/08/2027",
    status: "Đang giữ",
    isDeductedPartially: false,
    convertedAt: "12/08/2026",
    additionalPaidAmount: 2500000,
    note: "Đã nâng cấp thành công từ Cọc giữ chỗ (Thu bổ sung 2.500.000 ₫ ngày 12/08/2026)",
  },
  {
    id: "DEP-202608-201",
    roomId: "201",
    roomName: "Phòng 201",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Lê Hoàng Nam",
    tenantPhone: "0911345678",
    depositType: "Cọc hợp đồng",
    amount: 3000000,
    originalAmount: 4000000,
    depositDate: "01/06/2026",
    expiryDate: "01/06/2027",
    status: "Đang giữ",
    isDeductedPartially: true,
    deductedAmount: 1000000,
    deductionReason: "Trừ 1.000.000 ₫ tiền vi phạm quy định làm hư hại cửa kính (Vẫn tiếp tục giữ 3.000.000 ₫ còn lại)",
    note: "Hợp đồng 1 năm (Khấu trừ 1.000.000 ₫ cửa kính, giữ 3.000.000 ₫ còn lại)",
  },
  {
    id: "DEP-202608-203",
    roomId: "203",
    roomName: "Phòng 203",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Vũ Hải Yến",
    tenantPhone: "0978666555",
    depositType: "Cọc hợp đồng",
    amount: 5000000,
    originalAmount: 5000000,
    depositDate: "15/05/2026",
    expiryDate: "15/05/2028",
    status: "Đang giữ",
    isDeductedPartially: false,
    note: "Cọc hợp đồng 2 năm phòng VIP ban công",
  },
  {
    id: "DEP-202608-301",
    roomId: "301",
    roomName: "Phòng 301",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Hoàng Đức Trí",
    tenantPhone: "0944567890",
    depositType: "Cọc hợp đồng",
    amount: 0,
    originalAmount: 4500000,
    depositDate: "01/01/2026",
    expiryDate: "01/08/2026",
    status: "Đã hoàn",
    isDeductedPartially: true,
    deductedAmount: 1500000,
    refundAmount: 3000000,
    deductionReason: "Khấu trừ 1.500.000 ₫ chi phí móp tủ lạnh & sơn lại tường. Hoàn trả 3.000.000 ₫ còn lại.",
    note: "Thanh lý hợp đồng đúng hạn (Hoàn 3.000.000 ₫ + Khấu trừ 1.500.000 ₫)",
  },
  {
    id: "DEP-202608-303",
    roomId: "303",
    roomName: "Phòng 303",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Đặng Khánh Linh",
    tenantPhone: "0987111222",
    depositType: "Cọc hợp đồng",
    amount: 4500000,
    originalAmount: 4500000,
    depositDate: "01/07/2026",
    expiryDate: "01/07/2027",
    status: "Đang giữ",
    isDeductedPartially: false,
    note: "Hợp đồng 12 tháng tiêu chuẩn",
  },
  {
    id: "DEP-202608-401",
    roomId: "401",
    roomName: "Phòng 401",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Nguyễn Khánh An",
    tenantPhone: "0971222333",
    depositType: "Cọc hợp đồng",
    amount: 0,
    originalAmount: 5000000,
    depositDate: "01/03/2026",
    expiryDate: "01/03/2027",
    status: "Đã khấu trừ",
    isDeductedPartially: true,
    deductedAmount: 5000000,
    refundAmount: 0,
    deductionReason: "Đơn phương chấm dứt hợp đồng trước hạn không báo trước. Khấu trừ 100% tiền cọc theo điều khoản.",
    note: "Bùng hợp đồng trước hạn",
  },
  {
    id: "DEP-202608-403",
    roomId: "403",
    roomName: "Phòng 403",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Trịnh Kim Ngân",
    tenantPhone: "0919777888",
    depositType: "Cọc hợp đồng",
    amount: 3800000,
    originalAmount: 3800000,
    depositDate: "12/04/2026",
    expiryDate: "12/04/2027",
    status: "Đang giữ",
    isDeductedPartially: false,
    note: "Hợp đồng thuê 1 năm",
  },
  {
    id: "DEP-202608-501",
    roomId: "501",
    roomName: "Phòng 501",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Hồ Quang Hiếu",
    tenantPhone: "0982999000",
    depositType: "Cọc hợp đồng",
    amount: 6000000,
    originalAmount: 6000000,
    depositDate: "01/02/2026",
    expiryDate: "01/02/2028",
    status: "Đang giữ",
    isDeductedPartially: false,
    note: "Tiền cọc căn Studio Penthouse tầng 5 cao cấp",
  },
  {
    id: "DEP-202608-503",
    roomId: "503",
    roomName: "Phòng 503",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Tạ Mỹ Duyên",
    tenantPhone: "0908333222",
    depositType: "Cọc hợp đồng",
    amount: 0,
    originalAmount: 4200000,
    depositDate: "10/02/2026",
    expiryDate: "10/08/2026",
    status: "Đã hoàn",
    isDeductedPartially: false,
    refundAmount: 4200000,
    note: "Thanh lý hợp đồng 6 tháng đúng hạn, hoàn trả 100% tiền cọc 4.200.000 ₫",
  },
];

// Large Money Formatter Helper (Prevents digit wrapping)
const formatLargeMoney = (amount: number): string => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(2).replace(/\.00$/, "")} Tỷ ₫`;
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(2).replace(/\.00$/, "")}M ₫`;
  }
  return `${amount.toLocaleString("vi-VN")} ₫`;
};

function DepositsContent() {
  const t = useTranslations("deposits");
  const { activeBuilding } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [depositsList, setDepositsList] = useState<DepositItem[]>(initialDeposits);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid"); // Rule #9 default

  // Top Segment Switcher for 2 Deposit Types
  const [selectedDepositTypeTab, setSelectedDepositTypeTab] = useState<"Cọc giữ chỗ" | "Cọc hợp đồng">("Cọc giữ chỗ");

  // Status Filter Tab per active Deposit Type (Đang giữ | Đã hoàn | Đã khấu trừ)
  const [activeStatusTab, setActiveStatusTab] = useState<"all" | "holding" | "refunded" | "deducted">("all");

  const [searchTerm, setSearchTerm] = useState("");

  // Selected Deposit for Lightbox Modals
  const [selectedDeposit, setSelectedDeposit] = useState<DepositItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<DepositItem | null>(null);
  const [showRefundModal, setShowRefundModal] = useState<DepositItem | null>(null);
  const [showDeductModal, setShowDeductModal] = useState<DepositItem | null>(null);

  // Refund & Deduction Form State (Unified Modal)
  const [refundForm, setRefundForm] = useState({
    deductedAmount: "0",
    deductionReason: "",
    note: "",
  });

  // Handle Refund & Deduction Deposit (Unified)
  const handleRefundDeposit = () => {
    if (!showRefundModal) return;
    const nowStr = new Date().toLocaleString("vi-VN");
    const deductAmt = Math.min(showRefundModal.amount, Math.max(0, Number(refundForm.deductedAmount) || 0));
    const actualRefund = Math.max(0, showRefundModal.amount - deductAmt);

    setDepositsList(prev => prev.map(d => {
      if (d.id === showRefundModal.id) {
        if (actualRefund === 0 && deductAmt >= showRefundModal.amount) {
          // Deduct 100% (0 refund) -> Status: "Đã khấu trừ"
          return {
            ...d,
            status: "Đã khấu trừ",
            amount: 0,
            refundAmount: 0,
            isDeductedPartially: true,
            deductedAmount: showRefundModal.amount,
            deductionReason: refundForm.deductionReason || "Khấu trừ 100% tiền cọc",
            note: refundForm.note ? `${d.note || ""} [Khấu trừ 100% cọc lúc ${nowStr}: ${refundForm.note}]` : d.note,
          };
        } else if (deductAmt > 0) {
          // Partial deduction + Partial refund -> Status: "Đã hoàn" (renders both badges: Đã hoàn & Đã khấu trừ)
          return {
            ...d,
            status: "Đã hoàn",
            amount: 0,
            refundAmount: actualRefund,
            isDeductedPartially: true,
            deductedAmount: deductAmt,
            deductionReason: refundForm.deductionReason || "Khấu trừ một phần tiền cọc",
            note: refundForm.note ? `${d.note || ""} [Hoàn cọc ${actualRefund.toLocaleString("vi-VN")} ₫, khấu trừ ${deductAmt.toLocaleString("vi-VN")} ₫ lúc ${nowStr}: ${refundForm.note}]` : d.note,
          };
        } else {
          // 100% Refund -> Status: "Đã hoàn"
          return {
            ...d,
            status: "Đã hoàn",
            amount: 0,
            refundAmount: showRefundModal.amount,
            isDeductedPartially: false,
            deductedAmount: 0,
            note: refundForm.note ? `${d.note || ""} [Hoàn 100% cọc ${showRefundModal.amount.toLocaleString("vi-VN")} ₫ lúc ${nowStr}: ${refundForm.note}]` : d.note,
          };
        }
      }
      return d;
    }));

    setShowRefundModal(null);
    setIsFormDirty(false);
  };

  // Rule #10 Unsaved Confirmation Modal
  const [confirmCloseTarget, setConfirmCloseTarget] = useState<"create" | "upgrade" | "refund" | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);

  // New Deposit Form State
  const [newDepositForm, setNewDepositForm] = useState({
    roomName: "103",
    tenantName: "",
    tenantPhone: "",
    depositType: "Cọc giữ chỗ" as "Cọc giữ chỗ" | "Cọc hợp đồng",
    amount: "1000000",
    expiryDate: "2026-09-15",
    note: "",
  });

  // Upgrade Form State (Hold Deposit -> Contract Deposit)
  const [upgradeForm, setUpgradeForm] = useState({
    targetContractAmount: "3500000",
    additionalAmount: 2500000,
    note: "",
  });
  const [upgradeCollectionMethod, setUpgradeCollectionMethod] = useState<"vietqr" | "zalo_sms" | "cash">("vietqr");
  const [showZaloModal, setShowZaloModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Rule #9 Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6); // Default 6 for Grid

  useEffect(() => {
    setPageSize(viewMode === "grid" ? 6 : 10);
    setCurrentPage(1);
  }, [viewMode]);

  // Recalculate additional required deposit when upgrade modal target amount changes
  useEffect(() => {
    if (showUpgradeModal) {
      const target = Number(upgradeForm.targetContractAmount) || 0;
      const current = showUpgradeModal.amount;
      setUpgradeForm(prev => ({
        ...prev,
        additionalAmount: Math.max(0, target - current),
      }));
    }
  }, [upgradeForm.targetContractAmount, showUpgradeModal]);

  // 1. Total Counts for Top Segment Switcher (Cọc giữ chỗ vs Cọc hợp đồng)
  const holdTypeCountTotal = depositsList.filter(d => d.depositType === "Cọc giữ chỗ").length;
  const contractTypeCountTotal = depositsList.filter(d => d.depositType === "Cọc hợp đồng").length;

  // 2. Deposits scoped to Active Deposit Type Tab
  const activeTypeDeposits = depositsList.filter(d => d.depositType === selectedDepositTypeTab);

  // 3. Status Tab Counts per Active Deposit Type (Including partial deductions)
  const statusTotalCount = activeTypeDeposits.length;
  const statusHoldingCount = activeTypeDeposits.filter(d => d.status === "Đang giữ").length;
  const statusRefundedCount = activeTypeDeposits.filter(d => d.status === "Đã hoàn").length;
  const statusDeductedCount = activeTypeDeposits.filter(d => d.status === "Đã khấu trừ" || (d.isDeductedPartially && (d.deductedAmount || 0) > 0)).length;

  // 4. Final Filtered Deposits Array
  const filteredDeposits = depositsList.filter((dep) => {
    // Must match top segment Deposit Type (Cọc giữ chỗ OR Cọc hợp đồng)
    if (dep.depositType !== selectedDepositTypeTab) return false;

    // Search query match
    const matchSearch =
      dep.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dep.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dep.tenantPhone.includes(searchTerm) ||
      dep.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    // Status filter match
    if (activeStatusTab === "holding") return dep.status === "Đang giữ";
    if (activeStatusTab === "refunded") return dep.status === "Đã hoàn";
    if (activeStatusTab === "deducted") return dep.status === "Đã khấu trừ" || (dep.isDeductedPartially && (dep.deductedAmount || 0) > 0);

    return true;
  });

  // Pagination Calculation
  const totalItems = filteredDeposits.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedDeposits = filteredDeposits.slice(startIndex, startIndex + pageSize);

  // Stat Card Totals (Covering both deposit types)
  const totalHoldingAmount = depositsList
    .filter(d => d.status === "Đang giữ")
    .reduce((acc, d) => acc + d.amount, 0);

  const totalHoldTypeAmount = depositsList
    .filter(d => d.depositType === "Cọc giữ chỗ" && d.status === "Đang giữ")
    .reduce((acc, d) => acc + d.amount, 0);

  const totalRefundedAmount = depositsList
    .filter(d => d.status === "Đã hoàn")
    .reduce((acc, d) => acc + (d.refundAmount || 0), 0);

  const totalDeductedAmount = depositsList
    .reduce((acc, d) => acc + (d.deductedAmount || 0), 0);

  const holdingCountTotal = depositsList.filter(d => d.status === "Đang giữ").length;
  const holdTypeHoldingCountTotal = depositsList.filter(d => d.depositType === "Cọc giữ chỗ" && d.status === "Đang giữ").length;
  const refundedCountTotal = depositsList.filter(d => d.status === "Đã hoàn").length;
  const deductedCountTotal = depositsList.filter(d => d.status === "Đã khấu trừ" || (d.isDeductedPartially && (d.deductedAmount || 0) > 0)).length;

  // Handle Upgrade Hold Deposit -> Contract Deposit
  const handleConfirmUpgradeToContract = () => {
    if (!showUpgradeModal) return;
    const nowStr = new Date().toLocaleDateString("vi-VN");
    const targetAmt = Number(upgradeForm.targetContractAmount) || showUpgradeModal.amount;
    const addAmt = upgradeForm.additionalAmount;

    setDepositsList(prev => prev.map(d => {
      if (d.id === showUpgradeModal.id) {
        return {
          ...d,
          depositType: "Cọc hợp đồng",
          status: "Đang giữ",
          amount: targetAmt,
          additionalPaidAmount: addAmt,
          convertedAt: nowStr,
          note: `${d.note || ""} (Đã thu bổ sung ${addAmt.toLocaleString("vi-VN")} ₫ và nâng cấp thành Cọc Hợp Đồng ngày ${nowStr})`
        };
      }
      return d;
    }));

    if (selectedDeposit?.id === showUpgradeModal.id) {
      setSelectedDeposit(prev => prev ? {
        ...prev,
        depositType: "Cọc hợp đồng",
        status: "Đang giữ",
        amount: targetAmt,
        additionalPaidAmount: addAmt,
        convertedAt: nowStr,
      } : null);
    }

    // Switch view to Cọc hợp đồng tab after upgrade
    setSelectedDepositTypeTab("Cọc hợp đồng");
    setActiveStatusTab("holding");
    setShowUpgradeModal(null);
    setIsFormDirty(false);
  };

  // Handle Create Deposit
  const handleCreateDeposit = () => {
    if (!newDepositForm.tenantName || !newDepositForm.tenantPhone) return;

    const initialAmt = Number(newDepositForm.amount) || 1000000;
    const newDep: DepositItem = {
      id: `DEP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${newDepositForm.roomName}`,
      roomId: newDepositForm.roomName,
      roomName: `Phòng ${newDepositForm.roomName}`,
      buildingName: activeBuilding.name,
      tenantName: newDepositForm.tenantName,
      tenantPhone: newDepositForm.tenantPhone,
      depositType: newDepositForm.depositType,
      amount: initialAmt,
      originalAmount: initialAmt,
      depositDate: new Date().toLocaleDateString("vi-VN"),
      expiryDate: newDepositForm.expiryDate,
      status: "Đang giữ",
      isDeductedPartially: false,
      note: newDepositForm.note || (newDepositForm.depositType === "Cọc giữ chỗ" ? "Cọc giữ chỗ chờ hẹn lịch chốt hợp đồng" : "Cọc hợp đồng bảo đảm thuê nhà"),
    };

    setDepositsList([newDep, ...depositsList]);

    // Switch tab to created deposit type
    setSelectedDepositTypeTab(newDepositForm.depositType);
    setActiveStatusTab("holding");

    setShowCreateModal(false);
    setIsFormDirty(false);
    setNewDepositForm({
      roomName: "103",
      tenantName: "",
      tenantPhone: "",
      depositType: "Cọc giữ chỗ",
      amount: "1000000",
      expiryDate: "2026-09-15",
      note: "",
    });
  };

  // Request Close with Rule #10 Unsaved Pop-up Confirmation
  const requestCloseModal = (target: "create" | "upgrade" | "refund") => {
    if (isFormDirty) {
      setConfirmCloseTarget(target);
    } else {
      if (target === "create") setShowCreateModal(false);
      if (target === "upgrade") setShowUpgradeModal(null);
      if (target === "refund") setShowRefundModal(null);
    }
  };

  const handleConfirmCloseModal = () => {
    if (confirmCloseTarget === "create") setShowCreateModal(false);
    if (confirmCloseTarget === "upgrade") setShowUpgradeModal(null);
    if (confirmCloseTarget === "refund") setShowRefundModal(null);
    setConfirmCloseTarget(null);
    setIsFormDirty(false);
  };

  // Render Clean Status Badges (Strict: "Đang giữ" always shows single badge; "Đã hoàn" shows parallel "Đã hoàn + Đã khấu trừ" if partial deduction exists)
  const renderStatusBadge = (dep: DepositItem) => {
    if (dep.status === "Đang giữ") {
      return (
        <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-[#2AC1BC]/15 text-[#0d6e6b] border border-[#2AC1BC]/30">
          Đang giữ
        </span>
      );
    }

    if (dep.status === "Đã hoàn") {
      const hasDeduction = dep.isDeductedPartially || (dep.deductedAmount && dep.deductedAmount > 0);
      return (
        <div className="flex flex-wrap items-center gap-1 justify-end sm:justify-start">
          <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            Đã hoàn
          </span>
          {hasDeduction && (
            <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-rose-50 text-rose-700 border border-rose-200" title={`Đã khấu trừ ${dep.deductedAmount?.toLocaleString("vi-VN")} ₫`}>
              Đã khấu trừ
            </span>
          )}
        </div>
      );
    }

    // 100% Deduction status
    return (
      <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-rose-50 text-rose-700 border border-rose-200">
        Đã khấu trừ
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <PiggyBank className="w-6 h-6 text-[#2AC1BC]" /> {t("title")}
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-0.5">
            {t("sub")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setShowCreateModal(true);
              setIsFormDirty(false);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-black text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" /> {t("addNew")}
          </button>
        </div>
      </div>

      {/* Dark Hero Summary Banner (Matching Standard Design) */}
      <div className="bg-zinc-900 rounded-3xl p-5 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-zinc-800">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <PiggyBank className="w-64 h-64" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Left Title, Address Pill with Map button, and Description */}
          <div className="space-y-3 max-w-xl">
            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white flex items-center gap-2">
              {activeBuilding.name}
            </h2>

            {/* Address Pill with Integrated Map Link */}
            <div className="inline-flex flex-wrap sm:flex-nowrap items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-all max-w-full">
              <MapPin className="w-4 h-4 text-[#2AC1BC] shrink-0" />
              <span className="text-xs font-bold text-zinc-200 truncate max-w-[200px] sm:max-w-none">{activeBuilding.address}</span>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(activeBuilding.address)}`}
                target="_blank"
                rel="noreferrer"
                className="ml-auto sm:ml-1.5 px-2.5 py-1 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-[10px] font-black rounded-lg transition-colors flex items-center gap-1 shrink-0"
              >
                <span>Google Maps</span> &rarr;
              </a>
            </div>

            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {t("bannerSub")}
            </p>
          </div>

          {/* Right Stat Cards (2 Rows, 2 Cards per Row, Non-wrapping Money Amounts) */}
          <div className="flex flex-col items-stretch sm:items-end gap-3 w-full lg:w-auto">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full sm:w-auto">
              {/* Card 1: Đang Giữ */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 transition-colors rounded-2xl border border-[#2AC1BC]/30 backdrop-blur-md min-w-[130px] sm:min-w-[170px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2AC1BC] shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase font-extrabold text-[#2AC1BC] tracking-wider whitespace-nowrap">{t("holdingLabel", { count: holdingCountTotal })}</span>
                  <span className="font-black text-[#2AC1BC] text-xs sm:text-base leading-none mt-1 whitespace-nowrap tracking-tight">
                    {formatLargeMoney(totalHoldingAmount)}
                  </span>
                </div>
              </div>

              {/* Card 2: Cọc Giữ Chỗ */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-amber-500/10 hover:bg-amber-500/20 transition-colors rounded-2xl border border-amber-500/30 backdrop-blur-md min-w-[130px] sm:min-w-[170px]">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase font-extrabold text-amber-400 tracking-wider whitespace-nowrap">CỌC GIỮ CHỖ ({holdTypeHoldingCountTotal})</span>
                  <span className="font-black text-amber-400 text-xs sm:text-base leading-none mt-1 whitespace-nowrap tracking-tight">
                    {formatLargeMoney(totalHoldTypeAmount)}
                  </span>
                </div>
              </div>

              {/* Card 3: Đã Hoàn Cọc */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-purple-500/10 hover:bg-purple-500/20 transition-colors rounded-2xl border border-purple-500/30 backdrop-blur-md min-w-[130px] sm:min-w-[170px]">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase font-extrabold text-purple-400 tracking-wider whitespace-nowrap">ĐÃ HOÀN ({refundedCountTotal})</span>
                  <span className="font-black text-purple-400 text-xs sm:text-base leading-none mt-1 whitespace-nowrap tracking-tight">
                    {formatLargeMoney(totalRefundedAmount)}
                  </span>
                </div>
              </div>

              {/* Card 4: Tổng Đã Khấu Trừ */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-2xl border border-rose-500/30 backdrop-blur-md min-w-[130px] sm:min-w-[170px]">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase font-extrabold text-rose-400 tracking-wider whitespace-nowrap">ĐÃ KHẤU TRỪ ({deductedCountTotal})</span>
                  <span className="font-black text-rose-400 text-xs sm:text-base leading-none mt-1 whitespace-nowrap tracking-tight">
                    {formatLargeMoney(totalDeductedAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Filter & Control Bar */}
      <div className="bg-white p-3.5 sm:p-4 border border-zinc-200/80 rounded-2xl shadow-2xs space-y-3.5">
        {/* Top Segmented Pill Switcher */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
          {/* 2 Deposit Types Segment Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 bg-zinc-100 p-1 rounded-2xl sm:rounded-full border border-zinc-200/80 w-full md:w-auto">
            <button
              onClick={() => {
                setSelectedDepositTypeTab("Cọc giữ chỗ");
                setActiveStatusTab("all");
                setCurrentPage(1);
              }}
              className={`py-2 px-3 sm:px-4 rounded-xl sm:rounded-full text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${selectedDepositTypeTab === "Cọc giữ chỗ"
                ? "bg-amber-500 text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
                }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Cọc Giữ Chỗ Xem Phòng</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${selectedDepositTypeTab === "Cọc giữ chỗ"
                  ? "bg-white/20 text-white"
                  : "bg-zinc-200 text-zinc-700"
                  }`}
              >
                {holdTypeCountTotal}
              </span>
            </button>

            <button
              onClick={() => {
                setSelectedDepositTypeTab("Cọc hợp đồng");
                setActiveStatusTab("all");
                setCurrentPage(1);
              }}
              className={`py-2 px-3 sm:px-4 rounded-xl sm:rounded-full text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${selectedDepositTypeTab === "Cọc hợp đồng"
                ? "bg-[#2AC1BC] text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
                }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Cọc Hợp Đồng Thuê</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${selectedDepositTypeTab === "Cọc hợp đồng"
                  ? "bg-white/20 text-white"
                  : "bg-zinc-200 text-zinc-700"
                  }`}
              >
                {contractTypeCountTotal}
              </span>
            </button>
          </div>

          {/* Search Box & View Switcher */}
          <div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-full md:max-w-md">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Tìm phòng, tên khách, SĐT, mã..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8.5 pr-3 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all truncate"
              />
            </div>

            {/* View Switcher (Grid vs Table) */}
            <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200 shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${viewMode === "grid" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                title="Dạng Lưới (Grid)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${viewMode === "table" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                title="Dạng Bảng (Table)"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 flex items-center justify-between gap-2 shrink-0 text-xs font-bold">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-zinc-400 text-[11px] font-extrabold uppercase mr-1 hidden sm:inline">Trạng thái:</span>

            <button
              onClick={() => { setActiveStatusTab("all"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap ${activeStatusTab === "all" ? "bg-[#2AC1BC] text-white shadow-2xs" : "bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70"
                }`}
            >
              Tất cả ({statusTotalCount})
            </button>

            <button
              onClick={() => { setActiveStatusTab("holding"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap ${activeStatusTab === "holding" ? "bg-[#2AC1BC] text-white shadow-2xs" : "bg-[#2AC1BC]/10 text-[#0d6e6b] hover:bg-[#2AC1BC]/20"
                }`}
            >
              Đang giữ ({statusHoldingCount})
            </button>

            <button
              onClick={() => { setActiveStatusTab("refunded"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap ${activeStatusTab === "refunded" ? "bg-purple-600 text-white shadow-2xs" : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                }`}
            >
              Đã hoàn ({statusRefundedCount})
            </button>

            <button
              onClick={() => { setActiveStatusTab("deducted"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap border ${activeStatusTab === "deducted" ? "bg-rose-500 text-white border-rose-600 shadow-2xs" : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                }`}
            >
              Đã khấu trừ ({statusDeductedCount})
            </button>
          </div>

          <span className="text-[11px] font-bold text-zinc-400 shrink-0 hidden sm:inline">
            Đang xem: <strong className="text-zinc-800">{selectedDepositTypeTab}</strong>
          </span>
        </div>
      </div>

      {/* Main Content Display (Grid or Table View) */}
      {paginatedDeposits.length === 0 ? (
        <div className="p-12 text-center bg-white border border-zinc-200 rounded-2xl space-y-3">
          <PiggyBank className="w-12 h-12 text-zinc-300 mx-auto stroke-1" />
          <h3 className="font-extrabold text-sm text-zinc-800">Không tìm thấy khoản cọc nào trong danh mục {selectedDepositTypeTab}</h3>
          <p className="text-xs text-zinc-400">Thử chọn trạng thái khác hoặc nhập cụm từ tìm kiếm mới.</p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW (Rule #9 Default) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedDeposits.map((dep) => {
            const isHoldType = dep.depositType === "Cọc giữ chỗ";
            const isHolding = dep.status === "Đang giữ";
            const isRefunded = dep.status === "Đã hoàn";
            const isDeducted = dep.status === "Đã khấu trừ";

            return (
              <div
                key={dep.id}
                className={`bg-white border rounded-2xl p-4 space-y-4 hover:shadow-md transition-all flex flex-col justify-between ${isHoldType && isHolding ? "border-amber-300 bg-amber-50/15" :
                  isRefunded ? "border-purple-200 bg-purple-50/10" :
                    isDeducted ? "border-rose-200 bg-rose-50/10" :
                      "border-zinc-200/80 hover:border-[#2AC1BC]/40"
                  }`}
              >
                {/* Header Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-zinc-900">{dep.roomName}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-black rounded-md border ${isHoldType ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}>
                        {dep.depositType}
                      </span>
                    </div>

                    {renderStatusBadge(dep)}
                  </div>

                  {/* Tenant Details */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 font-medium">Người cọc:</span>
                      <span className="font-bold text-zinc-900">{dep.tenantName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 font-medium">Số điện thoại:</span>
                      <span className="font-bold text-zinc-700">{dep.tenantPhone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 font-medium">Ngày đặt cọc:</span>
                      <span className="font-semibold text-zinc-600">{dep.depositDate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 font-medium">{isHoldType ? "Hạn chốt HĐ:" : "Thời hạn cọc:"}</span>
                      <span className={`font-bold ${isHoldType && isHolding ? "text-amber-600" : "text-zinc-600"}`}>
                        {dep.expiryDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Amount & Action Footer */}
                <div className="pt-3 border-t border-zinc-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider">Tiền cọc hiện giữ</span>
                      <span className="font-black text-base text-[#2AC1BC]">
                        {dep.amount.toLocaleString("vi-VN")} ₫
                      </span>
                    </div>

                    {isHoldType && isHolding && (
                      <span className="text-[10px] font-extrabold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md">
                        Cọc Giữ Chỗ
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedDeposit(dep)}
                      className="flex-1 py-2 bg-zinc-100 hover:bg-[#2AC1BC] hover:text-white text-zinc-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" /> Chi tiết
                    </button>

                    {/* Rule: Convert Hold Deposit -> Contract Deposit by collecting additional funds */}
                    {isHoldType && isHolding && (
                      <button
                        onClick={() => {
                          setShowUpgradeModal(dep);
                          setIsFormDirty(false);
                        }}
                        className="py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        title="Thu bổ sung tiền cọc & nâng thành Cọc Hợp Đồng"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Nâng Cọc HĐ
                      </button>
                    )}

                    {/* Quick Message Reminder */}
                    {!isRefunded && !isDeducted && (
                      <button
                        onClick={() => router.push(`/landlord/messages?room=${encodeURIComponent(dep.roomId)}&tenant=${encodeURIComponent(dep.tenantName)}&depId=${encodeURIComponent(dep.id)}&amount=${dep.amount}&autoSend=true`)}
                        className="p-2 bg-zinc-100 hover:bg-[#2AC1BC]/10 text-zinc-700 hover:text-[#2AC1BC] rounded-xl transition-all cursor-pointer"
                        title="Gửi tin nhắn qua Chat"
                      >
                        <Send className="w-3.5 h-3.5 text-[#2AC1BC]" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW (Rule #9 Alternative) */
        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-xs text-left min-w-[700px]">
              <thead className="text-[11px] text-zinc-500 bg-zinc-50 border-b border-zinc-200 uppercase font-black tracking-wider">
                <tr>
                  <th className="px-4 py-3">Mã Cọc</th>
                  <th className="px-4 py-3">Phòng</th>
                  <th className="px-4 py-3">Khách cọc</th>
                  <th className="px-4 py-3">Loại cọc</th>
                  <th className="px-4 py-3">Số tiền giữ</th>
                  <th className="px-4 py-3">Ngày cọc</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-semibold">
                {paginatedDeposits.map((dep) => (
                  <tr key={dep.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-bold font-mono text-zinc-900 flex items-center gap-2">
                      <PiggyBank className="w-4 h-4 text-[#2AC1BC]" />
                      {dep.id}
                    </td>
                    <td className="px-4 py-3.5 font-black text-zinc-900">{dep.roomName}</td>
                    <td className="px-4 py-3.5 text-zinc-700">
                      <div>{dep.tenantName}</div>
                      <div className="text-[10px] text-zinc-400 font-normal">{dep.tenantPhone}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 text-[10px] font-black rounded-md border ${dep.depositType === "Cọc hợp đồng" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                        {dep.depositType}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-black text-[#2AC1BC] text-sm">{dep.amount.toLocaleString("vi-VN")} ₫</td>
                    <td className="px-4 py-3.5 text-zinc-600">{dep.depositDate}</td>
                    <td className="px-4 py-3.5">
                      {renderStatusBadge(dep)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedDeposit(dep)}
                          className="px-2.5 py-1 bg-zinc-100 hover:bg-[#2AC1BC] hover:text-white text-zinc-700 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Chi tiết
                        </button>
                        {dep.depositType === "Cọc giữ chỗ" && dep.status === "Đang giữ" && (
                          <button
                            onClick={() => {
                              setShowUpgradeModal(dep);
                              setIsFormDirty(false);
                            }}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1"
                            title="Thu bổ sung & nâng thành cọc hợp đồng"
                          >
                            <Sparkles className="w-3.5 h-3.5" /> Nâng Cọc HĐ
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Bar (Standard Dormio Rule #9) */}
      <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold">
        <div className="flex items-center gap-3">
          <span className="text-zinc-500">Hiển thị</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 bg-zinc-50 border border-zinc-200 rounded-lg font-black text-zinc-900 focus:outline-none cursor-pointer"
          >
            <option value={6}>6</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
          <span className="text-zinc-500">
            / trang | <strong className="text-zinc-900">{totalItems > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + pageSize, totalItems)}</strong> trên <strong className="text-zinc-900">{totalItems}</strong> mục
          </span>
        </div>

        {/* Page Window Jumping Controls */}
        <div className="flex flex-wrap items-center justify-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded-xl font-black text-xs transition-all cursor-pointer ${currentPage === page
                ? "bg-[#2AC1BC] text-white shadow-2xs"
                : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100 border border-zinc-200"
                }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. VIEW DETAIL LIGHTBOX MODAL */}
      {selectedDeposit && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDeposit(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl cursor-default animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-2xl shadow-xs">
                  <PiggyBank className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-zinc-900 flex items-center gap-2">
                    Chi Tiết Khoản Cọc {selectedDeposit.id}
                  </h3>
                  <p className="text-xs text-zinc-500 font-semibold">{selectedDeposit.roomName} • {selectedDeposit.buildingName}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedDeposit(null)}
                className="p-2 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-200/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar text-xs">
              {/* Tenant & Deposit Meta Card */}
              <div className="p-4 bg-zinc-50/80 border border-zinc-200/80 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Thông Tin Khách Thuê</span>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#2AC1BC]" />
                    <p className="font-black text-sm text-zinc-900">{selectedDeposit.tenantName}</p>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-600 font-semibold">
                    <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{selectedDeposit.tenantPhone}</span>
                  </div>
                </div>

                <div className="space-y-1.5 sm:text-right flex flex-col sm:items-end justify-between">
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Loại Cọc &amp; Trạng Thái</span>
                  <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                    <span className="font-extrabold text-zinc-800 bg-zinc-200/70 px-2.5 py-0.5 rounded-md text-[11px] inline-block whitespace-nowrap">
                      {selectedDeposit.depositType}
                    </span>
                    {renderStatusBadge(selectedDeposit)}
                  </div>
                </div>
              </div>

              {/* Financial Highlight Card */}
              <div className="p-5 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 text-white rounded-3xl space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                    Số Tiền Cọc Hiện Đang Giữ
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">
                    Hạn: <strong className="text-zinc-200 font-bold">{selectedDeposit.expiryDate}</strong>
                  </span>
                </div>

                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-1 text-2xl sm:text-3xl font-black text-[#2AC1BC] tracking-tight whitespace-nowrap">
                    <span>{selectedDeposit.amount.toLocaleString("vi-VN")}</span>
                    <span className="text-xl sm:text-2xl font-bold">₫</span>
                  </div>

                  {selectedDeposit.originalAmount > selectedDeposit.amount && (
                    <span className="text-[11px] text-zinc-400 font-medium italic whitespace-nowrap">
                      (Ban đầu: {selectedDeposit.originalAmount.toLocaleString("vi-VN")} ₫)
                    </span>
                  )}
                </div>

                {selectedDeposit.note && (
                  <div className="pt-2.5 border-t border-zinc-800/80 text-[11px] text-zinc-300 font-medium flex items-start gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <p><strong>Ghi chú:</strong> {selectedDeposit.note}</p>
                  </div>
                )}
              </div>

              {/* Deduction Breakdown Sub-card */}
              {selectedDeposit.isDeductedPartially && (selectedDeposit.deductedAmount || 0) > 0 && (
                <div className="p-4 bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-200 rounded-2xl space-y-2.5 text-rose-950 font-semibold shadow-2xs">
                  <div className="flex items-center justify-between border-b border-rose-200/80 pb-2">
                    <span className="font-extrabold flex items-center gap-1.5 text-xs text-rose-900">
                      <Scissors className="w-4 h-4 text-rose-600" /> Chi Tiết Khấu Trừ Tiền Cọc
                    </span>
                    <span className="font-black text-rose-700 text-sm whitespace-nowrap">
                      -{selectedDeposit.deductedAmount?.toLocaleString("vi-VN")} ₫
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-zinc-600">
                      <span>Số tiền cọc ban đầu:</span>
                      <span className="font-bold whitespace-nowrap">{selectedDeposit.originalAmount.toLocaleString("vi-VN")} ₫</span>
                    </div>
                    <div className="flex justify-between text-rose-700 font-bold">
                      <span>Khấu trừ vi phạm:</span>
                      <span className="whitespace-nowrap">-{selectedDeposit.deductedAmount?.toLocaleString("vi-VN")} ₫</span>
                    </div>
                    <div className="flex justify-between text-purple-700 font-black border-t border-rose-200/80 pt-1.5">
                      <span>Số tiền thực tế hoàn trả:</span>
                      <span className="whitespace-nowrap">{(selectedDeposit.refundAmount || 0).toLocaleString("vi-VN")} ₫</span>
                    </div>
                  </div>

                  {selectedDeposit.deductionReason && (
                    <p className="text-[11px] text-rose-800 italic pt-1 border-t border-rose-200/80">
                      💡 <strong>Lý do:</strong> {selectedDeposit.deductionReason}
                    </p>
                  )}
                </div>
              )}

              {/* Upgrade History Log */}
              {selectedDeposit.convertedAt && (
                <div className="p-3.5 bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-200 rounded-2xl text-amber-900 font-semibold space-y-1 shadow-2xs">
                  <p className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" /> Đã thu bổ sung {selectedDeposit.additionalPaidAmount?.toLocaleString("vi-VN")} ₫ &amp; Nâng thành Cọc Hợp Đồng!
                  </p>
                  <p className="text-[11px] text-amber-700">Ngày nâng cấp: {selectedDeposit.convertedAt}</p>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-zinc-100 bg-white flex flex-wrap items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => {
                  router.push(
                    `/landlord/messages?room=${encodeURIComponent(selectedDeposit.roomId)}&tenant=${encodeURIComponent(selectedDeposit.tenantName)}`
                  );
                }}
                className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 text-[#2AC1BC]" /> Chat Ngay Với Khách
              </button>

              <div className="flex items-center gap-2 ml-auto">
                {selectedDeposit.depositType === "Cọc giữ chỗ" && selectedDeposit.status === "Đang giữ" && (
                  <button
                    onClick={() => {
                      setShowUpgradeModal(selectedDeposit);
                      setSelectedDeposit(null);
                      setIsFormDirty(false);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" /> Nâng Cọc HĐ
                  </button>
                )}

                {selectedDeposit.status === "Đang giữ" && (
                  <button
                    onClick={() => {
                      setShowRefundModal(selectedDeposit);
                      setRefundForm({ deductedAmount: "0", deductionReason: "", note: "" });
                      setSelectedDeposit(null);
                      setIsFormDirty(false);
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" /> Hoàn &amp; Khấu Trừ Cọc
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. UPGRADE HOLD DEPOSIT TO CONTRACT DEPOSIT MODAL */}
      {showUpgradeModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) requestCloseModal("upgrade");
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl cursor-default animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-amber-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-2xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-zinc-900">Thu Bổ Sung & Nâng Cọc Hợp Đồng</h3>
                  <p className="text-xs text-zinc-500 font-semibold">{showUpgradeModal.roomName} • {showUpgradeModal.tenantName}</p>
                </div>
              </div>

              <button
                onClick={() => requestCloseModal("upgrade")}
                className="p-2 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-200/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar text-xs">
              {/* Dormio Smart Helper Banner */}
              <div className="p-3 bg-gradient-to-r from-amber-500/10 via-teal-500/10 to-emerald-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-zinc-700 font-medium leading-relaxed">
                  <strong className="text-zinc-900 font-black">Tiện ích thông minh Dormio:</strong> Tự động tính chênh lệch & hỗ trợ 3 hình thức thu tiền cọc bổ sung mượt mà!
                </p>
              </div>

              {/* Amount Breakdown & Calculation Card */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-zinc-600 text-xs">
                  <span>Tiền Cọc Đã Thu:</span>
                  <span className="font-black text-zinc-900 whitespace-nowrap">{showUpgradeModal.amount.toLocaleString("vi-VN")} ₫</span>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">Tiền Cọc Hợp Đồng (VNĐ) *</label>
                  <input
                    type="number"
                    value={upgradeForm.targetContractAmount}
                    onChange={(e) => {
                      setUpgradeForm({ ...upgradeForm, targetContractAmount: e.target.value });
                      setIsFormDirty(true);
                    }}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>

                {/* Additional Required Amount Banner */}
                <div className="p-3.5 bg-amber-500/10 border border-amber-300/80 rounded-xl flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-black text-amber-700 tracking-wider block truncate">
                      Số Tiền Thu Bổ Sung
                    </span>
                    <span className="text-lg sm:text-xl font-black text-amber-900 leading-none mt-1 block whitespace-nowrap">
                      +{upgradeForm.additionalAmount.toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-amber-600 shrink-0" />
                </div>
              </div>

              {/* 3 Payment Methods Selector */}
              <div className="space-y-2">
                <label className="block text-[11px] font-extrabold text-zinc-700 uppercase tracking-wider">
                  Chọn Phương Thức Thu Tiền &amp; Xác Nhận Nâng Cọc:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Method 1: VietQR Auto Webhook */}
                  <button
                    type="button"
                    onClick={() => setUpgradeCollectionMethod("vietqr")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${upgradeCollectionMethod === "vietqr"
                      ? "bg-[#2AC1BC]/10 border-[#2AC1BC] ring-2 ring-[#2AC1BC]/20 text-[#2AC1BC]"
                      : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-600"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <Smartphone className="w-4 h-4 text-[#2AC1BC]" />
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-[#2AC1BC]/20 text-[#2AC1BC]">Tự động</span>
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-zinc-900">1. VietQR Hệ Thống</div>
                      <div className="text-[10px] text-zinc-500 font-medium leading-tight mt-0.5">Tự động nâng cọc HĐ ngay khi tiền về</div>
                    </div>
                  </button>

                  {/* Method 2: Zalo / SMS Manual */}
                  <button
                    type="button"
                    onClick={() => setUpgradeCollectionMethod("zalo_sms")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${upgradeCollectionMethod === "zalo_sms"
                      ? "bg-blue-50 border-blue-400 ring-2 ring-blue-400/20 text-blue-700"
                      : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-600"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <Send className="w-4 h-4 text-blue-600" />
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700">Chuyển khoản</span>
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-zinc-900">2. Nhắc Zalo / SMS</div>
                      <div className="text-[10px] text-zinc-500 font-medium leading-tight mt-0.5">Kèm STK chủ trọ, bấm xác nhận sau</div>
                    </div>
                  </button>

                  {/* Method 3: Cash Manual */}
                  <button
                    type="button"
                    onClick={() => setUpgradeCollectionMethod("cash")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${upgradeCollectionMethod === "cash"
                      ? "bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/20 text-emerald-700"
                      : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-600"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700">Trực tiếp</span>
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-zinc-900">3. Thu Tiền Mặt</div>
                      <div className="text-[10px] text-zinc-500 font-medium leading-tight mt-0.5">Chủ trọ nhận tiền mặt &amp; ấn xác nhận</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Method Detail Guidelines */}
              {upgradeCollectionMethod === "vietqr" && (
                <div className="p-3.5 bg-[#2AC1BC]/10 border border-[#2AC1BC]/30 rounded-2xl space-y-2.5 text-[#0f5351]">
                  <p className="text-[11px] font-bold">
                    Nhấp nút để gửi mã VietQR thu tiền <strong className="whitespace-nowrap">+{upgradeForm.additionalAmount.toLocaleString("vi-VN")} ₫</strong> đến Người Thuê Trọ qua Chat.
                  </p>
                  <p className="text-[11px] font-bold">
                    Hệ thống sẽ <strong>TỰ ĐỘNG XÁC NHẬN &amp; NÂNG CỌC HĐ</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      router.push(
                        `/landlord/messages?room=${encodeURIComponent(showUpgradeModal.roomId)}&tenant=${encodeURIComponent(showUpgradeModal.tenantName)}&depId=${encodeURIComponent(showUpgradeModal.id)}&amount=${upgradeForm.additionalAmount}&autoSend=true&type=upgrade`
                      );
                    }}
                    className="w-full py-3 px-3 bg-[#2AC1BC] hover:bg-[#25ad87] text-white font-black text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
                  >
                    <Smartphone className="w-4 h-4 shrink-0" />
                    <span>Gửi Mã VietQR Qua Chat (Tự Động Nâng Cọc)</span>
                  </button>
                </div>
              )}

              {upgradeCollectionMethod === "zalo_sms" && (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl space-y-3 text-blue-900">
                  <p className="text-[11px] font-bold leading-relaxed">
                    Sao chép mẫu tin nhắn đã soạn sẵn STK ngân hàng của Chủ trọ, sau đó
                    mở trực tiếp Zalo hoặc tin nhắn SMS của số điện thoại <strong>{showUpgradeModal.tenantName}</strong> ({showUpgradeModal.tenantPhone}).
                  </p>


                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Direct Zalo Link */}
                    <button
                      type="button"
                      onClick={() => {
                        const text = `[DORMIO] Thong bao thu bo sung tien coc hop dong.\nPhong: ${showUpgradeModal.roomName} - Khach: ${showUpgradeModal.tenantName}\nSo tien can thu bo sung: +${upgradeForm.additionalAmount.toLocaleString("vi-VN")} VND.\nSTK MB Bank: 9999888899 - CHU TRO DORMIO\nNoi dung CK: COC ${showUpgradeModal.roomName} ${showUpgradeModal.tenantPhone}`;
                        navigator.clipboard.writeText(text);
                        const cleanPhone = showUpgradeModal.tenantPhone.replace(/\D/g, "");
                        window.open(`https://zalo.me/${cleanPhone}`, "_blank");
                      }}
                      className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                      title="Mở Zalo trực tiếp của người thuê"
                    >
                      <Send className="w-4 h-4" /> Mở Zalo ({showUpgradeModal.tenantPhone})
                    </button>

                    {/* Direct SMS Link */}
                    <button
                      type="button"
                      onClick={() => {
                        const text = `[DORMIO] Thong bao thu bo sung tien coc hop dong. Phong: ${showUpgradeModal.roomName} - Khach: ${showUpgradeModal.tenantName}. So tien can thu bo sung: +${upgradeForm.additionalAmount.toLocaleString("vi-VN")} VND. STK MB Bank: 9999888899 (CHU TRO DORMIO). Noi dung CK: COC ${showUpgradeModal.roomName}`;
                        const cleanPhone = showUpgradeModal.tenantPhone.replace(/\D/g, "");
                        window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(text)}`;
                      }}
                      className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                      title="Gửi SMS trực tiếp"
                    >
                      <Smartphone className="w-4 h-4" /> Gửi Tin Nhắn SMS
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowZaloModal(true)}
                    className="w-full py-2 bg-blue-100 hover:bg-blue-200 text-blue-900 font-extrabold text-[11px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" /> Xem Mẫu Tin Nhắn &amp; Sao Chép
                  </button>
                </div>
              )}

              {upgradeCollectionMethod === "cash" && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 space-y-1">
                  <p className="text-[11px] font-bold">
                    Người thuê trọ đóng trực tiếp tiền mặt <strong>+{upgradeForm.additionalAmount.toLocaleString("vi-VN")} ₫</strong>.
                  </p>
                  <p className="text-[11px] font-bold">
                    Chủ trọ bấm nút <strong>[Xác Nhận Đã Thu &amp; Nâng Cọc HĐ]</strong> bên dưới.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-100 bg-white flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => requestCloseModal("upgrade")}
                className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl cursor-pointer text-center"
              >
                Hủy
              </button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {upgradeCollectionMethod === "vietqr" && (
                  <span className="text-[10px] text-zinc-400 font-medium italic text-center sm:text-right">
                    VietQR tự động xác nhận khi tiền về
                  </span>
                )}
                <button
                  type="button"
                  disabled={upgradeCollectionMethod === "vietqr"}
                  onClick={handleConfirmUpgradeToContract}
                  title={
                    upgradeCollectionMethod === "vietqr"
                      ? "VietQR tự động xác nhận nâng cọc khi tiền về tài khoản, không cần bấm xác nhận thủ công"
                      : "Xác nhận đã thu đủ tiền và nâng thành Cọc Hợp Đồng"
                  }
                  className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 text-center ${upgradeCollectionMethod === "vietqr"
                    ? "bg-zinc-200 text-zinc-400 border border-zinc-300 cursor-not-allowed opacity-40 shadow-none select-none"
                    : "bg-amber-500 hover:bg-amber-600 text-white cursor-pointer shadow-md"
                    }`}
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Xác Nhận Đã Thu &amp; Nâng Cọc HĐ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2.1 ZALO / SMS TEMPLATE MODAL */}
      {showZaloModal && showUpgradeModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowZaloModal(false);
          }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl cursor-default animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2 text-blue-600">
                <Send className="w-5 h-5" />
                <h3 className="font-extrabold text-base text-zinc-900">Mẫu Tin Nhắn Zalo / SMS</h3>
              </div>
              <button onClick={() => setShowZaloModal(false)} className="text-zinc-400 hover:text-zinc-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-500 font-semibold">
              Sao chép nội dung tin nhắn dưới đây để gửi cho khách <strong>{showUpgradeModal.tenantName}</strong> ({showUpgradeModal.tenantPhone}) qua Zalo hoặc SMS:
            </p>

            <div className="p-3 bg-zinc-900 text-zinc-100 rounded-2xl text-xs font-mono space-y-2 relative border border-zinc-800">
              <p>
                [DORMIO] Thong bao thu bo sung tien coc hop dong.
                <br />
                Phong: {showUpgradeModal.roomName} - Khach: {showUpgradeModal.tenantName}
                <br />
                So tien can thu bo sung: +{upgradeForm.additionalAmount.toLocaleString("vi-VN")} VND.
                <br />
                ------------------------
                <br />
                STK Ngan Hang Chu Tro:
                <br />
                • Ngan hang: MB Bank (Ngan hang Quan Doi)
                <br />
                • So tai khoan: 9999888899
                <br />
                • Chu tai khoan: CHU TRO DORMIO
                <br />
                • Noi dung CK: COC {showUpgradeModal.roomName} {showUpgradeModal.tenantPhone}
                <br />
                Xin cam on!
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const text = `[DORMIO] Thong bao thu bo sung tien coc hop dong.\nPhong: ${showUpgradeModal.roomName} - Khach: ${showUpgradeModal.tenantName}\nSo tien can thu bo sung: +${upgradeForm.additionalAmount.toLocaleString("vi-VN")} VND.\nSTK MB Bank: 9999888899 - CHU TRO DORMIO\nNoi dung CK: COC ${showUpgradeModal.roomName} ${showUpgradeModal.tenantPhone}`;
                  navigator.clipboard.writeText(text);
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2000);
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {copySuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Send className="w-4 h-4" />}
                {copySuccess ? "Đã sao chép tin nhắn!" : "Sao Chép Tin Nhắn Zalo / SMS"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. CREATE NEW DEPOSIT MODAL */}
      {showCreateModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) requestCloseModal("create");
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl cursor-default animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-2xl">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-zinc-900">Thêm Khoản Đặt Cọc Mới</h3>
                  <p className="text-xs text-zinc-500 font-semibold">Tạo khoản Cọc Giữ Chỗ hoặc Cọc Hợp Đồng</p>
                </div>
              </div>

              <button
                onClick={() => requestCloseModal("create")}
                className="p-2 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-200/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">Số Phòng *</label>
                  <input
                    type="text"
                    value={newDepositForm.roomName}
                    onChange={(e) => {
                      setNewDepositForm({ ...newDepositForm, roomName: e.target.value });
                      setIsFormDirty(true);
                    }}
                    placeholder="Ví dụ: 103"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">Loại Đặt Cọc (2 Loại) *</label>
                  <select
                    value={newDepositForm.depositType}
                    onChange={(e) => {
                      setNewDepositForm({ ...newDepositForm, depositType: e.target.value as any });
                      setIsFormDirty(true);
                    }}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  >
                    <option value="Cọc giữ chỗ">Cọc giữ chỗ (Chờ hẹn lịch chốt HĐ)</option>
                    <option value="Cọc hợp đồng">Cọc hợp đồng (Đã ký hợp đồng thuê)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">Tên Người Đặt Cọc *</label>
                  <input
                    type="text"
                    value={newDepositForm.tenantName}
                    onChange={(e) => {
                      setNewDepositForm({ ...newDepositForm, tenantName: e.target.value });
                      setIsFormDirty(true);
                    }}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">Số Điện Thoại *</label>
                  <input
                    type="text"
                    value={newDepositForm.tenantPhone}
                    onChange={(e) => {
                      setNewDepositForm({ ...newDepositForm, tenantPhone: e.target.value });
                      setIsFormDirty(true);
                    }}
                    placeholder="0988xxxxxx"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">Số Tiền Đặt Cọc (VNĐ) *</label>
                  <input
                    type="number"
                    value={newDepositForm.amount}
                    onChange={(e) => {
                      setNewDepositForm({ ...newDepositForm, amount: e.target.value });
                      setIsFormDirty(true);
                    }}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">Thời Hạn Hết Cọc / Chốt HĐ</label>
                  <input
                    type="date"
                    value={newDepositForm.expiryDate}
                    onChange={(e) => {
                      setNewDepositForm({ ...newDepositForm, expiryDate: e.target.value });
                      setIsFormDirty(true);
                    }}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">Ghi Chú Ban Đầu</label>
                <textarea
                  rows={3}
                  value={newDepositForm.note}
                  onChange={(e) => {
                    setNewDepositForm({ ...newDepositForm, note: e.target.value });
                    setIsFormDirty(true);
                  }}
                  placeholder="Ghi chú điều kiện giữ cọc hoặc thỏa thuận thu thêm..."
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-medium text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                />
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 bg-white flex items-center justify-end gap-2">
              <button
                onClick={() => requestCloseModal("create")}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateDeposit}
                className="px-5 py-2 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-black rounded-xl shadow-md cursor-pointer"
              >
                Lưu Khoản Đặt Cọc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. UNIFIED REFUND & DEDUCTION DEPOSIT MODAL */}
      {showRefundModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) requestCloseModal("refund");
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl cursor-default animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-white to-purple-50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-600/10 text-purple-600 rounded-2xl shadow-xs">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-zinc-900">Hoàn &amp; Khấu Trừ Tiền Cọc</h3>
                  <p className="text-xs text-zinc-500 font-semibold">{showRefundModal.roomName} • {showRefundModal.tenantName}</p>
                </div>
              </div>

              <button
                onClick={() => requestCloseModal("refund")}
                className="p-2 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-200/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar text-xs">
              {/* Held Amount Banner */}
              <div className="p-4 bg-gradient-to-r from-purple-500/10 via-zinc-50 to-purple-500/10 border border-purple-200/80 rounded-2xl flex items-center justify-between gap-2 text-xs">
                <span className="text-zinc-600 font-semibold truncate">Số tiền cọc ban đầu hiện giữ:</span>
                <span className="font-black text-purple-900 text-sm sm:text-base whitespace-nowrap">{showRefundModal.amount.toLocaleString("vi-VN")} ₫</span>
              </div>

              {/* Deduction Amount Input */}
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700">
                    Số Tiền Khấu Trừ (VNĐ)
                  </label>
                </div>

                <input
                  type="number"
                  value={refundForm.deductedAmount}
                  onChange={(e) => {
                    setRefundForm({ ...refundForm, deductedAmount: e.target.value });
                    setIsFormDirty(true);
                  }}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 bg-rose-50/50 border border-rose-200 rounded-xl font-black text-rose-900 text-base focus:outline-none focus:border-rose-500 focus:bg-white transition-all"
                />

                {/* Quick Presets Pills (3-Column Grid) */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Chọn Nhanh Số Tiền Khấu Trừ:</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRefundForm({ ...refundForm, deductedAmount: "0" });
                        setIsFormDirty(true);
                      }}
                      className={`py-2 px-1 text-center font-black rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center leading-tight ${refundForm.deductedAmount === "0"
                        ? "bg-purple-600 text-white shadow-2xs"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                        }`}
                    >
                      <span className="text-[11px] sm:text-xs whitespace-nowrap">Hoàn 100%</span>
                      <span className="text-[9px] font-bold opacity-80 whitespace-nowrap">(0 ₫)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRefundForm({ ...refundForm, deductedAmount: String(showRefundModal.amount / 2) });
                        setIsFormDirty(true);
                      }}
                      className={`py-2 px-1 text-center font-black rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center leading-tight ${Number(refundForm.deductedAmount) === showRefundModal.amount / 2
                        ? "bg-amber-500 text-white shadow-2xs"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                        }`}
                    >
                      <span className="text-[11px] sm:text-xs whitespace-nowrap">Trừ 50%</span>
                      <span className="text-[9px] font-bold opacity-80 whitespace-nowrap">({(showRefundModal.amount / 2).toLocaleString("vi-VN")} ₫)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRefundForm({ ...refundForm, deductedAmount: String(showRefundModal.amount) });
                        setIsFormDirty(true);
                      }}
                      className={`py-2 px-1 text-center font-black rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center leading-tight ${Number(refundForm.deductedAmount) === showRefundModal.amount
                        ? "bg-rose-600 text-white shadow-2xs"
                        : "bg-rose-100 hover:bg-rose-200 text-rose-700"
                        }`}
                    >
                      <span className="text-[11px] sm:text-xs whitespace-nowrap">Trừ 100%</span>
                      <span className="text-[9px] font-bold opacity-80 whitespace-nowrap">({showRefundModal.amount.toLocaleString("vi-VN")} ₫)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Deduction Reason Input */}
              {Number(refundForm.deductedAmount) > 0 && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  <label className="block text-[11px] font-extrabold text-rose-800">Lý Do Khấu Trừ *</label>
                  <textarea
                    rows={2}
                    value={refundForm.deductionReason}
                    onChange={(e) => {
                      setRefundForm({ ...refundForm, deductionReason: e.target.value });
                      setIsFormDirty(true);
                    }}
                    placeholder="Nhập chi tiết lý do khấu trừ (Hư hại sofa, làm bẩn sơn tường, vi phạm điều khoản...)"
                    className="w-full px-3 py-2 bg-rose-50/40 border border-rose-200 rounded-xl font-medium text-rose-950 focus:outline-none focus:border-rose-500 text-xs"
                  />
                </div>
              )}

              {/* Refund Note Input */}
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-zinc-700">Ghi Chú Hoàn Cọc</label>
                <textarea
                  rows={2}
                  value={refundForm.note}
                  onChange={(e) => {
                    setRefundForm({ ...refundForm, note: e.target.value });
                    setIsFormDirty(true);
                  }}
                  placeholder="Phương thức hoàn tiền (Chuyển khoản VietQR / Tiền mặt...)"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-medium text-zinc-900 focus:outline-none focus:border-purple-500 text-xs"
                />
              </div>

              {/* Real-time Calculation Summary Card */}
              {(() => {
                const deductAmt = Math.min(showRefundModal.amount, Math.max(0, Number(refundForm.deductedAmount) || 0));
                const actualRefund = Math.max(0, showRefundModal.amount - deductAmt);

                return (
                  <div className="p-4 bg-gradient-to-br from-purple-50 via-white to-purple-50/80 border border-purple-200 rounded-2xl space-y-2 text-xs shadow-2xs">
                    <div className="flex justify-between items-center text-zinc-600">
                      <span>Số tiền cọc ban đầu:</span>
                      <span className="font-bold text-zinc-900 whitespace-nowrap">{showRefundModal.amount.toLocaleString("vi-VN")} ₫</span>
                    </div>

                    {deductAmt > 0 && (
                      <div className="flex justify-between items-center text-rose-700 font-bold border-t border-purple-200/60 pt-1.5">
                        <span>Khấu trừ vi phạm / hư hại:</span>
                        <span className="font-black whitespace-nowrap">-{deductAmt.toLocaleString("vi-VN")} ₫</span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-purple-900 font-black text-xs sm:text-sm border-t border-purple-200 pt-2">
                      <span>Số tiền thực tế hoàn trả cho khách:</span>
                      <span className="text-base sm:text-lg text-purple-700 whitespace-nowrap">{actualRefund.toLocaleString("vi-VN")} ₫</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-100 bg-white flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => requestCloseModal("refund")}
                className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl cursor-pointer text-center"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleRefundDeposit}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01]"
              >
                <Check className="w-4 h-4" /> Xác Nhận Hoàn &amp; Khấu Trừ Cọc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Rule #10: Unsaved Changes Pop-up Confirmation Modal */}
      {confirmCloseTarget && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmCloseTarget(null);
          }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl cursor-default animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-zinc-900">Xác Nhận Đóng Form</h3>
            </div>

            <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
              Bạn đang có thông tin nhập dở chưa lưu. Bạn có chắc chắn muốn thoát và hủy bỏ các thay đổi?
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmCloseTarget(null)}
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Tiếp tục chỉnh sửa
              </button>
              <button
                onClick={handleConfirmCloseModal}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
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

export default function DepositsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-zinc-400">Đang tải dữ liệu tiền cọc...</div>}>
      <DepositsContent />
    </Suspense>
  );
}

export default function DepositsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-zinc-400">Đang tải dữ liệu tiền cọc...</div>}>
      <DepositsContent />
    </Suspense>
  );
}
