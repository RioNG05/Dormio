import { useLanguage } from "@/context/LanguageContext";
import {
  formatCurrency,
  formatDate,
  localizeDbEnum,
  type dbEnumTranslations,
  type SupportedLocale,
} from "@/utils";

export { useDebounce } from "./use-debounce";

/**
 * Hook to directly obtain current active locale ("vi" | "en")
 */
export function useActiveLocale(): SupportedLocale {
  const { locale } = useLanguage();
  return locale;
}

/**
 * Hook providing locale-bound currency and date formatters
 */
export function useFormatters() {
  const { locale } = useLanguage();

  return {
    formatCurrency: (amount: number | string) => formatCurrency(amount, locale),
    formatDate: (dateInput: string | Date) => formatDate(dateInput, locale),
    locale,
  };
}

/**
 * Hook to translate database enums according to active locale
 */
export function useLocalizedEnum() {
  const { locale } = useLanguage();

  return (category: keyof typeof dbEnumTranslations, code: string) =>
    localizeDbEnum(category, code, locale);
}
