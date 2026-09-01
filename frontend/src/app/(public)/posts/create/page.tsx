"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Upload,
  Plus,
  Trash2,
  Sparkles,
  Coins,
  Building2,
  AlertCircle,
  FileText,
  DollarSign,
  Image as ImageIcon,
  CheckCircle2,
  ShieldCheck,
  Info,
  HelpCircle,
  Sparkle,
  Loader2,
  X,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { postService, PostQuotaStatus } from "@/services/post.service";

export default function PublicCreatePostPage() {
  const router = useRouter();

  // Quota & loading state
  const [quota, setQuota] = useState<PostQuotaStatus | null>(null);
  const [isLoadingQuota, setIsLoadingQuota] = useState(true);

  // Form fields
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [depositAmount, setDepositAmount] = useState<string>("2500000");
  const [imageUrls, setImageUrls] = useState<string[]>([
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
  ]);
  const [newImageUrl, setNewImageUrl] = useState("");

  // Submission & validation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Unsaved changes modal state
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuota() {
      try {
        setIsLoadingQuota(true);
        const data = await postService.getQuota();
        setQuota(data);
      } catch (err: any) {
        console.warn("Could not fetch quota from server, using fallback default:", err);
        setQuota({
          isLandlord: false,
          planName: "leasing_agent",
          baseDailyQuota: 3,
          bonusDailyQuota: 0,
          dailyPostQuota: 3,
          freePostsUsedToday: 0,
          freePostsRemainingToday: 3,
          purchasedCreditsAvailable: 0,
          canPublish: true,
        });
      } finally {
        setIsLoadingQuota(false);
      }
    }
    fetchQuota();
  }, []);

  const handleFieldChange = (setter: (val: any) => void, value: any) => {
    setter(value);
    setIsDirty(true);
    setErrorMessage(null);
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setImageUrls([...imageUrls, newImageUrl.trim()]);
    setNewImageUrl("");
    setIsDirty(true);
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const handleCancelClick = () => {
    if (isDirty) {
      setPendingNavigation("/");
      setShowConfirmModal(true);
    } else {
      router.push("/");
    }
  };

  const handleConfirmLeave = () => {
    setShowConfirmModal(false);
    setIsDirty(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
  };

  const handleSubmit = async (e: React.FormEvent, status: "draft" | "posted" = "posted") => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim() || title.trim().length < 5) {
      setErrorMessage("Tiêu đề tin đăng phải có ít nhất 5 ký tự.");
      return;
    }
    if (!content.trim() || content.trim().length < 10) {
      setErrorMessage("Nội dung mô tả chi tiết phải có ít nhất 10 ký tự.");
      return;
    }

    const parsedDeposit = Number(depositAmount);
    if (isNaN(parsedDeposit) || parsedDeposit < 0) {
      setErrorMessage("Số tiền cọc giữ chỗ phải là số và không được nhỏ hơn 0.");
      return;
    }

    try {
      setIsSubmitting(true);
      await postService.createPost({
        title: title.trim(),
        content: content.trim(),
        depositAmount: parsedDeposit,
        imageUrls: imageUrls.filter((url) => url.trim().length > 0),
        status,
      });

      setSuccessToast(
        status === "posted"
          ? "Đăng tin cho thuê thành công lên nền tảng BHRP!"
          : "Đã lưu bản nháp tin đăng thành công!"
      );

      setIsDirty(false);
      setTimeout(() => {
        router.push("/posts/analytics");
      }, 1200);
    } catch (err: any) {
      setErrorMessage(
        err.message || "Đã xảy ra lỗi khi tạo tin đăng. Vui lòng kiểm tra lại lượt đăng tin."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 pt-6 px-4 sm:px-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleCancelClick}
            className="p-2.5 text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer shrink-0"
            title="Quay lại trang chủ"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Đăng tin tìm khách thuê (BHRP)</h1>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full bg-[#FF6B35]/10 text-[#FF6B35]">
                UC-P-01
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Đăng tin cho thuê phòng trực tiếp lên sàn giao dịch BHRP Dormio
            </p>
          </div>
        </div>

        {/* Quota Badge */}
        {!isLoadingQuota && quota && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-[#FF6B35]/10 to-[#2ac1bc]/10 border border-[#FF6B35]/20 rounded-2xl shrink-0">
            <Coins className="w-5 h-5 text-[#FF6B35]" />
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">
                {quota.isLandlord ? `Hạn mức Chủ trọ (${quota.planName})` : "Hạn mức Môi giới (3 tin/ngày)"}
              </div>
              <div className="text-xs font-black text-zinc-900">
                {quota.freePostsRemainingToday > 0 ? (
                  <span className="text-[#2ac1bc]">
                    Còn {quota.freePostsRemainingToday}/{quota.dailyPostQuota} tin miễn phí hôm nay
                  </span>
                ) : quota.purchasedCreditsAvailable > 0 ? (
                  <span className="text-[#FF6B35]">
                    {quota.purchasedCreditsAvailable} lượt trả phí khả dụng
                  </span>
                ) : (
                  <span className="text-rose-500">Hết lượt đăng hôm nay</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Role Announcement Box */}
      <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-100 rounded-3xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600 shrink-0">
          <UserCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-blue-900">
            Đăng tin cho thuê dành cho Nhà môi giới & Chủ trọ
          </h3>
          <p className="text-xs text-blue-700 leading-relaxed">
            Mỗi tài khoản được cấp <strong className="font-bold">3 lượt đăng tin miễn phí mỗi ngày</strong>. Tin đăng của bạn sẽ hiển thị công khai trên cổng tìm phòng BHRP cho hàng nghìn người có nhu cầu thuê tại khu vực.
          </p>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-bold">{successToast}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={(e) => handleSubmit(e, "posted")} className="space-y-6">
        {/* 1. Basic Information */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-xl bg-[#FF6B35]/10 flex items-center justify-center text-[#FF6B35]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">Thông tin cơ bản bài đăng</h2>
              <p className="text-xs text-zinc-400">Tiêu đề hấp dẫn, giá cọc giữ chỗ và thông số phòng</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">
                Tiêu đề tin đăng <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleFieldChange(setTitle, e.target.value)}
                placeholder="VD: Cho thuê phòng Studio cao cấp, Full nội thất, Ban công thoáng Quận 1..."
                className="w-full px-4 py-3 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-colors"
              />
              <span className="text-xs text-zinc-400">Tối thiểu 5 ký tự</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">
                  Số tiền cọc giữ chỗ trực tuyến (VND) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="100000"
                  value={depositAmount}
                  onChange={(e) => handleFieldChange(setDepositAmount, e.target.value)}
                  placeholder="VD: 2500000"
                  className="w-full px-4 py-3 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-colors"
                />
                <span className="text-xs text-zinc-400">
                  Số tiền cọc hiển thị cho khách thuê đặt cọc trực tuyến trên BHRP (UC-PU-04).
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">
                  Loại hình bài đăng
                </label>
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-zinc-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-zinc-700">Tin đăng Sàn giao dịch BHRP</span>
                    <p className="text-[11px] text-zinc-500">Tin đăng trực tuyến mở cho tất cả khách thuê.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Detailed Description */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-xl bg-[#2ac1bc]/10 flex items-center justify-center text-[#2ac1bc]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">Mô tả chi tiết phòng trọ</h2>
              <p className="text-xs text-zinc-400">Mô tả tiện nghi, vị trí, giờ giấc và các dịch vụ đi kèm</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700">
              Nội dung mô tả <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => handleFieldChange(setContent, e.target.value)}
              placeholder="Nhập chi tiết: Phòng mới xây 100%, máy lạnh inverter, tủ lạnh, bếp riêng, máy giặt, thang máy, khoá vân tay an ninh 24/7, giờ giấc tự do không chung chủ..."
              className="w-full px-4 py-3 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-colors leading-relaxed"
            />
            <span className="text-xs text-zinc-400">Tối thiểu 10 ký tự.</span>
          </div>
        </div>

        {/* 3. Photos & Media */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">Hình ảnh phòng trọ</h2>
              <p className="text-xs text-zinc-400">Đăng tải tối đa các góc phòng sáng đẹp để tăng lượt xem</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Dán link ảnh (VD: https://images.unsplash.com/...)"
                className="flex-1 px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Thêm ảnh
              </button>
            </div>

            {imageUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="relative group rounded-2xl overflow-hidden border border-zinc-200 aspect-video bg-zinc-100">
                    <img src={url} alt={`Room photo ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-2 right-2 p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                      title="Xóa ảnh này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Error Alert Message directly above Action Buttons */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-700 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold">Không thể đăng tin</h4>
              <p className="text-xs mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* 4. Action Buttons */}
        <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
          <button
            type="button"
            onClick={handleCancelClick}
            className="px-6 py-3 text-xs font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-2xl transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={(e) => handleSubmit(e, "draft")}
              className="px-5 py-3 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-2xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Lưu bản nháp
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 text-xs font-black text-white bg-[#FF6B35] hover:bg-[#ff5518] rounded-2xl shadow-lg shadow-[#FF6B35]/25 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...
                </>
              ) : (
                <>
                  <Sparkle className="w-4 h-4" /> Đăng tin ngay
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Confirmation Modal when Leaving with Unsaved Changes */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-zinc-200 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-zinc-900">Xác nhận rời khỏi trang</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Bạn có các thông tin tin đăng chưa được lưu. Nếu rời đi bây giờ, các thay đổi sẽ bị mất.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2.5 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer"
              >
                Tiếp tục chỉnh sửa
              </button>
              <button
                type="button"
                onClick={handleConfirmLeave}
                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer"
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
