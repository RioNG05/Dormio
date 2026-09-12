"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import viMessages from "@/messages/vi";
import enMessages from "@/messages/en";
import { getStoredLocale, setStoredLocale as persistStoredLocale, type SupportedLocale } from "@/utils";

export type { SupportedLocale };

interface LanguageContextType {
  locale: SupportedLocale;
  currentLocale: SupportedLocale;
  setLocale: (lang: SupportedLocale) => void;
  t: (namespace?: string) => (key: string, values?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const messagesMap: Record<SupportedLocale, any> = {
  vi: viMessages,
  en: enMessages,
};

export type ValidNamespace =
  | "common"
  | "nav"
  | "footer"
  | "auth"
  | "guest"
  | "landlord"
  | "tenant"
  | "employee"
  | "admin";

const legacyNamespaceMap: Record<string, ValidNamespace> = {
  languageSwitcher: "common",
  staffPortal: "employee",
  staff: "employee",
  tenantPortal: "tenant",
  reports: "landlord",
  rooms: "landlord",
  contracts: "landlord",
  invoices: "landlord",
  assets: "landlord",
  expenses: "landlord",
  services: "landlord",
  customers: "landlord",
  deposits: "landlord",
  debts: "landlord",
  reminders: "landlord",
  listings: "landlord",
  workforce: "landlord",
  operations: "landlord",
  landlordDashboard: "landlord",
  landlordRoomDetail: "landlord",
  landlordUpgradeModal: "landlord",
  home: "guest",
  pricingPage: "guest",
  featuresPage: "guest",
  contactPage: "guest",
  blogPage: "guest",
  blogDetailPage: "guest",
  savedPostsPage: "guest",
  roomsPage: "guest",
  roomDetailPage: "guest",
  comparePage: "guest",
  guestMessagesPage: "guest",
  adminDashboard: "admin",
  aiChat: "admin",
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

      // Resolve namespace alias if legacy name was passed
      const resolvedNamespace = namespace
        ? legacyNamespaceMap[namespace] || namespace
        : undefined;

      const scopedMessages = resolvedNamespace ? messages[resolvedNamespace] || {} : messages;
      const scopedFallback = resolvedNamespace ? (fallbackMessages as any)[resolvedNamespace] || {} : fallbackMessages;

      return (key: string, values?: Record<string, any>): string => {
        // 1. Direct match in current namespace
        let text = scopedMessages[key] ?? scopedFallback[key];

        // 2. If not found, try with namespace/submodule prefix
        if (text === undefined && resolvedNamespace) {
          const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
          const prefixedKey = `${resolvedNamespace}${capitalizedKey}`;
          text = scopedMessages[prefixedKey] ?? scopedFallback[prefixedKey];
        }

        // 3. If still not found, search across all namespaces in current locale, then fallback locale
        if (text === undefined) {
          for (const ns of Object.keys(messages)) {
            if (messages[ns] && typeof messages[ns] === "object") {
              if (messages[ns][key] !== undefined) {
                text = messages[ns][key];
                break;
              }
            }
          }
        }
        if (text === undefined) {
          for (const ns of Object.keys(fallbackMessages)) {
            const fallbackNs = (fallbackMessages as any)[ns];
            if (fallbackNs && typeof fallbackNs === "object") {
              if (fallbackNs[key] !== undefined) {
                text = fallbackNs[key];
                break;
              }
            }
          }
        }

        // 4. Default to key if nothing was matched
        if (text === undefined) {
          text = key;
        }

        // 5. Replace placeholders
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
    <LanguageContext.Provider value={{ locale, currentLocale: locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      locale: "vi" as SupportedLocale,
      currentLocale: "vi" as SupportedLocale,
      setLocale: () => {},
      t: (namespace?: string) => (key: string, values?: Record<string, any>) => {
        const resolved = namespace ? legacyNamespaceMap[namespace] || namespace : undefined;
        const scoped = resolved ? (viMessages as any)[resolved] || {} : viMessages;
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
  return useMemo(() => t(namespace), [t, namespace]);
}
