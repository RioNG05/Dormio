import React from "react";
import { BookOpen, Video, FileQuestion, MessageCircle } from "lucide-react";

export default function GuidePage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Trung tâm trợ giúp</h1>
        <p className="text-sm text-zinc-500">Tài liệu hướng dẫn sử dụng và hỗ trợ từ đội ngũ Dormio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 border border-zinc-200 rounded-xl shadow-sm hover:border-primary transition-colors cursor-pointer group">
          <BookOpen className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-zinc-900 mb-2">Tài liệu HDSD</h3>
          <p className="text-sm text-zinc-500">Đọc các bài viết hướng dẫn chi tiết từng tính năng.</p>
        </div>
        <div className="bg-white p-6 border border-zinc-200 rounded-xl shadow-sm hover:border-accent transition-colors cursor-pointer group">
          <Video className="w-8 h-8 text-accent mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-zinc-900 mb-2">Video hướng dẫn</h3>
          <p className="text-sm text-zinc-500">Xem video thao tác trực quan trên hệ thống.</p>
        </div>
        <div className="bg-white p-6 border border-zinc-200 rounded-xl shadow-sm hover:border-blue-500 transition-colors cursor-pointer group">
          <FileQuestion className="w-8 h-8 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-zinc-900 mb-2">Câu hỏi thường gặp</h3>
          <p className="text-sm text-zinc-500">Giải đáp các thắc mắc phổ biến của chủ nhà trọ.</p>
        </div>
        <div className="bg-white p-6 border border-zinc-200 rounded-xl shadow-sm hover:border-green-500 transition-colors cursor-pointer group">
          <MessageCircle className="w-8 h-8 text-green-500 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-zinc-900 mb-2">Chat với CSKH</h3>
          <p className="text-sm text-zinc-500">Liên hệ trực tiếp với nhân viên hỗ trợ 24/7.</p>
        </div>
      </div>

      <h2 className="text-lg font-bold text-zinc-900 mb-4">Các bài viết nổi bật</h2>
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm divide-y divide-zinc-200">
        <div className="p-4 hover:bg-zinc-50 cursor-pointer">
          <h4 className="font-bold text-zinc-900">Cách tạo hợp đồng thuê phòng điện tử</h4>
          <p className="text-sm text-zinc-500 mt-1">Hướng dẫn các bước để soạn thảo, ký kết và lưu trữ hợp đồng thuê phòng online.</p>
        </div>
        <div className="p-4 hover:bg-zinc-50 cursor-pointer">
          <h4 className="font-bold text-zinc-900">Quy trình chốt điện nước và xuất hóa đơn</h4>
          <p className="text-sm text-zinc-500 mt-1">Cách ghi nhận chỉ số công tơ định kỳ và hệ thống tự động tính tiền gửi hóa đơn cho khách.</p>
        </div>
        <div className="p-4 hover:bg-zinc-50 cursor-pointer">
          <h4 className="font-bold text-zinc-900">Phân quyền nhân viên quản lý tòa nhà</h4>
          <p className="text-sm text-zinc-500 mt-1">Thiết lập tài khoản cho quản lý, bảo vệ và giới hạn tòa nhà họ được phép xem.</p>
        </div>
      </div>
    </div>
  );
}
