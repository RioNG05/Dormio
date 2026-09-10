"use client";

import React, { useState, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Newspaper, Plus, Search, Filter, Eye, Edit3, Trash2,
  CheckCircle2, Clock, Globe, BookOpen, LayoutGrid, Table as TableIcon,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X,
  ExternalLink, FileText, Image as ImageIcon, Sparkles, AlertTriangle
} from "lucide-react";

interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  category: "guide" | "legal" | "lifestyle" | "market";
  categoryLabel: string;
  excerpt: string;
  content: string;
  coverImage: string;
  readTime: string;
  author: string;
  views: number;
  status: "published" | "draft";
  publishedAt: string;
}

export default function AdminBlogsPage() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  // Rule #9: Standardized View & Pagination
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid"); // Grid is ALWAYS default
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6); // Default 6 for grid, 10 for table

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<BlogArticle | null>(null);

  // Editor Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formCategory, setFormCategory] = useState<BlogArticle["category"]>("guide");
  const [formCoverImage, setFormCoverImage] = useState("");
  const [formExcerpt, setFormExcerpt] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formStatus, setFormStatus] = useState<"published" | "draft">("published");
  const [editorError, setEditorError] = useState("");
  const [deleteTargetArticle, setDeleteTargetArticle] = useState<BlogArticle | null>(null);

  // Rule #10: Modal Reset Confirmation
  const [confirmCloseModal, setConfirmCloseModal] = useState<{
    isOpen: boolean;
    onDiscard: () => void;
  }>({ isOpen: false, onDiscard: () => {} });

  // Initial Articles Data
  const [articles, setArticles] = useState<BlogArticle[]>([
    {
      id: "POST-101",
      title: isEn
        ? "10 Essential Checks Before Signing a Boarding House Contract in Vietnam"
        : "10 Điều Nhất Định Phải Kiểm Tra Kỹ Trước Khi Ký Hợp Đồng Thuê Trọ",
      slug: "10-essential-checks-before-signing-boarding-house-contract",
      category: "legal",
      categoryLabel: isEn ? "Legal & Contracts" : "Pháp lý & Hợp đồng",
      excerpt: isEn
        ? "Protect yourself from unfair clauses, deposit traps, and utility markups with this practical landlord inspection checklist."
        : "Tránh bẫy tiền cọc, phụ phí điện nước ảo và điều khoản bất lợi bằng cẩm nang kiểm tra chi tiết từng điều khoản mẫu.",
      content: "Nội dung bài viết hướng dẫn chi tiết các bước đối chiếu CMND/CCCD chủ trọ, giấy chứng nhận quyền sử dụng đất, biên bản bàn giao thiết bị phòng và cách ghi rõ chỉ số đồng hồ điện nước ban đầu...",
      coverImage: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80",
      readTime: "5 min read",
      author: "Ban Biên Tập Dormio",
      views: 3840,
      status: "published",
      publishedAt: "2026-09-01",
    },
    {
      id: "POST-102",
      title: isEn
        ? "How to Decorate a 15m2 Boarding Room to Feel Like a Studio"
        : "Cách Decor Phòng Trọ 15m2 Thoáng Đẹp Như Studio Với Chi Phí Dưới 2 Triệu",
      slug: "how-to-decorate-15m2-room-under-2-million",
      category: "lifestyle",
      categoryLabel: isEn ? "Living & Decor" : "Mẹo sống & Decor",
      excerpt: isEn
        ? "Smart storage tips, warm lighting ideas, and multifunctional furniture layouts for tiny student rooms."
        : "Tối ưu hóa không gian hẹp, sử dụng giá kệ gắn tường không khoan đục và mẹo bố trí ánh sáng ấm áp cho sinh viên.",
      content: "Chia sẻ kinh nghiệm sắp xếp đồ đạc theo phong cách Minimalism, tận dụng không gian dưới gác lửng và mẹo khử mùi ẩm mốc mùa mưa...",
      coverImage: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80",
      readTime: "4 min read",
      author: "Nguyễn Thảo (Lifestyle Editor)",
      views: 5120,
      status: "published",
      publishedAt: "2026-09-03",
    },
    {
      id: "POST-103",
      title: isEn
        ? "HCMC & Hanoi Rental Price Trends Q3/2026: Where are the Best Values?"
        : "Xu Hướng Giá Thuê Phòng Trọ TP.HCM & Hà Nội Quý 3/2026: Khu Vực Nào Giá Tốt?",
      slug: "rental-price-trends-q3-2026-hcmc-hanoi",
      category: "market",
      categoryLabel: isEn ? "Market Insights" : "Tin tức thị trường",
      excerpt: isEn
        ? "Comprehensive rental index data across university hubs including Thu Duc, Cau Giay, and Binh Thanh."
        : "Báo cáo phân tích biến động giá thuê theo dữ liệu hơn 24.000 phòng trên nền tảng Dormio toàn quốc.",
      content: "Dữ liệu cho thấy khu vực TP. Thủ Đức gần Làng Đại học có mức tăng 4.2% so với cùng kỳ, trong khi khu vực Cầu Giấy và Đống Đa ghi nhận tỷ lệ lấp đầy đạt đỉnh 94%...",
      coverImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80",
      readTime: "7 min read",
      author: "Dormio Research Team",
      views: 2980,
      status: "published",
      publishedAt: "2026-09-05",
    },
    {
      id: "POST-104",
      title: isEn
        ? "Step-by-Step Guide to Booking & Escrowing Deposit via Dormio App"
        : "Hướng Dẫn Đặt Cọc Giữ Chỗ An Toàn Qua Nền Tảng Dormio",
      slug: "guide-to-safe-deposit-escrow-dormio",
      category: "guide",
      categoryLabel: isEn ? "Rental Guide" : "Cẩm nang thuê trọ",
      excerpt: isEn
        ? "Learn how our 100% money-back escrow system protects prospective tenants from scam landlords."
        : "Hiểu rõ cơ chế bảo lãnh hoàn tiền cọc 100% nếu phòng không đúng thực tế và quy trình kích hoạt hợp đồng tự động.",
      content: "Khi bấm 'Đặt cọc giữ chỗ', tiền của bạn không chuyển thẳng cho chủ trọ mà được giữ an toàn trong tài khoản trung gian của Dormio cho tới khi bạn đến nhận phòng thực tế...",
      coverImage: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
      readTime: "3 min read",
      author: "Hỗ Trợ Khách Hàng",
      views: 6450,
      status: "published",
      publishedAt: "2026-08-25",
    },
    {
      id: "POST-105",
      title: isEn
        ? "Draft: Comprehensive Landlord Tax and Licensing Guidelines 2026"
        : "[Bản nháp] Cập Nhật Quy Định Về Thuế Cho Thuê Nhà Trọ & Giấy Phép PCCC 2026",
      slug: "landlord-tax-and-licensing-guidelines-2026",
      category: "legal",
      categoryLabel: isEn ? "Legal & Contracts" : "Pháp lý & Hợp đồng",
      excerpt: isEn
        ? "Upcoming regulatory obligations for landlords operating more than 10 boarding rooms."
        : "Tổng hợp các biểu thuế môn bài, thuế GTGT, thuế TNCN và danh mục hồ sơ kiểm tra PCCC bắt buộc.",
      content: "Đang biên soạn bổ sung các thông tư liên tịch mới nhất của Bộ Tài chính và Bộ Công an về kinh doanh dịch vụ lưu trú...",
      coverImage: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80",
      readTime: "6 min read",
      author: "Luật sư Cố vấn Dormio",
      views: 0,
      status: "draft",
      publishedAt: "2026-09-08",
    },
  ]);

  // Filtered dataset
  const currentDataset = useMemo(() => {
    return articles.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.excerpt.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q);

      const matchCategory =
        categoryFilter === "all" || item.category === categoryFilter;

      const matchStatus =
        statusFilter === "all" || item.status === statusFilter;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [articles, searchQuery, categoryFilter, statusFilter]);

  // View mode
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

  // 5-page window jumping
  const windowStart = Math.floor((safeCurrentPage - 1) / 5) * 5 + 1;
  const windowEnd = Math.min(windowStart + 4, totalPages);
  const pageNumbers = [];
  for (let i = windowStart; i <= windowEnd; i++) {
    pageNumbers.push(i);
  }

  // Selection
  const isAllCurrentSelected =
    paginatedItems.length > 0 &&
    paginatedItems.every((item) => selectedIds.includes(item.id));

  const toggleSelectAllCurrent = () => {
    if (isAllCurrentSelected) {
      setSelectedIds((prev) => prev.filter((id) => !paginatedItems.some((item) => item.id === id)));
    } else {
      const pageIds = paginatedItems.map((item) => item.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Open Create/Edit modal
  const handleOpenCreate = () => {
    setEditingArticle(null);
    setFormTitle("");
    setFormSlug("");
    setFormCategory("guide");
    setFormCoverImage("https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop&q=80");
    setFormExcerpt("");
    setFormContent("");
    setFormStatus("published");
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (art: BlogArticle) => {
    setEditingArticle(art);
    setFormTitle(art.title);
    setFormSlug(art.slug);
    setFormCategory(art.category);
    setFormCoverImage(art.coverImage);
    setFormExcerpt(art.excerpt);
    setFormContent(art.content);
    setFormStatus(art.status);
    setEditorError("");
    setIsEditorOpen(true);
  };

  // Save Article
  const handleSaveArticle = () => {
    if (!formTitle.trim()) {
      setEditorError(isEn ? "Please enter an article title." : "Vui lòng nhập tiêu đề bài viết.");
      return;
    }

    const categoryLabels: Record<BlogArticle["category"], string> = {
      guide: isEn ? "Rental Guide" : "Cẩm nang thuê trọ",
      legal: isEn ? "Legal & Contracts" : "Pháp lý & Hợp đồng",
      lifestyle: isEn ? "Living & Decor" : "Mẹo sống & Decor",
      market: isEn ? "Market Insights" : "Tin tức thị trường",
    };

    const todayStr = new Date().toISOString().split("T")[0];

    if (editingArticle) {
      // Update
      setArticles((prev) =>
        prev.map((a) =>
          a.id === editingArticle.id
            ? {
                ...a,
                title: formTitle.trim(),
                slug: formSlug.trim() || formTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                category: formCategory,
                categoryLabel: categoryLabels[formCategory],
                coverImage: formCoverImage.trim() || a.coverImage,
                excerpt: formExcerpt.trim(),
                content: formContent.trim(),
                status: formStatus,
              }
            : a
        )
      );
    } else {
      // Create new
      const newId = `POST-${Math.floor(Math.random() * 900) + 110}`;
      const newPost: BlogArticle = {
        id: newId,
        title: formTitle.trim(),
        slug: formSlug.trim() || formTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        category: formCategory,
        categoryLabel: categoryLabels[formCategory],
        coverImage: formCoverImage.trim() || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop&q=80",
        excerpt: formExcerpt.trim(),
        content: formContent.trim(),
        readTime: "5 min read",
        author: "Ban Quản Trị Dormio",
        views: 0,
        status: formStatus,
        publishedAt: todayStr,
      };
      setArticles((prev) => [newPost, ...prev]);
    }

    setIsEditorOpen(false);
    setEditorError("");
  };

  // Delete article via custom confirmation modal
  const handleDeleteArticle = (item: BlogArticle) => {
    setDeleteTargetArticle(item);
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetArticle) return;
    setArticles((prev) => prev.filter((a) => a.id !== deleteTargetArticle.id));
    setSelectedIds((prev) => prev.filter((i) => i !== deleteTargetArticle.id));
    setDeleteTargetArticle(null);
  };

  // Toggle publish status
  const handleToggleStatus = (id: string) => {
    setArticles((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: a.status === "published" ? "draft" : "published" }
          : a
      )
    );
  };

  // Rule #10: Check dirty form on close
  const isFormDirty =
    formTitle.trim().length > 0 ||
    formExcerpt.trim().length > 0 ||
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
              {isEn ? "Public Content Management" : "Quản Lý Nội Dung Blog Công Khai"}
            </span>
            <span className="text-xs font-semibold text-zinc-400">
              • {isEn ? "Articles displayed on public /blog" : "Hiển thị trên chuyên trang /blog cho khách"}
            </span>
          </div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight mt-1">
            {isEn ? "Blog Articles & Editorial Desk" : "Biên Tập & Xuất Bản Bài Viết Blog"}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {isEn
              ? "Draft, edit, publish rental advice, legal warnings, and interior tips for prospective tenants and landlords."
              : "Quản lý các bài viết cẩm nang thuê trọ, kiến thức hợp đồng, mẹo tiết kiệm chi phí và báo cáo thị trường."}
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition-all shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isEn ? "New Article" : "Viết Bài Viết Mới"}</span>
        </button>
      </div>

      {/* Control Bar: Search, Filters, View Mode (Rule #9) */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200/90 shadow-2xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={isEn ? "Search title, author, keyword..." : "Tìm tiêu đề bài viết, tác giả..."}
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5"
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
                { id: "published", label: isEn ? "Published" : "Đã xuất bản" },
                { id: "draft", label: isEn ? "Drafts" : "Bản nháp" },
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

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 cursor-pointer focus:outline-none focus:border-orange-500"
          >
            <option value="all">{isEn ? "All Categories" : "Mọi chuyên mục"}</option>
            <option value="guide">{isEn ? "Rental Guide" : "Cẩm nang thuê trọ"}</option>
            <option value="legal">{isEn ? "Legal & Contracts" : "Pháp lý & Hợp đồng"}</option>
            <option value="lifestyle">{isEn ? "Living & Decor" : "Mẹo sống & Decor"}</option>
            <option value="market">{isEn ? "Market Insights" : "Tin tức thị trường"}</option>
          </select>
        </div>

        {/* View Mode (Rule #9) */}
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

      {/* Select All on Current Page Bar */}
      {paginatedItems.length > 0 && (
        <div className="flex items-center justify-between px-2 text-xs font-semibold text-zinc-500">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAllCurrentSelected}
              onChange={toggleSelectAllCurrent}
              className="w-4 h-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
            />
            <span>{isEn ? "Select all on this page" : "Chọn tất cả trên trang này"}</span>
          </label>
          <span>
            {isEn
              ? `Showing ${paginatedItems.length} of ${totalItems} articles`
              : `Hiển thị ${paginatedItems.length} trên ${totalItems} bài viết`}
          </span>
        </div>
      )}

      {/* Main Content */}
      {paginatedItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
            <Newspaper className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-800">
            {isEn ? "No articles found" : "Chưa có bài viết nào"}
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {isEn ? "Start drafting informative guides for your users." : "Bắt đầu soạn thảo bài viết hữu ích cho người thuê trọ."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW (Rule #9: Default 6 items) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedItems.map((item) => {
            const isSelected = selectedIds.includes(item.id);

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md ${
                  isSelected ? "border-orange-500 ring-2 ring-orange-500/20" : "border-zinc-200/90"
                }`}
              >
                <div>
                  {/* Thumbnail Banner */}
                  <div className="relative h-44 w-full bg-zinc-100 overflow-hidden">
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-black/20" />

                    <div className="absolute top-3 left-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item.id)}
                        className="w-4.5 h-4.5 rounded border-white/80 text-orange-600 focus:ring-orange-500 bg-white/90 shadow-sm cursor-pointer"
                      />
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase text-white shadow-2xs ${
                        item.status === "published" ? "bg-emerald-600" : "bg-amber-600"
                      }`}>
                        {item.status === "published" ? (isEn ? "PUBLISHED" : "ĐÃ XUẤT BẢN") : (isEn ? "DRAFT" : "BẢN NHÁP")}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[11px] font-bold">
                      <span className="bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
                        🏷️ {item.categoryLabel}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {item.views.toLocaleString()} {isEn ? "views" : "lượt xem"}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-2.5">
                    <h3 className="text-sm font-black text-zinc-900 line-clamp-2 hover:text-orange-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                      {item.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                      <span>{item.author}</span>
                      <span>{item.publishedAt}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 pt-0 border-t border-zinc-100 mt-2 flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(item.id)}
                    className="flex-1 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    {item.status === "published" ? (isEn ? "Unpublish" : "Gỡ xuống nháp") : (isEn ? "Publish" : "Xuất bản ngay")}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors cursor-pointer"
                    title={isEn ? "Edit article" : "Chỉnh sửa"}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteArticle(item)}
                    className="p-2 rounded-xl bg-zinc-100 hover:bg-orange-100 text-zinc-500 hover:text-orange-700 transition-colors cursor-pointer"
                    title={isEn ? "Delete article" : "Xóa bài"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW (Rule #9: Default 10 items) */
        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/70 text-zinc-500 uppercase tracking-wider font-bold">
                <th className="p-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={isAllCurrentSelected}
                    onChange={toggleSelectAllCurrent}
                    className="w-4 h-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                </th>
                <th className="p-3.5">{isEn ? "Article" : "Bài viết & Tiêu đề"}</th>
                <th className="p-3.5">{isEn ? "Category" : "Chuyên mục"}</th>
                <th className="p-3.5">{isEn ? "Views & Reading" : "Lượt đọc"}</th>
                <th className="p-3.5">{isEn ? "Status" : "Trạng thái"}</th>
                <th className="p-3.5 text-right">{isEn ? "Actions" : "Hành động"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginatedItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-zinc-50/80 transition-colors ${
                      isSelected ? "bg-orange-50/30" : ""
                    }`}
                  >
                    <td className="p-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item.id)}
                        className="w-4 h-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                      />
                    </td>

                    <td className="p-3.5 max-w-sm">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.coverImage}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-zinc-200"
                        />
                        <div className="space-y-0.5">
                          <div className="font-bold text-zinc-900 line-clamp-1">{item.title}</div>
                          <div className="text-[11px] text-zinc-400">{item.author} • {item.publishedAt}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="font-semibold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-md">
                        {item.categoryLabel}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="font-black text-zinc-900">{item.views.toLocaleString()} {isEn ? "views" : "lượt"}</div>
                      <div className="text-[11px] text-zinc-400">{item.readTime}</div>
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        item.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                        title={isEn ? "Edit" : "Sửa"}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteArticle(item)}
                        className="p-1.5 rounded-lg bg-zinc-100 hover:bg-orange-100 text-zinc-400 hover:text-orange-700 transition-colors cursor-pointer"
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
            {isEn ? `of ${totalItems} articles` : `trên ${totalItems} bài viết`}
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

      {/* ARTICLE EDITOR MODAL (Rule #10 compliant) */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-scaleIn max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Newspaper className="w-4 h-4" />
                </div>
                <h2 className="text-base font-black text-zinc-900">
                  {editingArticle
                    ? (isEn ? "Edit Blog Article" : "Chỉnh Sửa Bài Viết Blog")
                    : (isEn ? "Create New Blog Article" : "Viết Bài Viết Blog Mới")}
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
                  {isEn ? "Article Title:" : "Tiêu đề bài viết:"}
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={isEn ? "e.g., 5 Tips to Negotiate Rental Contracts" : "Ví dụ: 10 Điều cần kiểm tra kỹ trước khi ký hợp đồng thuê trọ"}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-700 block">
                    {isEn ? "Category:" : "Chuyên mục:"}
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-semibold text-zinc-800 cursor-pointer focus:outline-none focus:border-orange-500"
                  >
                    <option value="guide">{isEn ? "Rental Guide" : "Cẩm nang thuê trọ"}</option>
                    <option value="legal">{isEn ? "Legal & Contracts" : "Pháp lý & Hợp đồng"}</option>
                    <option value="lifestyle">{isEn ? "Living & Decor" : "Mẹo sống & Decor"}</option>
                    <option value="market">{isEn ? "Market Insights" : "Tin tức thị trường"}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-zinc-700 block">
                    {isEn ? "Publishing Status:" : "Trạng thái hiển thị:"}
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setFormStatus("published")}
                      className={`flex-1 py-1.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        formStatus === "published"
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

              {/* Excerpt */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 block">
                  {isEn ? "Short Excerpt / Meta Description:" : "Tóm tắt ngắn (Excerpt / Meta SEO):"}
                </label>
                <textarea
                  rows={2}
                  value={formExcerpt}
                  onChange={(e) => setFormExcerpt(e.target.value)}
                  placeholder={isEn ? "Brief 1-2 sentence overview shown in blog cards..." : "Tóm tắt ngắn 1-2 câu hiển thị ngoài trang chủ Blog..."}
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-2xl font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white leading-relaxed"
                />
              </div>

              {/* Content */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 block">
                  {isEn ? "Full Article Body (Markdown / Text):" : "Nội dung bài viết chi tiết (Markdown / Văn bản):"}
                </label>
                <textarea
                  rows={8}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder={isEn ? "Write article paragraphs here..." : "Viết nội dung bài viết chi tiết tại đây..."}
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-2xl font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white leading-relaxed"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2.5">
              <button
                onClick={handleRequestCloseEditor}
                className="px-4 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                {isEn ? "Cancel" : "Hủy bỏ"}
              </button>
              <button
                onClick={handleSaveArticle}
                className="px-5 py-2 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 transition-colors shadow-2xs cursor-pointer"
              >
                {editingArticle
                  ? (isEn ? "Save Changes" : "Lưu Cập Nhật")
                  : (isEn ? "Publish Article" : "Đăng Bài Viết")}
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
                {isEn ? "Discard Article Draft?" : "Xác nhận đóng form"}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                {isEn
                  ? "You have unsaved blog content. Are you sure you want to discard changes and close?"
                  : "Bạn có nội dung bài viết chưa lưu. Bạn có chắc muốn đóng và hủy các thông tin đã nhập?"}
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
      {deleteTargetArticle && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3 text-orange-600">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900">
                  {isEn ? "Confirm Delete Article" : "Xác nhận xóa bài viết"}
                </h3>
                <p className="text-xs text-zinc-500 font-mono">{deleteTargetArticle.id}</p>
              </div>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              {isEn
                ? `Are you sure you want to permanently delete "${deleteTargetArticle.title}"? This action cannot be undone.`
                : `Bạn có chắc chắn muốn xóa vĩnh viễn bài viết "${deleteTargetArticle.title}"? Hành động này không thể hoàn tác.`}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={() => setDeleteTargetArticle(null)}
                className="px-3.5 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                {isEn ? "Cancel" : "Hủy bỏ"}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer shadow-2xs"
              >
                {isEn ? "Delete Article" : "Xóa bài viết"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
