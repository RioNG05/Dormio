import React from "react";
import { Clock, Download } from "lucide-react";

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Bảng chấm công</h1>
          <p className="text-sm text-zinc-500">Theo dõi giờ làm và số công của nhân viên</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 shadow-sm">
          <Download className="w-4 h-4" /> Xuất bảng công
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6 text-center text-zinc-500 py-20 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-zinc-300" />
        </div>
        <h3 className="text-lg font-bold text-zinc-900 mb-2">Chưa có dữ liệu chấm công</h3>
        <p className="max-w-md mx-auto mb-6">Dữ liệu chấm công sẽ được tổng hợp khi nhân viên bắt đầu thực hiện check-in/check-out ca làm việc trên hệ thống.</p>
      </div>
    </div>
  );
}
