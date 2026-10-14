export const siteConfig = {
  name: 'Dormio - Hệ thống Quản lý Nhà trọ Thông minh',
  description:
    'Giải pháp chuyển đổi số toàn diện cho chủ trọ: quản lý phòng, hợp đồng điện tử, hóa đơn VietQR gạch nợ tự động.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ogImage: 'https://dormio.vn/og.jpg',
  links: {
    zalo: 'https://zalo.me/dormio',
    facebook: 'https://facebook.com/dormio',
  },
  contact: {
    email: 'contact@dormio.site',
    phone: '0859722619',
  },
}

export type SiteConfig = typeof siteConfig
