"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLanguage, SupportedLocale } from "@/context/LanguageContext";
import { Globe, ChevronDown, Check } from "lucide-react";

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languages: { code: SupportedLocale; shortLabel: string; fullLabel: string; flag: string }[] = [
    { code: "vi", shortLabel: "VIE", fullLabel: "Tiếng Việt", flag: "🇻🇳" },
    { code: "en", shortLabel: "ENG", fullLabel: "English", flag: "🇬🇧" },
  ];

  const currentLang = languages.find((l) => l.code === locale) || languages[0];

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-black text-zinc-800 bg-white/90 hover:bg-white hover:border-[#2AC1BC]/50 rounded-full border border-zinc-200/90 shadow-2xs hover:shadow-md hover:shadow-[#2AC1BC]/10 transition-all cursor-pointer group"
        aria-label="Switch Language"
      >
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-100 border border-zinc-200 text-xs shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
          {currentLang.flag}
        </span>
        <span className="uppercase text-[11px] font-black tracking-wider text-zinc-800 group-hover:text-[#2AC1BC] transition-colors">
          {currentLang.shortLabel}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-[#2AC1BC] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white p-2 shadow-2xl border border-zinc-200/90 z-50 animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5">
          <div className="px-3 py-1.5 border-b border-zinc-100 mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase text-zinc-400 tracking-wider">
            <Globe className="w-3 h-3 text-[#2AC1BC]" />
            <span>Ngôn ngữ / Language</span>
          </div>

          <div className="space-y-1">
            {languages.map((lang) => {
              const isSelected = locale === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLocale(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#2AC1BC]/10 text-[#0d6e6b] font-extrabold"
                      : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <span>{lang.fullLabel}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#2AC1BC] stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
