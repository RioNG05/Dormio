"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { postService, PublicPostListing } from "@/services/post.service";
import {
  Newspaper, Plus, Search, Eye, Edit3, Trash2,
  CheckCircle2, Clock, LayoutGrid, Table as TableIcon,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X,
  AlertTriangle, RefreshCw, Bookmark, MapPin, Building2
} from "lucide-react";

export default function AdminBlogsPage() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  // Data State
  const [posts, setPosts] = useState<PublicPostListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rule #9: Standardized View & Pagination
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid"); // Grid is ALWAYS default
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6); // Default 6 for grid, 10 for table

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "posted" | "draft" | "hidden">("all");

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PublicPostListing | null>(null);

  // Editor Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formCoverImage, setFormCoverImage] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formDepositAmount, setFormDepositAmount] = useState<number>(0);
  const [formStatus, setFormStatus] = useState<"posted" | "draft">("posted");
  const [editorError, setEditorError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Delete Target Modal
  const [deleteTargetPost, setDeleteTargetPost] = useState<PublicPostListing | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Rule #10: Modal Reset Confirmation
  const [confirmCloseModal, setConfirmCloseModal] = useState<{
    isOpen: boolean;
    onDiscard: () => void;
  }>({ isOpen: false, onDiscard: () => {} });

  // Fetch real data from backend
  const fetchPosts = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const res = await postService.browsePosts({
        search: searchQuery.trim() || undefined,
        status: statusFilter === "all" ? "all" : statusFilter,
        page: 1,
        limit: 100,
      });

      const list = res?.data || [];
      setPosts(list);
    } catch (err: any) {
      console.error("Failed to fetch posts:", err);
      setError(
        err?.response?.data?.message ||
          (isEn
            ? "Could not load posts from server. Please check your connection."
            : "Không thể tải danh sách bài viết từ máy chủ. Vui lòng kiểm tra lại.")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, statusFilter, isEn]);

  // Initial load and filter change
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts(true);
  };

  // Filtered dataset for client-side search query refine
  const currentDataset = useMemo(() => {
    return posts.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.title?.toLowerCase().includes(q) ||
        item.content?.toLowerCase().includes(q) ||
        item.poster?.username?.toLowerCase().includes(q) ||
        item.room?.boardingHouseName?.toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "all" || item.status === statusFilter;

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

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingPost(null);
    setFormTitle("");
    setFormCoverImage("https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop&q=80");
    setFormContent("");
    setFormDepositAmount(1000000);
    setFormStatus("posted");
    setEditorError("");
    setIsEditorOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (post: PublicPostListing) => {
    setEditingPost(post);
    setFormTitle(post.title || "");
    setFormCoverImage(post.images?.[0]?.url || "");
    setFormContent(post.content || "");
    setFormDepositAmount(post.depositAmount || 0);
    setFormStatus(post.status === "draft" ? "draft" : "posted");
    setEditorError("");
    setIsEditorOpen(true);
  };

  // Save / Submit Post
  const handleSavePost = async () => {
    if (!formTitle.trim()) {
      setEditorError(isEn ? "Please enter a title." : "Vui lòng nhập tiêu đề bài viết.");
      return;
    }
    if (!formContent.trim()) {
      setEditorError(isEn ? "Please enter content." : "Vui lòng nhập nội dung bài viết.");
      return;
    }

    setIsSaving(true);
    setEditorError("");

    try {
      if (editingPost) {
        // Update status of existing post
        if (editingPost.status !== formStatus) {
          await postService.updatePostStatus(editingPost.id, formStatus);
        }
      } else {
        // Create new post
        await postService.createPost({
          title: formTitle.trim(),
          content: formContent.trim(),
          depositAmount: formDepositAmount || 0,
          imageUrls: formCoverImage.trim() ? [formCoverImage.trim()] : [],
          status: formStatus,
        });
      }

      setIsEditorOpen(false);
      await fetchPosts(true);
    } catch (err: any) {
      console.error("Save error:", err);
      setEditorError(
        err?.response?.data?.message ||
          (isEn ? "Failed to save post. Please try again." : "Không thể lưu bài viết. Vui lòng thử lại.")
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle publish status (published <-> draft / hidden)
  const handleToggleStatus = async (item: PublicPostListing) => {
    const newStatus: "posted" | "draft" | "hidden" =
      item.status === "posted" ? "hidden" : "posted";

    try {
      // Optimistic update
      setPosts((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, status: newStatus } : p))
      );
      await postService.updatePostStatus(item.id, newStatus);
    } catch (err) {
      console.error("Failed to toggle post status:", err);
      // Rollback
      await fetchPosts(true);
    }
  };

  // Delete post
  const handleDeletePost = (item: PublicPostListing) => {
    setDeleteTargetPost(item);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetPost) return;
    setIsDeleting(true);
    try {
      await postService.deletePost(deleteTargetPost.id);
      setPosts((prev) => prev.filter((p) => p.id !== deleteTargetPost.id));
      setDeleteTargetPost(null);
    } catch (err: any) {
      console.error("Delete failed:", err);
      alert(
        err?.response?.data?.message ||
          (isEn ? "Could not delete post." : "Không thể xóa bài viết.")
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Rule #10: Check dirty form on modal exit
  const isFormDirty =
    formTitle.trim().length > 0 ||
    formContent.trim().length > 0;

  const handleRequestCloseEditor = () => {
    if (isFormDirty) {
      setConfirmCloseModal({
        isOpen: true,
        onDiscard: () => {
          setIsEditorOpen(false);
          setConfirmCloseModal({ isOpen: false, onDiscard: () => {} });
        },
      });
    } else {
      setIsEditorOpen(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-700 tracking-wide uppercase">
              <Newspaper className="w-3.5 h-3.5" />
              {isEn ? "Public Content Management" : "Quản Lý Nội Dung Blog & Bài Viết"}
            </span>
            <span className="text-xs font-semibold text-zinc-400">
              • {isEn ? "Live backend database" : "Dữ liệu thực từ hệ thống máy chủ"}
            </span>
          </div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight mt-1">
            {isEn ? "Blog Articles & Public Listings Desk" : "Biên Tập & Quản Lý Bài Viết"}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {isEn
              ? "Oversee rental listings, public blog articles, adjust visibility, and publish new content."
              : "Quản lý toàn bộ bài viết, tin đăng công khai, điều chỉnh trạng thái hiển thị và biên soạn nội dung mới."}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="p-2.5 rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 font-bold text-xs transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            title={isEn ? "Refresh data" : "Tải lại dữ liệu"}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-orange-600" : ""}`} />
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isEn ? "New Article / Post" : "Soạn Bài Viết Mới"}</span>
          </button>
        </div>
      </div>

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
            {isEn ? "Retry" : "Thử lại"}
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
              placeholder={isEn ? "Search title, content, author..." : "Tìm tiêu đề bài viết, tác giả, toà nhà..."}
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

          {/* Status chips */}
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
            {(
              [
                { id: "all", label: isEn ? "All" : "Tất cả" },
                { id: "posted", label: isEn ? "Published" : "Đã xuất bản" },
                { id: "draft", label: isEn ? "Drafts" : "Bản nháp" },
                { id: "hidden", label: isEn ? "Hidden" : "Đã ẩn" },
              ] as const
            ).map((chip) => (
              <button
                key={chip.id}
                onClick={() => {
                  setStatusFilter(chip.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === chip.id
                    ? "bg-white text-zinc-900 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode (Rule #9: Grid is ALWAYS default) */}
        <div className="flex items-center gap-3 self-end lg:self-auto">
          <div className="flex items-center bg-zinc-100 p-1 rounded-xl">
            <button
              onClick={() => handleViewModeChange("grid")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "grid" ? "bg-white text-orange-600 shadow-2xs font-extrabold" : "text-zinc-400 hover:text-zinc-700"
              }`}
              title={isEn ? "Grid View (Default)" : "Chế độ Lưới (Mặc định)"}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewModeChange("table")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "table" ? "bg-white text-orange-600 shadow-2xs font-extrabold" : "text-zinc-400 hover:text-zinc-700"
              }`}
              title={isEn ? "Table View" : "Chế độ Bảng"}
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Post count summary (selection checkboxes discarded) */}
      {!loading && paginatedItems.length > 0 && (
        <div className="flex items-center justify-between px-2 text-xs font-semibold text-zinc-500">
          <span>
            {isEn
              ? `Showing ${paginatedItems.length} of ${totalItems} posts from backend`
              : `Hiển thị ${paginatedItems.length} trên ${totalItems} bài viết`}
          </span>
          <span className="text-[11px] text-zinc-400 font-mono">
            {isEn ? "Sorted by newest" : "Sắp xếp mới nhất"}
          </span>
        </div>
      )}

      {/* Main Content */}
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
            {isEn ? "No posts found" : "Chưa có bài viết nào phù hợp"}
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {isEn
              ? "No live posts matched your filter criteria or search keyword."
              : "Không tìm thấy bài viết hoặc tin đăng nào phù hợp với bộ lọc hiện tại."}
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isEn ? "Create First Post" : "Tạo bài viết đầu tiên"}</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW (Rule #9: Default 6 items, selection checkboxes discarded) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedItems.map((item) => {
            const coverImg =
              item.images?.[0]?.url ||
              "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop&q=80";
            const categoryText =
              item.room?.boardingHouseName ||
              item.room?.roomTypeName ||
              item.address?.district ||
              (isEn ? "Rental Listing" : "Tin đăng thuê");

            const formattedDate = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString(isEn ? "en-US" : "vi-VN")
              : "—";

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-zinc-200/90 transition-all flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md"
              >
                <div>
                  {/* Thumbnail Banner */}
                  <div className="relative h-44 w-full bg-zinc-100 overflow-hidden">
                    <img
                      src={coverImg}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/20" />

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase text-white shadow-2xs ${
                          item.status === "posted"
                            ? "bg-emerald-600"
                            : item.status === "draft"
                            ? "bg-amber-600"
                            : "bg-zinc-600"
                        }`}
                      >
                        {item.status === "posted"
                          ? isEn ? "PUBLISHED" : "ĐÃ XUẤT BẢN"
                          : item.status === "draft"
                          ? isEn ? "DRAFT" : "BẢN NHÁP"
                          : isEn ? "HIDDEN" : "ĐÃ ẨN"}
                      </span>
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
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-2.5">
                    <h3 className="text-sm font-black text-zinc-900 line-clamp-2 hover:text-orange-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                      {item.content}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-100">
                      <span className="truncate max-w-[140px] font-semibold text-zinc-600">
                        {item.poster?.username || (isEn ? "Admin Desk" : "Ban Quản Trị")}
                      </span>
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 pt-0 border-t border-zinc-100 mt-2 flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(item)}
                    className="flex-1 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    {item.status === "posted"
                      ? isEn ? "Hide / Unpublish" : "Gỡ xuống nháp"
                      : isEn ? "Publish" : "Xuất bản ngay"}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors cursor-pointer"
                    title={isEn ? "Edit post" : "Chỉnh sửa"}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeletePost(item)}
                    className="p-2 rounded-xl bg-zinc-100 hover:bg-red-50 text-zinc-500 hover:text-red-600 transition-colors cursor-pointer"
                    title={isEn ? "Delete post" : "Xóa bài"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW (Rule #9: Default 10 items, selection checkboxes discarded) */
        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/70 text-zinc-500 uppercase tracking-wider font-bold">
                <th className="p-3.5">{isEn ? "Article / Post" : "Bài viết & Tiêu đề"}</th>
                <th className="p-3.5">{isEn ? "Category / Property" : "Toà nhà & Chuyên mục"}</th>
                <th className="p-3.5">{isEn ? "Engagement" : "Tương tác"}</th>
                <th className="p-3.5">{isEn ? "Deposit / Price" : "Tiền cọc"}</th>
                <th className="p-3.5">{isEn ? "Status" : "Trạng thái"}</th>
                <th className="p-3.5 text-right">{isEn ? "Actions" : "Hành động"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginatedItems.map((item) => {
                const coverImg =
                  item.images?.[0]?.url ||
                  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop&q=80";
                const categoryText =
                  item.room?.boardingHouseName ||
                  item.room?.roomTypeName ||
                  item.address?.district ||
                  (isEn ? "Listing" : "Tin đăng");
                const formattedDate = item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString(isEn ? "en-US" : "vi-VN")
                  : "—";

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-zinc-50/80 transition-colors"
                  >
                    <td className="p-3.5 max-w-sm">
                      <div className="flex items-center gap-3">
                        <img
                          src={coverImg}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-zinc-200"
                        />
                        <div className="space-y-0.5">
                          <div className="font-bold text-zinc-900 line-clamp-1">{item.title}</div>
                          <div className="text-[11px] text-zinc-400">
                            {item.poster?.username || "Admin"} • {formattedDate}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="font-semibold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-zinc-500" />
                        <span>{categoryText}</span>
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="font-black text-zinc-900 flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{(item.viewsCount || 0).toLocaleString()} {isEn ? "views" : "lượt"}</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                        <Bookmark className="w-3 h-3" />
                        <span>{item.savedCount || 0} {isEn ? "saved" : "lưu"}</span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-zinc-800">
                        {item.depositAmount
                          ? `${Number(item.depositAmount).toLocaleString("vi-VN")} ₫`
                          : "0 ₫"}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          item.status === "posted"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.status === "draft"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {item.status === "posted"
                          ? isEn ? "PUBLISHED" : "ĐÃ XUẤT BẢN"
                          : item.status === "draft"
                          ? isEn ? "DRAFT" : "BẢN NHÁP"
                          : isEn ? "HIDDEN" : "ĐÃ ẨN"}
                      </span>
                    </td>

                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer text-xs font-semibold"
                        title={item.status === "posted" ? (isEn ? "Hide" : "Ẩn") : (isEn ? "Publish" : "Hiện")}
                      >
                        {item.status === "posted" ? (isEn ? "Unpublish" : "Gỡ") : (isEn ? "Publish" : "Hiện")}
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                        title={isEn ? "Edit" : "Sửa"}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePost(item)}
                        className="p-1.5 rounded-lg bg-zinc-100 hover:bg-red-100 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                        title={isEn ? "Delete" : "Xóa"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
          <span>{isEn ? "Showing" : "Hiển thị"}</span>
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
          <span>{isEn ? "/ page" : "/ trang"}</span>
          <span className="text-zinc-300">|</span>
          <span>
            {totalItems === 0
              ? "0"
              : `${(safeCurrentPage - 1) * validPageSize + 1}-${Math.min(
                  safeCurrentPage * validPageSize,
                  totalItems
                )}`}{" "}
            {isEn ? `of ${totalItems} posts` : `trên ${totalItems} bài viết`}
          </span>
        </div>

        <div className="flex items-center gap-1 self-end sm:self-auto">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={safeCurrentPage === 1}
            className="p-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 text-zinc-600 cursor-pointer"
            title={isEn ? "First page" : "Trang đầu"}
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 5))}
            disabled={safeCurrentPage <= 1}
            className="p-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 text-zinc-600 cursor-pointer"
            title={isEn ? "Previous 5 pages" : "Lùi 5 trang"}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {pageNumbers.map((num) => (
            <button
              key={num}
              onClick={() => setCurrentPage(num)}
              className={`w-8 h-8 rounded-lg font-bold transition-all cursor-pointer ${
                safeCurrentPage === num
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
            title={isEn ? "Next 5 pages" : "Tiến 5 trang"}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={safeCurrentPage === totalPages}
            className="p-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 text-zinc-600 cursor-pointer"
            title={isEn ? "Last page" : "Trang cuối"}
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ARTICLE / POST EDITOR MODAL (Rule #10 compliant) */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-scaleIn max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Newspaper className="w-4 h-4" />
                </div>
                <h2 className="text-base font-black text-zinc-900">
                  {editingPost
                    ? isEn ? "Edit Post / Listing" : "Chỉnh Sửa Bài Viết / Tin Đăng"
                    : isEn ? "Create New Post / Article" : "Soạn Bài Viết / Tin Đăng Mới"}
                </h2>
              </div>
              <button
                onClick={handleRequestCloseEditor}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {editorError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{editorError}</span>
                </div>
              )}

              {/* Title */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 block">
                  {isEn ? "Title:" : "Tiêu đề bài viết / tin đăng:"}
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={isEn ? "e.g., 5 Tips to Negotiate Rental Contracts" : "Ví dụ: Phòng trọ sinh viên tiện nghi Quận 1"}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              {/* Status & Deposit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-700 block">
                    {isEn ? "Publishing Status:" : "Trạng thái hiển thị:"}
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setFormStatus("posted")}
                      className={`flex-1 py-1.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        formStatus === "posted"
                          ? "bg-emerald-50 border-emerald-400 text-emerald-700 shadow-2xs"
                          : "bg-zinc-50 border-zinc-200 text-zinc-500"
                      }`}
                    >
                      {isEn ? "Published" : "Xuất bản ngay"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStatus("draft")}
                      className={`flex-1 py-1.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        formStatus === "draft"
                          ? "bg-amber-50 border-amber-400 text-amber-800 shadow-2xs"
                          : "bg-zinc-50 border-zinc-200 text-zinc-500"
                      }`}
                    >
                      {isEn ? "Save as Draft" : "Lưu bản nháp"}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-zinc-700 block">
                    {isEn ? "Deposit Amount (VND):" : "Tiền đặt cọc giữ chỗ (VNĐ):"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100000}
                    value={formDepositAmount}
                    onChange={(e) => setFormDepositAmount(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Cover Image URL */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 block">
                  {isEn ? "Cover Image URL:" : "Link ảnh bìa (Cover URL):"}
                </label>
                <input
                  type="text"
                  value={formCoverImage}
                  onChange={(e) => setFormCoverImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-medium text-zinc-800 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              {/* Content */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 block">
                  {isEn ? "Content / Body:" : "Nội dung chi tiết:"}
                </label>
                <textarea
                  rows={8}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder={isEn ? "Write post content here..." : "Viết nội dung bài viết chi tiết tại đây..."}
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-2xl font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white leading-relaxed"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2.5">
              <button
                onClick={handleRequestCloseEditor}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                {isEn ? "Cancel" : "Hủy bỏ"}
              </button>
              <button
                onClick={handleSavePost}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {editingPost
                    ? isEn ? "Save Changes" : "Lưu Cập Nhật"
                    : isEn ? "Publish Post" : "Đăng Bài Viết"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rule #10: Custom Pop-up Confirmation Modal */}
      {confirmCloseModal.isOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 space-y-4 animate-scaleIn">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900">
                {isEn ? "Discard Unsaved Changes?" : "Xác nhận đóng form"}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                {isEn
                  ? "You have unsaved content. Are you sure you want to discard your draft and close?"
                  : "Bạn có nội dung chưa lưu. Bạn có chắc muốn đóng và hủy các thông tin đã nhập?"}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmCloseModal({ isOpen: false, onDiscard: () => {} })}
                className="px-3.5 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                {isEn ? "Continue Editing" : "Tiếp tục chỉnh sửa"}
              </button>
              <button
                onClick={confirmCloseModal.onDiscard}
                className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition-colors cursor-pointer shadow-2xs"
              >
                {isEn ? "Discard & Close" : "Hủy thay đổi & Đóng"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetPost && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3 text-orange-600">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900">
                  {isEn ? "Confirm Delete Post" : "Xác nhận xóa bài viết"}
                </h3>
                <p className="text-xs text-zinc-500 font-mono truncate max-w-[240px]">{deleteTargetPost.id}</p>
              </div>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              {isEn
                ? `Are you sure you want to permanently delete "${deleteTargetPost.title}"? This action cannot be undone.`
                : `Bạn có chắc chắn muốn xóa bài viết "${deleteTargetPost.title}"? Hành động này sẽ gỡ bài viết khỏi hệ thống.`}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={() => setDeleteTargetPost(null)}
                disabled={isDeleting}
                className="px-3.5 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                {isEn ? "Cancel" : "Hủy bỏ"}
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isEn ? "Delete Post" : "Xóa bài viết"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
