import React from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export default function ContactPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-zinc-50 py-12 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-5xl">
            Liên hệ với chúng tôi
          </h1>
          <p className="mt-4 text-lg text-zinc-500 max-w-2xl mx-auto">
            Bạn có câu hỏi, góp ý hay cần hỗ trợ? Hãy để lại thông tin, đội ngũ Dormio sẽ phản hồi bạn trong thời gian sớm nhất.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="flex flex-col gap-8">
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-zinc-900 mb-6">Thông tin liên hệ</h2>
              
              <div className="flex flex-col gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">Email</h3>
                    <p className="mt-1 text-zinc-500">{siteConfig.contact.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">Điện thoại</h3>
                    <p className="mt-1 text-zinc-500">{siteConfig.contact.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">Văn phòng</h3>
                    <p className="mt-1 text-zinc-500">
                      Tòa nhà Innovation, Công viên phần mềm Quang Trung, <br />
                      Quận 12, TP. Hồ Chí Minh
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links Box */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-zinc-900 mb-4">Kết nối với Dormio</h2>
              <p className="text-zinc-500 mb-6">Theo dõi chúng tôi trên mạng xã hội để cập nhật những tính năng và ưu đãi mới nhất.</p>
              <div className="flex gap-4">
                <a href={siteConfig.links.facebook} target="_blank" rel="noreferrer" className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-primary hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href={siteConfig.links.zalo} target="_blank" rel="noreferrer" className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-600 hover:bg-primary hover:text-white transition-colors">
                  Zalo
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-zinc-900 mb-6">Gửi tin nhắn</h2>
            <form className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="name" className="text-sm font-semibold text-zinc-700">Họ và tên *</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    className="w-full rounded-lg border border-zinc-200 p-3 text-sm focus:outline-primary focus:border-primary transition-colors"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="contact" className="text-sm font-semibold text-zinc-700">Email hoặc Số điện thoại *</label>
                  <input
                    id="contact"
                    type="text"
                    placeholder="name@example.com"
                    className="w-full rounded-lg border border-zinc-200 p-3 text-sm focus:outline-primary focus:border-primary transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="subject" className="text-sm font-semibold text-zinc-700">Chủ đề *</label>
                <input
                  id="subject"
                  type="text"
                  placeholder="Ví dụ: Cần tư vấn phần mềm quản lý"
                  className="w-full rounded-lg border border-zinc-200 p-3 text-sm focus:outline-primary focus:border-primary transition-colors"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="message" className="text-sm font-semibold text-zinc-700">Nội dung *</label>
                <textarea
                  id="message"
                  rows={5}
                  placeholder="Hãy mô tả chi tiết vấn đề hoặc câu hỏi của bạn..."
                  className="w-full rounded-lg border border-zinc-200 p-3 text-sm focus:outline-primary focus:border-primary transition-colors resize-y"
                  required
                ></textarea>
              </div>

              <Button type="submit" className="w-full sm:w-auto h-12 bg-primary hover:bg-primary-hover text-white px-8 rounded-xl font-semibold mt-2">
                <Send className="mr-2 h-4 w-4" />
                Gửi tin nhắn ngay
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
