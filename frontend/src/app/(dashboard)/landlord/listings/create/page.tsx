"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  X,
  Wand2,
  Tag,
  Compass,
  DollarSign,
  Layers,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import {
  postService,
  PostQuotaStatus,
  AiPostDraftResponse,
} from "@/services/post.service";
import { useAuth } from "@/context/AuthContext";
import { getRooms, type RoomItem } from "@/services/room.service";
import { getMyBoardingHouses } from "@/services/boarding-house.service";
import { formatCurrency } from "@/utils";

function CreateListingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { buildings: authBuildings, activeBuildingId } = useAuth();

  const queryRoomId = searchParams.get("roomId");
  const queryAiDraft = searchParams.get("aiDraft");

  // Form states (Zero mockups)
  const [title, setTitle] = useState("");
  const [roomId, setRoomId] = useState(queryRoomId || "");
  const [depositAmount, setDepositAmount] = useState<number | string>(3000000);
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  // Boarding House & Rooms states
  const [landlordBuildings, setLandlordBuildings] = useState<any[]>(authBuildings || []);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // UI / Logic states
  const [isDirty, setIsDirty] = useState(false);
  const [isConfirmCloseModalOpen, setIsConfirmCloseModalOpen] = useState(false);
  const [quota, setQuota] = useState<PostQuotaStatus | null>(null);
  const [isLoadingQuota, setIsLoadingQuota] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // AI Rental Post Suggestions State (UC-L-12)
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTone, setAiTone] = useState<"professional" | "youthful" | "budget">("professional");
  const [aiCustomNotes, setAiCustomNotes] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiDraftResult, setAiDraftResult] = useState<AiPostDraftResponse | null>(null);
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);

  // Load quota status on mount
  useEffect(() => {
    async function fetchQuota() {
      try {
        setIsLoadingQuota(true);
        const data = await postService.getQuota();
        setQuota(data);
      } catch (err: any) {
        console.warn("Could not fetch quota from server, using default quota display:", err);
        setQuota({
          isLandlord: true,
          planName: "free",
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

  // Sync landlord boarding houses
  useEffect(() => {
    if (authBuildings && authBuildings.length > 0) {
      setLandlordBuildings(authBuildings);
      if (!selectedBuildingId) {
        setSelectedBuildingId(activeBuildingId || authBuildings[0].id);
      }
    } else {
      getMyBoardingHouses({ silent: true })
        .then((data) => {
          if (data && data.length > 0) {
            setLandlordBuildings(data);
            if (!selectedBuildingId) {
              setSelectedBuildingId(activeBuildingId || data[0].id);
            }
          }
        })
        .catch((err) => {
          console.warn("Could not load boarding houses:", err);
        });
    }
  }, [authBuildings, activeBuildingId, selectedBuildingId]);

  // Fetch real rooms of selected boarding house from backend API
  useEffect(() => {
    if (!selectedBuildingId) {
      setRooms([]);
      return;
    }

    let isMounted = true;
    setIsLoadingRooms(true);

    getRooms(selectedBuildingId, { limit: 100 })
      .then((res) => {
        if (!isMounted) return;
        const fetchedRooms = res?.data || [];
        setRooms(fetchedRooms);

        // If queryRoomId matches a room, pre-select it
        if (queryRoomId && fetchedRooms.some((r) => r.id === queryRoomId)) {
          setRoomId(queryRoomId);
          if (queryAiDraft === "true") {
            setIsAiModalOpen(true);
          }
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch rooms for house:", err);
        if (isMounted) {
          setRooms([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingRooms(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBuildingId, queryRoomId, queryAiDraft]);

  const handleBuildingChange = (bId: string) => {
    setSelectedBuildingId(bId);
    setRoomId("");
    setIsDirty(true);
  };

  const handleRoomChange = (rId: string) => {
    setRoomId(rId);
    setIsDirty(true);
    setErrorMessage(null);

    // Smart pre-fill: if user selects a room and title is empty
    if (rId) {
      const room = rooms.find((r) => r.id === rId);
      const house = landlordBuildings.find((b) => b.id === selectedBuildingId);
      if (room && (!title.trim() || title.startsWith("Cho thuê phòng"))) {
        setTitle(
          `Cho thuê phòng ${room.roomNumber} - ${house?.name || "Khu trọ"}`
        );
      }
    }
  };

  const selectedRoom = rooms.find((r) => r.id === roomId);

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

  // AI Post Draft Generation (UC-L-12)
  const handleOpenAiModal = () => {
    if (!roomId) {
      setErrorMessage("Vui lòng chọn một phòng cụ thể trước khi dùng Trợ lý AI.");
      return;
    }
    setAiErrorMessage(null);
    setIsAiModalOpen(true);
  };

  const handleGenerateAi = async () => {
    if (!roomId) {
      setAiErrorMessage("Vui lòng chọn phòng để AI trích xuất thông số thực tế.");
      return;
    }

    try {
      setIsGeneratingAi(true);
      setAiErrorMessage(null);
      const draft = await postService.generateAiDraft({
        roomId,
        tone: aiTone,
        customNotes: aiCustomNotes.trim() || undefined,
      });
      setAiDraftResult(draft);
    } catch (err: any) {
      setAiErrorMessage(err?.message || "Lỗi khi khởi tạo gợi ý tin đăng từ AI.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleApplyAiDraft = () => {
    if (!aiDraftResult) return;

    setTitle(aiDraftResult.title);
    setContent(aiDraftResult.content);
    setDepositAmount(aiDraftResult.depositAmount);

    if (aiDraftResult.imageUrls && aiDraftResult.imageUrls.length > 0) {
      const merged = Array.from(new Set([...imageUrls, ...aiDraftResult.imageUrls]));
      setImageUrls(merged);
    }

    setIsDirty(true);
    setIsAiModalOpen(false);
    setSuccessToast("Đã áp dụng bản nháp gợi ý từ AI vào biểu mẫu tin đăng!");
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleSubmit = async (publishStatus: "posted" | "draft") => {
    if (isSubmitting) return;

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

    if (
      publishStatus === "posted" &&
      quota &&
      quota.freePostsRemainingToday <= 0 &&
      quota.purchasedCreditsAvailable <= 0
    ) {
      setErrorMessage(
        "Bạn đã dùng hết hạn mức đăng tin miễn phí hôm nay. Vui lòng chọn 'Lưu bản nháp' hoặc nâng cấp gói thành viên để xuất bản lên sàn."
      );
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

      // Refresh quota in background
      postService.getQuota().then(setQuota).catch(() => {});

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

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="text-sm font-bold">{errorMessage}</span>
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
                placeholder="VD: Cho thuê phòng Studio cao cấp, Full nội thất, Ban công thoáng Cầu Giấy..."
                className="w-full px-4 py-3 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-colors"
              />
              <span className="text-xs text-zinc-400">Tối thiểu 5 ký tự</span>
            </div>

            <div className="space-y-6">
              {/* Boarding House and Linked Room selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-zinc-50/70 rounded-2xl border border-zinc-200/80">
                {/* Select Boarding House */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#2AC1BC]" />
                    Tòa nhà / Nhà trọ
                  </label>

                  {landlordBuildings.length === 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                      Chưa có nhà trọ nào.{" "}
                      <Link href="/landlord/setup" className="underline font-bold">
                        Tạo nhà trọ mới
                      </Link>
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={selectedBuildingId}
                        onChange={(e) => handleBuildingChange(e.target.value)}
                        className="w-full px-4 py-3 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-colors bg-white cursor-pointer"
                      >
                        {landlordBuildings.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} {b.address ? `(${b.address})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <span className="text-xs text-zinc-400">
                    Chọn nhà trọ sở hữu để hiển thị các phòng khả dụng.
                  </span>
                </div>

                {/* Select Room */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-zinc-700">
                      Phòng liên kết
                    </label>
                    {isLoadingRooms && (
                      <span className="text-xs text-[#2AC1BC] flex items-center gap-1 font-semibold">
                        <Loader2 className="w-3 h-3 animate-spin" /> Đang tải phòng...
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <select
                      value={roomId}
                      onChange={(e) => handleRoomChange(e.target.value)}
                      disabled={isLoadingRooms || !selectedBuildingId}
                      className="w-full px-4 py-3 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-colors bg-white cursor-pointer disabled:opacity-50"
                    >
                      <option value="">-- Đăng tin chung (không gắn phòng) --</option>
                      {rooms.map((room) => {
                        const typeName = room.roomType?.name || "Tiêu chuẩn";
                        const areaStr = room.area ? ` • ${room.area}m²` : "";
                        const statusMap: Record<string, string> = {
                          available: "Trống",
                          deposited: "Đã cọc",
                          occupied: "Đang thuê",
                          maintainace: "Bảo trì",
                        };
                        const statusLabel = statusMap[room.status] || room.status;

                        return (
                          <option key={room.id} value={room.id}>
                            Phòng {room.roomNumber} (Tầng {room.floor}) - {typeName}{areaStr} [{statusLabel}]
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {rooms.length === 0 && !isLoadingRooms && selectedBuildingId && (
                    <span className="text-xs text-amber-600 block">
                      Tòa nhà này hiện chưa có phòng nào.{" "}
                      <Link href="/landlord/rooms" className="underline font-bold">
                        Thêm phòng ngay
                      </Link>
                    </span>
                  )}

                  {selectedRoom && (
                    <div className="p-3 bg-white border border-zinc-200 rounded-xl text-xs space-y-1 mt-2 shadow-xs animate-in fade-in duration-200">
                      <div className="flex justify-between font-bold text-zinc-800">
                        <span>Phòng {selectedRoom.roomNumber}</span>
                        <span className="text-[#2AC1BC] font-extrabold">
                          {selectedRoom.roomType?.name || "Tiêu chuẩn"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-zinc-500 text-[11px]">
                        <span>Tầng: {selectedRoom.floor}</span>
                        {selectedRoom.area && <span>Diện tích: {selectedRoom.area} m²</span>}
                        {selectedRoom.maxOccupants && <span>Sức chứa: {selectedRoom.maxOccupants} người</span>}
                      </div>
                    </div>
                  )}

                  <span className="text-xs text-zinc-400 block">
                    Liên kết phòng giúp kích hoạt Trợ lý AI (UC-L-12) tự động trích xuất tiện nghi và vị trí.
                  </span>
                </div>
              </div>

              {/* Deposit Amount */}
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
                  Số tiền cọc trực tuyến hiển thị cho khách thuê đặt giữ chỗ trên sàn BHRP (UC-PU-04).
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Detailed Description with UC-L-12 AI Assistant */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#FF6B35] text-white text-xs font-black">
                2
              </span>
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Mô tả chi tiết</h3>
            </div>

            {/* UC-L-12 AI Suggestion Trigger Button */}
            <button
              type="button"
              onClick={handleOpenAiModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-linear-to-r from-teal-600 to-[#2AC1BC] hover:opacity-95 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Gợi ý tin đăng bằng AI (UC-L-12)</span>
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700">
              Nội dung bài đăng <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={9}
              value={content}
              onChange={(e) => handleFieldChange(setContent, e.target.value)}
              placeholder="Mô tả chi tiết về không gian phòng, nội thất, tiện ích chung, quy định giờ giấc, chi phí điện nước dịch vụ... Bạn có thể bấm nút 'Gợi ý tin đăng bằng AI' phía trên để tạo nội dung tự động."
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
              placeholder="Nhập URL hình ảnh (VD: https://...)"
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
          {imageUrls.length > 0 ? (
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
                      className="p-2 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors shadow-md cursor-pointer"
                      title="Xóa ảnh này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 border-2 border-dashed border-zinc-200 rounded-2xl text-center space-y-2">
              <ImageIcon className="w-8 h-8 text-zinc-300 mx-auto" />
              <p className="text-xs font-semibold text-zinc-500">Chưa có ảnh nào được thêm</p>
              <p className="text-[11px] text-zinc-400">Bạn có thể nhập URL ảnh ở trên hoặc dùng gợi ý AI để tự động chèn ảnh phòng.</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-100">
          <button
            type="button"
            onClick={handleCancelClick}
            disabled={isSubmitting}
            className="px-6 py-3 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={() => handleSubmit("draft")}
            disabled={isSubmitting}
            className="px-6 py-3 text-xs font-bold text-zinc-900 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Lưu bản nháp
          </button>
          <button
            type="button"
            onClick={() => handleSubmit("posted")}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3 text-xs font-bold text-white bg-linear-to-r from-[#FF6B35] to-orange-600 hover:opacity-95 rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Đăng tin ngay (BHRP)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* UC-L-12: AI RENTAL POST DRAFT ASSISTANT MODAL                              */}
      {/* ========================================================================= */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-zinc-200 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#2AC1BC] to-teal-700 text-white flex items-center justify-center shadow-sm">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                    <span>Trợ lý AI soạn tin đăng (UC-L-12)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#2AC1BC]/15 text-[#138e89]">
                      Plus Tier
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500">Tự động tạo tiêu đề, mô tả và chính sách cọc dựa trên thông số phòng thực tế</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5">
              {/* Selected Room Context Banner */}
              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-teal-950">
                    Phòng đang chọn: P.{selectedRoom?.roomNumber || "Chưa chọn"} (Tầng {selectedRoom?.floor || 1})
                  </div>
                  <div className="text-teal-800">
                    Loại phòng: {selectedRoom?.roomType?.name || "Tiêu chuẩn"} • Diện tích: {selectedRoom?.area || "25"} m²
                  </div>
                  <div className="text-teal-700 text-[11px]">
                    Cơ sở: {landlordBuildings.find((b) => b.id === selectedBuildingId)?.name || "Nhà trọ"}
                  </div>
                </div>
                <span className="px-2 py-1 rounded-lg bg-teal-200/80 text-teal-900 font-extrabold text-[10px]">
                  Dữ liệu BHMS
                </span>
              </div>

              {/* Controls: Tone & Custom Highlights */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-700 block">
                    Phong cách bài viết (Tone of Voice):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: "professional", label: "Chuyên nghiệp", desc: "Trang trọng, đầy đủ, tin cậy", icon: "👔" },
                      { id: "youthful", label: "Sinh viên / Trẻ", desc: "Thân thiện, tự do, sôi nổi", icon: "🎒" },
                      { id: "budget", label: "Tiết kiệm / Giá tốt", desc: "Tối ưu chi phí, minh bạch", icon: "💰" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setAiTone(t.id as any)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          aiTone === t.id
                            ? "bg-[#2AC1BC]/10 border-[#2AC1BC] text-[#138e89] shadow-xs"
                            : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                        }`}
                      >
                        <div className="text-sm font-bold flex items-center gap-1.5">
                          <span>{t.icon}</span>
                          <span>{t.label}</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-1">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 block">
                    Ghi chú điểm nổi bật riêng (Tùy chọn):
                  </label>
                  <input
                    type="text"
                    value={aiCustomNotes}
                    onChange={(e) => setAiCustomNotes(e.target.value)}
                    placeholder="VD: Miễn phí tiền wifi tháng đầu, gần trạm xe buýt và trường ĐH Quốc Gia..."
                    className="w-full px-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>

                {aiErrorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{aiErrorMessage}</span>
                  </div>
                )}

                {/* Generate Button */}
                <button
                  type="button"
                  disabled={isGeneratingAi}
                  onClick={handleGenerateAi}
                  className="w-full py-3 bg-linear-to-r from-teal-600 to-[#2AC1BC] hover:opacity-95 text-white text-xs font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isGeneratingAi ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang trích xuất dữ liệu và soạn thảo tin đăng...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>{aiDraftResult ? "Tạo lại bản nháp khác" : "Bắt đầu tạo bản nháp bằng AI"}</span>
                    </>
                  )}
                </button>
              </div>

              {/* AI Draft Result Preview */}
              {aiDraftResult && (
                <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50/70 space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
                    <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Bản nháp AI đề xuất
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Phiên #{aiDraftResult.conversationId.slice(0, 8)}
                    </span>
                  </div>

                  {/* Suggested Title */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Tiêu đề:</span>
                    <div className="text-xs font-bold text-zinc-900 p-2.5 bg-white rounded-xl border border-zinc-200">
                      {aiDraftResult.title}
                    </div>
                  </div>

                  {/* Suggested Badges */}
                  {aiDraftResult.highlights.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Điểm nhấn:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {aiDraftResult.highlights.map((h, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-zinc-700 border border-zinc-200">
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Deposit */}
                  <div className="flex items-center justify-between text-xs p-2.5 bg-white rounded-xl border border-zinc-200">
                    <span className="font-bold text-zinc-600">Tiền cọc giữ chỗ đề xuất:</span>
                    <span className="font-extrabold text-[#2AC1BC]">
                      {formatCurrency(aiDraftResult.depositAmount)}
                    </span>
                  </div>

                  {/* Suggested Content Preview */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Nội dung chi tiết:</span>
                    <div className="text-xs text-zinc-700 p-3 bg-white rounded-xl border border-zinc-200 max-h-56 overflow-y-auto whitespace-pre-line leading-relaxed font-sans">
                      {aiDraftResult.content}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-zinc-100 flex items-center justify-end gap-2.5 bg-zinc-50/50">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all cursor-pointer"
              >
                Đóng
              </button>
              {aiDraftResult && (
                <button
                  type="button"
                  onClick={handleApplyAiDraft}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#2AC1BC] hover:bg-[#23a5a0] rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Áp dụng vào tin đăng</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal when Closing Unsaved Form (Rule #10) */}
      {isConfirmCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
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

export default function CreateListingPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-zinc-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2AC1BC]" />
          <p className="text-xs font-semibold">Đang tải biểu mẫu tin đăng...</p>
        </div>
      }
    >
      <CreateListingForm />
    </Suspense>
  );
}
