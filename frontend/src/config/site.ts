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
    email: "[EMAIL_ADDRESS]",
    phone: "0859722619",
  }
};

export type SiteConfig = typeof siteConfig;
