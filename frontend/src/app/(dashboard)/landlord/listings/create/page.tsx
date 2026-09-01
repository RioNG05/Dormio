"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  UploadCloud,
  ImageIcon,
  Plus,
  Trash2,
  Sparkles,
  AlertCircle,
  Building2,
  Coins,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { postService, PostQuotaStatus } from "@/services/post.service";

export default function CreateListingPage() {
  const router = useRouter();

  // Form states
  const [title, setTitle] = useState("");
  const [roomId, setRoomId] = useState("");
  const [depositAmount, setDepositAmount] = useState<number | string>(3500000);
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
  ]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [status, setStatus] = useState<"posted" | "draft">("posted");

  // UI / Logic states
  const [isDirty, setIsDirty] = useState(false);
  const [isConfirmCloseModalOpen, setIsConfirmCloseModalOpen] = useState(false);
  const [quota, setQuota] = useState<PostQuotaStatus | null>(null);
  const [isLoadingQuota, setIsLoadingQuota] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Load quota status on mount
  useEffect(() => {
    async function fetchQuota() {
      try {
        setIsLoadingQuota(true);
        const data = await postService.getQuota();
        setQuota(data);
      } catch (err: any) {
        console.warn("Could not fetch quota from server, using default quota display:", err);
        // Fallback display
        setQuota({
          planName: "free",
          dailyPostQuota: 1,
          freePostsUsedToday: 0,
          freePostsRemainingToday: 1,
          purchasedCreditsAvailable: 0,
          canPublish: true,
        });
      } finally {
        setIsLoadingQuota(false);
      }
    }
    fetchQuota();
  }, []);

  const handleFieldChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
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

  const handleRemoveImage = (indexToRemove: number) => {
    setImageUrls(imageUrls.filter((_, idx) => idx !== indexToRemove));
    setIsDirty(true);
  };

  const handleCancelClick = () => {
    if (isDirty) {
      setIsConfirmCloseModalOpen(true);
    } else {
      router.push("/landlord/listings");
    }
  };

  const handleSubmit = async (publishStatus: "posted" | "draft") => {
    if (!title.trim()) {
      setErrorMessage("Vui lòng nhập tiêu đề tin đăng (tối thiểu 5 ký tự).");
      return;
    }
    if (title.trim().length < 5) {
      setErrorMessage("Tiêu đề tin đăng phải có ít nhất 5 ký tự.");
      return;
    }
    if (!content.trim() || content.trim().length < 10) {
      setErrorMessage("Nội dung mô tả chi tiết phải có ít nhất 10 ký tự.");
      return;
    }
    if (Number(depositAmount) < 0 || isNaN(Number(depositAmount))) {
      setErrorMessage("Số tiền cọc không hợp lệ.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await postService.createPost({
        title: title.trim(),
        content: content.trim(),
        depositAmount: Number(depositAmount),
        roomId: roomId.trim() || undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        status: publishStatus,
      });

      setSuccessToast(
        publishStatus === "posted"
          ? "Đăng tin cho thuê thành công lên sàn BHRP!"
          : "Đã lưu bản nháp tin đăng thành công!"
      );

      setIsDirty(false);
      setTimeout(() => {
        router.push("/landlord/listings");
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
    <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleCancelClick}
            className="p-2.5 text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
            title="Quay lại danh sách"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Đăng tin tìm khách thuê (UC-P-01)</h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Đăng tin lên nền tảng BHRP để tiếp cận hàng nghìn khách thuê tiềm năng
            </p>
          </div>
        </div>

        {/* Quota Badge */}
        {!isLoadingQuota && quota && (
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-[#FF6B35]/10 to-[#2ac1bc]/10 border border-[#FF6B35]/20 rounded-2xl">
            <Coins className="w-5 h-5 text-[#FF6B35]" />
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Hạn mức đăng tin</div>
              <div className="text-xs font-black text-zinc-900">
                {quota.freePostsRemainingToday > 0 ? (
                  <span className="text-[#2ac1bc]">
                    Còn {quota.freePostsRemainingToday}/{quota.dailyPostQuota} tin miễn phí
                  </span>
                ) : quota.purchasedCreditsAvailable > 0 ? (
                  <span className="text-[#FF6B35]">
                    {quota.purchasedCreditsAvailable} lượt trả phí
                  </span>
                ) : (
                  <span className="text-rose-500">Hết lượt hôm nay</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-bold">{successToast}</span>
        </div>
      )}

      {/* Main Form */}
      <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-8">
        
        {/* 1. Basic Info */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#FF6B35] text-white text-xs font-black">
              1
            </span>
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Thông tin cơ bản</h3>
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
                  Phòng liên kết {quota?.isLandlord ? "(Tùy chọn cho Chủ trọ)" : "(Không áp dụng cho Môi giới)"}
                </label>
                {quota?.isLandlord === false ? (
                  <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-zinc-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-zinc-700">Tài khoản Môi giới (Leasing Agent)</span>
                      <p className="text-[11px] text-zinc-500">Đăng tin cho thuê tổng quan không liên kết phòng cụ thể.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                      <select
                        value={roomId}
                        onChange={(e) => handleFieldChange(setRoomId, e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-colors bg-white appearance-none cursor-pointer"
                      >
                        <option value="">-- Đăng tin chung (không gắn phòng) --</option>
                        <option value="11111111-1111-1111-1111-111111111111">Phòng 101 - Dormio Premier Quận 1</option>
                        <option value="22222222-2222-2222-2222-222222222222">Phòng 201 - Dormio Premier Quận 1</option>
                        <option value="33333333-3333-3333-3333-333333333333">Phòng 301 - Dormio Premier Quận 1 (Duplex)</option>
                      </select>
                    </div>
                    <span className="text-xs text-zinc-400">Nếu chọn phòng, hệ thống sẽ tự động xác thực quyền sở hữu của bạn.</span>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">
                  Số tiền cọc giữ chỗ (VND) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="100000"
                  value={depositAmount}
                  onChange={(e) => handleFieldChange(setDepositAmount, e.target.value)}
                  placeholder="VD: 3500000"
                  className="w-full px-4 py-3 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-colors"
                />
                <span className="text-xs text-zinc-400">
                  Số tiền cọc trực tuyến hiển thị cho khách thuê đặt giữ chỗ trên BHRP (UC-PU-04).
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Detailed Description */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#FF6B35] text-white text-xs font-black">
                2
              </span>
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Mô tả chi tiết</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setContent(
                  `🏠 PHÒNG TRỌ CAO CẤP FULL NỘI THẤT - GIỜ GIẤC TỰ DO\n\n` +
                  `✨ Tiện ích phòng:\n` +
                  `- Máy lạnh Inverter tiết kiệm điện, tủ lạnh 2 cánh, máy nước nóng.\n` +
                  `- Bếp riêng có hút mùi, tủ quần áo âm tường rộng rãi, giường nệm êm ái.\n` +
                  `- Cửa sổ lớn, ban công thoáng mát đón ánh sáng tự nhiên.\n\n` +
                  `🛡️ Tiện ích toà nhà:\n` +
                  `- Khoá cổng vân tay / thẻ từ an ninh 24/7, camera giám sát từng tầng.\n` +
                  `- Khu giặt sấy riêng, nhà xe rộng rãi không lo trầy xước.\n` +
                  `- Vị trí trung tâm thuận tiện di chuyển, gần chợ, siêu thị, trường đại học.\n\n` +
                  `📞 Liên hệ xem phòng ngay hôm nay để nhận ưu đãi!`
                );
                setIsDirty(true);
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-[#FF6B35] hover:text-[#ff5518] transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Dùng mẫu mô tả gợi ý
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700">
              Nội dung bài đăng <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={8}
              value={content}
              onChange={(e) => handleFieldChange(setContent, e.target.value)}
              placeholder="Mô tả chi tiết về không gian phòng, nội thất, tiện ích chung, quy định giờ giấc, chi phí điện nước dịch vụ..."
              className="w-full px-4 py-3 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-colors resize-none leading-relaxed"
            ></textarea>
            <span className="text-xs text-zinc-400">Tối thiểu 10 ký tự</span>
          </div>
        </div>

        {/* 3. Images */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#FF6B35] text-white text-xs font-black">
              3
            </span>
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Hình ảnh phòng & không gian</h3>
          </div>

          {/* Add Image by URL */}
          <div className="flex gap-2">
            <input
              type="url"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Nhập URL hình ảnh (VD: https://images.unsplash.com/...)"
              className="flex-1 px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-colors"
            />
            <button
              type="button"
              onClick={handleAddImage}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Thêm ảnh
            </button>
          </div>

          {/* Image Previews */}
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {imageUrls.map((url, idx) => (
                <div key={idx} className="relative group rounded-2xl overflow-hidden border border-zinc-200 aspect-video bg-zinc-100 shadow-sm">
                  <img
                    src={url}
                    alt={`Listing preview ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-2 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors shadow-lg cursor-pointer"
                      title="Xóa ảnh"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-black/60 backdrop-blur-md text-[10px] font-bold text-white rounded-md">
                    Ảnh {idx + 1}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Upload Placeholder */}
          <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-zinc-50 hover:border-[#FF6B35]/50 transition-colors">
            <UploadCloud className="w-8 h-8 text-zinc-400 mb-2" />
            <span className="text-xs font-bold text-zinc-700">Hình ảnh tối ưu được lưu trữ và tối ưu qua Cloudinary CDN</span>
            <span className="text-[11px] text-zinc-400 mt-1">Đăng tối thiểu 3-5 ảnh rõ nét để tăng 80% tỷ lệ liên hệ từ khách thuê.</span>
          </div>
        </div>

        {/* Error Alert placed directly above the action buttons */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="text-sm font-bold">{errorMessage}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-zinc-100 gap-4">
          <button
            type="button"
            onClick={handleCancelClick}
            className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit("draft")}
              className="flex-1 sm:flex-none px-6 py-3 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Lưu bản nháp
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit("posted")}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 text-sm font-bold text-white bg-[#FF6B35] hover:bg-[#ff5518] rounded-xl shadow-md shadow-[#FF6B35]/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang đăng tin...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Đăng tin ngay
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Confirmation Modal when Closing Unsaved Form */}
      {isConfirmCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-6 border border-zinc-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900">Xác nhận đóng form</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn thoát?</p>
              </div>
            </div>

            <div className="text-xs text-zinc-600 bg-zinc-50 p-4 rounded-2xl leading-relaxed">
              Mọi thông tin tiêu đề, mô tả và hình ảnh bạn vừa nhập sẽ bị hủy nếu bạn đóng form mà không lưu.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmCloseModalOpen(false)}
                className="px-5 py-2.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                Tiếp tục chỉnh sửa
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmCloseModalOpen(false);
                  setIsDirty(false);
                  router.push("/landlord/listings");
                }}
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
