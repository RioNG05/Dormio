"use client";

import React from "react";
import { BookOpen, Video, FileQuestion, MessageCircle } from "lucide-react";
import { useTranslations, useLanguage } from "@/context/LanguageContext";

export default function GuidePage() {
  const t = useTranslations("operations");
  const { locale } = useLanguage();

  const articles = [
    {
      title:
        locale === "en"
          ? "How to create an electronic room rental contract"
          : "Cách tạo hợp đồng thuê phòng điện tử",
      desc:
        locale === "en"
          ? "Step-by-step guide to draft, sign, and securely store digital leases online."
          : "Hướng dẫn các bước để soạn thảo, ký kết và lưu trữ hợp đồng thuê phòng online.",
    },
    {
      title:
        locale === "en"
          ? "Utility meter closing & invoice dispatch workflow"
          : "Quy trình chốt điện nước và xuất hóa đơn",
      desc:
        locale === "en"
          ? "How to record periodic meter readings and automatically send billing notices to tenants."
          : "Cách ghi nhận chỉ số công tơ định kỳ và hệ thống tự động tính tiền gửi hóa đơn cho khách.",
    },
    {
      title:
        locale === "en"
          ? "Role & permission management for property staff"
          : "Phân quyền nhân viên quản lý tòa nhà",
      desc:
        locale === "en"
          ? "Configure accounts for managers and security guards with scoped building access."
          : "Thiết lập tài khoản cho quản lý, bảo vệ và giới hạn tòa nhà họ được phép xem.",
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">{t("guideTitle")}</h1>
        <p className="text-sm text-zinc-500">{t("guideSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 border border-zinc-200 rounded-xl shadow-sm hover:border-[#2AC1BC] transition-colors cursor-pointer group">
          <BookOpen className="w-8 h-8 text-[#2AC1BC] mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-zinc-900 mb-2">{t("docGuide")}</h3>
          <p className="text-sm text-zinc-500">{t("docGuideDesc")}</p>
        </div>
        <div className="bg-white p-6 border border-zinc-200 rounded-xl shadow-sm hover:border-[#FF6B35] transition-colors cursor-pointer group">
          <Video className="w-8 h-8 text-[#FF6B35] mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-zinc-900 mb-2">{t("videoGuide")}</h3>
          <p className="text-sm text-zinc-500">{t("videoGuideDesc")}</p>
        </div>
        <div className="bg-white p-6 border border-zinc-200 rounded-xl shadow-sm hover:border-blue-500 transition-colors cursor-pointer group">
          <FileQuestion className="w-8 h-8 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-zinc-900 mb-2">{t("faq")}</h3>
          <p className="text-sm text-zinc-500">{t("faqDesc")}</p>
        </div>
        <div className="bg-white p-6 border border-zinc-200 rounded-xl shadow-sm hover:border-emerald-500 transition-colors cursor-pointer group">
          <MessageCircle className="w-8 h-8 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-zinc-900 mb-2">{t("chatSupport")}</h3>
          <p className="text-sm text-zinc-500">{t("chatSupportDesc")}</p>
        </div>
      </div>

      <h2 className="text-lg font-bold text-zinc-900 mb-4">
        {t("featuredArticles")}
      </h2>
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm divide-y divide-zinc-200">
        {articles.map((art, idx) => (
          <div key={idx} className="p-4 hover:bg-zinc-50 cursor-pointer transition-colors">
            <h4 className="font-bold text-zinc-900">{art.title}</h4>
            <p className="text-sm text-zinc-500 mt-1">{art.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
