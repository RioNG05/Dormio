"use client";

import { useLanguage } from "@/context/LanguageContext";

interface LanguageSwitcherProps {
  className?: string;
}

export default function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLanguage();

  const toggleLanguage = () => {
    setLocale(locale === "vi" ? "en" : "vi");
  };

  const isVi = locale === "vi";

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      title={isVi ? "Switch to English (EN)" : "Chuyển sang Tiếng Việt (VI)"}
      aria-label={isVi ? "Switch to English (EN)" : "Chuyển sang Tiếng Việt (VI)"}
      className={`inline-flex items-center justify-center h-8 w-9 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-xs font-bold text-zinc-700 hover:text-zinc-900 transition-colors cursor-pointer select-none active:scale-95 ${className}`}
    >
      {isVi ? "VI" : "EN"}
    </button>
  );
}
