"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { NextIntlClientProvider } from "next-intl";
import viMessages from "../../messages/vi";
import enMessages from "../../messages/en";

export type SupportedLocale = "vi" | "en";

interface LanguageContextType {
  locale: SupportedLocale;
  setLocale: (lang: SupportedLocale) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const messagesMap: Record<SupportedLocale, any> = {
  vi: viMessages,
  en: enMessages,
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>("vi");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem("dormio_lang") as SupportedLocale;
    if (savedLang && (savedLang === "vi" || savedLang === "en")) {
      setLocaleState(savedLang);
    }
  }, []);

  const setLocale = (lang: SupportedLocale) => {
    setLocaleState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("dormio_lang", lang);
      document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000`;
    }
  };

  const activeMessages = messagesMap[locale] || viMessages;

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider
        locale={locale}
        messages={activeMessages}
        timeZone="Asia/Ho_Chi_Minh"
        onError={(error) => {
          // Suppress missing message runtime crash overlay in dev
        }}
        getMessageFallback={({ key }) => key}
      >
        {children}
      </NextIntlClientProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
