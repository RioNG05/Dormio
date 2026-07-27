"use client";

import React, { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Users, DollarSign } from "lucide-react";

export default function ReportsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const revenueData = [
    { name: "T1", revenue: 4000, profit: 2400 },
    { name: "T2", revenue: 3000, profit: 1398 },
    { name: "T3", revenue: 2000, profit: 9800 },
    { name: "T4", revenue: 2780, profit: 3908 },
    { name: "T5", revenue: 1890, profit: 4800 },
    { name: "T6", revenue: 2390, profit: 3800 },
  ];

  const occupancyData = [
    { name: "T1", occupied: 80 },
    { name: "T2", occupied: 85 },
    { name: "T3", occupied: 90 },
    { name: "T4", occupied: 85 },
    { name: "T5", occupied: 95 },
    { name: "T6", occupied: 98 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Báo cáo & Thống kê</h1>
        <p className="text-sm text-zinc-500">Phân tích chuyên sâu về doanh thu, tỷ lệ lấp đầy và công nợ</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-zinc-500 font-medium">Doanh thu T6</div>
            <DollarSign className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 mt-2">23.900.000 ₫</div>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span>+12.5% so với tháng trước</span>
          </div>
        </div>
        <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-zinc-500 font-medium">Tỷ lệ lấp đầy</div>
            <Users className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 mt-2">98%</div>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span>+3% so với tháng trước</span>
          </div>
        </div>
        <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-zinc-500 font-medium">Công nợ tồn</div>
            <DollarSign className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 mt-2">1.500.000 ₫</div>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-red-600">
            <TrendingDown className="w-3 h-3" />
            <span>Chưa thu của 1 phòng</span>
          </div>
        </div>
        <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-sm border-b-4 border-b-accent">
          <div className="flex items-center justify-between">
            <div className="text-sm text-zinc-500 font-medium">Lợi nhuận ròng T6</div>
            <TrendingUp className="w-4 h-4 text-accent" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 mt-2">19.500.000 ₫</div>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-zinc-500">
            <span>Đã trừ chi phí 4.4M</span>
          </div>
        </div>
      </div>

      {mounted && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-zinc-900 mb-6">Biểu đồ doanh thu (6 tháng)</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a'}} />
                  <Tooltip cursor={{fill: '#f4f4f5'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="revenue" fill="#89c8b9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" fill="#ee6927" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#89c8b9]"></div>
                <span className="text-sm text-zinc-600">Doanh thu</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ee6927]"></div>
                <span className="text-sm text-zinc-600">Lợi nhuận</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-zinc-900 mb-6">Tỷ lệ lấp đầy (%)</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={occupancyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a'}} dy={10} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#71717a'}} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Line type="monotone" dataKey="occupied" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
