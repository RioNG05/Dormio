"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import viMessages from "@/messages/vi";
import enMessages from "@/messages/en";
import { getStoredLocale, setStoredLocale as persistStoredLocale, type SupportedLocale } from "@/utils";

export type { SupportedLocale };

interface LanguageContextType {
  locale: SupportedLocale;
  setLocale: (lang: SupportedLocale) => void;
  t: (namespace?: string) => (key: string, values?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const messagesMap: Record<SupportedLocale, any> = {
  vi: viMessages,
  en: enMessages,
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>("vi");

  useEffect(() => {
    const initial = getStoredLocale();
    setLocaleState(initial);
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.lang = initial;
    }
  }, []);

  const setLocale = (lang: SupportedLocale) => {
    setLocaleState(lang);
    persistStoredLocale(lang);
  };

  const t = useCallback(
    (namespace?: string) => {
      const messages = messagesMap[locale] || viMessages;
      const fallbackMessages = viMessages;
      const scopedMessages = namespace ? messages[namespace] || {} : messages;
      const scopedFallback = namespace ? (fallbackMessages as any)[namespace] || {} : fallbackMessages;

      return (key: string, values?: Record<string, any>): string => {
        let text = scopedMessages[key] ?? scopedFallback[key] ?? key;
        if (typeof text === "string" && values) {
          Object.entries(values).forEach(([k, v]) => {
            text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
          });
        }
        return typeof text === "string" ? text : String(text);
      };
    },
    [locale]
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      locale: "vi" as SupportedLocale,
      setLocale: () => {},
      t: (namespace?: string) => (key: string, values?: Record<string, any>) => {
        const scoped = namespace ? (viMessages as any)[namespace] || {} : viMessages;
        let text = scoped[key] ?? key;
        if (typeof text === "string" && values) {
          Object.entries(values).forEach(([k, v]) => {
            text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
          });
        }
        return text;
      },
    };
  }
  return context;
}

export function useTranslations(namespace?: string) {
  const { t } = useLanguage();
  return t(namespace);
}
