"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  UploadCloud,
  X,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building,
  LogIn,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/TextInput";
import { TextareaInput } from "@/components/ui/TextareaInput";
import { SelectInput } from "@/components/ui/SelectInput";
import { useTranslations } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  grievanceService,
  Grievance,
  GrievanceType,
  GrievancePriority,
} from "@/services/grievance.service";
import { uploadImageToBackend } from "@/services/upload.service";

export default function SendApplicationPage() {
  const t = useTranslations("sendApplication");
  const tCommon = useTranslations("common");
  const { isLoggedIn, user } = useAuth();
  const { toast } = useToast();

  // Data state
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Grievance[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Grievance | null>(null);

  // View Mode: Grid (default, Rule #9) vs Table
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Pagination (Rule #9)
  const [currentPage, setCurrentPage] = useState(1);
  const [customPageSize, setCustomPageSize] = useState<number>(6);
  const itemsPerPage = customPageSize > 0 ? customPageSize : viewMode === "grid" ? 6 : 10;

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appType, setAppType] = useState<GrievanceType>("complaint");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<GrievancePriority>("medium");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Unsaved changes check (Rule #10)
  const isFormDirty =
    title.trim() !== "" ||
    description.trim() !== "" ||
    uploadedImages.length > 0 ||
    priority !== "medium" ||
    appType !== "complaint";

  // Reset form helper
  const resetForm = () => {
    setAppType("complaint");
    setTitle("");
    setDescription("");
    setPriority("medium");
    setUploadedImages([]);
    setFormError(null);
    setShowExitConfirm(false);
  };

  // Close modal safely (Rule #10)
  const handleCloseModal = () => {
    if (isFormDirty) {
      setShowExitConfirm(true);
    } else {
      setIsModalOpen(false);
      resetForm();
    }
  };

  // Fetch applications if user is logged in
  useEffect(() => {
    let isMounted = true;

    async function loadApplications() {
      if (!isLoggedIn) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await grievanceService.getTenantGrievances();
        if (!isMounted) return;
        setApplications(data || []);
      } catch (err: unknown) {
        console.warn("Could not load user applications:", err);
        if (!isMounted) return;
        setApplications([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadApplications();

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn]);

  // Adjust default page size when view mode changes
  useEffect(() => {
    setCustomPageSize(viewMode === "grid" ? 6 : 10);
    setCurrentPage(1);
  }, [viewMode]);

  // Client image compression to prevent large payloads
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const image = new window.Image();
        image.onload = () => {
          const maxDim = 1280;
          let { width, height } = image;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(image, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.82));
          } else {
            resolve(readerEvent.target?.result as string);
          }
        };
        image.onerror = () => resolve(readerEvent.target?.result as string);
        image.src = readerEvent.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedImages.length + files.length > 5) {
      setFormError(t("errorMaxImages"));
      return;
    }

    const compressedList: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const base64 = await compressImageFile(files[i]);
      compressedList.push(base64);
    }

    setUploadedImages((prev) => [...prev, ...compressedList].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Application
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();

    if (title.trim().length < 5) {
      setFormError(t("errorEmptyTitle"));
      return;
    }

    if (description.trim().length < 10) {
      setFormError(t("errorEmptyDesc"));
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      // 1. Upload images to Cloudinary with folder dormio/application-images
      const cloudinaryUrls: string[] = [];
      for (const img of uploadedImages) {
        if (img.startsWith("http://") || img.startsWith("https://")) {
          cloudinaryUrls.push(img);
        } else {
          const uploadRes = await uploadImageToBackend(img, "dormio/application-images");
          if (uploadRes?.url) {
            cloudinaryUrls.push(uploadRes.url);
          }
        }
      }

      // 2. Submit grievance with Cloudinary URLs
      const newApp = await grievanceService.createGrievance({
        type: appType,
        title: title.trim(),
        description: description.trim(),
        priority,
        imageUrls: cloudinaryUrls,
      });

      setApplications((prev) => [newApp, ...prev]);
      setIsModalOpen(false);
      resetForm();
      toast.success(t("submitSuccessToast"));
    } catch (err: unknown) {
      console.error("Failed to create application:", err);
      const errMsg = err instanceof Error ? err.message : t("submitErrorToast");
      setFormError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered & Paginated Applications
  const filteredApplications = useMemo(() => {
    return applications.filter((item) => {
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());

      const itemType = item.type || "complaint";
      const matchType = typeFilter === "all" || itemType === typeFilter;

      const itemStatus = String(item.status);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "resolved" && (itemStatus === "resolved" || itemStatus === "closed")) ||
        (statusFilter === "in_progress" && (itemStatus === "in_progress" || itemStatus === "investigating")) ||
        (statusFilter === "rejected" && itemStatus === "rejected") ||
        (statusFilter === "pending" && itemStatus === "pending");

      return matchSearch && matchType && matchStatus;
    });
  }, [applications, searchQuery, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / itemsPerPage));
  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredApplications.slice(start, start + itemsPerPage);
  }, [filteredApplications, currentPage, itemsPerPage]);

  // Windowed pagination calculation (Rule #9: 5-page window jumping)
  const windowStart = Math.floor((currentPage - 1) / 5) * 5 + 1;
  const windowEnd = Math.min(windowStart + 4, totalPages);
  const pageNumbers: number[] = [];
  for (let i = windowStart; i <= windowEnd; i++) {
    pageNumbers.push(i);
  }

  // Type metadata helper
  const getTypeInfo = (type?: GrievanceType) => {
    switch (type) {
      case "inquiry":
        return {
          label: t("typeInquiry"),
          icon: HelpCircle,
          badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
          cardBorder: "border-blue-500 bg-blue-50/30",
        };
      case "feedback":
        return {
          label: t("typeFeedback"),
          icon: Sparkles,
          badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
          cardBorder: "border-purple-500 bg-purple-50/30",
        };
      case "complaint":
      default:
        return {
          label: t("typeComplaint"),
          icon: AlertTriangle,
          badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
          cardBorder: "border-rose-500 bg-rose-50/30",
        };
    }
  };

  // Status badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
      case "closed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>{t("statusResolved")}</span>
          </span>
        );
      case "in_progress":
      case "investigating":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
            <Clock className="w-3 h-3 text-blue-600 animate-spin" />
            <span>{t("statusInProgress")}</span>
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 text-[10px] font-bold">
            <XCircle className="w-3 h-3 text-zinc-500" />
            <span>{t("statusRejected")}</span>
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>{t("statusPending")}</span>
          </span>
        );
    }
  };

  // Priority badge helper
  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "high":
        return (
          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black uppercase">
            {t("priorityHigh")}
          </span>
        );
      case "low":
        return (
          <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 text-[10px] font-black uppercase">
            {t("priorityLow")}
          </span>
        );
      case "medium":
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase">
            {t("priorityMedium")}
          </span>
        );
    }
  };

  const priorityOptions = [
    { value: "low", label: t("priorityLow") },
    { value: "medium", label: t("priorityMedium") },
    { value: "high", label: t("priorityHigh") },
  ];

  const statusOptions = [
    { value: "all", label: t("statusFilterAll") },
    { value: "pending", label: t("statusPending") },
    { value: "in_progress", label: t("statusInProgress") },
    { value: "resolved", label: t("statusResolved") },
    { value: "rejected", label: t("statusRejected") },
  ];

  return (
    <div className="min-h-screen bg-zinc-50/60 pb-16">
      {/* Hero Header */}
      <section className="bg-gradient-to-b from-white via-zinc-50 to-transparent border-b border-zinc-200/80 pt-10 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2AC1BC]/10 border border-[#2AC1BC]/30 text-[#2AC1BC] text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t("badge")}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-900 tracking-tight">
              {t("pageTitle")}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium max-w-2xl leading-relaxed">
              {t("pageSubtitle")}
            </p>
          </div>

          <div>
            {isLoggedIn ? (
              <Button
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#2AC1BC] hover:bg-[#23B3AE] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#2AC1BC]/25 cursor-pointer transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{t("btnNewApplication")}</span>
              </Button>
            ) : (
              <Link href="/login?from=/send-application">
                <Button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#2AC1BC] hover:bg-[#23B3AE] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#2AC1BC]/25 cursor-pointer">
                  <LogIn className="w-4 h-4" />
                  <span>{t("loginBtn")}</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {!isLoggedIn ? (
          /* Login Notice Card for unauthenticated visitors */
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-zinc-200 shadow-sm text-center max-w-xl mx-auto space-y-4 my-8">
            <div className="w-16 h-16 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-zinc-900">{t("loginNoticeTitle")}</h2>
            <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-medium">
              {t("loginNoticeDesc")}
            </p>
            <div className="pt-2">
              <Link href="/login?from=/send-application">
                <Button className="px-6 py-2.5 rounded-2xl bg-[#2AC1BC] hover:bg-[#23B3AE] text-white text-xs font-bold shadow-md cursor-pointer">
                  <LogIn className="w-4 h-4 mr-2" />
                  <span>{t("loginBtn")}</span>
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filter and Control Bar */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-zinc-200/90 shadow-xs space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* 3 Main Type Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 bg-zinc-100/80 rounded-2xl shrink-0">
                  <button
                    onClick={() => {
                      setTypeFilter("all");
                      setCurrentPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${typeFilter === "all"
                        ? "bg-white text-zinc-900 shadow-xs"
                        : "text-zinc-600 hover:text-zinc-900"
                      }`}
                  >
                    <span>{t("tabAll")}</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-zinc-200 text-zinc-700">
                      {applications.length}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setTypeFilter("complaint");
                      setCurrentPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${typeFilter === "complaint"
                        ? "bg-rose-500 text-white shadow-xs"
                        : "text-zinc-600 hover:text-zinc-900"
                      }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{t("tabComplaint")}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${typeFilter === "complaint"
                          ? "bg-rose-600 text-white"
                          : "bg-rose-100 text-rose-800"
                        }`}
                    >
                      {applications.filter((a) => (a.type || "complaint") === "complaint").length}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setTypeFilter("inquiry");
                      setCurrentPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${typeFilter === "inquiry"
                        ? "bg-blue-500 text-white shadow-xs"
                        : "text-zinc-600 hover:text-zinc-900"
                      }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{t("tabInquiry")}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${typeFilter === "inquiry"
                          ? "bg-blue-600 text-white"
                          : "bg-blue-100 text-blue-800"
                        }`}
                    >
                      {applications.filter((a) => a.type === "inquiry").length}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setTypeFilter("feedback");
                      setCurrentPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${typeFilter === "feedback"
                        ? "bg-purple-500 text-white shadow-xs"
                        : "text-zinc-600 hover:text-zinc-900"
                      }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t("tabFeedback")}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${typeFilter === "feedback"
                          ? "bg-purple-600 text-white"
                          : "bg-purple-100 text-purple-800"
                        }`}
                    >
                      {applications.filter((a) => a.type === "feedback").length}
                    </span>
                  </button>
                </div>

                {/* Search & Status Filter */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={t("searchPlaceholder")}
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-[#2AC1BC]"
                    />
                  </div>

                  <div className="w-36 shrink-0">
                    <SelectInput
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      options={statusOptions}
                      className="py-1.5 text-xs bg-zinc-50"
                    />
                  </div>

                  {/* Grid vs Table View Toggle (Rule #9) */}
                  <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl border border-zinc-200 shrink-0">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-lg cursor-pointer transition-all ${viewMode === "grid"
                          ? "bg-white text-zinc-900 shadow-2xs font-bold"
                          : "text-zinc-500 hover:text-zinc-800"
                        }`}
                      title="Grid View"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("table")}
                      className={`p-1.5 rounded-lg cursor-pointer transition-all ${viewMode === "table"
                          ? "bg-white text-zinc-900 shadow-2xs font-bold"
                          : "text-zinc-500 hover:text-zinc-800"
                        }`}
                      title="Table View"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* List / Grid Display */}
            {loading ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-zinc-200">
                <Clock className="w-8 h-8 text-[#2AC1BC] animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold text-zinc-400">{tCommon("loading")}</p>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-zinc-200 space-y-3">
                <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-zinc-800">{t("emptyListTitle")}</h3>
                <p className="text-xs text-zinc-400 font-medium max-w-sm mx-auto">
                  {t("emptyListDesc")}
                </p>
                <div className="pt-2">
                  <Button
                    onClick={() => {
                      resetForm();
                      setIsModalOpen(true);
                    }}
                    className="px-4 py-2 bg-[#2AC1BC] text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    <span>{t("btnNewApplication")}</span>
                  </Button>
                </div>
              </div>
            ) : viewMode === "grid" ? (
              /* GRID VIEW (Rule #9 Default) */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedApplications.map((item) => {
                  const typeInfo = getTypeInfo(item.type);
                  const Icon = typeInfo.icon;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedApplication(item)}
                      className="bg-white rounded-3xl p-5 border border-zinc-200/90 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group hover:border-[#2AC1BC]"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase ${typeInfo.badgeColor}`}
                          >
                            <Icon className="w-3 h-3" />
                            <span>{typeInfo.label}</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            {getPriorityBadge(item.priority)}
                            {getStatusBadge(item.status)}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-black text-zinc-900 group-hover:text-[#2AC1BC] transition-colors line-clamp-1">
                            {item.title}
                          </h4>
                          <p className="text-xs text-zinc-500 font-medium line-clamp-2 mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        {item.images && item.images.length > 0 && (
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            {item.images.slice(0, 3).map((img) => (
                              <img
                                key={img.id}
                                src={img.url}
                                alt="Evidence"
                                className="w-12 h-12 rounded-xl object-cover border border-zinc-200"
                              />
                            ))}
                            {item.images.length > 3 && (
                              <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] font-black text-zinc-500">
                                +{item.images.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400 mt-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span className="font-bold text-[#2AC1BC] group-hover:underline">
                          {t("viewDetailBtn")} &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* TABLE VIEW */
              <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50/70 text-[11px] font-black text-zinc-500 uppercase tracking-wider">
                        <th className="py-3.5 px-4">{t("typeLabel")}</th>
                        <th className="py-3.5 px-4">{t("titleLabel")}</th>
                        <th className="py-3.5 px-4">{t("priorityLabel")}</th>
                        <th className="py-3.5 px-4">{t("statusFilterLabel")}</th>
                        <th className="py-3.5 px-4">{t("createdDate")}</th>
                        <th className="py-3.5 px-4 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-xs font-semibold text-zinc-700">
                      {paginatedApplications.map((item) => {
                        const typeInfo = getTypeInfo(item.type);
                        const Icon = typeInfo.icon;

                        return (
                          <tr
                            key={item.id}
                            onClick={() => setSelectedApplication(item)}
                            className="hover:bg-zinc-50/80 transition-colors cursor-pointer group"
                          >
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase ${typeInfo.badgeColor}`}
                              >
                                <Icon className="w-3 h-3" />
                                <span>{typeInfo.label}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4 max-w-xs">
                              <p className="font-black text-zinc-900 group-hover:text-[#2AC1BC] truncate">
                                {item.title}
                              </p>
                              <p className="text-[11px] text-zinc-400 font-normal truncate">
                                {item.description}
                              </p>
                            </td>
                            <td className="py-3 px-4">{getPriorityBadge(item.priority)}</td>
                            <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                            <td className="py-3 px-4 text-zinc-400 text-[11px]">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-[11px] font-bold rounded-xl"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                <span>{t("viewDetailBtn")}</span>
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Standardized Pagination Bar (Rule #9) */}
            {filteredApplications.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 px-4 bg-white rounded-2xl border border-zinc-200 text-xs font-semibold text-zinc-600">
                {/* Items per page selector & Range indicator */}
                <div className="flex items-center gap-2">
                  <span>{tCommon("showing")}</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={customPageSize}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (val > 0) {
                        setCustomPageSize(val);
                        setCurrentPage(1);
                      }
                    }}
                    className="w-14 px-2 py-1 bg-zinc-50 border border-zinc-300 rounded-lg text-center font-bold text-zinc-900 text-xs focus:outline-none focus:border-[#2AC1BC]"
                  />
                  <span>
                    {tCommon("perPage")} |{" "}
                    {(currentPage - 1) * itemsPerPage + 1}-
                    {Math.min(currentPage * itemsPerPage, filteredApplications.length)}{" "}
                    {tCommon("of")} {filteredApplications.length} {tCommon("items")}
                  </span>
                </div>

                {/* 5-page window jumping controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {windowStart > 1 && (
                    <button
                      onClick={() => setCurrentPage(Math.max(1, windowStart - 5))}
                      className="px-2.5 py-1 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-xs font-bold"
                    >
                      ...
                    </button>
                  )}

                  {pageNumbers.map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${currentPage === pageNum
                          ? "bg-[#2AC1BC] text-white shadow-2xs"
                          : "border border-zinc-200 hover:bg-zinc-100 text-zinc-700"
                        }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  {windowEnd < totalPages && (
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, windowEnd + 1))}
                      className="px-2.5 py-1 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-xs font-bold"
                    >
                      ...
                    </button>
                  )}

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* CREATE APPLICATION MODAL */}
      {isModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 my-8 space-y-6 relative">
            <button
              onClick={handleCloseModal}
              className="absolute right-5 top-5 p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1 pr-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2AC1BC]/10 text-[#2AC1BC] text-[10px] font-black rounded-full uppercase tracking-wider">
                <FileText className="w-3 h-3" />
                <span>Dormio Support</span>
              </div>
              <h2 className="text-xl font-black text-zinc-900 tracking-tight">{t("modalTitle")}</h2>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">{t("modalSubtitle")}</p>
            </div>

            {formError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitApplication} className="space-y-5">
              {/* 3 Application Type Selector Cards */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 block">
                  {t("typeLabel")} <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Complaint Card */}
                  <button
                    type="button"
                    onClick={() => setAppType("complaint")}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${appType === "complaint"
                        ? "border-rose-500 bg-rose-50/50 shadow-xs ring-1 ring-rose-500"
                        : "border-zinc-200 hover:border-zinc-300 bg-white"
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span className="text-xs font-black text-zinc-900">{t("typeComplaint")}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-tight">
                      {t("typeComplaintDesc")}
                    </p>
                  </button>

                  {/* Inquiry Card */}
                  <button
                    type="button"
                    onClick={() => setAppType("inquiry")}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${appType === "inquiry"
                        ? "border-blue-500 bg-blue-50/50 shadow-xs ring-1 ring-blue-500"
                        : "border-zinc-200 hover:border-zinc-300 bg-white"
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <HelpCircle className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-black text-zinc-900">{t("typeInquiry")}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-tight">
                      {t("typeInquiryDesc")}
                    </p>
                  </button>

                  {/* Feedback Card */}
                  <button
                    type="button"
                    onClick={() => setAppType("feedback")}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${appType === "feedback"
                        ? "border-purple-500 bg-purple-50/50 shadow-xs ring-1 ring-purple-500"
                        : "border-zinc-200 hover:border-zinc-300 bg-white"
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-black text-zinc-900">{t("typeFeedback")}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-tight">
                      {t("typeFeedbackDesc")}
                    </p>
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <TextInput
                label={t("titleLabel")}
                required
                placeholder={t("titlePlaceholder")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              {/* Detail Textarea */}
              <TextareaInput
                label={t("detailLabel")}
                required
                rows={4}
                placeholder={t("detailPlaceholder")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              {/* Priority Selector */}
              <SelectInput
                label={t("priorityLabel")}
                value={priority}
                onChange={(e) => setPriority(e.target.value as GrievancePriority)}
                options={priorityOptions}
              />

              {/* Image Evidence Upload */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 block">
                  {t("evidenceImagesLabel")}
                </label>

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 pb-2">
                    {uploadedImages.map((src, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-zinc-200 aspect-square">
                        <img src={src} alt="Evidence" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeUploadedImage(idx)}
                          className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {uploadedImages.length < 5 && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-200 hover:border-[#2AC1BC] rounded-2xl p-4 text-center cursor-pointer transition-colors bg-zinc-50/50 hover:bg-zinc-50"
                  >
                    <UploadCloud className="w-6 h-6 text-zinc-400 mx-auto mb-1" />
                    <p className="text-xs font-bold text-zinc-600">{t("uploadGuide")}</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  className="rounded-2xl px-5 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                >
                  {t("cancelBtn")}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-2xl px-6 py-2.5 text-xs font-bold bg-[#2AC1BC] hover:bg-[#23B3AE] text-white shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? t("submittingBtn") : t("submitBtn")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM EXIT MODAL (Rule #10) */}
      {showExitConfirm && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowExitConfirm(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-zinc-900">{t("confirmExitTitle")}</h3>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                {t("confirmExitDesc")}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowExitConfirm(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-zinc-700"
              >
                {t("continueEditingBtn")}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="rounded-xl px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                {t("discardAndCloseBtn")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* APPLICATION DETAIL MODAL */}
      {selectedApplication && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedApplication(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 my-8 space-y-6 relative">
            <button
              onClick={() => setSelectedApplication(null)}
              className="absolute right-5 top-5 p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="space-y-2 pr-8">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase ${getTypeInfo(selectedApplication.type).badgeColor
                    }`}
                >
                  <span>{getTypeInfo(selectedApplication.type).label}</span>
                </span>
                {getStatusBadge(selectedApplication.status)}
                {getPriorityBadge(selectedApplication.priority)}
              </div>

              <h3 className="text-xl font-black text-zinc-900 tracking-tight">
                {selectedApplication.title}
              </h3>

              <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-400 pt-1">
                <span>
                  {t("createdDate")}: {new Date(selectedApplication.createdAt).toLocaleString()}
                </span>
                {selectedApplication.boardingHouseName && (
                  <span className="flex items-center gap-1 text-zinc-600 font-bold">
                    <Building className="w-3.5 h-3.5" />
                    {selectedApplication.boardingHouseName}
                    {selectedApplication.roomNumber ? ` - P.${selectedApplication.roomNumber}` : ""}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">
                {t("detailLabel")}
              </span>
              <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed font-medium whitespace-pre-wrap">
                {selectedApplication.description}
              </p>
            </div>

            {/* Evidence Photos */}
            {selectedApplication.images && selectedApplication.images.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">
                  {t("evidenceImagesLabel")}
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {selectedApplication.images.map((img) => (
                    <a
                      key={img.id}
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl overflow-hidden border border-zinc-200 aspect-square hover:opacity-90 transition-opacity"
                    >
                      <img src={img.url} alt="Evidence" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Resolution Section */}
            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>{t("adminResolutionTitle")}</span>
                </span>
                {selectedApplication.resolvedAt && (
                  <span className="text-[10px] text-amber-700 font-medium">
                    {new Date(selectedApplication.resolvedAt).toLocaleString()}
                  </span>
                )}
              </div>

              {selectedApplication.resolutionNote ? (
                <p className="text-xs text-amber-900 leading-relaxed font-medium whitespace-pre-wrap bg-white/70 p-3 rounded-xl border border-amber-200">
                  {selectedApplication.resolutionNote}
                </p>
              ) : (
                <p className="text-xs text-amber-700 font-medium italic">
                  {t("noResolutionYet")}
                </p>
              )}

              {selectedApplication.resolvedByName && (
                <p className="text-[10px] text-amber-800 font-bold">
                  {t("resolvedBy")}: {selectedApplication.resolvedByName}
                </p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setSelectedApplication(null)}
                className="rounded-xl px-5 py-2 text-xs font-bold text-zinc-700"
              >
                {t("closeBtn")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
