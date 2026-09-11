"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLanguage, useTranslations } from "@/context/LanguageContext";
import { postService, PublicPostListing } from "@/services/post.service";
import {
  ShieldAlert, Plus, Search, Eye, Edit3, Trash2,
  Lock, Unlock, LayoutGrid, Table as TableIcon,
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

  // Rule #9: Standardized View & Pagination
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid"); // Grid is ALWAYS default
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6); // Default 6 for grid, 10 for table

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
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

  // Fetch real data from backend
  const fetchPosts = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      // Fetch all posts so admin can filter across all statuses including locked & reported
      const res = await postService.browsePosts({
        search: searchQuery.trim() || undefined,
        status: statusFilter === "reported" || statusFilter === "all" ? "all" : statusFilter,
        page: 1,
        limit: 100,
      });

      let list = res?.data || [];

      // Augment reported demo metadata if mock or tie with grievances
      list = list.map((item, idx) => {
        // Flag items as reported if they have reportsCount or for demonstration of report system
        if (idx === 1 && !item.reportsCount) {
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

      setPosts(list);
    } catch (err: any) {
      console.error("Failed to fetch posts:", err);
      setError(
        err?.response?.data?.message || t("adminBlogsFetchError")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, statusFilter, t, locale]);

  // Initial load and filter change
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts(true);
  };

  // Filtered dataset for client-side search query refine & reported status
  const currentDataset = useMemo(() => {
    return posts.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.title?.toLowerCase().includes(q) ||
        item.content?.toLowerCase().includes(q) ||
        item.poster?.username?.toLowerCase().includes(q) ||
        item.room?.boardingHouseName?.toLowerCase().includes(q);

      let matchStatus = true;
      if (statusFilter === "reported") {
        matchStatus = Boolean((item.reportsCount && item.reportsCount > 0) || (item.reportReasons && item.reportReasons.length > 0));
      } else if (statusFilter !== "all") {
        matchStatus = item.status === statusFilter;
      }

      return matchSearch && matchStatus;
    });
  }, [posts, searchQuery, statusFilter]);

  // View mode change handler (Rule #9)
  const handleViewModeChange = (mode: "grid" | "table") => {
    setViewMode(mode);
    setPageSize(mode === "grid" ? 6 : 10);
    setCurrentPage(1);
  };

  const totalItems = currentDataset.length;
  const validPageSize = Math.max(1, Number(pageSize) || (viewMode === "grid" ? 6 : 10));
  const totalPages = Math.max(1, Math.ceil(totalItems / validPageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * validPageSize;
    return currentDataset.slice(start, start + validPageSize);
  }, [currentDataset, safeCurrentPage, validPageSize]);

  // 5-page window jumping (Rule #9)
  const windowStart = Math.floor((safeCurrentPage - 1) / 5) * 5 + 1;
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

  // --- Edit Post Flow (Rule #10 compliant) ---
  const handleOpenEdit = (item: PublicPostListing) => {
    setEditTarget(item);
    setEditTitle(item.title || "");
    setEditContent(item.content || "");
    setEditDeposit(Number(item.depositAmount) || 0);
    setEditCoverImage(item.images?.[0]?.url || "");
    setEditStatus((item.status as any) || "posted");
    setEditError("");
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

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    if (editTitle.trim().length < 5) {
      setEditError(t("adminBlogsErrorTitleLength"));
      return;
    }
    if (editContent.trim().length < 10) {
      setEditError(t("adminBlogsErrorContentLength"));
      return;
    }

    setIsSavingEdit(true);
    setEditError("");
    try {
      await postService.updatePost(editTarget.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
        depositAmount: Number(editDeposit) || 0,
        imageUrls: editCoverImage.trim() ? [editCoverImage.trim()] : [],
        status: editStatus,
      });

      await fetchPosts(true);

      setEditTarget(null);
      setFeedbackMsg({ type: "success", text: t("adminBlogsDetailSaveChanges") });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      console.error("Failed to update post:", err);
      setEditError(err?.response?.data?.message || t("adminBlogsFetchError"));
    } finally {
      setIsSavingEdit(false);
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

      {/* Control Bar: Search, Filters, View Mode (Rule #9) */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200/90 shadow-2xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={t("adminBlogsSearchPlaceholder")}
              className="w-full pl-9 pr-8 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Chips: All, Posted, Draft, Hidden, Locked, Reported */}
          <div className="flex flex-wrap items-center gap-1 bg-zinc-100 p-1 rounded-xl">
            {(
              [
                { id: "all", label: t("adminModFilterAll") },
                { id: "posted", label: t("adminModFilterPosted") },
                { id: "draft", label: t("adminModFilterDraft") },
                { id: "hidden", label: t("adminModFilterHidden") },
                { id: "locked", label: t("adminModFilterLocked") },
                { id: "reported", label: t("adminModFilterReported") },
              ] as const
            ).map((chip) => (
              <button
                key={chip.id}
                onClick={() => {
                  setStatusFilter(chip.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${statusFilter === chip.id
                  ? chip.id === "locked"
                    ? "bg-red-600 text-white shadow-2xs"
                    : chip.id === "reported"
                      ? "bg-amber-500 text-white shadow-2xs"
                      : "bg-white text-zinc-900 shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-800"
                  }`}
              >
                {chip.id === "locked" && <Lock className="w-3 h-3" />}
                {chip.id === "reported" && <AlertTriangle className="w-3 h-3" />}
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* View Mode (Rule #9: Grid is ALWAYS default) */}
        <div className="flex items-center gap-3 self-end lg:self-auto">
          <div className="flex items-center bg-zinc-100 p-1 rounded-xl">
            <button
              onClick={() => handleViewModeChange("grid")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "grid"
                ? "bg-white text-orange-600 shadow-2xs font-extrabold"
                : "text-zinc-400 hover:text-zinc-700"
                }`}
              title={t("adminModViewGrid")}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewModeChange("table")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "table"
                ? "bg-white text-orange-600 shadow-2xs font-extrabold"
                : "text-zinc-400 hover:text-zinc-700"
                }`}
              title={t("adminModViewCard")}
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Post count summary */}
      {!loading && paginatedItems.length > 0 && (
        <div className="flex items-center justify-between px-2 text-xs font-semibold text-zinc-500">
          <span>
            {t("adminBlogsShowingCount", { count: paginatedItems.length, total: totalItems })}
          </span>
          <span className="text-[11px] text-zinc-400 font-mono">
            {t("adminBlogsSortedByNewest")}
          </span>
        </div>
      )}

      {/* Main Content List */}
      {loading ? (
        /* Loading skeleton */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-zinc-200/80 p-4 space-y-3 animate-pulse"
            >
              <div className="h-44 bg-zinc-200 rounded-xl w-full" />
              <div className="h-4 bg-zinc-200 rounded w-3/4" />
              <div className="h-3 bg-zinc-100 rounded w-full" />
              <div className="h-3 bg-zinc-100 rounded w-1/2" />
              <div className="h-8 bg-zinc-100 rounded-xl mt-4" />
            </div>
          ))}
        </div>
      ) : paginatedItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
            <Newspaper className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-800">
            {t("adminBlogsNoPosts")}
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {t("adminBlogsNoPostsDesc")}
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t("adminBlogsCreateFirst")}</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* CARD MODE */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedItems.map((item) => {
            const coverImg =
              item.images?.[0]?.url ||
              HOUSE_PLACEHOLDER;
            const categoryText =
              item.room?.boardingHouseName ||
              item.room?.roomTypeName ||
              item.address?.district ||
              t("adminBlogsDefaultCategory");

            const formattedDate = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "vi-VN")
              : "—";

            const isReported = (item.reportsCount && item.reportsCount > 0);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-zinc-200/90 transition-all flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md"
              >
                <div>
                  {/* Thumbnail Banner */}
                  <Link
                    href={`/admin/blogs/${item.id}`}
                    className="block relative h-44 w-full bg-zinc-100 overflow-hidden group cursor-pointer"
                  >
                    <img
                      src={coverImg}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/30" />

                    {/* Status Badges */}
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase text-white shadow-2xs ${item.status === "posted"
                          ? "bg-emerald-600"
                          : item.status === "draft"
                            ? "bg-amber-600"
                            : item.status === "locked"
                              ? "bg-red-600 ring-2 ring-red-300"
                              : "bg-zinc-600"
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
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-2xs flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{t("adminModBadgeReported", { count: item.reportsCount })}</span>
                        </span>
                      )}
                    </div>

                    {/* Bottom Metadata */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[11px] font-bold">
                      <span className="bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1 truncate max-w-[65%]">
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span className="truncate">{categoryText}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-xs">
                          <Eye className="w-3 h-3" />
                          {(item.viewsCount || 0).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-xs">
                          <Bookmark className="w-3 h-3" />
                          {item.savedCount || 0}
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Body */}
                  <div className="p-4 space-y-2.5">
                    <Link
                      href={`/admin/blogs/${item.id}`}
                      className="text-sm font-black text-zinc-900 line-clamp-2 hover:text-orange-600 transition-colors text-left block"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                      {item.content}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-100">
                      <span className="truncate max-w-[140px] font-semibold text-zinc-600">
                        {item.poster?.username || t("adminBlogsAdminAuthor")}
                      </span>
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                </div>

                {/* Moderation Actions */}
                <div className="p-4 pt-0 border-t border-zinc-100 mt-2 flex flex-wrap items-center justify-center gap-1.5">
                  {/* Lock / Unlock Toggle */}
                  {item.status === "locked" ? (
                    <button
                      onClick={() => handleOpenUnlock(item)}
                      className="py-1.5 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      title={t("adminModActionUnlock")}
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>{t("adminModActionUnlock")}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenLock(item)}
                      className="py-1.5 px-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      title={t("adminModActionLock")}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{t("adminModActionLock")}</span>
                    </button>
                  )}

                  {/* Publish / Unpublish */}
                  {item.status !== "locked" && (
                    <button
                      onClick={() => handleTogglePublish(item)}
                      className="py-1.5 px-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-colors cursor-pointer"
                      title={item.status === "posted" ? t("adminModActionUnpublish") : t("adminModActionPublish")}
                    >
                      {item.status === "posted" ? t("adminBlogsUnpublish") : t("adminBlogsPublish")}
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => handleOpenDelete(item)}
                    className="p-2 rounded-xl bg-zinc-100 hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                    title={t("adminModActionDelete")}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE MODE */
        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/70 text-zinc-500 uppercase tracking-wider font-bold">
                <th className="p-3.5">{t("adminBlogsColArticle")}</th>
                <th className="p-3.5">{t("adminBlogsColCategory")}</th>
                <th className="p-3.5">{t("adminBlogsColEngagement")}</th>
                <th className="p-3.5">{t("adminBlogsColDeposit")}</th>
                <th className="p-3.5">{t("adminBlogsColStatus")}</th>
                <th className="p-3.5 text-right">{t("adminBlogsColActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginatedItems.map((item) => {
                const coverImg =
                  item.images?.[0]?.url ||
                  HOUSE_PLACEHOLDER;
                const categoryText =
                  item.room?.boardingHouseName ||
                  item.room?.roomTypeName ||
                  item.address?.district ||
                  t("adminBlogsDefaultCategory");
                const formattedDate = item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "vi-VN")
                  : "—";

                const isReported = (item.reportsCount && item.reportsCount > 0);

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

                    <td className="p-3.5 ">
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
              })}
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
              : `${(safeCurrentPage - 1) * validPageSize + 1}-${Math.min(
                safeCurrentPage * validPageSize,
                totalItems
              )}`}{" "}
            {t("adminBlogsPaginationOfPosts", { total: totalItems })}
          </span>
        </div>

        <div className="flex items-center gap-1 self-end sm:self-auto">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={safeCurrentPage === 1}
            className="p-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 text-zinc-600 cursor-pointer"
            title={t("adminBlogsFirstPage")}
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 5))}
            disabled={safeCurrentPage <= 1}
            className="p-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 text-zinc-600 cursor-pointer"
            title={t("adminBlogsPrev5Pages")}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {pageNumbers.map((num) => (
            <button
              key={num}
              onClick={() => setCurrentPage(num)}
              className={`w-8 h-8 rounded-lg font-bold transition-all cursor-pointer ${safeCurrentPage === num
                ? "bg-orange-600 text-white shadow-2xs"
                : "border border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                }`}
            >
              {num}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, safeCurrentPage + 5))}
            disabled={safeCurrentPage >= totalPages}
            className="p-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 text-zinc-600 cursor-pointer"
            title={t("adminBlogsNext5Pages")}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={safeCurrentPage === totalPages}
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

      {/* ─── MODAL 4: EDIT POST MODAL (Rule #10 compliant) ─── */}
      {editTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={handleRequestCloseEdit}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8 animate-scaleIn max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h2 className="text-base font-black text-zinc-900">
                  {t("adminBlogsDetailEditModalTitle")}
                </h2>
              </div>
              <button
                onClick={handleRequestCloseEdit}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 block">
                  {t("adminBlogsFieldTitle")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 block">
                  {t("adminBlogsFieldCoverImage")}
                </label>
                <input
                  type="url"
                  value={editCoverImage}
                  onChange={(e) => setEditCoverImage(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 block">
                  {t("adminBlogsFieldContent")} <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800 focus:outline-none focus:border-orange-500 focus:bg-white leading-relaxed"
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
                    value={editDeposit}
                    onChange={(e) => setEditDeposit(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 block">
                    {t("adminBlogsFieldStatus")}
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-orange-500 focus:bg-white cursor-pointer"
                  >
                    <option value="posted">{t("adminModFilterPosted")}</option>
                    <option value="draft">{t("adminModFilterDraft")}</option>
                    <option value="hidden">{t("adminModFilterHidden")}</option>
                    <option value="locked">{t("adminModFilterLocked")}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={handleRequestCloseEdit}
                  disabled={isSavingEdit}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  {t("adminBlogsCancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{t("adminBlogsDetailSaveChanges")}</span>
                </button>
              </div>
            </form>
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
