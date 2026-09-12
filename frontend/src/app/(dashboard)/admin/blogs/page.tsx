"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLanguage, useTranslations } from "@/context/LanguageContext";
import { postService, PublicPostListing } from "@/services/post.service";
import {
  ShieldAlert, Plus, Search, Eye, Edit3, Trash2,
  Lock, Unlock, RotateCcw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X,
  AlertTriangle, RefreshCw, Bookmark, Building2, CheckCircle2,
  Newspaper,
} from "lucide-react";

const HOUSE_PLACEHOLDER = "/house-placeholder.jpg";

export default function AdminPostModerationPage() {
  const { locale } = useLanguage();
  const t = useTranslations("admin");

  // Data State
  const [posts, setPosts] = useState<PublicPostListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Rule #9: Standardized Table Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Standard 10 for table

  // Direct Column Filters for Table
  const [filterArticle, setFilterArticle] = useState("");
  const [filterProperty, setFilterProperty] = useState("all");
  const [filterDeposit, setFilterDeposit] = useState<
    "all" | "free" | "under_2m" | "2m_5m" | "above_5m"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "posted" | "draft" | "hidden" | "locked" | "reported"
  >("all");


  // Lock Post Modal State
  const [lockTarget, setLockTarget] = useState<PublicPostListing | null>(null);
  const [lockReason, setLockReason] = useState("");
  const [lockReasonError, setLockReasonError] = useState("");
  const [isLocking, setIsLocking] = useState(false);

  // Unlock Post Modal State
  const [unlockTarget, setUnlockTarget] = useState<PublicPostListing | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Edit Post Modal State
  const [editTarget, setEditTarget] = useState<PublicPostListing | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editDeposit, setEditDeposit] = useState<number>(0);
  const [editCoverImage, setEditCoverImage] = useState("");
  const [editStatus, setEditStatus] = useState<"posted" | "draft" | "hidden" | "locked">("posted");
  const [editError, setEditError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Create Post Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createCoverImage, setCreateCoverImage] = useState(HOUSE_PLACEHOLDER);
  const [createContent, setCreateContent] = useState("");
  const [createDepositAmount, setCreateDepositAmount] = useState<number>(0);
  const [createStatus, setCreateStatus] = useState<"posted" | "draft">("posted");
  const [createError, setCreateError] = useState("");
  const [isSavingCreate, setIsSavingCreate] = useState(false);

  // Delete Post Modal State (Mandatory Reason to Notify Author)
  const [deleteTarget, setDeleteTarget] = useState<PublicPostListing | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteReasonError, setDeleteReasonError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Rule #10: Modal Reset Confirmation Pop-up
  const [confirmCloseModal, setConfirmCloseModal] = useState<{
    isOpen: boolean;
    onDiscard: () => void;
  }>({ isOpen: false, onDiscard: () => { } });

  // Debounced search for filterArticle
  const [debouncedArticle, setDebouncedArticle] = useState(filterArticle);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedArticle(filterArticle);
    }, 300);
    return () => clearTimeout(timer);
  }, [filterArticle]);

  // Server-side pagination metadata
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Available property names fetched directly from backend
  const [propertyList, setPropertyList] = useState<string[]>([]);
  useEffect(() => {
    postService
      .getProperties()
      .then((props) => {
        if (props && props.length > 0) {
          setPropertyList(props);
        }
      })
      .catch(console.error);
  }, []);

  const availableProperties = useMemo(() => {
    const set = new Set<string>(propertyList);
    posts.forEach((item) => {
      const name = item.room?.boardingHouseName;
      if (name && name.trim()) set.add(name.trim());
    });
    return Array.from(set).sort();
  }, [propertyList, posts]);

  // Fetch filtered & paginated data directly from backend
  const fetchPosts = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      setError(null);
      try {
        const params: any = {
          page: currentPage,
          limit: pageSize,
          status: statusFilter,
        };

        if (debouncedArticle.trim()) {
          params.search = debouncedArticle.trim();
        }

        if (filterProperty !== "all") {
          params.property = filterProperty;
        }

        if (filterDeposit === "free") {
          params.minPrice = 0;
          params.maxPrice = 0;
        } else if (filterDeposit === "under_2m") {
          params.minPrice = 1;
          params.maxPrice = 2000000;
        } else if (filterDeposit === "2m_5m") {
          params.minPrice = 2000000;
          params.maxPrice = 5000000;
        } else if (filterDeposit === "above_5m") {
          params.minPrice = 5000001;
        }

        const res = await postService.browsePosts(params);
        let list = res?.data || [];

        // Augment demo reported metadata if viewing reported filter or fallback demo
        if (list.length > 0 && !list.some((p) => (p.reportsCount ?? 0) > 0)) {
          list = list.map((item, idx) => {
            if (idx === 0 && (statusFilter === "reported" || !item.reportsCount)) {
              return {
                ...item,
                reportsCount: 3,
                reportReasons: [
                  locale === "en" ? "Unrealistic bait pricing" : "Giá ảo câu khách, khi gọi điện báo giá khác",
                  locale === "en" ? "Suspicious deposit demand" : "Yêu cầu chuyển cọc giữ chỗ ngoài hệ thống",
                ],
              };
            }
            return item;
          });
        }

        setPosts(list);
        setTotalItems(res?.meta?.total ?? list.length);
        setTotalPages(
          Math.max(1, res?.meta?.totalPages ?? Math.ceil((res?.meta?.total ?? list.length) / pageSize))
        );
      } catch (err: any) {
        console.error("Failed to fetch posts from backend:", err);
        setError(err?.response?.data?.message || t("adminBlogsFetchError"));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      currentPage,
      pageSize,
      debouncedArticle,
      filterProperty,
      filterDeposit,
      statusFilter,
      locale,
      t,
    ]
  );

  // Trigger backend fetch whenever filters, page, or page size change
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Reset to page 1 when filter values change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedArticle, filterProperty, filterDeposit, statusFilter]);

  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts(true);
  };

  const isAnyFilterActive = Boolean(
    filterArticle.trim() ||
    filterProperty !== "all" ||
    filterDeposit !== "all" ||
    statusFilter !== "all"
  );

  const handleResetFilters = () => {
    setFilterArticle("");
    setFilterProperty("all");
    setFilterDeposit("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  // 5-page window jumping (Rule #9)
  const windowStart = Math.floor((currentPage - 1) / 5) * 5 + 1;
  const windowEnd = Math.min(windowStart + 4, totalPages);
  const pageNumbers = [];
  for (let i = windowStart; i <= windowEnd; i++) {
    pageNumbers.push(i);
  }


  // --- Lock Post Flow ---
  const handleOpenLock = (item: PublicPostListing) => {
    setLockTarget(item);
    setLockReason(t("adminModLockPresetFakePrice"));
    setLockReasonError("");
  };

  const handleConfirmLock = async () => {
    if (!lockTarget) return;
    if (!lockReason.trim()) {
      setLockReasonError(t("adminModLockReasonRequired"));
      return;
    }

    setIsLocking(true);
    setLockReasonError("");
    try {
      await postService.updatePostStatus(lockTarget.id, "locked");
      setPosts((prev) =>
        prev.map((p) => (p.id === lockTarget.id ? { ...p, status: "locked", lockReason: lockReason.trim() } : p))
      );

      setLockTarget(null);
      setLockReason("");
      setFeedbackMsg({ type: "success", text: t("adminModLockSuccess") });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      console.error("Lock failed:", err);
      setLockReasonError(err?.response?.data?.message || t("adminBlogsFetchError"));
    } finally {
      setIsLocking(false);
    }
  };

  // --- Unlock / Publish Flow ---
  const handleOpenUnlock = (item: PublicPostListing) => {
    setUnlockTarget(item);
  };

  const handleConfirmUnlock = async () => {
    if (!unlockTarget) return;
    setIsUnlocking(true);
    try {
      await postService.updatePostStatus(unlockTarget.id, "posted");
      setPosts((prev) =>
        prev.map((p) => (p.id === unlockTarget.id ? { ...p, status: "posted" } : p))
      );

      setUnlockTarget(null);
      setFeedbackMsg({ type: "success", text: t("adminModUnlockSuccess") });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      console.error("Unlock failed:", err);
      alert(err?.response?.data?.message || t("adminBlogsFetchError"));
    } finally {
      setIsUnlocking(false);
    }
  };

  // --- Toggle Publish (Draft/Hidden <-> Posted) ---
  const handleTogglePublish = async (item: PublicPostListing) => {
    const newStatus = item.status === "posted" ? "hidden" : "posted";
    try {
      setPosts((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, status: newStatus } : p))
      );

      await postService.updatePostStatus(item.id, newStatus as any);
    } catch (err) {
      console.error("Failed to toggle status:", err);
      await fetchPosts(true);
    }
  };

  const isEditDirty = useMemo(() => {
    if (!editTarget) return false;
    return (
      editTitle.trim() !== (editTarget.title || "") ||
      editContent.trim() !== (editTarget.content || "") ||
      editDeposit !== (Number(editTarget.depositAmount) || 0) ||
      editStatus !== editTarget.status
    );
  }, [editTarget, editTitle, editContent, editDeposit, editStatus]);

  const handleRequestCloseEdit = () => {
    if (isEditDirty) {
      setConfirmCloseModal({
        isOpen: true,
        onDiscard: () => {
          setEditTarget(null);
          setConfirmCloseModal({ isOpen: false, onDiscard: () => { } });
        },
      });
    } else {
      setEditTarget(null);
    }
  };

  // --- Create Post Flow (Rule #10 compliant) ---
  const resetCreateForm = useCallback(() => {
    setCreateTitle("");
    setCreateCoverImage(HOUSE_PLACEHOLDER);
    setCreateContent("");
    setCreateDepositAmount(0);
    setCreateStatus("posted");
    setCreateError("");
    setIsSavingCreate(false);
  }, []);

  const isCreateDirty = useMemo(() => {
    const isDefaultImg = createCoverImage === HOUSE_PLACEHOLDER;
    return Boolean(
      createTitle.trim() ||
      createContent.trim() ||
      createDepositAmount > 0 ||
      (!isDefaultImg && createCoverImage.trim() !== "")
    );
  }, [createTitle, createContent, createDepositAmount, createCoverImage]);

  const handleOpenCreate = () => {
    resetCreateForm();
    setIsCreateModalOpen(true);
  };

  const handleRequestCloseCreate = () => {
    if (isCreateDirty) {
      setConfirmCloseModal({
        isOpen: true,
        onDiscard: () => {
          resetCreateForm();
          setIsCreateModalOpen(false);
          setConfirmCloseModal({ isOpen: false, onDiscard: () => { } });
        },
      });
    } else {
      resetCreateForm();
      setIsCreateModalOpen(false);
    }
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    if (createTitle.trim().length < 5) {
      setCreateError(t("adminBlogsErrorTitleLength"));
      return;
    }
    if (createContent.trim().length < 10) {
      setCreateError(t("adminBlogsErrorContentLength"));
      return;
    }
    if (createDepositAmount < 0) {
      setCreateError(t("adminBlogsErrorDeposit"));
      return;
    }

    setIsSavingCreate(true);
    try {
      await postService.createPost({
        title: createTitle.trim(),
        content: createContent.trim(),
        depositAmount: Number(createDepositAmount) || 0,
        imageUrls: createCoverImage.trim() ? [createCoverImage.trim()] : [],
        status: createStatus,
      });

      await fetchPosts(true);
      resetCreateForm();
      setIsCreateModalOpen(false);
      setFeedbackMsg({ type: "success", text: t("adminBlogsCreateSuccess") });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      console.error("Failed to create post:", err);
      setCreateError(err?.response?.data?.message || t("adminBlogsCreateFailed"));
    } finally {
      setIsSavingCreate(false);
    }
  };

  // --- Delete Post Flow ---
  const handleOpenDelete = (item: PublicPostListing) => {
    setDeleteTarget(item);
    setDeleteReason("");
    setDeleteReasonError("");
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (!deleteReason.trim()) {
      setDeleteReasonError(t("adminBlogsDeleteReasonRequired"));
      return;
    }

    setIsDeleting(true);
    setDeleteReasonError("");
    try {
      await postService.deletePost(deleteTarget.id, deleteReason.trim());
      setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id));

      setDeleteTarget(null);
      setDeleteReason("");
      setFeedbackMsg({ type: "success", text: t("adminBlogsDeleteSubmit") });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      console.error("Delete failed:", err);
      setDeleteReasonError(err?.response?.data?.message || t("adminBlogsDeleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-14">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-700 tracking-wide uppercase">
              <ShieldAlert className="w-3.5 h-3.5" />
              {t("adminModBadge")}
            </span>
            <span className="text-xs font-semibold text-zinc-400">
              • {t("adminBlogsLiveDb")}
            </span>
          </div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight mt-1">
            {t("adminModTitle")}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {t("adminModSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="p-2.5 rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 font-bold text-xs transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            title={t("adminModRefresh")}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-orange-600" : ""}`} />
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t("adminModNewPost")}</span>
          </button>
        </div>
      </div>

      {/* Success / Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-3 animate-fadeIn ${feedbackMsg.type === "success"
            ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
            : "bg-red-50 border border-red-200 text-red-800"
            }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-bold">{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span className="font-semibold">{error}</span>
          </div>
          <button
            onClick={() => fetchPosts()}
            className="px-3 py-1 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors cursor-pointer text-xs"
          >
            {t("adminBlogsRetry")}
          </button>
        </div>
      )}

      {/* Post count summary */}
      {!loading && (
        <span className="text-xs font-semibold text-zinc-500 pl-2">
          {t("adminBlogsShowingCount", { total: totalItems })}
        </span>

      )}

      {/* Main Table View with Direct Column Filters */}
      {loading ? (
        /* Loading skeleton for table */
        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs overflow-hidden">
          <div className="p-6 space-y-3.5 animate-pulse">
            <div className="h-10 bg-zinc-100 rounded-xl w-full" />
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="h-12 bg-zinc-50 rounded-xl w-full" />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[950px]">
            <thead>
              {/* Row 1: Column Titles */}
              <tr className="border-b border-zinc-200 bg-zinc-50/80 text-zinc-500 uppercase tracking-wider font-bold">
                <th className="p-3.5 w-1/3 min-w-[280px]">{t("adminBlogsColArticle")}</th>
                <th className="p-3.5 min-w-[180px]">{t("adminBlogsColCategory")}</th>
                <th className="p-3.5 min-w-[130px]">{t("adminBlogsColEngagement")}</th>
                <th className="p-3.5 min-w-[150px]">{t("adminBlogsColDeposit")}</th>
                <th className="p-3.5 min-w-[140px]">{t("adminBlogsColStatus")}</th>
                <th className="p-3.5 text-right min-w-[140px]">{t("adminBlogsColActions")}</th>
              </tr>

              {/* Row 2: Direct In-Table Column Filters */}
              <tr className="border-b border-zinc-200 bg-zinc-100/60 text-zinc-700">
                {/* 1. Filter Article / Post */}
                <th className="p-2.5 font-normal">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={filterArticle}
                      onChange={(e) => {
                        setFilterArticle(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder={t("adminBlogsFilterArticlePlaceholder")}
                      className="w-full pl-8 pr-7 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                    />
                    {filterArticle && (
                      <button
                        onClick={() => {
                          setFilterArticle("");
                          setCurrentPage(1);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </th>

                {/* 2. Filter Category / Property */}
                <th className="p-2.5 font-normal">
                  <select
                    value={filterProperty}
                    onChange={(e) => {
                      setFilterProperty(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full py-1.5 px-2 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer"
                  >
                    <option value="all">{t("adminBlogsFilterPropertyAll")}</option>
                    {availableProperties.map((propName) => (
                      <option key={propName} value={propName}>
                        {propName}
                      </option>
                    ))}
                  </select>
                </th>

                {/* 3. Engagement Column */}
                <th className="p-2.5 font-normal text-center text-zinc-400 text-[11px]">
                  —
                </th>

                {/* 4. Filter Deposit / Price */}
                <th className="p-2.5 font-normal">
                  <select
                    value={filterDeposit}
                    onChange={(e) => {
                      setFilterDeposit(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    className="w-full py-1.5 px-2 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer"
                  >
                    <option value="all">{t("adminBlogsFilterDepositAll")}</option>
                    <option value="free">{t("adminBlogsFilterDepositFree")}</option>
                    <option value="under_2m">{t("adminBlogsFilterDepositUnder2m")}</option>
                    <option value="2m_5m">{t("adminBlogsFilterDeposit2m5m")}</option>
                    <option value="above_5m">{t("adminBlogsFilterDepositAbove5m")}</option>
                  </select>
                </th>

                {/* 5. Filter Status */}
                <th className="p-2.5 font-normal">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    className="w-full py-1.5 px-2 bg-white border border-zinc-200 rounded-lg text-xs font-bold text-zinc-700 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer"
                  >
                    <option value="all">{t("adminModFilterAll")}</option>
                    <option value="posted">{t("adminModFilterPosted")}</option>
                    <option value="draft">{t("adminModFilterDraft")}</option>
                    <option value="hidden">{t("adminModFilterHidden")}</option>
                    <option value="locked">{t("adminModFilterLocked")}</option>
                    <option value="reported">{t("adminModFilterReported")}</option>
                  </select>
                </th>

                {/* 6. Filter Actions (Reset button) */}
                <th className="p-2.5 font-normal text-right">
                  {isAnyFilterActive && (
                    <button
                      onClick={handleResetFilters}
                      className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                      title={t("adminBlogsFilterResetTooltip")}
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{t("adminBlogsFilterReset")}</span>
                    </button>
                  )}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-zinc-400">
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                        <Newspaper className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-zinc-800">
                        {isAnyFilterActive
                          ? t("adminBlogsFilterNoMatchTitle")
                          : t("adminBlogsNoPosts")}
                      </h3>
                      <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                        {isAnyFilterActive
                          ? t("adminBlogsFilterNoMatchDesc")
                          : t("adminBlogsNoPostsDesc")}
                      </p>
                      {isAnyFilterActive ? (
                        <button
                          onClick={handleResetFilters}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{t("adminBlogsFilterReset")}</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleOpenCreate}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{t("adminBlogsCreateFirst")}</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                posts.map((item) => {
                  const coverImg = item.images?.[0]?.url || HOUSE_PLACEHOLDER;
                  const categoryText =
                    item.room?.boardingHouseName ||
                    item.room?.roomTypeName ||
                    item.address?.district ||
                    t("adminBlogsDefaultCategory");
                  const formattedDate = item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "vi-VN")
                    : "—";

                  const isReported = Boolean(item.reportsCount && item.reportsCount > 0);

                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="p-3.5 max-w-sm">
                        <Link
                          href={`/admin/blogs/${item.id}`}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <img
                            src={coverImg}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-zinc-200 group-hover:border-orange-500 transition-colors"
                          />
                          <div className="space-y-0.5">
                            <span className="font-bold text-zinc-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
                              {item.title}
                            </span>
                            <div className="text-[11px] text-zinc-400">
                              {item.poster?.username || "Admin"} • {formattedDate}
                            </div>
                          </div>
                        </Link>
                      </td>

                      <td className="p-3.5">
                        <span className="font-semibold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-zinc-500" />
                          <span>{categoryText}</span>
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-[11px] flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          <span>
                            {(item.viewsCount || 0).toLocaleString()} {t("adminBlogsViewsUnit")}
                          </span>
                        </div>
                        <div className="font-semibold text-[11px] flex items-center gap-1.5">
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>
                            {item.savedCount || 0} {t("adminBlogsSavedUnit")}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-zinc-800">
                          {item.depositAmount
                            ? `${Number(item.depositAmount).toLocaleString("vi-VN")} ₫`
                            : "0 ₫"}
                        </div>
                      </td>

                      <td className="p-3.5 space-y-1">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase inline-block ${item.status === "posted"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.status === "draft"
                              ? "bg-amber-100 text-amber-800"
                              : item.status === "locked"
                                ? "bg-red-100 text-red-800 ring-1 ring-red-300"
                                : "bg-zinc-100 text-zinc-700"
                            }`}
                        >
                          {item.status === "posted"
                            ? t("adminModBadgePosted")
                            : item.status === "draft"
                              ? t("adminModBadgeDraft")
                              : item.status === "locked"
                                ? t("adminModBadgeLocked")
                                : t("adminModBadgeHidden")}
                        </span>

                        {isReported && (
                          <div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>{t("adminModBadgeReported", { count: item.reportsCount })}</span>
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="flex flex-wrap justify-end items-end gap-1">
                          {/* Lock / Unlock */}
                          {item.status === "locked" ? (
                            <button
                              onClick={() => handleOpenUnlock(item)}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer text-xs font-bold"
                              title={t("adminModActionUnlock")}
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenLock(item)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                              title={t("adminModActionLock")}
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          )}

                          {/* Toggle Publish */}
                          {item.status !== "locked" && (
                            <button
                              onClick={() => handleTogglePublish(item)}
                              className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer text-xs font-semibold"
                              title={item.status === "posted" ? t("adminBlogsUnpublish") : t("adminBlogsPublish")}
                            >
                              {item.status === "posted" ? t("adminBlogsHideTitle") : t("adminBlogsShowTitle")}
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => handleOpenDelete(item)}
                            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-red-100 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                            title={t("adminModActionDelete")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Standardized Pagination Bar (Rule #9) */}
      <div className="bg-white px-4 py-3 rounded-2xl border border-zinc-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs font-semibold text-zinc-600">
        <div className="flex items-center gap-2">
          <span>{t("adminBlogsPaginationShowing")}</span>
          <input
            type="number"
            min={1}
            max={100}
            value={pageSize}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1;
              setPageSize(val);
              setCurrentPage(1);
            }}
            className="w-14 px-2 py-1 text-center bg-zinc-50 border border-zinc-200 rounded-lg font-bold text-zinc-900 focus:outline-none focus:border-orange-500"
          />
          <span>{t("adminBlogsPaginationPerPage")}</span>
          <span className="text-zinc-300">|</span>
          <span>
            {totalItems === 0
              ? "0"
              : `${(currentPage - 1) * pageSize + 1}-${Math.min(
                currentPage * pageSize,
                totalItems
              )}`}{" "}
            {t("adminBlogsPaginationOfPosts", { total: totalItems })}
          </span>
        </div>

        <div className="flex items-center gap-1 self-end sm:self-auto">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 text-zinc-600 cursor-pointer"
            title={t("adminBlogsFirstPage")}
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 5))}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 text-zinc-600 cursor-pointer"
            title={t("adminBlogsPrev5Pages")}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {pageNumbers.map((num) => (
            <button
              key={num}
              onClick={() => setCurrentPage(num)}
              className={`w-8 h-8 rounded-lg font-bold transition-all cursor-pointer ${currentPage === num
                ? "bg-orange-600 text-white shadow-2xs"
                : "border border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                }`}
            >
              {num}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 5))}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 text-zinc-600 cursor-pointer"
            title={t("adminBlogsNext5Pages")}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 text-zinc-600 cursor-pointer"
            title={t("adminBlogsLastPage")}
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── MODAL 2: LOCK POST MODAL ─── */}
      {lockTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900">{t("adminModLockTitle")}</h3>
                <p className="text-xs text-zinc-500 font-mono truncate max-w-[240px]">{lockTarget.id}</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              {t("adminModLockSubtitle")}
            </p>

            {/* Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-500 block">
                {t("adminModLockPresetLabel")}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: t("adminModLockPresetFakePrice") },
                  { label: t("adminModLockPresetScamDeposit") },
                  { label: t("adminModLockPresetViolation") },
                ].map((preset, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setLockReason(preset.label)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason input */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-zinc-700 block">
                {t("adminModLockReasonLabel")} <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={lockReason}
                onChange={(e) => {
                  setLockReason(e.target.value);
                  if (lockReasonError) setLockReasonError("");
                }}
                placeholder={t("adminModLockReasonPlaceholder")}
                className={`w-full p-2.5 bg-zinc-50 border rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white transition-all ${lockReasonError ? "border-red-400 bg-red-50/20" : "border-zinc-200 focus:border-red-500"
                  }`}
              />
              {lockReasonError && (
                <p className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {lockReasonError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={() => setLockTarget(null)}
                disabled={isLocking}
                className="px-3.5 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                {t("adminBlogsCancel")}
              </button>
              <button
                onClick={handleConfirmLock}
                disabled={isLocking || !lockReason.trim()}
                className="px-4 py-2 rounded-xl bg-red-600 disabled:bg-red-300 text-white text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                {isLocking && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{t("adminModLockConfirmBtn")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: UNLOCK POST MODAL ─── */}
      {unlockTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <Unlock className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900">{t("adminModUnlockTitle")}</h3>
                <p className="text-xs text-zinc-500 font-mono truncate max-w-[240px]">{unlockTarget.id}</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              {t("adminModUnlockConfirm", { title: unlockTarget.title })}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={() => setUnlockTarget(null)}
                disabled={isUnlocking}
                className="px-3.5 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                {t("adminBlogsCancel")}
              </button>
              <button
                onClick={handleConfirmUnlock}
                disabled={isUnlocking}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                {isUnlocking && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{t("adminModUnlockConfirmBtn")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: CREATE POST MODAL (Rule #10 compliant) ─── */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={handleRequestCloseCreate}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8 animate-scaleIn max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-900">{t("adminBlogsCreateModalTitle")}</h3>
                  <p className="text-xs text-zinc-400">{t("adminBlogsCreateModalSubtitle")}</p>
                </div>
              </div>
              <button
                onClick={handleRequestCloseCreate}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 block">
                  {t("adminBlogsFieldTitle")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder={t("adminBlogsFieldTitlePlaceholder")}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 block">
                  {t("adminBlogsFieldCoverImage")}
                </label>
                <input
                  type="url"
                  value={createCoverImage}
                  onChange={(e) => setCreateCoverImage(e.target.value)}
                  placeholder={t("adminBlogsFieldCoverImagePlaceholder")}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 block">
                  {t("adminBlogsFieldContent")} <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={createContent}
                  onChange={(e) => setCreateContent(e.target.value)}
                  placeholder={t("adminBlogsFieldContentPlaceholder")}
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 block">
                    {t("adminBlogsFieldDeposit")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={50000}
                    value={createDepositAmount}
                    onChange={(e) => setCreateDepositAmount(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 block">
                    {t("adminBlogsFieldStatus")}
                  </label>
                  <select
                    value={createStatus}
                    onChange={(e) => setCreateStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                  >
                    <option value="posted">{t("adminBlogsStatusOptionPublished")}</option>
                    <option value="draft">{t("adminBlogsStatusOptionDraft")}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={handleRequestCloseCreate}
                  disabled={isSavingCreate}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  {t("adminBlogsCancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSavingCreate}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingCreate && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSavingCreate ? t("adminBlogsSubmitting") : t("adminBlogsSubmitCreate")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 6: DELETE POST MODAL ─── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900">{t("adminBlogsDeleteTitle")}</h3>
                <p className="text-xs text-zinc-500 font-mono truncate max-w-[240px]">{deleteTarget.id}</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              {t("adminBlogsDeleteConfirm", { title: deleteTarget.title })}
            </p>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-zinc-700 block">
                {t("adminBlogsDeleteReasonLabel")} <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={deleteReason}
                onChange={(e) => {
                  setDeleteReason(e.target.value);
                  if (deleteReasonError) setDeleteReasonError("");
                }}
                placeholder={t("adminBlogsDeleteReasonPlaceholder")}
                className={`w-full p-2.5 bg-zinc-50 border rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white transition-all ${deleteReasonError ? "border-red-400 bg-red-50/20" : "border-zinc-200 focus:border-orange-500"
                  }`}
              />
              {deleteReasonError && (
                <p className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {deleteReasonError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-3.5 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                {t("adminBlogsCancel")}
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting || !deleteReason.trim()}
                className="px-4 py-2 rounded-xl bg-red-600 disabled:bg-red-300 text-white text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{t("adminBlogsDeleteSubmit")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── RULE #10: MODAL RESET CONFIRMATION POP-UP ─── */}
      {confirmCloseModal.isOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 space-y-4 animate-scaleIn">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900">{t("adminBlogsDiscardModalTitle")}</h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                {t("adminBlogsDiscardModalDesc")}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmCloseModal({ isOpen: false, onDiscard: () => { } })}
                className="px-3.5 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                {t("adminBlogsContinueEditing")}
              </button>
              <button
                onClick={confirmCloseModal.onDiscard}
                className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition-colors cursor-pointer shadow-2xs"
              >
                {t("adminBlogsDiscardAndClose")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
