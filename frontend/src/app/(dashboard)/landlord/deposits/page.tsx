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
import { useTranslations } from "@/context/LanguageContext";

// Deposit Item Interface (Strict 2 Deposit Types & Dual Status Display Support)
export interface DepositItem {
  id: string;
  roomId: string;
  roomName: string;
  buildingName: string;
  tenantName: string;
  tenantPhone: string;
  depositType: "Cá»c giá»¯ chá»—" | "Cá»c há»£p Ä‘á»“ng"; // Exactly 2 Deposit Types
  amount: number; // Current active deposit amount held
  originalAmount: number; // Initial deposit amount
  depositDate: string;
  expiryDate: string;
  status: "Äang giá»¯" | "ÄÃ£ hoÃ n" | "ÄÃ£ kháº¥u trá»«"; // Base status category
  isDeductedPartially?: boolean; // Flag indicating if any deduction occurred (triggers parallel "ÄÃ£ kháº¥u trá»«" badge)
  deductedAmount?: number; // Total amount deducted
  refundAmount?: number; // Final amount refunded to tenant
  deductionReason?: string;
  convertedAt?: string; // Date upgraded from Hold -> Contract Deposit
  additionalPaidAmount?: number; // Additional deposit collected during upgrade to Contract Deposit
  note?: string;
}

// Exactly 20 Mock Deposit Data Items (10 Items for Cá»c giá»¯ chá»—, 10 Items for Cá»c há»£p Ä‘á»“ng)
const initialDeposits: DepositItem[] = [
  // ================= 10 ITEMS FOR "Cá»ŒC GIá»® CHá»–" =================
  {
    id: "DEP-202608-102",
    roomId: "102",
    roomName: "PhÃ²ng 102",
    buildingName: "Dormio Premier Quáº­n 1",
    tenantName: "Tráº§n Thá»‹ Mai",
    tenantPhone: "0977234567",
    depositType: "Cá»c giá»¯ chá»—",
    amount: 1000000,
    originalAmount: 1000000,
    depositDate: "15/08/2026",
    expiryDate: "25/08/2026",
    status: "Äang giá»¯",
    isDeductedPartially: false,
    note: "Cá»c giá»¯ chá»— háº¹n chá»‘t há»£p Ä‘á»“ng. Cáº§n thu bá»• sung 2.000.000 â‚« Ä‘á»ƒ nÃ¢ng lÃªn Cá»c Há»£p Äá»“ng.",
  },
  {
    id: "DEP-202608-104",
    roomId: "104",
    roomName: "PhÃ²ng 104",
    buildingName: "Dormio Premier Quáº­n 1",
    tenantName: "BÃ¹i PhÆ°Æ¡ng Tháº£o",
    tenantPhone: "0935888999",
    depositType: "Cá»c giá»¯ chá»—",
    amount: 1500000,
    originalAmount: 1500000,
    depositDate: "20/08/2026",
    expiryDate: "02/09/2026",
    status: "Äang giá»¯",
    isDeductedPartially: false,
    note: "Cá»c giá»¯ chá»— háº¹n dá»n vÃ o Ä‘áº§u thÃ¡ng 9. Dá»± kiáº¿n cá»c HÄ: 4.500.000 â‚«",
  },
  {
    id: "DEP-202608-202",
    roomId: "202",
    roomName: "PhÃ²ng 202",
    buildingName: "Dormio Premier Quáº­n 1",
    tenantName: "Pháº¡m Minh Anh",
    tenantPhone: "0933456789",
    depositType: "Cá»c giá»¯ chá»—",
    amount: 0,
    originalAmount: 2000000,
    depositDate: "01/08/2026",
    expiryDate: "10/08/2026",
    status: "ÄÃ£ hoÃ n",
    isDeductedPartially: false,
    refundAmount: 2000000,
    note: "ÄÃ£ hoÃ n cá»c 100% (2.000.000 â‚«) do khÃ¡ch khÃ´ng dá»n vÃ o Ä‘Ãºng cam káº¿t",
  },
  {
    id: "DEP-202608-204",
    roomId: "204",
    roomName: "PhÃ²ng 204",
    buildingName: "Dormio Premier Quáº­n 1",
    tenantName: "VÃµ Gia Huy",
    tenantPhone: "0912333444",
    depositType: "Cá»c giá»¯ chá»—",
    amount: 2000000,
    originalAmount: 2000000,
    depositDate: "22/08/2026",
    expiryDate: "30/08/2026",
    status: "Äang giá»¯",
    isDeductedPartially: false,
    note: "Cá»c giá»¯ chá»— trá»±c tuyáº¿n qua SÃ n BHRP. Chá» kÃ½ há»£p Ä‘á»“ng trá»±c tiáº¿p.",
  },
  {
    id: "DEP-202608-302",
    roomId: "302",
    roomName: "PhÃ²ng 302",
    buildingName: "Dormio Premier Quáº­n 1",
    tenantName: "NgÃ´ Thanh HÆ°Æ¡ng",
    tenantPhone: "0966677889",
    depositType: "Cá»c giá»¯ chá»—",
    amount: 0,
    originalAmount: 3000000,
    depositDate: "05/08/2026",
    expiryDate: "12/08/2026",
    status: "ÄÃ£ kháº¥u trá»«",
    isDeductedPartially: true,
    deductedAmount: 3000000,
    refundAmount: 0,
    deductionReason: "Bá» cá»c sau quÃ¡ háº¡n 10 ngÃ y khÃ´ng Ä‘áº¿n kÃ½ há»£p Ä‘á»“ng. Kháº¥u trá»« 100% tiá»n cá»c.",
    note: "KhÃ¡ch bÃ¹ng cá»c",
  },
  {
    id: "DEP-202608-304",
    roomId: "304",
    roomName: "PhÃ²ng 304",
    buildingName: "Dormio Premier Quáº­n 1",
    tenantName: "Phan VÄƒn Viá»‡t",
    tenantPhone: "0903444555",
    depositType: "Cá»c giá»¯ chá»—",
    amount: 0,
    originalAmount: 1500000,
    depositDate: "10/07/2026",
    expiryDate: "17/07/2026",
    status: "ÄÃ£ hoÃ n",
    isDeductedPartially: false,
    refundAmount: 1500000,
    note: "HoÃ n cá»c giá»¯ chá»— 100% do phÃ²ng báº­n sá»­a chá»¯a á»‘ng nÆ°á»›c",
  },
  {
    id: "DEP-202608-402",
    roomId: "402",
    roomName: "PhÃ²ng 402",
    buildingName: "Dormio Premier Quáº­n 1",
    tenantName: "DÆ°Æ¡ng Minh Triáº¿t",
    tenantPhone: "0938555666",
    depositType: "Cá»c giá»¯ chá»—",
    amount: 2000000,
    originalAmount: 2500000,
    depositDate: "25/08/2026",
    expiryDate: "05/09/2026",
    status: "Äang giá»¯",
    isDeductedPartially: true,
    deductedAmount: 500000,
    deductionReason: "Trá»« 500.000 â‚« tiá»n vi pháº¡m Ä‘á»•i ngÃ y háº¹n giá»¯ phÃ²ng quÃ¡ 2 láº§n (Váº«n giá»¯ 2.000.000 â‚« cÃ²n láº¡i)",
    note: "Cá»c giá»¯ chá»— (Hiá»ƒn thá»‹ 2 nhÃ£n: Äang giá»¯ + ÄÃ£ kháº¥u trá»«)",
  },
  {
    id: "DEP-202608-502",
    roomId: "502",
    roomName: "PhÃ²ng 502",
    buildingName: "Dormio Premier Quáº­n 1",
    tenantName: "LÃ¢m HoÃ i ThÆ°Æ¡ng",
    tenantPhone: "0909123456",
    depositType: "Cá»c giá»¯ chá»—",
    amount: 0,
    originalAmount: 1800000,
    depositDate: "28/08/2026",
    expiryDate: "10/09/2026",
    status: "ÄÃ£ hoÃ n",
    isDeductedPartially: true,
    deductedAmount: 500000,
    refundAmount: 1300000,
    deductionReason: "Trá»« 500.000 â‚« chi phÃ­ há»§y giá»¯ chá»— sÃ¡t giá». HoÃ n tráº£ 1.300.000 â‚« cÃ²n láº¡i.",
    note: "Cá»c giá»¯ chá»— (Hiá»ƒn thá»‹ 2 nhÃ£n: ÄÃ£ hoÃ n + ÄÃ£ kháº¥u trá»«)",
  },
  {
    id: "DEP-202608-504",
    roomId: "504",
    roomName: "PhÃ²ng 504",
    buildingName: "Dormio Premier Quáº­n 1",
    tenantName: "TrÆ°Æ¡ng Táº¥n Sang",
    tenantPhone: "0988777666",
    depositType: "Cá»c giá»¯ chá»—",
    amount: 0,
    originalAmount: 2000000,
    depositDate: "15/07/2026",
    expiryDate: "22/07/2026",
    status: "ÄÃ£ hoÃ n",
    isDeductedPartially: false,
    refundAmount: 2000000,
    note: "KhÃ¡ch Ä‘á»•i lá»‹ch cÃ´ng tÃ¡c khÃ´ng thuÃª ná»¯a. ÄÃ£ hoÃ n 100% tiá»n cá»c giá»¯ chá»—.",
  },
  {
    id: "DEP-202608-602",
    roomId: "602",
    roomName: "PhÃ²ng 602",
    buildingName: "Dormio Premier Quáº­n 1",
    tenantName: "Cao ThÃ¹y Trang",
    tenantPhone: "0934111222",
    depositType: "Cá»c giá»¯ chá»—",
    amount: 0,
    originalAmount: 2500000,
    depositDate: "02/08/2026",
    expiryDate: "10/08/2026",
    status: "ÄÃ£ kháº¥u trá»«",
    isDeductedPartially: true,
    deductedAmount: 2500000,
    refundAmount: 0,
    deductionReason: "QuÃ¡ háº¡n 15 ngÃ y khÃ´ng tá»›i kÃ½ há»£p Ä‘á»“ng vÃ  khÃ´ng liÃªn láº¡c Ä‘Æ°á»£c. Kháº¥u trá»« 100% cá»c.",
    note: "KhÃ¡ch há»§y lá»‹ch khÃ´ng thÃ´ng bÃ¡o",
  },

  // ================= 10 ITEMS FOR "Cá»ŒC Há»¢P Äá»’NG" =================
  {
    id: "DEP-202608-101",
    roomId: "101",
    roomName: "PhÃ²ng 101",
    buildingName: "Dormio Premier Quáº­n 1",
    tenantName: "Nguyá»…n VÄƒn Tuáº¥n",
    tenantPhone: "0988123456",
    depositType: "Cá»c há»£p Ä‘á»“ng",
    amount: 3500000,
    originalAmount: 3500000,
    depositDate: "10/08/2026",
    expiryDate: "10/08/2027",
    status: "Äang giá»¯",
    isDeductedPartially: false,
    note: "Tiá»n cá»c báº£o Ä‘áº£m há»£p Ä‘á»“ng 12 thÃ¡ng chÃ­nh thá»©c",
  },
  {
    id: "DEP-202608-103",
    roomId: "103",
    roomName: "PhÃ²ng 103",
    buildingName: "Dormio Premier Quáº­n 1",
    tenantName: "Äá»— Quá»‘c Báº£o",
    tenantPhone: "0905123987",
    depositType: "Cá»c há»£p Ä‘á»“ng",
    amount: 4000000,
    originalAmount: 1500000,
    depositDate: "05/08/2026",
    expiryDate: "05/08/2027",
    status: "Äang giá»¯",
    isDeductedPartially: false,
    convertedAt: "12/08/2026",
    additionalPaidAmount: 2500000,
    note: "ÄÃ£ nÃ¢ng cáº¥p thÃ nh cÃ´ng tá»« Cá»c giá»¯ chá»— (Thu bá»• sung 2.500.000 â‚« ngÃ y 12/08/2026)",
  },
  {
    id: "DEP-202608-201",
    roomId: "201",
    roomName: "PhÃ²ng 201",
    buildingName: "Dormio Premier Quáº­n 1",
    tenantName: "LÃª HoÃ ng Nam",
    tenantPhone: "0911345678",
    depositType: "Cá»c há»£p Ä‘á»“ng",
    amount: 3000000,
    originalAmount: 4000000,
    depositDate: "01/06/2026",
    expiryDate: "01/06/2027",
    status: "Äang giá»¯",
    isDeductedPartially: true,
    deductedAmount: 1000000,
    deductionReason: "Trá»« 1.000.000 â‚« tiá»n vi pháº¡m quy Ä‘á»‹nh lÃ m hÆ° háº¡i cá»­a kÃ­nh (Váº«n tiáº¿p tá»¥c giá»¯ 3.000.000 â‚« cÃ²n láº¡i)",
    note: "Há»£p Ä‘á»“ng 1 nÄƒm (Kháº¥u trá»« 1.000.000 â‚« cá»­a kÃ­nh, giá»¯ 3.000.000 â‚« cÃ²n láº¡i)",
  },
  {
    id: "DEP-202608-203",
    roomId: "203",
    roomName: "PhÃ²ng 203",
    buildingName: "Dormio Premier Quáº­n 1",
    tenantName: "VÅ© Háº£i Yáº¿n",
    tenantPhone: "0978666555",
    depositType: "Cá»c há»£p Ä‘á»“ng",
    amount: 5000000,
    originalAmount: 5000000,
    depositDate: "15/05/2026",
    expiryDate: "15/05/2028",
    status: "Äang giá»¯",
    isDeductedPartially: false,
    note: "Cá»c há»£p Ä‘á»“ng 2 nÄƒm phÃ²ng VIP ban cÃ´ng",
  },
  {
    id: "DEP-202608-301",
    roomId: "301",
    roomName: "PhÃ²ng 301",
    buildingName: "Dormio Premier Quáº­n 1",
    tenantName: "HoÃ ng Äá»©c TrÃ­",
    tenantPhone: "0944567890",
    depositType: "Cá»c há»£p Ä‘á»“ng",
    amount: 0,
    originalAmount: 4500000,
    depositDate: "01/01/2026",
    expiryDate: "01/08/2026",
    status: "ÄÃ£ hoÃ n",
    isDeductedPartially: true,
    deductedAmount: 1500000,
    refundAmount: 3000000,
    deductionReason: "Kháº¥u trá»« 1.500.000 â‚« chi phÃ­ mÃ³p tá»§ láº¡nh & sÆ¡n láº¡i tÆ°á»ng. HoÃ n tráº£ 3.000.000 â‚« cÃ²n láº¡i.",
    note: "Thanh lÃ½ há»£p Ä‘á»“ng Ä‘Ãºng háº¡n (HoÃ n 3.000.000 â‚« + Kháº¥u trá»« 1.500.000 â‚«)",
  },
  {
    id: "DEP-202608-303",
    roomId: "303",
    roomName: "PhÃ²ng 303",
    buildingName: "Dormio Premier Quáº­n 1",
    tenantName: "Äáº·ng KhÃ¡nh Linh",
    tenantPhone: "0987111222",
    depositType: "Cá»c há»£p Ä‘á»“ng",
    amount: 4500000,
    originalAmount: 4500000,
    depositDate: "01/07/2026",
    expiryDate: "01/07/2027",
    status: "Äang giá»¯",
    isDeductedPartially: false,
    note: "Há»£p Ä‘á»“ng 12 thÃ¡ng tiÃªu chuáº©n",
  },
  {
    id: "DEP-202608-401",
    roomId: "401",
    roomName: "PhÃ²ng 401",
    buildingName: "Dormio Premier Quáº­n 1",
    tenantName: "Nguyá»…n KhÃ¡nh An",
    tenantPhone: "0971222333",
    depositType: "Cá»c há»£p Ä‘á»“ng",
    amount: 0,
    originalAmount: 5000000,
    depositDate: "01/03/2026",
    expiryDate: "01/03/2027",
    status: "ÄÃ£ kháº¥u trá»«",
    isDeductedPartially: true,
    deductedAmount: 5000000,
    refundAmount: 0,
    deductionReason: "ÄÆ¡n phÆ°Æ¡ng cháº¥m dá»©t há»£p Ä‘á»“ng trÆ°á»›c háº¡n khÃ´ng bÃ¡o trÆ°á»›c. Kháº¥u trá»« 100% tiá»n cá»c theo Ä‘iá»u khoáº£n.",
    note: "BÃ¹ng há»£p Ä‘á»“ng trÆ°á»›c háº¡n",
  },
  {
    id: "DEP-202608-403",
    roomId: "403",
    roomName: "PhÃ²ng 403",
    buildingName: "Dormio Premier Quáº­n 1",
    tenantName: "Trá»‹nh Kim NgÃ¢n",
    tenantPhone: "0919777888",
    depositType: "Cá»c há»£p Ä‘á»“ng",
    amount: 3800000,
    originalAmount: 3800000,
    depositDate: "12/04/2026",
    expiryDate: "12/04/2027",
    status: "Äang giá»¯",
    isDeductedPartially: false,
    note: "Há»£p Ä‘á»“ng thuÃª 1 nÄƒm",
  },
  {
    id: "DEP-202608-501",
    roomId: "501",
    roomName: "PhÃ²ng 501",
    buildingName: "Dormio Premier Quáº­n 1",
    tenantName: "Há»“ Quang Hiáº¿u",
    tenantPhone: "0982999000",
    depositType: "Cá»c há»£p Ä‘á»“ng",
    amount: 6000000,
    originalAmount: 6000000,
    depositDate: "01/02/2026",
    expiryDate: "01/02/2028",
    status: "Äang giá»¯",
    isDeductedPartially: false,
    note: "Tiá»n cá»c cÄƒn Studio Penthouse táº§ng 5 cao cáº¥p",
  },
  {
    id: "DEP-202608-503",
    roomId: "503",
    roomName: "PhÃ²ng 503",
    buildingName: "Dormio Premier Quáº­n 1",
    tenantName: "Táº¡ Má»¹ DuyÃªn",
    tenantPhone: "0908333222",
    depositType: "Cá»c há»£p Ä‘á»“ng",
    amount: 0,
    originalAmount: 4200000,
    depositDate: "10/02/2026",
    expiryDate: "10/08/2026",
    status: "ÄÃ£ hoÃ n",
    isDeductedPartially: false,
    refundAmount: 4200000,
    note: "Thanh lÃ½ há»£p Ä‘á»“ng 6 thÃ¡ng Ä‘Ãºng háº¡n, hoÃ n tráº£ 100% tiá»n cá»c 4.200.000 â‚«",
  },
];

// Large Money Formatter Helper (Prevents digit wrapping)
const formatLargeMoney = (amount: number): string => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(2).replace(/\.00$/, "")} Tá»· â‚«`;
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(2).replace(/\.00$/, "")}M â‚«`;
  }
  return `${amount.toLocaleString("vi-VN")} â‚«`;
};

function DepositsContent() {
  const t = useTranslations("deposits");
  const { activeBuilding } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [depositsList, setDepositsList] = useState<DepositItem[]>(initialDeposits);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid"); // Rule #9 default

  // Top Segment Switcher for 2 Deposit Types
  const [selectedDepositTypeTab, setSelectedDepositTypeTab] = useState<"Cá»c giá»¯ chá»—" | "Cá»c há»£p Ä‘á»“ng">("Cá»c giá»¯ chá»—");

  // Status Filter Tab per active Deposit Type (Äang giá»¯ | ÄÃ£ hoÃ n | ÄÃ£ kháº¥u trá»«)
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
          // Deduct 100% (0 refund) -> Status: "ÄÃ£ kháº¥u trá»«"
          return {
            ...d,
            status: "ÄÃ£ kháº¥u trá»«",
            amount: 0,
            refundAmount: 0,
            isDeductedPartially: true,
            deductedAmount: showRefundModal.amount,
            deductionReason: refundForm.deductionReason || "Kháº¥u trá»« 100% tiá»n cá»c",
            note: refundForm.note ? `${d.note || ""} [Kháº¥u trá»« 100% cá»c lÃºc ${nowStr}: ${refundForm.note}]` : d.note,
          };
        } else if (deductAmt > 0) {
          // Partial deduction + Partial refund -> Status: "ÄÃ£ hoÃ n" (renders both badges: ÄÃ£ hoÃ n & ÄÃ£ kháº¥u trá»«)
          return {
            ...d,
            status: "ÄÃ£ hoÃ n",
            amount: 0,
            refundAmount: actualRefund,
            isDeductedPartially: true,
            deductedAmount: deductAmt,
            deductionReason: refundForm.deductionReason || "Kháº¥u trá»« má»™t pháº§n tiá»n cá»c",
            note: refundForm.note ? `${d.note || ""} [HoÃ n cá»c ${actualRefund.toLocaleString("vi-VN")} â‚«, kháº¥u trá»« ${deductAmt.toLocaleString("vi-VN")} â‚« lÃºc ${nowStr}: ${refundForm.note}]` : d.note,
          };
        } else {
          // 100% Refund -> Status: "ÄÃ£ hoÃ n"
          return {
            ...d,
            status: "ÄÃ£ hoÃ n",
            amount: 0,
            refundAmount: showRefundModal.amount,
            isDeductedPartially: false,
            deductedAmount: 0,
            note: refundForm.note ? `${d.note || ""} [HoÃ n 100% cá»c ${showRefundModal.amount.toLocaleString("vi-VN")} â‚« lÃºc ${nowStr}: ${refundForm.note}]` : d.note,
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
    depositType: "Cá»c giá»¯ chá»—" as "Cá»c giá»¯ chá»—" | "Cá»c há»£p Ä‘á»“ng",
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

  // 1. Total Counts for Top Segment Switcher (Cá»c giá»¯ chá»— vs Cá»c há»£p Ä‘á»“ng)
  const holdTypeCountTotal = depositsList.filter(d => d.depositType === "Cá»c giá»¯ chá»—").length;
  const contractTypeCountTotal = depositsList.filter(d => d.depositType === "Cá»c há»£p Ä‘á»“ng").length;

  // 2. Deposits scoped to Active Deposit Type Tab
  const activeTypeDeposits = depositsList.filter(d => d.depositType === selectedDepositTypeTab);

  // 3. Status Tab Counts per Active Deposit Type (Including partial deductions)
  const statusTotalCount = activeTypeDeposits.length;
  const statusHoldingCount = activeTypeDeposits.filter(d => d.status === "Äang giá»¯").length;
  const statusRefundedCount = activeTypeDeposits.filter(d => d.status === "ÄÃ£ hoÃ n").length;
  const statusDeductedCount = activeTypeDeposits.filter(d => d.status === "ÄÃ£ kháº¥u trá»«" || (d.isDeductedPartially && (d.deductedAmount || 0) > 0)).length;

  // 4. Final Filtered Deposits Array
  const filteredDeposits = depositsList.filter((dep) => {
    // Must match top segment Deposit Type (Cá»c giá»¯ chá»— OR Cá»c há»£p Ä‘á»“ng)
    if (dep.depositType !== selectedDepositTypeTab) return false;

    // Search query match
    const matchSearch =
      dep.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dep.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dep.tenantPhone.includes(searchTerm) ||
      dep.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    // Status filter match
    if (activeStatusTab === "holding") return dep.status === "Äang giá»¯";
    if (activeStatusTab === "refunded") return dep.status === "ÄÃ£ hoÃ n";
    if (activeStatusTab === "deducted") return dep.status === "ÄÃ£ kháº¥u trá»«" || (dep.isDeductedPartially && (dep.deductedAmount || 0) > 0);

    return true;
  });

  // Pagination Calculation
  const totalItems = filteredDeposits.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedDeposits = filteredDeposits.slice(startIndex, startIndex + pageSize);

  // Stat Card Totals (Covering both deposit types)
  const totalHoldingAmount = depositsList
    .filter(d => d.status === "Äang giá»¯")
    .reduce((acc, d) => acc + d.amount, 0);

  const totalHoldTypeAmount = depositsList
    .filter(d => d.depositType === "Cá»c giá»¯ chá»—" && d.status === "Äang giá»¯")
    .reduce((acc, d) => acc + d.amount, 0);

  const totalRefundedAmount = depositsList
    .filter(d => d.status === "ÄÃ£ hoÃ n")
    .reduce((acc, d) => acc + (d.refundAmount || 0), 0);

  const totalDeductedAmount = depositsList
    .reduce((acc, d) => acc + (d.deductedAmount || 0), 0);

  const holdingCountTotal = depositsList.filter(d => d.status === "Äang giá»¯").length;
  const holdTypeHoldingCountTotal = depositsList.filter(d => d.depositType === "Cá»c giá»¯ chá»—" && d.status === "Äang giá»¯").length;
  const refundedCountTotal = depositsList.filter(d => d.status === "ÄÃ£ hoÃ n").length;
  const deductedCountTotal = depositsList.filter(d => d.status === "ÄÃ£ kháº¥u trá»«" || (d.isDeductedPartially && (d.deductedAmount || 0) > 0)).length;

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
          depositType: "Cá»c há»£p Ä‘á»“ng",
          status: "Äang giá»¯",
          amount: targetAmt,
          additionalPaidAmount: addAmt,
          convertedAt: nowStr,
          note: `${d.note || ""} (ÄÃ£ thu bá»• sung ${addAmt.toLocaleString("vi-VN")} â‚« vÃ  nÃ¢ng cáº¥p thÃ nh Cá»c Há»£p Äá»“ng ngÃ y ${nowStr})`
        };
      }
      return d;
    }));

    if (selectedDeposit?.id === showUpgradeModal.id) {
      setSelectedDeposit(prev => prev ? {
        ...prev,
        depositType: "Cá»c há»£p Ä‘á»“ng",
        status: "Äang giá»¯",
        amount: targetAmt,
        additionalPaidAmount: addAmt,
        convertedAt: nowStr,
      } : null);
    }

    // Switch view to Cá»c há»£p Ä‘á»“ng tab after upgrade
    setSelectedDepositTypeTab("Cá»c há»£p Ä‘á»“ng");
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
      roomName: `PhÃ²ng ${newDepositForm.roomName}`,
      buildingName: activeBuilding.name,
      tenantName: newDepositForm.tenantName,
      tenantPhone: newDepositForm.tenantPhone,
      depositType: newDepositForm.depositType,
      amount: initialAmt,
      originalAmount: initialAmt,
      depositDate: new Date().toLocaleDateString("vi-VN"),
      expiryDate: newDepositForm.expiryDate,
      status: "Äang giá»¯",
      isDeductedPartially: false,
      note: newDepositForm.note || (newDepositForm.depositType === "Cá»c giá»¯ chá»—" ? "Cá»c giá»¯ chá»— chá» háº¹n lá»‹ch chá»‘t há»£p Ä‘á»“ng" : "Cá»c há»£p Ä‘á»“ng báº£o Ä‘áº£m thuÃª nhÃ "),
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
      depositType: "Cá»c giá»¯ chá»—",
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

  // Render Clean Status Badges (Strict: "Äang giá»¯" always shows single badge; "ÄÃ£ hoÃ n" shows parallel "ÄÃ£ hoÃ n + ÄÃ£ kháº¥u trá»«" if partial deduction exists)
  const renderStatusBadge = (dep: DepositItem) => {
    if (dep.status === "Äang giá»¯") {
      return (
        <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-[#2AC1BC]/15 text-[#0d6e6b] border border-[#2AC1BC]/30">
          Äang giá»¯
        </span>
      );
    }

    if (dep.status === "ÄÃ£ hoÃ n") {
      const hasDeduction = dep.isDeductedPartially || (dep.deductedAmount && dep.deductedAmount > 0);
      return (
        <div className="flex flex-wrap items-center gap-1 justify-end sm:justify-start">
          <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            ÄÃ£ hoÃ n
          </span>
          {hasDeduction && (
            <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-rose-50 text-rose-700 border border-rose-200" title={`ÄÃ£ kháº¥u trá»« ${dep.deductedAmount?.toLocaleString("vi-VN")} â‚«`}>
              ÄÃ£ kháº¥u trá»«
            </span>
          )}
        </div>
      );
    }

    // 100% Deduction status
    return (
      <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-rose-50 text-rose-700 border border-rose-200">
        ÄÃ£ kháº¥u trá»«
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
              {/* Card 1: Äang Giá»¯ */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 transition-colors rounded-2xl border border-[#2AC1BC]/30 backdrop-blur-md min-w-[130px] sm:min-w-[170px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2AC1BC] shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase font-extrabold text-[#2AC1BC] tracking-wider whitespace-nowrap">{t("holdingLabel", { count: holdingCountTotal })}</span>
                  <span className="font-black text-[#2AC1BC] text-xs sm:text-base leading-none mt-1 whitespace-nowrap tracking-tight">
                    {formatLargeMoney(totalHoldingAmount)}
                  </span>
                </div>
              </div>

              {/* Card 2: Cá»c Giá»¯ Chá»— */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-amber-500/10 hover:bg-amber-500/20 transition-colors rounded-2xl border border-amber-500/30 backdrop-blur-md min-w-[130px] sm:min-w-[170px]">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase font-extrabold text-amber-400 tracking-wider whitespace-nowrap">Cá»ŒC GIá»® CHá»– ({holdTypeHoldingCountTotal})</span>
                  <span className="font-black text-amber-400 text-xs sm:text-base leading-none mt-1 whitespace-nowrap tracking-tight">
                    {formatLargeMoney(totalHoldTypeAmount)}
                  </span>
                </div>
              </div>

              {/* Card 3: ÄÃ£ HoÃ n Cá»c */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-purple-500/10 hover:bg-purple-500/20 transition-colors rounded-2xl border border-purple-500/30 backdrop-blur-md min-w-[130px] sm:min-w-[170px]">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase font-extrabold text-purple-400 tracking-wider whitespace-nowrap">ÄÃƒ HOÃ€N ({refundedCountTotal})</span>
                  <span className="font-black text-purple-400 text-xs sm:text-base leading-none mt-1 whitespace-nowrap tracking-tight">
                    {formatLargeMoney(totalRefundedAmount)}
                  </span>
                </div>
              </div>

              {/* Card 4: Tá»•ng ÄÃ£ Kháº¥u Trá»« */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-2xl border border-rose-500/30 backdrop-blur-md min-w-[130px] sm:min-w-[170px]">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase font-extrabold text-rose-400 tracking-wider whitespace-nowrap">ÄÃƒ KHáº¤U TRá»ª ({deductedCountTotal})</span>
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
                setSelectedDepositTypeTab("Cá»c giá»¯ chá»—");
                setActiveStatusTab("all");
                setCurrentPage(1);
              }}
              className={`py-2 px-3 sm:px-4 rounded-xl sm:rounded-full text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${selectedDepositTypeTab === "Cá»c giá»¯ chá»—"
                ? "bg-amber-500 text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
                }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Cá»c Giá»¯ Chá»— Xem PhÃ²ng</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${selectedDepositTypeTab === "Cá»c giá»¯ chá»—"
                  ? "bg-white/20 text-white"
                  : "bg-zinc-200 text-zinc-700"
                  }`}
              >
                {holdTypeCountTotal}
              </span>
            </button>

            <button
              onClick={() => {
                setSelectedDepositTypeTab("Cá»c há»£p Ä‘á»“ng");
                setActiveStatusTab("all");
                setCurrentPage(1);
              }}
              className={`py-2 px-3 sm:px-4 rounded-xl sm:rounded-full text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${selectedDepositTypeTab === "Cá»c há»£p Ä‘á»“ng"
                ? "bg-[#2AC1BC] text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
                }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Cá»c Há»£p Äá»“ng ThuÃª</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${selectedDepositTypeTab === "Cá»c há»£p Ä‘á»“ng"
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
                placeholder="TÃ¬m phÃ²ng, tÃªn khÃ¡ch, SÄT, mÃ£..."
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
                title="Dáº¡ng LÆ°á»›i (Grid)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${viewMode === "table" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                title="Dáº¡ng Báº£ng (Table)"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 flex items-center justify-between gap-2 shrink-0 text-xs font-bold">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-zinc-400 text-[11px] font-extrabold uppercase mr-1 hidden sm:inline">Tráº¡ng thÃ¡i:</span>

            <button
              onClick={() => { setActiveStatusTab("all"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap ${activeStatusTab === "all" ? "bg-[#2AC1BC] text-white shadow-2xs" : "bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70"
                }`}
            >
              Táº¥t cáº£ ({statusTotalCount})
            </button>

            <button
              onClick={() => { setActiveStatusTab("holding"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap ${activeStatusTab === "holding" ? "bg-[#2AC1BC] text-white shadow-2xs" : "bg-[#2AC1BC]/10 text-[#0d6e6b] hover:bg-[#2AC1BC]/20"
                }`}
            >
              Äang giá»¯ ({statusHoldingCount})
            </button>

            <button
              onClick={() => { setActiveStatusTab("refunded"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap ${activeStatusTab === "refunded" ? "bg-purple-600 text-white shadow-2xs" : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                }`}
            >
              ÄÃ£ hoÃ n ({statusRefundedCount})
            </button>

            <button
              onClick={() => { setActiveStatusTab("deducted"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap border ${activeStatusTab === "deducted" ? "bg-rose-500 text-white border-rose-600 shadow-2xs" : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                }`}
            >
              ÄÃ£ kháº¥u trá»« ({statusDeductedCount})
            </button>
          </div>

          <span className="text-[11px] font-bold text-zinc-400 shrink-0 hidden sm:inline">
            Äang xem: <strong className="text-zinc-800">{selectedDepositTypeTab}</strong>
          </span>
        </div>
      </div>

      {/* Main Content Display (Grid or Table View) */}
      {paginatedDeposits.length === 0 ? (
        <div className="p-12 text-center bg-white border border-zinc-200 rounded-2xl space-y-3">
          <PiggyBank className="w-12 h-12 text-zinc-300 mx-auto stroke-1" />
          <h3 className="font-extrabold text-sm text-zinc-800">KhÃ´ng tÃ¬m tháº¥y khoáº£n cá»c nÃ o trong danh má»¥c {selectedDepositTypeTab}</h3>
          <p className="text-xs text-zinc-400">Thá»­ chá»n tráº¡ng thÃ¡i khÃ¡c hoáº·c nháº­p cá»¥m tá»« tÃ¬m kiáº¿m má»›i.</p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW (Rule #9 Default) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedDeposits.map((dep) => {
            const isHoldType = dep.depositType === "Cá»c giá»¯ chá»—";
            const isHolding = dep.status === "Äang giá»¯";
            const isRefunded = dep.status === "ÄÃ£ hoÃ n";
            const isDeducted = dep.status === "ÄÃ£ kháº¥u trá»«";

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
                      <span className="text-zinc-500 font-medium">NgÆ°á»i cá»c:</span>
                      <span className="font-bold text-zinc-900">{dep.tenantName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 font-medium">Sá»‘ Ä‘iá»‡n thoáº¡i:</span>
                      <span className="font-bold text-zinc-700">{dep.tenantPhone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 font-medium">NgÃ y Ä‘áº·t cá»c:</span>
                      <span className="font-semibold text-zinc-600">{dep.depositDate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 font-medium">{isHoldType ? "Háº¡n chá»‘t HÄ:" : "Thá»i háº¡n cá»c:"}</span>
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
                      <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider">Tiá»n cá»c hiá»‡n giá»¯</span>
                      <span className="font-black text-base text-[#2AC1BC]">
                        {dep.amount.toLocaleString("vi-VN")} â‚«
                      </span>
                    </div>

                    {isHoldType && isHolding && (
                      <span className="text-[10px] font-extrabold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md">
                        Cá»c Giá»¯ Chá»—
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedDeposit(dep)}
                      className="flex-1 py-2 bg-zinc-100 hover:bg-[#2AC1BC] hover:text-white text-zinc-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" /> Chi tiáº¿t
                    </button>

                    {/* Rule: Convert Hold Deposit -> Contract Deposit by collecting additional funds */}
                    {isHoldType && isHolding && (
                      <button
                        onClick={() => {
                          setShowUpgradeModal(dep);
                          setIsFormDirty(false);
                        }}
                        className="py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        title="Thu bá»• sung tiá»n cá»c & nÃ¢ng thÃ nh Cá»c Há»£p Äá»“ng"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> NÃ¢ng Cá»c HÄ
                      </button>
                    )}

                    {/* Quick Message Reminder */}
                    {!isRefunded && !isDeducted && (
                      <button
                        onClick={() => router.push(`/landlord/messages?room=${encodeURIComponent(dep.roomId)}&tenant=${encodeURIComponent(dep.tenantName)}&depId=${encodeURIComponent(dep.id)}&amount=${dep.amount}&autoSend=true`)}
                        className="p-2 bg-zinc-100 hover:bg-[#2AC1BC]/10 text-zinc-700 hover:text-[#2AC1BC] rounded-xl transition-all cursor-pointer"
                        title="Gá»­i tin nháº¯n qua Chat"
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
                  <th className="px-4 py-3">MÃ£ Cá»c</th>
                  <th className="px-4 py-3">PhÃ²ng</th>
                  <th className="px-4 py-3">KhÃ¡ch cá»c</th>
                  <th className="px-4 py-3">Loáº¡i cá»c</th>
                  <th className="px-4 py-3">Sá»‘ tiá»n giá»¯</th>
                  <th className="px-4 py-3">NgÃ y cá»c</th>
                  <th className="px-4 py-3">Tráº¡ng thÃ¡i</th>
                  <th className="px-4 py-3 text-right">Thao tÃ¡c</th>
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
                      <span className={`px-2 py-0.5 text-[10px] font-black rounded-md border ${dep.depositType === "Cá»c há»£p Ä‘á»“ng" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                        {dep.depositType}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-black text-[#2AC1BC] text-sm">{dep.amount.toLocaleString("vi-VN")} â‚«</td>
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
                          <Eye className="w-3.5 h-3.5" /> Chi tiáº¿t
                        </button>
                        {dep.depositType === "Cá»c giá»¯ chá»—" && dep.status === "Äang giá»¯" && (
                          <button
                            onClick={() => {
                              setShowUpgradeModal(dep);
                              setIsFormDirty(false);
                            }}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1"
                            title="Thu bá»• sung & nÃ¢ng thÃ nh cá»c há»£p Ä‘á»“ng"
                          >
                            <Sparkles className="w-3.5 h-3.5" /> NÃ¢ng Cá»c HÄ
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
          <span className="text-zinc-500">Hiá»ƒn thá»‹</span>
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
            / trang | <strong className="text-zinc-900">{totalItems > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + pageSize, totalItems)}</strong> trÃªn <strong className="text-zinc-900">{totalItems}</strong> má»¥c
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
                    Chi Tiáº¿t Khoáº£n Cá»c {selectedDeposit.id}
                  </h3>
                  <p className="text-xs text-zinc-500 font-semibold">{selectedDeposit.roomName} â€¢ {selectedDeposit.buildingName}</p>
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
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">ThÃ´ng Tin KhÃ¡ch ThuÃª</span>
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
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Loáº¡i Cá»c &amp; Tráº¡ng ThÃ¡i</span>
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
                    Sá»‘ Tiá»n Cá»c Hiá»‡n Äang Giá»¯
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">
                    Háº¡n: <strong className="text-zinc-200 font-bold">{selectedDeposit.expiryDate}</strong>
                  </span>
                </div>

                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-1 text-2xl sm:text-3xl font-black text-[#2AC1BC] tracking-tight whitespace-nowrap">
                    <span>{selectedDeposit.amount.toLocaleString("vi-VN")}</span>
                    <span className="text-xl sm:text-2xl font-bold">â‚«</span>
                  </div>

                  {selectedDeposit.originalAmount > selectedDeposit.amount && (
                    <span className="text-[11px] text-zinc-400 font-medium italic whitespace-nowrap">
                      (Ban Ä‘áº§u: {selectedDeposit.originalAmount.toLocaleString("vi-VN")} â‚«)
                    </span>
                  )}
                </div>

                {selectedDeposit.note && (
                  <div className="pt-2.5 border-t border-zinc-800/80 text-[11px] text-zinc-300 font-medium flex items-start gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <p><strong>Ghi chÃº:</strong> {selectedDeposit.note}</p>
                  </div>
                )}
              </div>

              {/* Deduction Breakdown Sub-card */}
              {selectedDeposit.isDeductedPartially && (selectedDeposit.deductedAmount || 0) > 0 && (
                <div className="p-4 bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-200 rounded-2xl space-y-2.5 text-rose-950 font-semibold shadow-2xs">
                  <div className="flex items-center justify-between border-b border-rose-200/80 pb-2">
                    <span className="font-extrabold flex items-center gap-1.5 text-xs text-rose-900">
                      <Scissors className="w-4 h-4 text-rose-600" /> Chi Tiáº¿t Kháº¥u Trá»« Tiá»n Cá»c
                    </span>
                    <span className="font-black text-rose-700 text-sm whitespace-nowrap">
                      -{selectedDeposit.deductedAmount?.toLocaleString("vi-VN")} â‚«
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-zinc-600">
                      <span>Sá»‘ tiá»n cá»c ban Ä‘áº§u:</span>
                      <span className="font-bold whitespace-nowrap">{selectedDeposit.originalAmount.toLocaleString("vi-VN")} â‚«</span>
                    </div>
                    <div className="flex justify-between text-rose-700 font-bold">
                      <span>Kháº¥u trá»« vi pháº¡m:</span>
                      <span className="whitespace-nowrap">-{selectedDeposit.deductedAmount?.toLocaleString("vi-VN")} â‚«</span>
                    </div>
                    <div className="flex justify-between text-purple-700 font-black border-t border-rose-200/80 pt-1.5">
                      <span>Sá»‘ tiá»n thá»±c táº¿ hoÃ n tráº£:</span>
                      <span className="whitespace-nowrap">{(selectedDeposit.refundAmount || 0).toLocaleString("vi-VN")} â‚«</span>
                    </div>
                  </div>

                  {selectedDeposit.deductionReason && (
                    <p className="text-[11px] text-rose-800 italic pt-1 border-t border-rose-200/80">
                      ðŸ’¡ <strong>LÃ½ do:</strong> {selectedDeposit.deductionReason}
                    </p>
                  )}
                </div>
              )}

              {/* Upgrade History Log */}
              {selectedDeposit.convertedAt && (
                <div className="p-3.5 bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-200 rounded-2xl text-amber-900 font-semibold space-y-1 shadow-2xs">
                  <p className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" /> ÄÃ£ thu bá»• sung {selectedDeposit.additionalPaidAmount?.toLocaleString("vi-VN")} â‚« &amp; NÃ¢ng thÃ nh Cá»c Há»£p Äá»“ng!
                  </p>
                  <p className="text-[11px] text-amber-700">NgÃ y nÃ¢ng cáº¥p: {selectedDeposit.convertedAt}</p>
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
                <Send className="w-3.5 h-3.5 text-[#2AC1BC]" /> Chat Ngay Vá»›i KhÃ¡ch
              </button>

              <div className="flex items-center gap-2 ml-auto">
                {selectedDeposit.depositType === "Cá»c giá»¯ chá»—" && selectedDeposit.status === "Äang giá»¯" && (
                  <button
                    onClick={() => {
                      setShowUpgradeModal(selectedDeposit);
                      setSelectedDeposit(null);
                      setIsFormDirty(false);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" /> NÃ¢ng Cá»c HÄ
                  </button>
                )}

                {selectedDeposit.status === "Äang giá»¯" && (
                  <button
                    onClick={() => {
                      setShowRefundModal(selectedDeposit);
                      setRefundForm({ deductedAmount: "0", deductionReason: "", note: "" });
                      setSelectedDeposit(null);
                      setIsFormDirty(false);
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" /> HoÃ n &amp; Kháº¥u Trá»« Cá»c
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
                  <h3 className="font-black text-base text-zinc-900">Thu Bá»• Sung & NÃ¢ng Cá»c Há»£p Äá»“ng</h3>
                  <p className="text-xs text-zinc-500 font-semibold">{showUpgradeModal.roomName} â€¢ {showUpgradeModal.tenantName}</p>
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
                  <strong className="text-zinc-900 font-black">Tiá»‡n Ã­ch thÃ´ng minh Dormio:</strong> Tá»± Ä‘á»™ng tÃ­nh chÃªnh lá»‡ch & há»— trá»£ 3 hÃ¬nh thá»©c thu tiá»n cá»c bá»• sung mÆ°á»£t mÃ !
                </p>
              </div>

              {/* Amount Breakdown & Calculation Card */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-zinc-600 text-xs">
                  <span>Tiá»n Cá»c ÄÃ£ Thu:</span>
                  <span className="font-black text-zinc-900 whitespace-nowrap">{showUpgradeModal.amount.toLocaleString("vi-VN")} â‚«</span>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">Tiá»n Cá»c Há»£p Äá»“ng (VNÄ) *</label>
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
                      Sá»‘ Tiá»n Thu Bá»• Sung
                    </span>
                    <span className="text-lg sm:text-xl font-black text-amber-900 leading-none mt-1 block whitespace-nowrap">
                      +{upgradeForm.additionalAmount.toLocaleString("vi-VN")} â‚«
                    </span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-amber-600 shrink-0" />
                </div>
              </div>

              {/* 3 Payment Methods Selector */}
              <div className="space-y-2">
                <label className="block text-[11px] font-extrabold text-zinc-700 uppercase tracking-wider">
                  Chá»n PhÆ°Æ¡ng Thá»©c Thu Tiá»n &amp; XÃ¡c Nháº­n NÃ¢ng Cá»c:
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
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-[#2AC1BC]/20 text-[#2AC1BC]">Tá»± Ä‘á»™ng</span>
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-zinc-900">1. VietQR Há»‡ Thá»‘ng</div>
                      <div className="text-[10px] text-zinc-500 font-medium leading-tight mt-0.5">Tá»± Ä‘á»™ng nÃ¢ng cá»c HÄ ngay khi tiá»n vá»</div>
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
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700">Chuyá»ƒn khoáº£n</span>
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-zinc-900">2. Nháº¯c Zalo / SMS</div>
                      <div className="text-[10px] text-zinc-500 font-medium leading-tight mt-0.5">KÃ¨m STK chá»§ trá», báº¥m xÃ¡c nháº­n sau</div>
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
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700">Trá»±c tiáº¿p</span>
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-zinc-900">3. Thu Tiá»n Máº·t</div>
                      <div className="text-[10px] text-zinc-500 font-medium leading-tight mt-0.5">Chá»§ trá» nháº­n tiá»n máº·t &amp; áº¥n xÃ¡c nháº­n</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Method Detail Guidelines */}
              {upgradeCollectionMethod === "vietqr" && (
                <div className="p-3.5 bg-[#2AC1BC]/10 border border-[#2AC1BC]/30 rounded-2xl space-y-2.5 text-[#0f5351]">
                  <p className="text-[11px] font-bold">
                    Nháº¥p nÃºt Ä‘á»ƒ gá»­i mÃ£ VietQR thu tiá»n <strong className="whitespace-nowrap">+{upgradeForm.additionalAmount.toLocaleString("vi-VN")} â‚«</strong> Ä‘áº¿n NgÆ°á»i ThuÃª Trá» qua Chat.
                  </p>
                  <p className="text-[11px] font-bold">
                    Há»‡ thá»‘ng sáº½ <strong>Tá»° Äá»˜NG XÃC NHáº¬N &amp; NÃ‚NG Cá»ŒC HÄ</strong>.
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
                    <span>Gá»­i MÃ£ VietQR Qua Chat (Tá»± Äá»™ng NÃ¢ng Cá»c)</span>
                  </button>
                </div>
              )}

              {upgradeCollectionMethod === "zalo_sms" && (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl space-y-3 text-blue-900">
                  <p className="text-[11px] font-bold leading-relaxed">
                    Sao chÃ©p máº«u tin nháº¯n Ä‘Ã£ soáº¡n sáºµn STK ngÃ¢n hÃ ng cá»§a Chá»§ trá», sau Ä‘Ã³
                    má»Ÿ trá»±c tiáº¿p Zalo hoáº·c tin nháº¯n SMS cá»§a sá»‘ Ä‘iá»‡n thoáº¡i <strong>{showUpgradeModal.tenantName}</strong> ({showUpgradeModal.tenantPhone}).
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
                      title="Má»Ÿ Zalo trá»±c tiáº¿p cá»§a ngÆ°á»i thuÃª"
                    >
                      <Send className="w-4 h-4" /> Má»Ÿ Zalo ({showUpgradeModal.tenantPhone})
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
                      title="Gá»­i SMS trá»±c tiáº¿p"
                    >
                      <Smartphone className="w-4 h-4" /> Gá»­i Tin Nháº¯n SMS
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowZaloModal(true)}
                    className="w-full py-2 bg-blue-100 hover:bg-blue-200 text-blue-900 font-extrabold text-[11px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" /> Xem Máº«u Tin Nháº¯n &amp; Sao ChÃ©p
                  </button>
                </div>
              )}

              {upgradeCollectionMethod === "cash" && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 space-y-1">
                  <p className="text-[11px] font-bold">
                    NgÆ°á»i thuÃª trá» Ä‘Ã³ng trá»±c tiáº¿p tiá»n máº·t <strong>+{upgradeForm.additionalAmount.toLocaleString("vi-VN")} â‚«</strong>.
                  </p>
                  <p className="text-[11px] font-bold">
                    Chá»§ trá» báº¥m nÃºt <strong>[XÃ¡c Nháº­n ÄÃ£ Thu &amp; NÃ¢ng Cá»c HÄ]</strong> bÃªn dÆ°á»›i.
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
                Há»§y
              </button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {upgradeCollectionMethod === "vietqr" && (
                  <span className="text-[10px] text-zinc-400 font-medium italic text-center sm:text-right">
                    VietQR tá»± Ä‘á»™ng xÃ¡c nháº­n khi tiá»n vá»
                  </span>
                )}
                <button
                  type="button"
                  disabled={upgradeCollectionMethod === "vietqr"}
                  onClick={handleConfirmUpgradeToContract}
                  title={
                    upgradeCollectionMethod === "vietqr"
                      ? "VietQR tá»± Ä‘á»™ng xÃ¡c nháº­n nÃ¢ng cá»c khi tiá»n vá» tÃ i khoáº£n, khÃ´ng cáº§n báº¥m xÃ¡c nháº­n thá»§ cÃ´ng"
                      : "XÃ¡c nháº­n Ä‘Ã£ thu Ä‘á»§ tiá»n vÃ  nÃ¢ng thÃ nh Cá»c Há»£p Äá»“ng"
                  }
                  className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 text-center ${upgradeCollectionMethod === "vietqr"
                    ? "bg-zinc-200 text-zinc-400 border border-zinc-300 cursor-not-allowed opacity-40 shadow-none select-none"
                    : "bg-amber-500 hover:bg-amber-600 text-white cursor-pointer shadow-md"
                    }`}
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span>XÃ¡c Nháº­n ÄÃ£ Thu &amp; NÃ¢ng Cá»c HÄ</span>
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
                <h3 className="font-extrabold text-base text-zinc-900">Máº«u Tin Nháº¯n Zalo / SMS</h3>
              </div>
              <button onClick={() => setShowZaloModal(false)} className="text-zinc-400 hover:text-zinc-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-500 font-semibold">
              Sao chÃ©p ná»™i dung tin nháº¯n dÆ°á»›i Ä‘Ã¢y Ä‘á»ƒ gá»­i cho khÃ¡ch <strong>{showUpgradeModal.tenantName}</strong> ({showUpgradeModal.tenantPhone}) qua Zalo hoáº·c SMS:
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
                â€¢ Ngan hang: MB Bank (Ngan hang Quan Doi)
                <br />
                â€¢ So tai khoan: 9999888899
                <br />
                â€¢ Chu tai khoan: CHU TRO DORMIO
                <br />
                â€¢ Noi dung CK: COC {showUpgradeModal.roomName} {showUpgradeModal.tenantPhone}
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
                {copySuccess ? "ÄÃ£ sao chÃ©p tin nháº¯n!" : "Sao ChÃ©p Tin Nháº¯n Zalo / SMS"}
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
                  <h3 className="font-black text-base text-zinc-900">ThÃªm Khoáº£n Äáº·t Cá»c Má»›i</h3>
                  <p className="text-xs text-zinc-500 font-semibold">Táº¡o khoáº£n Cá»c Giá»¯ Chá»— hoáº·c Cá»c Há»£p Äá»“ng</p>
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
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">Sá»‘ PhÃ²ng *</label>
                  <input
                    type="text"
                    value={newDepositForm.roomName}
                    onChange={(e) => {
                      setNewDepositForm({ ...newDepositForm, roomName: e.target.value });
                      setIsFormDirty(true);
                    }}
                    placeholder="VÃ­ dá»¥: 103"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">Loáº¡i Äáº·t Cá»c (2 Loáº¡i) *</label>
                  <select
                    value={newDepositForm.depositType}
                    onChange={(e) => {
                      setNewDepositForm({ ...newDepositForm, depositType: e.target.value as any });
                      setIsFormDirty(true);
                    }}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  >
                    <option value="Cá»c giá»¯ chá»—">Cá»c giá»¯ chá»— (Chá» háº¹n lá»‹ch chá»‘t HÄ)</option>
                    <option value="Cá»c há»£p Ä‘á»“ng">Cá»c há»£p Ä‘á»“ng (ÄÃ£ kÃ½ há»£p Ä‘á»“ng thuÃª)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">TÃªn NgÆ°á»i Äáº·t Cá»c *</label>
                  <input
                    type="text"
                    value={newDepositForm.tenantName}
                    onChange={(e) => {
                      setNewDepositForm({ ...newDepositForm, tenantName: e.target.value });
                      setIsFormDirty(true);
                    }}
                    placeholder="VÃ­ dá»¥: Nguyá»…n VÄƒn A"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">Sá»‘ Äiá»‡n Thoáº¡i *</label>
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
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">Sá»‘ Tiá»n Äáº·t Cá»c (VNÄ) *</label>
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
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">Thá»i Háº¡n Háº¿t Cá»c / Chá»‘t HÄ</label>
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
                <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">Ghi ChÃº Ban Äáº§u</label>
                <textarea
                  rows={3}
                  value={newDepositForm.note}
                  onChange={(e) => {
                    setNewDepositForm({ ...newDepositForm, note: e.target.value });
                    setIsFormDirty(true);
                  }}
                  placeholder="Ghi chÃº Ä‘iá»u kiá»‡n giá»¯ cá»c hoáº·c thá»a thuáº­n thu thÃªm..."
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-medium text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                />
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 bg-white flex items-center justify-end gap-2">
              <button
                onClick={() => requestCloseModal("create")}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Há»§y
              </button>
              <button
                onClick={handleCreateDeposit}
                className="px-5 py-2 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-black rounded-xl shadow-md cursor-pointer"
              >
                LÆ°u Khoáº£n Äáº·t Cá»c
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
                  <h3 className="font-black text-base text-zinc-900">HoÃ n &amp; Kháº¥u Trá»« Tiá»n Cá»c</h3>
                  <p className="text-xs text-zinc-500 font-semibold">{showRefundModal.roomName} â€¢ {showRefundModal.tenantName}</p>
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
                <span className="text-zinc-600 font-semibold truncate">Sá»‘ tiá»n cá»c ban Ä‘áº§u hiá»‡n giá»¯:</span>
                <span className="font-black text-purple-900 text-sm sm:text-base whitespace-nowrap">{showRefundModal.amount.toLocaleString("vi-VN")} â‚«</span>
              </div>

              {/* Deduction Amount Input */}
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700">
                    Sá»‘ Tiá»n Kháº¥u Trá»« (VNÄ)
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
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Chá»n Nhanh Sá»‘ Tiá»n Kháº¥u Trá»«:</span>
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
                      <span className="text-[11px] sm:text-xs whitespace-nowrap">HoÃ n 100%</span>
                      <span className="text-[9px] font-bold opacity-80 whitespace-nowrap">(0 â‚«)</span>
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
                      <span className="text-[11px] sm:text-xs whitespace-nowrap">Trá»« 50%</span>
                      <span className="text-[9px] font-bold opacity-80 whitespace-nowrap">({(showRefundModal.amount / 2).toLocaleString("vi-VN")} â‚«)</span>
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
                      <span className="text-[11px] sm:text-xs whitespace-nowrap">Trá»« 100%</span>
                      <span className="text-[9px] font-bold opacity-80 whitespace-nowrap">({showRefundModal.amount.toLocaleString("vi-VN")} â‚«)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Deduction Reason Input */}
              {Number(refundForm.deductedAmount) > 0 && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  <label className="block text-[11px] font-extrabold text-rose-800">LÃ½ Do Kháº¥u Trá»« *</label>
                  <textarea
                    rows={2}
                    value={refundForm.deductionReason}
                    onChange={(e) => {
                      setRefundForm({ ...refundForm, deductionReason: e.target.value });
                      setIsFormDirty(true);
                    }}
                    placeholder="Nháº­p chi tiáº¿t lÃ½ do kháº¥u trá»« (HÆ° háº¡i sofa, lÃ m báº©n sÆ¡n tÆ°á»ng, vi pháº¡m Ä‘iá»u khoáº£n...)"
                    className="w-full px-3 py-2 bg-rose-50/40 border border-rose-200 rounded-xl font-medium text-rose-950 focus:outline-none focus:border-rose-500 text-xs"
                  />
                </div>
              )}

              {/* Refund Note Input */}
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-zinc-700">Ghi ChÃº HoÃ n Cá»c</label>
                <textarea
                  rows={2}
                  value={refundForm.note}
                  onChange={(e) => {
                    setRefundForm({ ...refundForm, note: e.target.value });
                    setIsFormDirty(true);
                  }}
                  placeholder="PhÆ°Æ¡ng thá»©c hoÃ n tiá»n (Chuyá»ƒn khoáº£n VietQR / Tiá»n máº·t...)"
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
                      <span>Sá»‘ tiá»n cá»c ban Ä‘áº§u:</span>
                      <span className="font-bold text-zinc-900 whitespace-nowrap">{showRefundModal.amount.toLocaleString("vi-VN")} â‚«</span>
                    </div>

                    {deductAmt > 0 && (
                      <div className="flex justify-between items-center text-rose-700 font-bold border-t border-purple-200/60 pt-1.5">
                        <span>Kháº¥u trá»« vi pháº¡m / hÆ° háº¡i:</span>
                        <span className="font-black whitespace-nowrap">-{deductAmt.toLocaleString("vi-VN")} â‚«</span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-purple-900 font-black text-xs sm:text-sm border-t border-purple-200 pt-2">
                      <span>Sá»‘ tiá»n thá»±c táº¿ hoÃ n tráº£ cho khÃ¡ch:</span>
                      <span className="text-base sm:text-lg text-purple-700 whitespace-nowrap">{actualRefund.toLocaleString("vi-VN")} â‚«</span>
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
                Há»§y
              </button>
              <button
                type="button"
                onClick={handleRefundDeposit}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01]"
              >
                <Check className="w-4 h-4" /> XÃ¡c Nháº­n HoÃ n &amp; Kháº¥u Trá»« Cá»c
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
              <h3 className="font-extrabold text-base text-zinc-900">XÃ¡c Nháº­n ÄÃ³ng Form</h3>
            </div>

            <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
              Báº¡n Ä‘ang cÃ³ thÃ´ng tin nháº­p dá»Ÿ chÆ°a lÆ°u. Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n thoÃ¡t vÃ  há»§y bá» cÃ¡c thay Ä‘á»•i?
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmCloseTarget(null)}
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Tiáº¿p tá»¥c chá»‰nh sá»­a
              </button>
              <button
                onClick={handleConfirmCloseModal}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Há»§y thay Ä‘á»•i & ÄÃ³ng
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
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-zinc-400">Äang táº£i dá»¯ liá»‡u tiá»n cá»c...</div>}>
      <DepositsContent />
    </Suspense>
  );
}

