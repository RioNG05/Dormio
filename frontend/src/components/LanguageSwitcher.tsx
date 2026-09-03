"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";

interface LanguageSwitcherProps {
  className?: string;
}

export default function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      role="group"
      aria-label={locale === "vi" ? "Chọn ngôn ngữ" : "Select language"}
      className={`inline-flex items-center gap-1.5 text-xs select-none ${className}`}
    >
      <button
        type="button"
        onClick={() => setLocale("vi")}
        aria-pressed={locale === "vi"}
        title="Chuyển sang Tiếng Việt"
        className={`px-1 py-0.5 transition-all cursor-pointer rounded ${
          locale === "vi"
            ? "font-black text-[#FF6B35]"
            : "font-semibold text-zinc-400 hover:text-zinc-700"
        }`}
        aria-label="Tiếng Việt"
      >
        VN
      </button>

      <span className="text-zinc-300 font-normal select-none">|</span>

      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        title="Switch to English"
        className={`px-1 py-0.5 transition-all cursor-pointer rounded ${
          locale === "en"
            ? "font-black text-[#FF6B35]"
            : "font-semibold text-zinc-400 hover:text-zinc-700"
        }`}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}
