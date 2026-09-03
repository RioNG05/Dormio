"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Calendar,
  Clock,
  ChevronRight,
  ArrowLeft,
  Copy,
  Check,
} from "lucide-react";
import { useTranslations, useLanguage } from "@/context/LanguageContext";

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params?.slug || "kinh-nghiem-quan-ly-nha-tro-chong-that-thoat-dien-nuoc";
  const [copied, setCopied] = useState(false);
  const tBlog = useTranslations("blogDetailPage");
  const tNav = useTranslations("nav");
  const { locale } = useLanguage();

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Mock Post Detail
  const post = {
    title:
      locale === "en"
        ? "Secrets to 100% Prevention of Electricity & Water Loss in Boarding Houses with AI OCR"
        : "Bí quyết quản lý nhà trọ chống thất thoát điện nước 100% bằng AI OCR",
    date: locale === "en" ? "August 25, 2026" : "25 Tháng 8, 2026",
    readTime: `6 ${tBlog("readTimePrefix")}`,
    category: locale === "en" ? "Landlord Tips" : "Bí quyết Chủ trọ",
    author: {
      name: "Nguyễn Văn Hùng",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      role: tBlog("authorRole"),
    },
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
    content:
      locale === "en"
        ? `Managing electricity and water consumption meters has always been a painful challenge for boarding house landlords. Discrepancies between total master meters and individual sub-meters, tampering, or transcription mistakes in handwritten logbooks cause landlords to lose 5% to 15% of monthly utility revenue.

In this article, Dormio shares 4 common causes of utility loss and how modern AI OCR meter-reading technology completely resolves them.

---

### 1. Why do boarding houses constantly suffer utility losses?

* **Manual logging mistakes**: At month-end when transcribing 30-50 rooms, misreading digits (e.g., mistaking 3 for 8) occurs frequently.
* **Meter tampering**: Unscrupulous tenants occasionally bypass or restrict water taps so meters fail to spin.
* **Hidden pipe leaks**: Underground pipe leaks or toilet flush overflows waste dozens of cubic meters each month without early notice.

---

### 2. Automated meter closing via AI OCR snapshot

The Dormio platform integrates smart computer vision AI OCR:

1. **Direct camera capture**: Landlords or staff snap a quick photo of the meter dial in the Dormio App.
2. **Instant AI extraction**: The system extracts digits with 100% precision in under 0.5 seconds.
3. **Transparent audit trail**: The meter snapshot is attached directly to the tenant's digital invoice via App/Zalo, eliminating all billing disputes.

---

### 3. Key benefits of digital boarding house transformation

* **Save 90% of admin time**: No more paper logbooks; rates and tiered fees are computed automatically.
* **Smart surge alerts**: If a room's usage surges 3x compared to prior months, the system sends immediate leak warnings.`
        : `Quản lý chỉ số điện nước luôn là bài toán đau đầu đối với các chủ nhà trọ. Tình trạng chênh lệch giữa công tơ tổng và công tơ từng phòng, gian lận chỉ số, hay sai sót khi chép tay bằng sổ sách khiến chủ trọ tổn thất từ 5% - 15% doanh thu hàng tháng.

Trong bài viết này, Dormio chia sẻ 4 nguyên nhân phổ biến gây thất thoát điện nước và cách khắc phục triệt để bằng công nghệ chốt số AI OCR hiện đại.

---

### 1. Tại sao nhà trọ của bạn liên tục bị thất thoát điện nước?

* **Ghi chép thủ công nhầm lẫn**: Vào những ngày cuối tháng khi phải chốt số cho 30-50 phòng, việc nhìn nhầm chữ số (VD: số 3 thành số 8) rất hay xảy ra.
* **Khách thuê gian lận đồng hồ**: Một số cá nhân can thiệp vào công tơ điện hoặc vặn nhỏ vòi nước để đồng hồ không quay.
* **Rò rỉ đường ống nước ngầm**: Rò rỉ bồn cầu, vòi nước hỏng không được phát hiện kịp thời làm thất thoát hàng chục khối nước mỗi tháng.

---

### 2. Giải pháp chốt số tự động qua hình ảnh AI OCR

Nền tảng quản lý nhà trọ **Dormio** tích hợp công nghệ AI OCR nhận diện hình ảnh thông minh:

1. **Chụp ảnh trực tiếp**: Chủ trọ hoặc nhân viên mở App Dormio chụp ảnh mặt đồng hồ điện/nước.
2. **AI tự đọc chỉ số**: Hệ thống tự động trích xuất dãy số chính xác 100% trong 0.5 giây.
3. **Lưu trữ bằng chứng minh bạch**: Hình ảnh đồng hồ được đính kèm trực tiếp vào hóa đơn gửi cho khách thuê qua Zalo/App, loại bỏ hoàn toàn tranh cãi.

---

### 3. Lợi ích khi ứng dụng chuyển đổi số nhà trọ

* **Tiết kiệm 90% thời gian**: Không cần mang sổ sách chép tay, hệ thống tự động nhân đơn giá và tính tiền hóa đơn.
* **Tự động cảnh báo bất thường**: Nếu phòng có lượng tiêu thụ điện/nước tăng đột biến gấp 3 lần so với tháng trước, hệ thống sẽ gửi thông báo cảnh báo rò rỉ.`,
  };

  const relatedPosts = [
    {
      slug: "mau-hop-dong-thue-phong-tro-chuan-phap-ly-2026",
      title:
        locale === "en"
          ? "Standard Boarding House Lease Agreement Template for 2026"
          : "Mẫu hợp đồng thuê phòng trọ chuẩn pháp lý mới nhất năm 2026",
      image:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=600&q=80",
      date: locale === "en" ? "August 20, 2026" : "20 Tháng 8, 2026",
    },
    {
      slug: "gach-no-tu-dong-vietqr-tang-30-percent-dong-tien",
      title:
        locale === "en"
          ? "VietQR 0.5s Automated Reconciliation: Improving Cashflow by 30%"
          : "Ứng dụng VietQR gạch nợ 0.5s giúp chủ trọ thu tiền nhà đúng hạn",
      image:
        "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80",
      date: locale === "en" ? "August 12, 2026" : "12 Tháng 8, 2026",
    },
  ];

  return (
    <div className="bg-zinc-50/50 min-h-screen pb-24">
      {/* Breadcrumb Bar */}
      <div className="bg-white border-b border-zinc-200/80 py-3 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl flex items-center gap-2 text-xs font-semibold text-zinc-500 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-[#2AC1BC]">
            {tNav("home")}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <Link href="/blog" className="hover:text-[#2AC1BC]">
            {tNav("blog")}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="text-[#2AC1BC] line-clamp-1">{post.title}</span>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-8">
        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-[#2AC1BC] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {tBlog("backToBlog")}
        </Link>

        {/* Article Header */}
        <div className="flex flex-col gap-4 mb-8">
          <span className="px-3.5 py-1 rounded-full bg-[#2ac1bc]/10 text-[#2ac1bc] text-xs font-bold w-fit">
            {post.category}
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-zinc-900 leading-tight [text-wrap:balance]">
            {post.title}
          </h1>

          {/* Author Card & Meta */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-b border-zinc-200/80 py-4">
            <div className="flex items-center gap-3">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-10 h-10 rounded-full object-cover border border-zinc-200"
              />
              <div>
                <span className="text-xs font-bold text-zinc-900 block">
                  {post.author.name}
                </span>
                <span className="text-[10px] text-zinc-400 block">
                  {post.author.role}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {post.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {post.readTime}
              </span>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-zinc-700 font-bold hover:bg-zinc-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied ? tBlog("copied") : tBlog("share")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Featured Cover Image */}
        <div className="rounded-3xl overflow-hidden aspect-[16/9] bg-zinc-100 mb-10 shadow-md">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Body Content */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-zinc-200/80 shadow-sm mb-12">
          <div className="prose prose-zinc max-w-none text-xs sm:text-sm text-zinc-700 leading-relaxed whitespace-pre-line font-medium">
            {post.content}
          </div>
        </div>

        {/* RELATED ARTICLES */}
        <div className="pt-8 border-t border-zinc-200">
          <h3 className="text-xl font-bold text-zinc-900 mb-6">
            {tBlog("relatedPosts")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {relatedPosts.map((item, idx) => (
              <Link
                key={idx}
                href={`/blog/${item.slug}`}
                className="group flex items-center gap-4 p-4 rounded-2xl bg-white border border-zinc-200/80 hover:border-[#2ac1bc]/40 hover:shadow-md transition-all"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-zinc-100">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 flex items-center gap-1 mb-1">
                    <Calendar className="w-3 h-3" /> {item.date}
                  </span>
                  <h4 className="text-xs font-bold text-zinc-900 group-hover:text-[#2ac1bc] line-clamp-2 leading-snug">
                    {item.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
