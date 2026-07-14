import React from "react";
import { Building, CreditCard, Clock, AlertTriangle, MessageSquare, Wrench, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TenantDashboardPage() {
  const bills = [
    { type: "Tiền phòng & Dịch vụ", period: "Tháng 07/2026", amount: 4500000, status: "unpaid", dueDate: "05/07/2026" },
    { type: "Tiền điện nước", period: "Tháng 06/2026", amount: 650000, status: "paid", dueDate: "05/07/2026" },
  ];

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Cổng thông tin khách thuê</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Tra cứu hoá đơn, thanh toán và gửi yêu cầu hỗ trợ đến chủ nhà.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Room Info & Quick actions */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Room Info */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8 z-0"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary"><Building className="w-6 h-6" /></div>
                <div>
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Phòng của bạn</h2>
                  <div className="text-2xl font-extrabold text-zinc-900">Phòng 101</div>
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-zinc-100">
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500">Khu trọ</span>
                  <span className="text-sm font-semibold text-zinc-900">Khu trọ cao cấp An Bình</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500">Chủ nhà</span>
                  <span className="text-sm font-semibold text-zinc-900">Nguyễn Văn Rio (0901.234.567)</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500">Thời hạn hợp đồng</span>
                  <span className="text-sm font-semibold text-zinc-900">01/01/2026 - 31/12/2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Support */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-zinc-900 mb-4">Hỗ trợ & Yêu cầu</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-50 border border-zinc-100 hover:border-primary/50 hover:bg-primary/5 transition-colors gap-2 text-zinc-700 hover:text-primary">
                <Wrench className="w-5 h-5" />
                <span className="text-xs font-semibold">Báo sửa chữa</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-50 border border-zinc-100 hover:border-primary/50 hover:bg-primary/5 transition-colors gap-2 text-zinc-700 hover:text-primary">
                <MessageSquare className="w-5 h-5" />
                <span className="text-xs font-semibold">Nhắn chủ nhà</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Invoices */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" /> Hoá đơn cần thanh toán
              </h2>
            </div>
            <div className="flex flex-col gap-4">
              {bills.map((bill, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border transition-all ${bill.status === 'unpaid' ? 'bg-white border-amber-200 shadow-md' : 'bg-zinc-50 border-zinc-100 opacity-70'}`}
                >
                  <div className="flex items-start gap-4 mb-4 sm:mb-0">
                    <div className={`p-3 rounded-full shrink-0 ${bill.status === 'unpaid' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {bill.status === 'unpaid' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-bold text-zinc-900 text-base">{bill.type}</div>
                      <div className="text-sm text-zinc-500 mt-0.5">{bill.period}</div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-2">
                        <Clock className="w-3.5 h-3.5" /> Hạn thanh toán: {bill.dueDate}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:items-end gap-3 sm:pl-4 sm:border-l border-zinc-100">
                    <div className="text-xl font-extrabold text-zinc-900">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(bill.amount)}
                    </div>
                    {bill.status === "unpaid" ? (
                      <Button className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white h-9 rounded-lg shadow-sm text-sm">
                        Thanh toán ngay
                      </Button>
                    ) : (
                      <span className="inline-flex items-center justify-center rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                        Đã thanh toán
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
