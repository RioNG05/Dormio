"use client";

import { useLanguage, useTranslations } from "@/context/LanguageContext";

interface LanguageSwitcherProps {
  className?: string;
}

export default function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLanguage();
  const t = useTranslations("languageSwitcher");

  const toggleLanguage = () => {
    setLocale(locale === "vi" ? "en" : "vi");
  };

  const isEn = locale === "en";

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      role="switch"
      aria-checked={isEn}
      title={isEn ? t("switchToVi") : t("switchToEn")}
      aria-label={isEn ? t("switchToVi") : t("switchToEn")}
      className={`group relative inline-flex items-center h-7 rounded-full bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200/90 p-0.5 text-xs font-black transition-all cursor-pointer select-none active:scale-95 shadow-2xs ${className}`}
    >
      {/* Sliding background pill */}
      <span
        aria-hidden="true"
        className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full bg-white shadow-xs border border-zinc-200/60 transition-transform duration-200 ease-out ${isEn ? "translate-x-[calc(100%+2px)]" : "translate-x-0"
          }`}
      />

      {/* VI label */}
      <span
        className={`relative z-10 flex items-center justify-center w-6 h-full text-[10px] font-black transition-colors duration-200 ${!isEn ? "text-[#FF6B35]" : "text-zinc-400 group-hover:text-zinc-600"
          }`}
      >
        {t("langVi")}
      </span>

      {/* EN label */}
      <span
        className={`relative z-10 flex items-center justify-center w-6 h-full text-[10px] font-black transition-colors duration-200 ${isEn ? "text-[#FF6B35]" : "text-zinc-400 group-hover:text-zinc-600"
          }`}
      >
        {t("langEn")}
      </span>
    </button>
  );
}
