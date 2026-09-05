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
import { useTranslations, useLanguage } from "@/context/LanguageContext";
import { formatCurrency } from "@/utils";

export type DepositType = "holding" | "contract";
export type DepositStatus = "holding" | "refunded" | "deducted";

export interface DepositItem {
  id: string;
  roomId: string;
  roomName: string;
  buildingName: string;
  tenantName: string;
  tenantPhone: string;
  depositType: DepositType;
  amount: number;
  originalAmount: number;
  depositDate: string;
  expiryDate: string;
  status: DepositStatus;
  isDeductedPartially?: boolean;
  deductedAmount?: number;
  refundAmount?: number;
  deductionReason?: string;
  convertedAt?: string;
  additionalPaidAmount?: number;
  note?: string;
}

const initialDeposits: DepositItem[] = [
  // 10 Items for Holding Deposit ("holding")
  {
    id: "DEP-202608-102",
    roomId: "102",
    roomName: "102",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Trần Thị Mai",
    tenantPhone: "0977234567",
    depositType: "holding",
    amount: 1000000,
    originalAmount: 1000000,
    depositDate: "15/08/2026",
    expiryDate: "25/08/2026",
    status: "holding",
    isDeductedPartially: false,
    note: "Cọc giữ chỗ hẹn chốt hợp đồng. Cần thu bổ sung 2.000.000 ₫ để nâng lên Cọc Hợp Đồng.",
  },
  {
    id: "DEP-202608-104",
    roomId: "104",
    roomName: "104",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Bùi Phương Thảo",
    tenantPhone: "0935888999",
    depositType: "holding",
    amount: 1500000,
    originalAmount: 1500000,
    depositDate: "20/08/2026",
    expiryDate: "02/09/2026",
    status: "holding",
    isDeductedPartially: false,
    note: "Cọc giữ chỗ hẹn dọn vào đầu tháng 9. Dự kiến cọc HĐ: 4.500.000 ₫",
  },
  {
    id: "DEP-202608-202",
    roomId: "202",
    roomName: "202",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Phạm Minh Anh",
    tenantPhone: "0933456789",
    depositType: "holding",
    amount: 0,
    originalAmount: 2000000,
    depositDate: "01/08/2026",
    expiryDate: "10/08/2026",
    status: "refunded",
    isDeductedPartially: false,
    refundAmount: 2000000,
    note: "Đã hoàn cọc 100% (2.000.000 ₫) do khách không dọn vào đúng cam kết",
  },
  {
    id: "DEP-202608-204",
    roomId: "204",
    roomName: "204",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Võ Gia Huy",
    tenantPhone: "0912333444",
    depositType: "holding",
    amount: 2000000,
    originalAmount: 2000000,
    depositDate: "22/08/2026",
    expiryDate: "30/08/2026",
    status: "holding",
    isDeductedPartially: false,
    note: "Cọc giữ chỗ trực tuyến qua Sàn BHRP. Chờ ký hợp đồng trực tiếp.",
  },
  {
    id: "DEP-202608-302",
    roomId: "302",
    roomName: "302",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Ngô Thanh Hương",
    tenantPhone: "0966677889",
    depositType: "holding",
    amount: 0,
    originalAmount: 3000000,
    depositDate: "05/08/2026",
    expiryDate: "12/08/2026",
    status: "deducted",
    isDeductedPartially: true,
    deductedAmount: 3000000,
    refundAmount: 0,
    deductionReason: "Bỏ cọc sau quá hạn 10 ngày không đến ký hợp đồng. Khấu trừ 100% tiền cọc.",
    note: "Khách bùng cọc",
  },
  {
    id: "DEP-202608-304",
    roomId: "304",
    roomName: "304",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Phan Văn Việt",
    tenantPhone: "0903444555",
    depositType: "holding",
    amount: 0,
    originalAmount: 1500000,
    depositDate: "10/07/2026",
    expiryDate: "17/07/2026",
    status: "refunded",
    isDeductedPartially: false,
    refundAmount: 1500000,
    note: "Hoàn cọc giữ chỗ 100% do phòng bận sửa chữa ống nước",
  },
  {
    id: "DEP-202608-402",
    roomId: "402",
    roomName: "402",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Dương Minh Triết",
    tenantPhone: "0938555666",
    depositType: "holding",
    amount: 2000000,
    originalAmount: 2500000,
    depositDate: "25/08/2026",
    expiryDate: "05/09/2026",
    status: "holding",
    isDeductedPartially: true,
    deductedAmount: 500000,
    deductionReason: "Trừ 500.000 ₫ tiền vi phạm đổi ngày hẹn giữ phòng quá 2 lần (Vẫn giữ 2.000.000 ₫ còn lại)",
    note: "Cọc giữ chỗ (Hiển thị 2 nhãn: Đang giữ + Đã khấu trừ)",
  },
  {
    id: "DEP-202608-502",
    roomId: "502",
    roomName: "502",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Lâm Hoài Thương",
    tenantPhone: "0909123456",
    depositType: "holding",
    amount: 0,
    originalAmount: 1800000,
    depositDate: "28/08/2026",
    expiryDate: "10/09/2026",
    status: "refunded",
    isDeductedPartially: true,
    deductedAmount: 500000,
    refundAmount: 1300000,
    deductionReason: "Trừ 500.000 ₫ chi phí hủy giữ chỗ sát giờ. Hoàn trả 1.300.000 ₫ còn lại.",
    note: "Cọc giữ chỗ (Hiển thị 2 nhãn: Đã hoàn + Đã khấu trừ)",
  },
  {
    id: "DEP-202608-504",
    roomId: "504",
    roomName: "504",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Trương Tấn Sang",
    tenantPhone: "0988777666",
    depositType: "holding",
    amount: 0,
    originalAmount: 2000000,
    depositDate: "15/07/2026",
    expiryDate: "22/07/2026",
    status: "refunded",
    isDeductedPartially: false,
    refundAmount: 2000000,
    note: "Khách đổi lịch công tác không thuê nữa. Đã hoàn 100% tiền cọc giữ chỗ.",
  },
  {
    id: "DEP-202608-602",
    roomId: "602",
    roomName: "602",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Cao Thùy Trang",
    tenantPhone: "0934111222",
    depositType: "holding",
    amount: 0,
    originalAmount: 2500000,
    depositDate: "02/08/2026",
    expiryDate: "10/08/2026",
    status: "deducted",
    isDeductedPartially: true,
    deductedAmount: 2500000,
    refundAmount: 0,
    deductionReason: "Quá hạn 15 ngày không tới ký hợp đồng và không liên lạc được. Khấu trừ 100% cọc.",
    note: "Khách hủy lịch không thông báo",
  },

  // 10 Items for Contract Deposit ("contract")
  {
    id: "DEP-202608-101",
    roomId: "101",
    roomName: "101",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Nguyễn Văn Tuấn",
    tenantPhone: "0988123456",
    depositType: "contract",
    amount: 3500000,
    originalAmount: 3500000,
    depositDate: "10/08/2026",
    expiryDate: "10/08/2027",
    status: "holding",
    isDeductedPartially: false,
    note: "Tiền cọc bảo đảm hợp đồng 12 tháng chính thức",
  },
  {
    id: "DEP-202608-103",
    roomId: "103",
    roomName: "103",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Đỗ Quốc Bảo",
    tenantPhone: "0905123987",
    depositType: "contract",
    amount: 4000000,
    originalAmount: 1500000,
    depositDate: "05/08/2026",
    expiryDate: "05/08/2027",
    status: "holding",
    isDeductedPartially: false,
    convertedAt: "12/08/2026",
    additionalPaidAmount: 2500000,
    note: "Đã nâng cấp thành công từ Cọc giữ chỗ (Thu bổ sung 2.500.000 ₫ ngày 12/08/2026)",
  },
  {
    id: "DEP-202608-201",
    roomId: "201",
    roomName: "201",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Lê Hoàng Nam",
    tenantPhone: "0911345678",
    depositType: "contract",
    amount: 3000000,
    originalAmount: 4000000,
    depositDate: "01/06/2026",
    expiryDate: "01/06/2027",
    status: "holding",
    isDeductedPartially: true,
    deductedAmount: 1000000,
    deductionReason: "Trừ 1.000.000 ₫ tiền vi phạm quy định làm hư hại cửa kính (Vẫn tiếp tục giữ 3.000.000 ₫ còn lại)",
    note: "Hợp đồng 1 năm (Khấu trừ 1.000.000 ₫ cửa kính, giữ 3.000.000 ₫ còn lại)",
  },
  {
    id: "DEP-202608-203",
    roomId: "203",
    roomName: "203",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Vũ Hải Yến",
    tenantPhone: "0978666555",
    depositType: "contract",
    amount: 5000000,
    originalAmount: 5000000,
    depositDate: "15/05/2026",
    expiryDate: "15/05/2028",
    status: "holding",
    isDeductedPartially: false,
    note: "Cọc hợp đồng 2 năm phòng VIP ban công",
  },
  {
    id: "DEP-202608-301",
    roomId: "301",
    roomName: "301",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Hoàng Đức Trí",
    tenantPhone: "0944567890",
    depositType: "contract",
    amount: 0,
    originalAmount: 4500000,
    depositDate: "01/01/2026",
    expiryDate: "01/08/2026",
    status: "refunded",
    isDeductedPartially: true,
    deductedAmount: 1500000,
    refundAmount: 3000000,
    deductionReason: "Khấu trừ 1.500.000 ₫ chi phí móp tủ lạnh & sơn lại tường. Hoàn trả 3.000.000 ₫ còn lại.",
    note: "Thanh lý hợp đồng đúng hạn (Hoàn 3.000.000 ₫ + Khấu trừ 1.500.000 ₫)",
  },
  {
    id: "DEP-202608-303",
    roomId: "303",
    roomName: "303",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Đặng Khánh Linh",
    tenantPhone: "0987111222",
    depositType: "contract",
    amount: 4500000,
    originalAmount: 4500000,
    depositDate: "01/07/2026",
    expiryDate: "01/07/2027",
    status: "holding",
    isDeductedPartially: false,
    note: "Hợp đồng 12 tháng tiêu chuẩn",
  },
  {
    id: "DEP-202608-401",
    roomId: "401",
    roomName: "401",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Nguyễn Khánh An",
    tenantPhone: "0971222333",
    depositType: "contract",
    amount: 0,
    originalAmount: 5000000,
    depositDate: "01/03/2026",
    expiryDate: "01/03/2027",
    status: "deducted",
    isDeductedPartially: true,
    deductedAmount: 5000000,
    refundAmount: 0,
    deductionReason: "Đơn phương chấm dứt hợp đồng trước hạn không báo trước. Khấu trừ 100% tiền cọc theo điều khoản.",
    note: "Bùng hợp đồng trước hạn",
  },
  {
    id: "DEP-202608-403",
    roomId: "403",
    roomName: "403",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Trịnh Kim Ngân",
    tenantPhone: "0919777888",
    depositType: "contract",
    amount: 3800000,
    originalAmount: 3800000,
    depositDate: "12/04/2026",
    expiryDate: "12/04/2027",
    status: "holding",
    isDeductedPartially: false,
    note: "Hợp đồng thuê 1 năm",
  },
  {
    id: "DEP-202608-501",
    roomId: "501",
    roomName: "501",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Hồ Quang Hiếu",
    tenantPhone: "0982999000",
    depositType: "contract",
    amount: 6000000,
    originalAmount: 6000000,
    depositDate: "01/02/2026",
    expiryDate: "01/02/2028",
    status: "holding",
    isDeductedPartially: false,
    note: "Tiền cọc căn Studio Penthouse tầng 5 cao cấp",
  },
  {
    id: "DEP-202608-503",
    roomId: "503",
    roomName: "503",
    buildingName: "Dormio Premier Quận 1",
    tenantName: "Tạ Mỹ Duyên",
    tenantPhone: "0908333222",
    depositType: "contract",
    amount: 0,
    originalAmount: 4200000,
    depositDate: "10/02/2026",
    expiryDate: "10/08/2026",
    status: "refunded",
    isDeductedPartially: false,
    refundAmount: 4200000,
    note: "Thanh lý hợp đồng 6 tháng đúng hạn, hoàn trả 100% tiền cọc 4.200.000 ₫",
  },
];

function DepositsContent() {
  const t = useTranslations("deposits");
  const { locale } = useLanguage();
  const { activeBuilding } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [depositsList, setDepositsList] = useState<DepositItem[]>(initialDeposits);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid"); // Rule #9: Grid is ALWAYS default

  const [selectedDepositTypeTab, setSelectedDepositTypeTab] = useState<DepositType>("holding");
  const [activeStatusTab, setActiveStatusTab] = useState<"all" | DepositStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination states (Rule #9: Grid=6, Table=10)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [selectedDeposit, setSelectedDeposit] = useState<DepositItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<DepositItem | null>(null);
  const [showRefundModal, setShowRefundModal] = useState<DepositItem | null>(null);

  // Form dirty states & Confirmation Modal (Rule #10)
  const [isCreateDirty, setIsCreateDirty] = useState(false);
  const [isUpgradeDirty, setIsUpgradeDirty] = useState(false);
  const [isRefundDirty, setIsRefundDirty] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onDiscard: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onDiscard: () => {},
  });

  // Forms data
  const [createForm, setCreateForm] = useState({
    roomId: "105",
    roomName: "105",
    tenantName: "",
    tenantPhone: "",
    depositType: "holding" as DepositType,
    amount: "1500000",
    depositDate: new Date().toLocaleDateString("vi-VN"),
    expiryDate: "",
    note: "",
  });

  const [upgradeForm, setUpgradeForm] = useState({
    additionalAmount: 2000000,
    paymentMethod: "vietqr" as "vietqr" | "cash",
    note: "",
  });

  const [refundForm, setRefundForm] = useState({
    refundType: "full" as "full" | "partial" | "forfeit",
    deductedAmount: "0",
    deductionReason: "",
    note: "",
  });

  // Switch itemsPerPage when changing view mode (Rule #9)
  const handleViewModeChange = (mode: "grid" | "table") => {
    setViewMode(mode);
    setItemsPerPage(mode === "grid" ? 6 : 10);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  // Switch Deposit Type Tab
  const handleDepositTypeTabChange = (type: DepositType) => {
    setSelectedDepositTypeTab(type);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  // Close modals with Rule #10 confirmation popup check
  const requestCloseCreateModal = () => {
    if (isCreateDirty) {
      setConfirmModal({
        isOpen: true,
        title: locale === "en" ? "Discard Unsaved Changes?" : "Xác nhận đóng form",
        message: locale === "en"
          ? "You have unsaved form data. Discarding will lose all inputs."
          : "Bạn đang có thông tin chưa lưu. Bạn có chắc chắn muốn đóng và hủy bỏ các thông tin đã nhập?",
        onDiscard: () => {
          setIsCreateDirty(false);
          setShowCreateModal(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        },
      });
    } else {
      setShowCreateModal(false);
    }
  };

  const requestCloseUpgradeModal = () => {
    if (isUpgradeDirty) {
      setConfirmModal({
        isOpen: true,
        title: locale === "en" ? "Discard Upgrade Draft?" : "Xác nhận đóng form",
        message: locale === "en"
          ? "You have unsaved upgrade changes. Discarding will close this modal."
          : "Bạn có thông tin nâng cấp cọc chưa lưu. Bạn có chắc chắn muốn đóng?",
        onDiscard: () => {
          setIsUpgradeDirty(false);
          setShowUpgradeModal(null);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        },
      });
    } else {
      setShowUpgradeModal(null);
    }
  };

  const requestCloseRefundModal = () => {
    if (isRefundDirty) {
      setConfirmModal({
        isOpen: true,
        title: locale === "en" ? "Discard Refund Process?" : "Xác nhận đóng form",
        message: locale === "en"
          ? "You have unsaved deduction/refund inputs. Discarding will close this modal."
          : "Bạn có thông tin quyết toán cọc chưa lưu. Bạn có chắc chắn muốn đóng?",
        onDiscard: () => {
          setIsRefundDirty(false);
          setShowRefundModal(null);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        },
      });
    } else {
      setShowRefundModal(null);
    }
  };

  // Filtered deposits
  const filteredDeposits = depositsList.filter((item) => {
    // 1. By deposit type
    if (item.depositType !== selectedDepositTypeTab) return false;

    // 2. By status tab
    if (activeStatusTab !== "all" && item.status !== activeStatusTab) return false;

    // 3. By search keyword
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchRoom = item.roomName.toLowerCase().includes(q);
      const matchTenant = item.tenantName.toLowerCase().includes(q);
      const matchPhone = item.tenantPhone.includes(q);
      const matchCode = item.id.toLowerCase().includes(q);
      if (!matchRoom && !matchTenant && !matchPhone && !matchCode) return false;
    }

    return true;
  });

  // Pagination calculation (Rule #9)
  const totalItems = filteredDeposits.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedItems = filteredDeposits.slice(startIndex, endIndex);

  // Pagination window jump by 5 (Rule #9)
  const windowSize = 5;
  const currentWindowIndex = Math.floor((validCurrentPage - 1) / windowSize);
  const windowStart = currentWindowIndex * windowSize + 1;
  const windowEnd = Math.min(windowStart + windowSize - 1, totalPages);
  const visiblePageNumbers = [];
  for (let i = windowStart; i <= windowEnd; i++) {
    visiblePageNumbers.push(i);
  }

  // Select all applies to current page items only (Rule #9)
  const isAllCurrentPageSelected =
    paginatedItems.length > 0 &&
    paginatedItems.every((item) => selectedIds.includes(item.id));

  const handleToggleSelectAll = () => {
    if (isAllCurrentPageSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !paginatedItems.some((item) => item.id === id))
      );
    } else {
      const pageIds = paginatedItems.map((item) => item.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // KPIs
  const totalActiveHeldAmount = depositsList
    .filter((d) => d.status === "holding")
    .reduce((sum, d) => sum + d.amount, 0);

  const totalContractUpgraded = depositsList
    .filter((d) => d.depositType === "contract")
    .reduce((sum, d) => sum + d.amount, 0);

  const totalRefundedAmount = depositsList
    .filter((d) => d.status === "refunded")
    .reduce((sum, d) => sum + (d.refundAmount || d.originalAmount), 0);

  const totalDeductedAmount = depositsList
    .filter((d) => d.isDeductedPartially || d.status === "deducted")
    .reduce((sum, d) => sum + (d.deductedAmount || 0), 0);

  // Submission handlers
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: DepositItem = {
      id: `DEP-${Date.now().toString().slice(-6)}`,
      roomId: createForm.roomId,
      roomName: createForm.roomName,
      buildingName: activeBuilding.name,
      tenantName: createForm.tenantName,
      tenantPhone: createForm.tenantPhone,
      depositType: createForm.depositType,
      amount: Number(createForm.amount) || 0,
      originalAmount: Number(createForm.amount) || 0,
      depositDate: createForm.depositDate || new Date().toLocaleDateString("vi-VN"),
      expiryDate: createForm.expiryDate || "30/09/2026",
      status: "holding",
      note: createForm.note,
    };
    setDepositsList([newRecord, ...depositsList]);
    setIsCreateDirty(false);
    setShowCreateModal(false);
  };

  const handleUpgradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showUpgradeModal) return;
    const addAmt = Number(upgradeForm.additionalAmount) || 0;
    const nowStr = new Date().toLocaleDateString("vi-VN");

    setDepositsList((prev) =>
      prev.map((d) => {
        if (d.id === showUpgradeModal.id) {
          return {
            ...d,
            depositType: "contract",
            amount: d.amount + addAmt,
            originalAmount: d.originalAmount,
            convertedAt: nowStr,
            additionalPaidAmount: addAmt,
            note: `${d.note || ""} [${locale === "en" ? "Upgraded to Lease Deposit" : "Đã nâng lên Cọc HĐ"} +${formatCurrency(addAmt, locale)} (${nowStr})]`,
          };
        }
        return d;
      })
    );
    setIsUpgradeDirty(false);
    setShowUpgradeModal(null);
  };

  const handleRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRefundModal) return;

    let deductAmt = 0;
    let refundAmt = 0;
    let newStatus: DepositStatus = "refunded";

    if (refundForm.refundType === "full") {
      deductAmt = 0;
      refundAmt = showRefundModal.amount;
      newStatus = "refunded";
    } else if (refundForm.refundType === "forfeit") {
      deductAmt = showRefundModal.amount;
      refundAmt = 0;
      newStatus = "deducted";
    } else {
      deductAmt = Math.min(showRefundModal.amount, Math.max(0, Number(refundForm.deductedAmount) || 0));
      refundAmt = Math.max(0, showRefundModal.amount - deductAmt);
      newStatus = refundAmt === 0 ? "deducted" : "refunded";
    }

    setDepositsList((prev) =>
      prev.map((d) => {
        if (d.id === showRefundModal.id) {
          return {
            ...d,
            status: newStatus,
            amount: 0,
            refundAmount: refundAmt,
            deductedAmount: deductAmt,
            isDeductedPartially: deductAmt > 0,
            deductionReason: refundForm.deductionReason,
            note: `${d.note || ""} [${locale === "en" ? "Settled" : "Quyết toán"}: Refund ${formatCurrency(refundAmt, locale)}, Deduct ${formatCurrency(deductAmt, locale)}]`,
          };
        }
        return d;
      })
    );

    setIsRefundDirty(false);
    setShowRefundModal(null);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* 1. TOP HEADER TITLE & CREATE BUTTON */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <PiggyBank className="w-6 h-6 text-[#2AC1BC]" />
            {t("title")}
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            {t("sub")}
          </p>
        </div>

        <button
          onClick={() => {
            setIsCreateDirty(false);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2AC1BC] hover:bg-[#23A8A3] text-white text-xs font-black rounded-2xl shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t("addNew")}</span>
        </button>
      </div>

      {/* 2. DARK HERO CARD WITH 4 KPI METRICS */}
      <div className="bg-zinc-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden border border-zinc-800">
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {activeBuilding.name}
              </span>
            </div>

            <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#2AC1BC] shrink-0" />
              <span>{activeBuilding.address}</span>
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-[#2AC1BC] hover:underline ml-1"
              >
                Google Maps →
              </a>
            </div>

            <p className="text-zinc-400 text-xs leading-relaxed pt-1">
              {t("bannerSub")}
            </p>
          </div>

          {/* 4 Financial KPIs Cards */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
            {/* 1. HELD */}
            <div className="p-3.5 bg-zinc-800/80 rounded-2xl border border-zinc-700/60 flex flex-col min-w-[150px]">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {t("statHeld")} ({depositsList.filter((d) => d.status === "holding").length})
              </span>
              <span className="text-base sm:text-lg font-black text-emerald-300 mt-1">
                {formatCurrency(totalActiveHeldAmount, locale)}
              </span>
            </div>

            {/* 2. UPGRADED */}
            <div className="p-3.5 bg-zinc-800/80 rounded-2xl border border-zinc-700/60 flex flex-col min-w-[150px]">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                {t("statUpgraded")} ({depositsList.filter((d) => d.depositType === "contract").length})
              </span>
              <span className="text-base sm:text-lg font-black text-amber-300 mt-1">
                {formatCurrency(totalContractUpgraded, locale)}
              </span>
            </div>

            {/* 3. REFUNDED */}
            <div className="p-3.5 bg-zinc-800/80 rounded-2xl border border-zinc-700/60 flex flex-col min-w-[150px]">
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <RotateCcw className="w-3 h-3 text-purple-400" />
                {t("statRefunded")} ({depositsList.filter((d) => d.status === "refunded").length})
              </span>
              <span className="text-base sm:text-lg font-black text-purple-300 mt-1">
                {formatCurrency(totalRefundedAmount, locale)}
              </span>
            </div>

            {/* 4. DEDUCTED */}
            <div className="p-3.5 bg-zinc-800/80 rounded-2xl border border-zinc-700/60 flex flex-col min-w-[150px]">
              <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Scissors className="w-3 h-3 text-rose-400" />
                {t("statDeducted")} ({depositsList.filter((d) => d.isDeductedPartially || d.status === "deducted").length})
              </span>
              <span className="text-base sm:text-lg font-black text-rose-300 mt-1">
                {formatCurrency(totalDeductedAmount, locale)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SEGMENT SWITCHER TABS (HOLDING VS CONTRACT) */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-2.5 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl">
          <button
            onClick={() => handleDepositTypeTabChange("holding")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              selectedDepositTypeTab === "holding"
                ? "bg-amber-500 text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t("tabHoldingDeposit")}</span>
            <span className="px-1.5 py-0.2 bg-white/20 rounded-md text-[10px]">
              {depositsList.filter((d) => d.depositType === "holding").length}
            </span>
          </button>

          <button
            onClick={() => handleDepositTypeTabChange("contract")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              selectedDepositTypeTab === "contract"
                ? "bg-[#2AC1BC] text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t("tabContractDeposit")}</span>
            <span className="px-1.5 py-0.2 bg-white/20 rounded-md text-[10px]">
              {depositsList.filter((d) => d.depositType === "contract").length}
            </span>
          </button>
        </div>

        {/* Search input and View Mode toggler */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
            />
          </div>

          <div className="flex items-center border border-zinc-200 rounded-xl p-0.5 bg-zinc-50 shrink-0">
            <button
              onClick={() => handleViewModeChange("grid")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "grid" ? "bg-white text-[#2AC1BC] shadow-xs" : "text-zinc-400 hover:text-zinc-700"
              }`}
              title="Grid View (Default 6/page)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewModeChange("table")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "table" ? "bg-white text-[#2AC1BC] shadow-xs" : "text-zinc-400 hover:text-zinc-700"
              }`}
              title="Table View (Default 10/page)"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. STATUS FILTER TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wider mr-1">
            {t("statusFilterLabel")}
          </span>
          <button
            onClick={() => {
              setActiveStatusTab("all");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeStatusTab === "all"
                ? "bg-zinc-900 text-white shadow-xs"
                : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {t("statusAll")} (
            {depositsList.filter((d) => d.depositType === selectedDepositTypeTab).length}
            )
          </button>
          <button
            onClick={() => {
              setActiveStatusTab("holding");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeStatusTab === "holding"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white border border-zinc-200 text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            {t("statusHolding")} (
            {depositsList.filter((d) => d.depositType === selectedDepositTypeTab && d.status === "holding").length}
            )
          </button>
          <button
            onClick={() => {
              setActiveStatusTab("refunded");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeStatusTab === "refunded"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-white border border-zinc-200 text-purple-700 hover:bg-purple-50"
            }`}
          >
            {t("statusRefunded")} (
            {depositsList.filter((d) => d.depositType === selectedDepositTypeTab && d.status === "refunded").length}
            )
          </button>
          <button
            onClick={() => {
              setActiveStatusTab("deducted");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeStatusTab === "deducted"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-white border border-zinc-200 text-rose-700 hover:bg-rose-50"
            }`}
          >
            {t("statusDeducted")} (
            {depositsList.filter((d) => d.depositType === selectedDepositTypeTab && (d.isDeductedPartially || d.status === "deducted")).length}
            )
          </button>
        </div>

        <div className="text-[11px] font-bold text-zinc-400">
          {t("currentViewing")}{" "}
          <span className="text-zinc-700 font-black">
            {selectedDepositTypeTab === "holding" ? t("tabHoldingDeposit") : t("tabContractDeposit")}
          </span>
        </div>
      </div>

      {/* 5. MAIN CONTENT DISPLAY (GRID OR TABLE) */}
      {paginatedItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-zinc-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
            <PiggyBank className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-zinc-800">{t("emptyNotFoundTitle")}</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">{t("emptyNotFoundDesc")}</p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW (DEFAULT 6 / PAGE PER RULE #9) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200/80 shadow-xs hover:shadow-md hover:border-[#2AC1BC]/40 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div>
                {/* Card Top: Room & Status Badges */}
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-zinc-900">
                      {locale === "en" ? `Room ${item.roomName}` : `Phòng ${item.roomName}`}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md ${
                        item.depositType === "holding"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-teal-50 text-teal-700 border border-teal-200"
                      }`}
                    >
                      {item.depositType === "holding" ? t("holdingDeposit") : t("contractDeposit")}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.status === "holding" && (
                      <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {t("statusHolding")}
                      </span>
                    )}
                    {item.status === "refunded" && (
                      <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        {t("statusRefunded")}
                      </span>
                    )}
                    {(item.status === "deducted" || item.isDeductedPartially) && (
                      <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        {t("statusDeducted")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Info Rows */}
                <div className="grid grid-cols-2 gap-y-2 text-xs pt-3">
                  <div>
                    <span className="text-[11px] text-zinc-400 font-bold block">{t("tenant")}</span>
                    <span className="font-black text-zinc-800 truncate block">{item.tenantName}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-400 font-bold block">{t("phone")}</span>
                    <span className="font-semibold text-zinc-700 block">{item.tenantPhone}</span>
                  </div>

                  <div>
                    <span className="text-[11px] text-zinc-400 font-bold block">{t("depositDate")}</span>
                    <span className="font-semibold text-zinc-700 block">{item.depositDate}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-400 font-bold block">
                      {item.depositType === "holding" ? t("expiryDate") : t("moveInDate")}
                    </span>
                    <span className="font-bold text-amber-600 block">{item.expiryDate}</span>
                  </div>
                </div>

                {/* Money Held Callout */}
                <div className="mt-3.5 p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">
                      {t("currentDeposit")}
                    </span>
                    <span className="text-base font-black text-[#2AC1BC] leading-tight block mt-0.5">
                      {formatCurrency(item.amount, locale)}
                    </span>
                  </div>

                  {item.originalAmount !== item.amount && (
                    <span className="text-[10px] font-bold text-zinc-400 text-right block">
                      {t("originalDeposit")} {formatCurrency(item.originalAmount, locale)}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                <button
                  onClick={() => setSelectedDeposit(item)}
                  className="flex-1 py-2 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer text-center"
                >
                  {t("btnDetail")}
                </button>

                {item.depositType === "holding" && item.status === "holding" && (
                  <button
                    onClick={() => {
                      setIsUpgradeDirty(false);
                      setShowUpgradeModal(item);
                    }}
                    className="flex-1 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t("btnUpgrade")}</span>
                  </button>
                )}

                {item.status === "holding" && (
                  <button
                    onClick={() => {
                      setIsRefundDirty(false);
                      setShowRefundModal(item);
                    }}
                    className="py-2 px-3 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors cursor-pointer text-center"
                    title={t("btnRefundDeduct")}
                  >
                    {t("btnRefundDeduct")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW (DEFAULT 10 / PAGE PER RULE #9) */
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-black text-zinc-500 uppercase tracking-wider">
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllCurrentPageSelected}
                      onChange={handleToggleSelectAll}
                      className="rounded border-zinc-300 text-[#2AC1BC] focus:ring-[#2AC1BC] cursor-pointer"
                    />
                  </th>
                  <th className="p-3.5">{t("colCode")}</th>
                  <th className="p-3.5">{t("colRoom")}</th>
                  <th className="p-3.5">{t("colTenant")}</th>
                  <th className="p-3.5">{t("colType")}</th>
                  <th className="p-3.5">{t("colAmount")}</th>
                  <th className="p-3.5">{t("colDates")}</th>
                  <th className="p-3.5">{t("colStatus")}</th>
                  <th className="p-3.5 text-right">{t("colActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                {paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => handleToggleSelectItem(item.id)}
                        className="rounded border-zinc-300 text-[#2AC1BC] focus:ring-[#2AC1BC] cursor-pointer"
                      />
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-zinc-500">{item.id}</td>
                    <td className="p-3.5 font-black text-zinc-900">
                      {locale === "en" ? `Room ${item.roomName}` : `Phòng ${item.roomName}`}
                    </td>
                    <td className="p-3.5">
                      <div className="font-black text-zinc-900">{item.tenantName}</div>
                      <div className="text-[11px] text-zinc-400 font-normal">{item.tenantPhone}</div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md ${
                          item.depositType === "holding"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-teal-50 text-teal-700 border border-teal-200"
                        }`}
                      >
                        {item.depositType === "holding" ? t("holdingDeposit") : t("contractDeposit")}
                      </span>
                    </td>
                    <td className="p-3.5 font-black text-[#2AC1BC]">
                      {formatCurrency(item.amount, locale)}
                    </td>
                    <td className="p-3.5 text-[11px]">
                      <div>{item.depositDate}</div>
                      <div className="text-amber-600 font-bold">{item.expiryDate}</div>
                    </td>
                    <td className="p-3.5">
                      {item.status === "holding" && (
                        <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {t("statusHolding")}
                        </span>
                      )}
                      {item.status === "refunded" && (
                        <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          {t("statusRefunded")}
                        </span>
                      )}
                      {(item.status === "deducted" || item.isDeductedPartially) && (
                        <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          {t("statusDeducted")}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedDeposit(item)}
                          className="px-2.5 py-1 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
                        >
                          {t("btnDetail")}
                        </button>
                        {item.depositType === "holding" && item.status === "holding" && (
                          <button
                            onClick={() => {
                              setIsUpgradeDirty(false);
                              setShowUpgradeModal(item);
                            }}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors cursor-pointer"
                          >
                            {t("btnUpgrade")}
                          </button>
                        )}
                        {item.status === "holding" && (
                          <button
                            onClick={() => {
                              setIsRefundDirty(false);
                              setShowRefundModal(item);
                            }}
                            className="px-2.5 py-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer"
                          >
                            {t("btnRefundDeduct")}
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

      {/* 6. STANDARDIZED PAGINATION BAR (PER DORMIO-GLOBAL RULE #9) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs text-xs">
        {/* Left control: Hiển thị [<input>] / trang | X - Y trên tổng số Z [mục] */}
        <div className="flex items-center gap-2 text-zinc-600 font-semibold">
          <span>{t("showing")}</span>
          <input
            type="number"
            min={1}
            max={100}
            value={itemsPerPage}
            onChange={(e) => {
              const val = Math.max(1, parseInt(e.target.value) || 1);
              setItemsPerPage(val);
              setCurrentPage(1);
            }}
            className="w-12 py-1 px-1 text-center font-black text-zinc-900 border border-zinc-300 rounded-lg focus:outline-none focus:border-[#2AC1BC]"
          />
          <span>{t("perPage")}</span>
          <span className="text-zinc-300 mx-1">|</span>
          <span>
            {totalItems > 0 ? startIndex + 1 : 0} - {endIndex} {t("of")} {totalItems} {t("items")}
          </span>
        </div>

        {/* Right control: 5-page window jumping (Prev/Next jumps by 5) with Teal #2AC1BC active */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(Math.max(1, windowStart - windowSize))}
            disabled={windowStart === 1}
            className="p-2 border border-zinc-200 rounded-xl hover:bg-zinc-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
            title="Jump back 5 pages"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {visiblePageNumbers.map((p) => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              className={`w-8 h-8 rounded-xl font-black text-xs transition-all cursor-pointer ${
                validCurrentPage === p
                  ? "bg-[#2AC1BC] text-white shadow-xs"
                  : "hover:bg-zinc-100 text-zinc-700"
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, windowEnd + 1))}
            disabled={windowEnd >= totalPages}
            className="p-2 border border-zinc-200 rounded-xl hover:bg-zinc-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
            title="Jump forward 5 pages"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 7. MODAL 1: DEPOSIT DETAIL LIGHTBOX */}
      {/* ==================================================================== */}
      {selectedDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-black text-zinc-900">{t("detailModalTitle")}</h3>
                <p className="text-[11px] text-zinc-400 font-medium">{selectedDeposit.id}</p>
              </div>
              <button
                onClick={() => setSelectedDeposit(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-500">{t("room")}</span>
                  <span className="font-black text-zinc-900">
                    {locale === "en" ? `Room ${selectedDeposit.roomName}` : `Phòng ${selectedDeposit.roomName}`} ({selectedDeposit.buildingName})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-500">{t("tenant")}</span>
                  <span className="font-black text-zinc-900">{selectedDeposit.tenantName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-500">{t("phone")}</span>
                  <span className="font-semibold text-zinc-700">{selectedDeposit.tenantPhone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-500">{t("depositTypeLabel")}</span>
                  <span className="font-extrabold text-[#2AC1BC]">
                    {selectedDeposit.depositType === "holding" ? t("holdingDeposit") : t("contractDeposit")}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-800">{t("currentDeposit")}</span>
                  <span className="text-base font-black text-emerald-700">
                    {formatCurrency(selectedDeposit.amount, locale)}
                  </span>
                </div>
                {selectedDeposit.originalAmount !== selectedDeposit.amount && (
                  <div className="flex items-center justify-between text-zinc-500">
                    <span>{t("originalDeposit")}</span>
                    <span>{formatCurrency(selectedDeposit.originalAmount, locale)}</span>
                  </div>
                )}
                {selectedDeposit.deductedAmount && (
                  <div className="flex items-center justify-between text-rose-600 font-bold">
                    <span>{t("deductedAmountLabel")}</span>
                    <span>-{formatCurrency(selectedDeposit.deductedAmount, locale)}</span>
                  </div>
                )}
                {selectedDeposit.refundAmount !== undefined && (
                  <div className="flex items-center justify-between text-purple-700 font-bold">
                    <span>{t("actualRefundLabel")}</span>
                    <span>{formatCurrency(selectedDeposit.refundAmount, locale)}</span>
                  </div>
                )}
              </div>

              {selectedDeposit.note && (
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-zinc-600">
                  <span className="font-bold text-zinc-800 block mb-0.5">{t("notesLabel")}:</span>
                  <p className="text-[11px] leading-relaxed">{selectedDeposit.note}</p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedDeposit(null)}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl cursor-pointer transition-colors text-xs"
              >
                {t("closeBtn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 8. MODAL 2: CREATE DEPOSIT MODAL */}
      {/* ==================================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-black text-zinc-900">{t("createModalTitle")}</h3>
                <p className="text-[11px] text-zinc-400 font-medium">{t("createModalSub")}</p>
              </div>
              <button
                onClick={requestCloseCreateModal}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-zinc-700">{t("depositTypeLabel")}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateDirty(true);
                      setCreateForm({ ...createForm, depositType: "holding" });
                    }}
                    className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                      createForm.depositType === "holding"
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-zinc-50 text-zinc-600 border-zinc-200"
                    }`}
                  >
                    {t("holdingDeposit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateDirty(true);
                      setCreateForm({ ...createForm, depositType: "contract" });
                    }}
                    className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                      createForm.depositType === "contract"
                        ? "bg-[#2AC1BC] text-white border-[#2AC1BC]"
                        : "bg-zinc-50 text-zinc-600 border-zinc-200"
                    }`}
                  >
                    {t("contractDeposit")}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-700">{t("roomSelectLabel")}</label>
                  <input
                    type="text"
                    required
                    value={createForm.roomName}
                    onChange={(e) => {
                      setIsCreateDirty(true);
                      setCreateForm({ ...createForm, roomName: e.target.value, roomId: e.target.value });
                    }}
                    placeholder="VD: 105"
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 font-semibold focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-zinc-700">{t("amountLabel")}</label>
                  <input
                    type="number"
                    required
                    value={createForm.amount}
                    onChange={(e) => {
                      setIsCreateDirty(true);
                      setCreateForm({ ...createForm, amount: e.target.value });
                    }}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 font-black text-[#2AC1BC] focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-700">{t("tenantNameLabel")}</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn An"
                  value={createForm.tenantName}
                  onChange={(e) => {
                    setIsCreateDirty(true);
                    setCreateForm({ ...createForm, tenantName: e.target.value });
                  }}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 font-semibold focus:outline-none focus:border-[#2AC1BC]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-700">{t("tenantPhoneLabel")}</label>
                <input
                  type="text"
                  required
                  placeholder="VD: 0912345678"
                  value={createForm.tenantPhone}
                  onChange={(e) => {
                    setIsCreateDirty(true);
                    setCreateForm({ ...createForm, tenantPhone: e.target.value });
                  }}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 font-semibold focus:outline-none focus:border-[#2AC1BC]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-700">{t("notesLabel")}</label>
                <textarea
                  rows={2}
                  value={createForm.note}
                  onChange={(e) => {
                    setIsCreateDirty(true);
                    setCreateForm({ ...createForm, note: e.target.value });
                  }}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 font-medium focus:outline-none focus:border-[#2AC1BC]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={requestCloseCreateModal}
                  className="flex-1 py-2.5 border border-zinc-200 text-zinc-700 font-bold rounded-xl hover:bg-zinc-50 cursor-pointer transition-colors"
                >
                  {t("cancelBtn")}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#2AC1BC] hover:bg-[#23A8A3] text-white font-bold rounded-xl cursor-pointer transition-colors shadow-sm shadow-[#2AC1BC]/20"
                >
                  {t("saveBtn")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 9. MODAL 3: UPGRADE HOLDING DEPOSIT TO CONTRACT */}
      {/* ==================================================================== */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-black text-zinc-900">{t("upgradeModalTitle")}</h3>
                <p className="text-[11px] text-zinc-400 font-medium">{t("upgradeModalSub")}</p>
              </div>
              <button
                onClick={requestCloseUpgradeModal}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpgradeSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 space-y-1 text-amber-900">
                <div className="font-black text-sm">
                  {locale === "en" ? `Room ${showUpgradeModal.roomName}` : `Phòng ${showUpgradeModal.roomName}`} — {showUpgradeModal.tenantName}
                </div>
                <div className="text-xs">
                  {t("currentDeposit")}: <strong>{formatCurrency(showUpgradeModal.amount, locale)}</strong>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-700">{t("additionalAmountLabel")}</label>
                <input
                  type="number"
                  required
                  value={upgradeForm.additionalAmount}
                  onChange={(e) => {
                    setIsUpgradeDirty(true);
                    setUpgradeForm({ ...upgradeForm, additionalAmount: Number(e.target.value) || 0 });
                  }}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 font-black text-amber-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-700">{t("paymentMethodLabel")}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUpgradeDirty(true);
                      setUpgradeForm({ ...upgradeForm, paymentMethod: "vietqr" });
                    }}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                      upgradeForm.paymentMethod === "vietqr"
                        ? "bg-[#2AC1BC]/10 border-[#2AC1BC] text-[#2AC1BC]"
                        : "bg-zinc-50 border-zinc-200 text-zinc-600"
                    }`}
                  >
                    {t("vietqrMethod")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUpgradeDirty(true);
                      setUpgradeForm({ ...upgradeForm, paymentMethod: "cash" });
                    }}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                      upgradeForm.paymentMethod === "cash"
                        ? "bg-amber-500/10 border-amber-500 text-amber-600"
                        : "bg-zinc-50 border-zinc-200 text-zinc-600"
                    }`}
                  >
                    {t("cashMethod")}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={requestCloseUpgradeModal}
                  className="flex-1 py-2.5 border border-zinc-200 text-zinc-700 font-bold rounded-xl hover:bg-zinc-50 cursor-pointer transition-colors"
                >
                  {t("cancelBtn")}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl cursor-pointer transition-colors shadow-sm shadow-amber-500/20"
                >
                  {t("confirmUpgradeBtn")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 10. MODAL 4: REFUND & DEDUCTION MODAL */}
      {/* ==================================================================== */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-black text-zinc-900">{t("refundModalTitle")}</h3>
                <p className="text-[11px] text-zinc-400 font-medium">{t("refundModalSub")}</p>
              </div>
              <button
                onClick={requestCloseRefundModal}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRefundSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200/80 space-y-1 text-purple-900">
                <div className="font-black text-sm">
                  {locale === "en" ? `Room ${showRefundModal.roomName}` : `Phòng ${showRefundModal.roomName}`} — {showRefundModal.tenantName}
                </div>
                <div className="text-xs">
                  {t("currentDeposit")}: <strong>{formatCurrency(showRefundModal.amount, locale)}</strong>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-zinc-700">{t("statusFilterLabel")}</label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 p-2 bg-zinc-50 border border-zinc-200 rounded-xl cursor-pointer">
                    <input
                      type="radio"
                      name="refundType"
                      checked={refundForm.refundType === "full"}
                      onChange={() => {
                        setIsRefundDirty(true);
                        setRefundForm({ ...refundForm, refundType: "full", deductedAmount: "0" });
                      }}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-bold text-zinc-800">{t("fullRefundOption")}</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-zinc-50 border border-zinc-200 rounded-xl cursor-pointer">
                    <input
                      type="radio"
                      name="refundType"
                      checked={refundForm.refundType === "partial"}
                      onChange={() => {
                        setIsRefundDirty(true);
                        setRefundForm({ ...refundForm, refundType: "partial" });
                      }}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-bold text-zinc-800">{t("partialDeductOption")}</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-zinc-50 border border-zinc-200 rounded-xl cursor-pointer">
                    <input
                      type="radio"
                      name="refundType"
                      checked={refundForm.refundType === "forfeit"}
                      onChange={() => {
                        setIsRefundDirty(true);
                        setRefundForm({
                          ...refundForm,
                          refundType: "forfeit",
                          deductedAmount: String(showRefundModal.amount),
                        });
                      }}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-bold text-zinc-800">{t("fullDeductOption")}</span>
                  </label>
                </div>
              </div>

              {refundForm.refundType === "partial" && (
                <div className="space-y-1">
                  <label className="font-bold text-zinc-700">{t("deductedAmountLabel")}</label>
                  <input
                    type="number"
                    max={showRefundModal.amount}
                    value={refundForm.deductedAmount}
                    onChange={(e) => {
                      setIsRefundDirty(true);
                      setRefundForm({ ...refundForm, deductedAmount: e.target.value });
                    }}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 font-black text-rose-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              {(refundForm.refundType === "partial" || refundForm.refundType === "forfeit") && (
                <div className="space-y-1">
                  <label className="font-bold text-zinc-700">{t("deductionReasonLabel")}</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Làm hỏng cửa kính, đổi ngày quá 2 lần..."
                    value={refundForm.deductionReason}
                    onChange={(e) => {
                      setIsRefundDirty(true);
                      setRefundForm({ ...refundForm, deductionReason: e.target.value });
                    }}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 font-medium focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={requestCloseRefundModal}
                  className="flex-1 py-2.5 border border-zinc-200 text-zinc-700 font-bold rounded-xl hover:bg-zinc-50 cursor-pointer transition-colors"
                >
                  {t("cancelBtn")}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl cursor-pointer transition-colors shadow-sm shadow-purple-600/20"
                >
                  {t("confirmRefundBtn")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 11. MODAL 5: CUSTOM CONFIRMATION MODAL (PER DORMIO-GLOBAL RULE #10) */}
      {/* ==================================================================== */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4 animate-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-black text-zinc-900">{confirmModal.title}</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                {locale === "en" ? "Continue Editing" : "Tiếp tục chỉnh sửa"}
              </button>
              <button
                onClick={confirmModal.onDiscard}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                {locale === "en" ? "Discard & Close" : "Hủy thay đổi & Đóng"}
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
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-zinc-400">Loading...</div>}>
      <DepositsContent />
    </Suspense>
  );
}
