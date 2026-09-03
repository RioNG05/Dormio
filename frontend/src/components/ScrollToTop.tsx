"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useTranslations } from "@/context/LanguageContext";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const tCommon = useTranslations("common");

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  const label = tCommon("scrollToTop") || "Cuộn lên đầu trang";

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#2AC1BC] text-white shadow-lg shadow-[#2AC1BC]/30 transition-all hover:-translate-y-1 hover:bg-[#23a8a3] focus:outline-none focus:ring-2 focus:ring-[#2AC1BC] focus:ring-offset-2 cursor-pointer"
      aria-label={label}
      title={label}
    >
      <ArrowUp className="h-6 w-6" />
    </button>
  );
}
