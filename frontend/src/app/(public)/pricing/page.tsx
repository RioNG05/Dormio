import React from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
  const plans = [
    {
      name: "Miễn phí",
      price: "0đ",
      duration: "mãi mãi",
      description: "Dành cho cá nhân có ít phòng trọ, nhu cầu quản lý cơ bản.",
      features: [
        "Quản lý tối đa 1 nhà trọ",
        "Tối đa 5 phòng",
        "Đăng 1 tin cho thuê/tháng",
        "Hỗ trợ qua email",
      ],
      notIncluded: ["Quản lý hóa đơn tự động", "Báo cáo doanh thu", "Quản lý nhân viên"],
      cta: "Bắt Đầu Ngay",
      popular: false,
    },
    {
      name: "Chuyên Nghiệp",
      price: "199.000đ",
      duration: "/tháng",
      description: "Giải pháp hoàn hảo cho chủ trọ quy mô vừa và nhỏ.",
      features: [
        "Quản lý tối đa 5 nhà trọ",
        "Tối đa 50 phòng",
        "Đăng tin không giới hạn",
        "Quản lý hóa đơn tự động",
        "Hỗ trợ ưu tiên qua Zalo/Email",
      ],
      notIncluded: ["Báo cáo doanh thu chuyên sâu", "Quản lý nhân viên"],
      cta: "Chọn Gói Này",
      popular: true,
    },
    {
      name: "Doanh Nghiệp",
      price: "499.000đ",
      duration: "/tháng",
      description: "Quản lý chuỗi trọ số lượng lớn với các tính năng cao cấp.",
      features: [
        "Không giới hạn nhà trọ",
        "Không giới hạn số phòng",
        "Tính năng tự động hóa 100%",
        "Báo cáo doanh thu chuyên sâu",
        "Quản lý nhân viên, phân quyền",
        "Hỗ trợ 24/7 chuyên biệt",
      ],
      notIncluded: [],
      cta: "Liên Hệ Đăng Ký",
      popular: false,
    },
  ];

  return (
    <div className="py-20 bg-zinc-50 dark:bg-zinc-950 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50 mb-4">
            Bảng Giá Dịch Vụ
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400">
            Lựa chọn gói dịch vụ phù hợp nhất với quy mô quản lý của bạn. Nâng cấp bất cứ lúc nào khi kinh doanh mở rộng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {plans.map((plan, idx) => (
            <div 
              key={idx} 
              className={`relative flex flex-col p-8 rounded-3xl bg-white dark:bg-zinc-900 border transition-all duration-300
                ${plan.popular 
                  ? 'border-primary shadow-2xl shadow-primary/20 scale-105 z-10' 
                  : 'border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl'
                }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-primary text-white text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full">
                    Phổ Biến Nhất
                  </span>
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{plan.name}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 min-h-[40px]">{plan.description}</p>
              </div>
              
              <div className="mb-8 flex items-end gap-1">
                <span className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-50">{plan.price}</span>
                <span className="text-zinc-500 dark:text-zinc-400 font-medium mb-1">{plan.duration}</span>
              </div>
              
              <ul className="flex-1 space-y-4 mb-8">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-zinc-600 dark:text-zinc-300">{feat}</span>
                  </li>
                ))}
                {plan.notIncluded.map((feat, i) => (
                  <li key={i} className="flex items-start gap-3 opacity-50">
                    <X className="h-5 w-5 text-zinc-400 shrink-0 mt-0.5" />
                    <span className="text-zinc-500 dark:text-zinc-400 line-through">{feat}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                variant={plan.popular ? "primary" : "outline"} 
                className={`w-full h-12 rounded-xl text-base font-semibold ${
                  plan.popular ? 'bg-primary hover:bg-primary-hover text-white' : ''
                }`}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
