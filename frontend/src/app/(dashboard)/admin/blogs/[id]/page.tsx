"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage, useTranslations } from "@/context/LanguageContext";
import { postService, PublicPostListing } from "@/services/post.service";
import {
  ArrowLeft, Newspaper, Edit3, Trash2, CheckCircle2, RotateCcw,
  Eye, Bookmark, Building2, MapPin, Calendar, User,
  AlertTriangle, Check, Copy, RefreshCw, X, ShieldAlert,
  Layers, Lock, Unlock,
} from "lucide-react";

export default function AdminPostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params?.id as string;

  const { locale } = useLanguage();
  const t = useTranslations("admin");

  // Data State
  const [post, setPost] = useState<PublicPostListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formDepositAmount, setFormDepositAmount] = useState<number>(0);
  const [formCoverImage, setFormCoverImage] = useState("");
  const [formStatus, setFormStatus] = useState<"posted" | "draft" | "hidden" | "locked">("posted");
  const [editError, setEditError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Lock Modal State
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [lockReason, setLockReason] = useState("");
  const [lockReasonError, setLockReasonError] = useState("");
  const [isLocking, setIsLocking] = useState(false);

  // Unlock Modal State
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Delete Modal State (Mandatory Reason to Notify Author)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Rule #10: Modal Reset Confirmation
  const [confirmCloseModal, setConfirmCloseModal] = useState<{
    isOpen: boolean;
    onDiscard: () => void;
  }>({ isOpen: false, onDiscard: () => {} });

  // Selected gallery image
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Load post details from backend
  const fetchPostDetail = useCallback(async (isSilent = false) => {
    if (!postId) return;
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const res = await postService.getPublicPostById(postId);
      if (res) {
        // Augment demo reported metadata if mock or tie with grievances
        if (!res.reportsCount && (res.title?.toLowerCase().includes("report") || res.id.endsWith("2"))) {
          res.reportsCount = 3;
          res.reportReasons = [
            locale === "en" ? "Unrealistic bait pricing" : "Giá ảo câu khách, khi gọi điện báo giá khác",
            locale === "en" ? "Suspicious deposit demand" : "Yêu cầu chuyển cọc giữ chỗ ngoài hệ thống",
          ];
        }
        setPost(res);
      } else {
        setError(t("adminBlogsDetailNotFound"));
      }
    } catch (err: any) {
      console.error("Failed to load post detail:", err);
      setError(
        err?.response?.data?.message || t("adminBlogsFetchError")
      );
    } finally {
      setLoading(false);
    }
  }, [postId, t, locale]);

  useEffect(() => {
    fetchPostDetail();
  }, [fetchPostDetail]);

  // Copy Post ID
  const handleCopyId = () => {
    if (!postId) return;
    navigator.clipboard.writeText(postId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Revert to Draft
  const handleRevertToDraft = async () => {
    if (!post) return;
    setActionLoading(true);
    try {
      await postService.updatePostStatus(post.id, "draft");
      setPost((prev) => (prev ? { ...prev, status: "draft" } : null));
      setFeedbackMsg({
        type: "success",
        text: locale === "en" ? "Post reverted to draft." : "Đã chuyển bài viết về bản nháp.",
      });
    } catch (err: any) {
      console.error("Failed to revert to draft:", err);
      setFeedbackMsg({
        type: "error",
        text: err?.response?.data?.message || t("adminBlogsFetchError"),
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Publish Post
  const handlePublishPost = async () => {
    if (!post) return;
    setActionLoading(true);
    try {
      await postService.updatePostStatus(post.id, "posted");
      setPost((prev) => (prev ? { ...prev, status: "posted" } : null));
      setFeedbackMsg({
        type: "success",
        text: locale === "en" ? "Post published successfully." : "Đã xuất bản bài viết thành công.",
      });
    } catch (err: any) {
      console.error("Failed to publish post:", err);
      setFeedbackMsg({
        type: "error",
        text: err?.response?.data?.message || t("adminBlogsFetchError"),
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = () => {
    if (!post) return;
    setFormTitle(post.title || "");
    setFormContent(post.content || "");
    setFormDepositAmount(post.depositAmount || 0);
    setFormCoverImage(post.images?.[0]?.url || "");
    setFormStatus(
      post.status === "draft"
        ? "draft"
        : post.status === "hidden"
        ? "hidden"
        : post.status === "locked"
        ? "locked"
        : "posted"
    );
    setEditError("");
    setIsEditModalOpen(true);
  };

  // Save Edit Content
  const handleSaveEdit = async () => {
    if (!post) return;
    if (!formTitle.trim()) {
      setEditError(t("adminBlogsErrorTitleLength"));
      return;
    }
    if (!formContent.trim()) {
      setEditError(t("adminBlogsErrorContentLength"));
      return;
    }

    setIsSaving(true);
    setEditError("");

    try {
      await postService.updatePost(post.id, {
        title: formTitle.trim(),
        content: formContent.trim(),
        depositAmount: formDepositAmount || 0,
        imageUrls: formCoverImage.trim() ? [formCoverImage.trim()] : [],
        status: formStatus,
      });

      setIsEditModalOpen(false);
      setFeedbackMsg({
        type: "success",
        text: locale === "en" ? "Post updated successfully." : "Cập nhật bài viết thành công.",
      });
      await fetchPostDetail(true);
    } catch (err: any) {
      console.error("Failed to update post:", err);
      setEditError(
        err?.response?.data?.message || t("adminBlogsFetchError")
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Lock Post Handler
  const handleConfirmLock = async () => {
    if (!post) return;
    if (!lockReason.trim()) {
      setLockReasonError(t("adminModLockReasonRequired"));
      return;
    }

    setIsLocking(true);
    setLockReasonError("");

    try {
      await postService.updatePostStatus(post.id, "locked");
      setPost((prev) => (prev ? { ...prev, status: "locked", lockReason: lockReason.trim() } : null));
      setIsLockModalOpen(false);
      setLockReason("");
      setFeedbackMsg({ type: "success", text: t("adminModLockSuccess") });
    } catch (err: any) {
      console.error("Failed to lock post:", err);
      setLockReasonError(err?.response?.data?.message || t("adminBlogsFetchError"));
    } finally {
      setIsLocking(false);
    }
  };

  // Unlock Post Handler
  const handleConfirmUnlock = async () => {
    if (!post) return;
    setIsUnlocking(true);

    try {
      await postService.updatePostStatus(post.id, "posted");
      setPost((prev) => (prev ? { ...prev, status: "posted", lockReason: undefined } : null));
      setIsUnlockModalOpen(false);
      setFeedbackMsg({ type: "success", text: t("adminModUnlockSuccess") });
    } catch (err: any) {
      console.error("Failed to unlock post:", err);
      setFeedbackMsg({
        type: "error",
        text: err?.response?.data?.message || t("adminBlogsFetchError"),
      });
    } finally {
      setIsUnlocking(false);
    }
  };

  // Confirm Delete with Mandatory Author Notification Reason
  const handleConfirmDelete = async () => {
    if (!post) return;
    if (!deleteReason.trim()) {
      setDeleteError(t("adminBlogsDeleteReasonRequired"));
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      await postService.deletePost(post.id, deleteReason.trim());
      setIsDeleteModalOpen(false);
      // Navigate back to listing page
      router.push("/admin/blogs");
    } catch (err: any) {
      console.error("Failed to delete post:", err);
      setDeleteError(
        err?.response?.data?.message || t("adminBlogsDeleteFailed")
      );
      setIsDeleting(false);
    }
  };

  // Rule #10: Check dirty form on edit close
  const isFormDirty =
    post &&
    (formTitle.trim() !== (post.title || "") ||
      formContent.trim() !== (post.content || "") ||
      formDepositAmount !== (post.depositAmount || 0) ||
      formStatus !== post.status);

  const handleRequestCloseEdit = () => {
    if (isFormDirty) {
      setConfirmCloseModal({
        isOpen: true,
        onDiscard: () => {
          setIsEditModalOpen(false);
          setConfirmCloseModal({ isOpen: false, onDiscard: () => {} });
        },
      });
    } else {
      setIsEditModalOpen(false);
    }
  };

  const handleRequestCloseLock = () => {
    if (lockReason.trim().length > 0) {
      setConfirmCloseModal({
        isOpen: true,
        onDiscard: () => {
          setIsLockModalOpen(false);
          setLockReason("");
          setLockReasonError("");
          setConfirmCloseModal({ isOpen: false, onDiscard: () => {} });
        },
      });
    } else {
      setIsLockModalOpen(false);
      setLockReason("");
      setLockReasonError("");
    }
  };

  const handleRequestCloseDelete = () => {
    if (deleteReason.trim().length > 0) {
      setConfirmCloseModal({
        isOpen: true,
        onDiscard: () => {
          setIsDeleteModalOpen(false);
          setDeleteReason("");
          setDeleteError("");
          setConfirmCloseModal({ isOpen: false, onDiscard: () => {} });
        },
      });
    } else {
      setIsDeleteModalOpen(false);
      setDeleteReason("");
      setDeleteError("");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="h-6 bg-zinc-200 rounded w-48 animate-pulse" />
        <div className="bg-white rounded-3xl border border-zinc-200 p-8 space-y-6 animate-pulse">
          <div className="h-10 bg-zinc-200 rounded w-2/3" />
          <div className="h-64 bg-zinc-100 rounded-2xl w-full" />
          <div className="space-y-3">
            <div className="h-4 bg-zinc-200 rounded w-full" />
            <div className="h-4 bg-zinc-200 rounded w-5/6" />
            <div className="h-4 bg-zinc-200 rounded w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="space-y-6 pb-12">
        <Link
          href="/admin/blogs"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-orange-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("adminBlogsDetailBack")}</span>
        </Link>
        <div className="bg-white rounded-3xl border border-red-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-zinc-900">
            {t("adminBlogsDetailNotFound")}
          </h2>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {error || t("adminBlogsDetailNotFoundDesc")}
          </p>
          <Link
            href="/admin/blogs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition-colors shadow-2xs"
          >
            <span>{t("adminBlogsDetailReturn")}</span>
          </Link>
        </div>
      </div>
    );
  }

  const allImages =
    post.images && post.images.length > 0
      ? post.images
      : [
          {
            id: "default-cover",
            url: "/house-placeholder.jpg",
          },
        ];

  const currentImage = allImages[activeImageIndex] || allImages[0];
  const isReported = Boolean((post.reportsCount && post.reportsCount > 0) || (post.reportReasons && post.reportReasons.length > 0));

  return (
    <div className="space-y-6 pb-16">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/admin/blogs"
            className="inline-flex items-center gap-1 font-bold text-zinc-500 hover:text-orange-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t("adminBlogsDetailBack")}</span>
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="font-semibold text-zinc-400 truncate max-w-[260px]">
            {post.title}
          </span>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Lock / Unlock Post */}
          {post.status === "locked" ? (
            <button
              onClick={() => setIsUnlockModalOpen(true)}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              title={t("adminModActionUnlock")}
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>{t("adminModActionUnlock")}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setLockReason("");
                setLockReasonError("");
                setIsLockModalOpen(true);
              }}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              title={t("adminModActionLock")}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{t("adminModActionLock")}</span>
            </button>
          )}

          {/* Status Transitions: Publish / Revert to Draft (when not locked) */}
          {post.status !== "locked" && (
            post.status === "posted" ? (
              <button
                onClick={handleRevertToDraft}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                title={t("adminBlogsDetailRevertTitle")}
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>{t("adminBlogsDetailRevertBtn")}</span>
              </button>
            ) : (
              <button
                onClick={handlePublishPost}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                title={t("adminBlogsDetailPublishTitle")}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t("adminBlogsDetailPublishBtn")}</span>
              </button>
            )
          )}

          {/* Edit Content */}
          <button
            onClick={handleOpenEdit}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{t("adminBlogsDetailEditBtn")}</span>
          </button>

          {/* Delete Post */}
          <button
            onClick={() => {
              setDeleteReason("");
              setDeleteError("");
              setIsDeleteModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t("adminBlogsDetailDeleteBtn")}</span>
          </button>

          {/* Refresh */}
          <button
            onClick={() => fetchPostDetail(true)}
            disabled={loading}
            className="p-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 transition-colors shadow-2xs cursor-pointer"
            title={t("adminModRefresh")}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Feedback Message Toast */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-2xs animate-fadeIn ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-zinc-500 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Locked Post Warning Banner */}
      {post.status === "locked" && (
        <div className="p-5 rounded-3xl bg-red-50 border border-red-200 text-red-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="font-black text-red-900 text-sm flex items-center gap-2">
                <span>{t("adminModBadgeLocked")}</span>
                <span className="text-[10px] uppercase font-bold text-red-700 bg-red-200/70 px-2 py-0.5 rounded-md">
                  {t("adminModLockTitle")}
                </span>
              </div>
              <p className="text-xs text-red-800 font-medium leading-relaxed">
                {post.lockReason || t("adminModLockSubtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsUnlockModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>{t("adminModActionUnlock")}</span>
          </button>
        </div>
      )}

      {/* Reported / Grievance Notice Banner */}
      {isReported && (
        <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-amber-800 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {t("adminModInspectReports")} ({post.reportsCount || post.reportReasons?.length || 1})
            </span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-xs font-medium text-amber-800">
            {(post.reportReasons && post.reportReasons.length > 0
              ? post.reportReasons
              : [locale === "en" ? "Unrealistic bait pricing" : "Giá ảo câu khách, khi gọi điện báo giá khác"]
            ).map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-zinc-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide ${
                  post.status === "posted"
                    ? "bg-emerald-100 text-emerald-800"
                    : post.status === "draft"
                    ? "bg-amber-100 text-amber-800"
                    : post.status === "locked"
                    ? "bg-red-100 text-red-800 ring-1 ring-red-300"
                    : "bg-zinc-100 text-zinc-700"
                }`}
              >
                {post.status === "posted"
                  ? t("adminBlogsBadgePublished")
                  : post.status === "draft"
                  ? t("adminBlogsBadgeDraft")
                  : post.status === "locked"
                  ? t("adminModBadgeLocked")
                  : t("adminBlogsBadgeHidden")}
              </span>

              {isReported && (
                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-500 text-white shadow-2xs flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{t("adminModBadgeReported", { count: post.reportsCount || 1 })}</span>
                </span>
              )}

              {post.room?.boardingHouseName && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-700">
                  <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{post.room.boardingHouseName}</span>
                </span>
              )}

              {post.room?.roomNumber && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600">
                  {t("adminBlogsDetailRoom", { number: post.room.roomNumber })}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 pt-1">
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-zinc-400">UUID:</span>
                <span className="text-zinc-700 font-semibold">{post.id}</span>
                <button
                  onClick={handleCopyId}
                  className="p-1 text-zinc-400 hover:text-zinc-700 rounded transition-colors cursor-pointer"
                  title={t("adminBlogsDetailCopyUuid")}
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-zinc-400" />}
                </button>
              </div>

              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>
                  {t("adminBlogsDetailCreated")}{" "}
                  {post.createdAt ? new Date(post.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "vi-VN") : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Badge */}
          <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 flex items-center gap-5 shrink-0 self-start">
            <div className="text-center">
              <div className="text-base font-black text-zinc-900 flex items-center justify-center gap-1">
                <Eye className="w-4 h-4 text-orange-600" />
                {(post.viewsCount || 0).toLocaleString()}
              </div>
              <div className="text-[11px] font-bold text-zinc-400 mt-0.5">
                {t("adminBlogsDetailViews")}
              </div>
            </div>
            <div className="w-px h-8 bg-zinc-200" />
            <div className="text-center">
              <div className="text-base font-black text-zinc-900 flex items-center justify-center gap-1">
                <Bookmark className="w-4 h-4 text-orange-600" />
                {post.savedCount || 0}
              </div>
              <div className="text-[11px] font-bold text-zinc-400 mt-0.5">
                {t("adminBlogsDetailBookmarks")}
              </div>
            </div>
            <div className="w-px h-8 bg-zinc-200" />
            <div className="text-center">
              <div className="text-base font-black text-emerald-700">
                {post.depositAmount ? `${Number(post.depositAmount).toLocaleString("vi-VN")} ₫` : "0 ₫"}
              </div>
              <div className="text-[11px] font-bold text-zinc-400 mt-0.5">
                {t("adminBlogsDetailDeposit")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Images & Full Post Body */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Showcase */}
          <div className="bg-white p-5 rounded-3xl border border-zinc-200/90 shadow-2xs space-y-3">
            <h2 className="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-orange-600" />
              <span>{t("adminBlogsDetailGallery")}</span>
            </h2>

            <div className="relative h-80 sm:h-96 w-full rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200">
              <img
                src={currentImage.url}
                alt={post.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                {activeImageIndex + 1} / {allImages.length}
              </div>
            </div>

            {/* Thumbnails list */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-1">
                {allImages.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      activeImageIndex === idx
                        ? "border-orange-600 ring-2 ring-orange-500/20 shadow-xs"
                        : "border-zinc-200 hover:border-zinc-300 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Full Post Content */}
          <div className="bg-white p-6 rounded-3xl border border-zinc-200/90 shadow-2xs space-y-3">
            <h2 className="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Newspaper className="w-3.5 h-3.5 text-orange-600" />
              <span>{t("adminBlogsDetailFullDesc")}</span>
            </h2>

            <div className="prose prose-zinc max-w-none text-xs leading-relaxed text-zinc-800 whitespace-pre-line bg-zinc-50/50 p-5 rounded-2xl border border-zinc-100">
              {post.content}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Author, Property & Location Details */}
        <div className="space-y-6">
          {/* Author / Poster Card */}
          <div className="bg-white p-5 rounded-3xl border border-zinc-200/90 shadow-2xs space-y-4">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-orange-600" />
              <span>{t("adminBlogsDetailAuthorInfo")}</span>
            </h3>

            <div className="flex items-center gap-3.5">
              <img
                src={
                  post.poster?.avatarUrl ||
                  "/avatar-placeholder.png"
                }
                alt=""
                className="w-12 h-12 rounded-2xl object-cover border border-zinc-200"
              />
              <div className="space-y-0.5">
                <div className="font-black text-zinc-900 text-sm">
                  {post.poster?.username || t("adminBlogsAdminAuthor")}
                </div>
                <div className="text-[11px] text-zinc-400 font-mono truncate max-w-[190px]">
                  {post.poster?.id ? `ID: ${post.poster.id}` : t("adminBlogsAdminAuthor")}
                </div>
              </div>
            </div>

            <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 text-[11px] text-zinc-500 leading-relaxed">
              {t("adminBlogsDetailModerationDesc")}
            </div>
          </div>

          {/* Associated Room & Boarding House Card */}
          {post.room && (
            <div className="bg-white p-5 rounded-3xl border border-zinc-200/90 shadow-2xs space-y-4">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-orange-600" />
                <span>{t("adminBlogsDetailRoomAndBuilding")}</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-zinc-100">
                  <span className="text-zinc-500">{t("adminBlogsDetailBoardingHouse")}</span>
                  <span className="font-bold text-zinc-900">{post.room.boardingHouseName || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100">
                  <span className="text-zinc-500">{t("adminBlogsDetailRoomNumber")}</span>
                  <span className="font-bold text-zinc-900">{post.room.roomNumber || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100">
                  <span className="text-zinc-500">{t("adminBlogsDetailFloor")}</span>
                  <span className="font-bold text-zinc-900">{post.room.floor || 1}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100">
                  <span className="text-zinc-500">{t("adminBlogsDetailArea")}</span>
                  <span className="font-bold text-zinc-900">{post.room.area ? `${post.room.area} m²` : "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100">
                  <span className="text-zinc-500">{t("adminBlogsDetailRoomType")}</span>
                  <span className="font-bold text-zinc-900 uppercase text-[11px]">{post.room.roomTypeName || "common"}</span>
                </div>
              </div>

              {/* Address details */}
              {post.address && (
                <div className="pt-2 border-t border-zinc-100 space-y-1 text-xs">
                  <div className="font-bold text-zinc-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span>{t("adminBlogsDetailLocation")}</span>
                  </div>
                  <div className="text-zinc-500 leading-relaxed text-[11px]">
                    {[
                      post.address.houseNumber,
                      post.address.street,
                      post.address.ward,
                      post.address.district,
                      post.address.province,
                    ]
                      .filter(Boolean)
                      .join(", ") || t("adminBlogsDetailAddressNotSpecified")}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Action Box */}
          <div className="bg-orange-50/50 p-5 rounded-3xl border border-orange-200/60 shadow-2xs space-y-3">
            <h3 className="text-xs font-black text-orange-800 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-orange-600" />
              <span>{t("adminBlogsDetailModerationNote")}</span>
            </h3>
            <p className="text-[11px] text-zinc-600 leading-relaxed">
              {t("adminBlogsDetailModerationDesc")}
            </p>
          </div>
        </div>
      </div>

      {/* ─── MODAL 1: EDIT POST MODAL (Rule #10 compliant) ─── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-scaleIn max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
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

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {editError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Title */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 block">
                  {t("adminBlogsFieldTitle")}:
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              {/* Status & Deposit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-700 block">
                    {t("adminBlogsFieldStatus")}:
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-semibold text-zinc-800 cursor-pointer focus:outline-none focus:border-orange-500"
                  >
                    <option value="posted">{t("adminBlogsStatusPublished")}</option>
                    <option value="draft">{t("adminBlogsStatusDraft")}</option>
                    <option value="hidden">{t("adminBlogsStatusHidden")}</option>
                    <option value="locked">{t("adminModBadgeLocked")}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-zinc-700 block">
                    {t("adminBlogsFieldDeposit")}:
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
                  {t("adminBlogsFieldCoverImage")}:
                </label>
                <input
                  type="text"
                  value={formCoverImage}
                  onChange={(e) => setFormCoverImage(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-medium text-zinc-800 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              {/* Content */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 block">
                  {t("adminBlogsFieldContent")}:
                </label>
                <textarea
                  rows={8}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-2xl font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white leading-relaxed"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2.5">
              <button
                onClick={handleRequestCloseEdit}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                {t("adminBlogsCancel")}
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{t("adminBlogsDetailSaveChanges")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: LOCK POST MODAL (Rule #10 compliant) ─── */}
      {isLockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900">{t("adminModLockTitle")}</h3>
                <p className="text-xs text-zinc-500 font-mono truncate max-w-[240px]">{post.id}</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              {t("adminModLockSubtitle")}
            </p>

            {lockReasonError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{lockReasonError}</span>
              </div>
            )}

            <div className="space-y-2 text-xs">
              <label className="font-bold text-zinc-700 block">
                {t("adminModLockReasonLabel")}
              </label>

              {/* Preset Chips */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  t("adminModLockPresetFakePrice"),
                  t("adminModLockPresetScamDeposit"),
                  t("adminModLockPresetViolation"),
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setLockReason(preset);
                      setLockReasonError("");
                    }}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                      lockReason === preset
                        ? "bg-red-50 border-red-300 text-red-700"
                        : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                value={lockReason}
                onChange={(e) => {
                  setLockReason(e.target.value);
                  if (e.target.value.trim()) setLockReasonError("");
                }}
                placeholder={t("adminModLockReasonPlaceholder")}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-2xl font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-red-500 focus:bg-white leading-relaxed mt-1"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={handleRequestCloseLock}
                disabled={isLocking}
                className="px-3.5 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                {t("adminBlogsCancel")}
              </button>
              <button
                onClick={handleConfirmLock}
                disabled={isLocking}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                {isLocking && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{t("adminModLockConfirmBtn")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: UNLOCK POST MODAL ─── */}
      {isUnlockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <Unlock className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900">{t("adminModUnlockTitle")}</h3>
                <p className="text-xs text-zinc-500 font-mono truncate max-w-[240px]">{post.id}</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              {t("adminModUnlockConfirm", { title: post.title })}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={() => setIsUnlockModalOpen(false)}
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

      {/* ─── MODAL 4: DELETE POST MODAL (Rule #10 compliant) ─── */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900">
                  {t("adminBlogsDetailDeleteModalTitle")}
                </h3>
                <p className="text-xs text-zinc-500 font-mono truncate max-w-[240px]">{post.id}</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              {t("adminBlogsDetailDeleteModalDesc", {
                title: post.title,
                author: post.poster?.username || "the author",
              })}
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="space-y-1 text-xs">
              <label className="font-bold text-zinc-700 block">
                {t("adminBlogsDeleteReasonLabel")}
              </label>
              <textarea
                rows={3}
                value={deleteReason}
                onChange={(e) => {
                  setDeleteReason(e.target.value);
                  if (e.target.value.trim()) setDeleteError("");
                }}
                placeholder={t("adminBlogsDeleteReasonPlaceholder")}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-2xl font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-red-500 focus:bg-white leading-relaxed"
              />
              <div className="text-[10px] text-zinc-400 text-right">
                {deleteReason.length} / 500 {t("adminBlogsDetailCharsUnit")}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={handleRequestCloseDelete}
                disabled={isDeleting}
                className="px-3.5 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                {t("adminBlogsCancel")}
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting || !deleteReason.trim()}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{t("adminBlogsDetailConfirmDeleteAndDispatch")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: RULE #10 CONFIRMATION POP-UP ─── */}
      {confirmCloseModal.isOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 space-y-4 animate-scaleIn">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900">
                {t("adminBlogsDiscardModalTitle")}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                {t("adminBlogsDiscardModalDesc")}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmCloseModal({ isOpen: false, onDiscard: () => {} })}
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
