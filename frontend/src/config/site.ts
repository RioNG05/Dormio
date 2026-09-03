export type SupportedLocale = "vi" | "en";

export const siteConfig = {
  name: "Dormio - Nền tảng Quản lý & Cho thuê Phòng trọ",
  description: "Giải pháp quản lý phòng trọ chuyên nghiệp, tìm phòng nhanh chóng, trải nghiệm mượt mà.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ogImage: "https://dormio.vn/og.jpg",
  links: {
    zalo: "https://zalo.me/dormio",
    facebook: "https://facebook.com/dormio",
  },
  contact: {
    email: "contact@dormio.vn",
    phone: "0859722619",
  },
  locales: {
    vi: {
      name: "Dormio - Nền tảng Quản lý & Cho thuê Phòng trọ",
      description: "Giải pháp quản lý phòng trọ chuyên nghiệp, tìm phòng nhanh chóng, trải nghiệm mượt mà.",
    },
    en: {
      name: "Dormio - Smart Rental & Boarding House Management Platform",
      description: "Comprehensive boarding house management solution, quick room finding, seamless experience.",
    },
  },
};

export function getSiteConfig(locale: SupportedLocale = "vi") {
  const localized = siteConfig.locales[locale] || siteConfig.locales.vi;
  return {
    ...siteConfig,
    name: localized.name,
    description: localized.description,
  };
}

export type SiteConfig = typeof siteConfig;
