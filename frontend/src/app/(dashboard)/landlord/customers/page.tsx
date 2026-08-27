"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Filter, MoreHorizontal, UserPlus, X, UploadCloud, User, Plus, Building2, Activity, ArrowUpDown, LayoutGrid, List, ChevronDown, Upload, Download, Target, Users, ChevronLeft, ChevronRight, ArrowLeft, Edit2, Trash2, Phone, Briefcase, CreditCard, Home, Clock, Image as ImageIcon, AlertTriangle, MapPin } from "lucide-react";
import { generateMockCustomers } from "./data";

import { useAuth } from "@/context/AuthContext";

export default function CustomersPage() {
  const { activeBuilding } = useAuth();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortFilter, setSortFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });


  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, buildingFilter, statusFilter, sortFilter, itemsPerPage]);

  const handleCloseModal = () => {
    if (isDirty) {
      if (window.confirm("Bạn có thông tin chưa lưu. Bạn có chắc chắn muốn đóng?")) {
        setIsModalOpen(false);
        setTimeout(() => setIsDirty(false), 200);
      }
    } else {
      setIsModalOpen(false);
    }
  };

  const [customers, setCustomers] = useState(generateMockCustomers());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const rawId = params.get('id');
      if (rawId) {
        router.push(`/landlord/customers/${encodeURIComponent(rawId)}`);
      }
    }
  }, [router]);


  if (!isMounted) {
    return null;
  }

  const filteredCustomers = customers.filter(customer => {
    const matchSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      customer.cccd.includes(searchQuery);
    const matchBuilding = buildingFilter === "" || customer.building === buildingFilter;
    const matchStatus = statusFilter === "" || customer.status === statusFilter;
    return matchSearch && matchBuilding && matchStatus;
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortFilter === "name_asc") return a.name.localeCompare(b.name);
    if (sortFilter === "room_asc") return a.room.localeCompare(b.room);
    return 0;
  });

  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = sortedCustomers.slice(startIndex, startIndex + itemsPerPage);

  const totalCustomers = customers.length;
  const stayingCount = customers.filter(c => c.status === 'Đang ở').length;
  const expiringCount = customers.filter(c => c.status === 'Sắp hết hợp đồng').length;
  const leftCount = customers.filter(c => c.status === 'Đã rời').length;

  return (
    <div className="space-y-6">
      {/* Top Bar / Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
                Quản lý khách thuê
              </h1>
              <p className="text-sm text-zinc-500 mt-1 font-medium">
                Danh sách khách thuê theo tòa nhà, phòng và trạng thái
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => alert("Tính năng Import danh sách khách thuê bằng Excel đang được phát triển.")}
                className="px-3.5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" /> Import
              </button>
              <button
                onClick={() => alert("Xuất file Excel danh sách khách thuê thành công.")}
                className="px-3.5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 text-xs font-bold text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Thêm khách thuê
              </button>
            </div>
          </div>

          {/* Building Overview Banner */}
          <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 text-white shadow-xl relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
              <Users className="w-64 h-64" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
              <div className="space-y-3 max-w-xl w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
                    {activeBuilding.name}
                  </h2>
                  <span className="px-2.5 py-0.5 bg-[#2AC1BC]/20 text-[#2AC1BC] border border-[#2AC1BC]/30 text-[10px] font-black rounded-full uppercase tracking-wider shrink-0">
                    Đang vận hành
                  </span>
                </div>

                {/* Separated Address Line with Integrated Map Link */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2.5 sm:px-3 sm:py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-all w-full sm:w-auto">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-[#2AC1BC] shrink-0" />
                    <span className="text-xs font-bold text-zinc-200 truncate sm:whitespace-normal">{activeBuilding.address}</span>
                  </div>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(activeBuilding.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="self-end sm:self-auto px-2.5 py-1 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-[10px] font-black rounded-lg transition-colors flex items-center gap-1 shrink-0"
                  >
                    <span>Xem Bản Đồ</span> &rarr;
                  </a>
                </div>

                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                  Quản lý tổng thể danh sách khách hàng lưu trú, thông tin liên lạc và tình trạng hợp đồng.
                </p>
              </div>

              <div className="flex flex-col items-end gap-3 w-full lg:w-auto mt-4 lg:mt-0">
                {/* Stats Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-row lg:justify-end gap-3 w-full">
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-white/10 backdrop-blur-md w-full lg:w-[145px]">
                    <Building2 className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Số tòa nhà</span>
                      <span className="font-black text-white text-lg leading-none mt-1">1</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-xl border border-rose-500/30 backdrop-blur-md w-full lg:w-[145px]">
                    <Users className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">Tổng khách thuê</span>
                      <span className="font-black text-rose-500 text-lg leading-none mt-1">{totalCustomers}</span>
                    </div>
                  </div>
                </div>

                {/* Stats Row 2 */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:flex-row lg:justify-end gap-3 w-full">
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 transition-colors rounded-xl border border-[#2AC1BC]/30 backdrop-blur-md w-full lg:w-[145px]">
                    <div className="w-2 h-2 rounded-full bg-[#2AC1BC] shadow-[0_0_8px_rgba(42,193,188,0.8)] flex-shrink-0"></div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-[#2AC1BC] tracking-wider">Đang ở</span>
                      <span className="font-black text-white text-lg leading-none mt-1">{stayingCount}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-orange-500/10 hover:bg-orange-500/20 transition-colors rounded-xl border border-orange-500/30 backdrop-blur-md w-full lg:w-[145px]">
                    <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] flex-shrink-0"></div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-orange-400 tracking-wider">Sắp hết HĐ</span>
                      <span className="font-black text-white text-lg leading-none mt-1">{expiringCount}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-xl border border-blue-500/30 backdrop-blur-md w-full lg:w-[145px]">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] flex-shrink-0"></div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">Đã rời</span>
                      <span className="font-black text-white text-lg leading-none mt-1">{leftCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 1-Click Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-2">
            {[
              { id: "", label: "Tất cả", count: totalCustomers, color: "text-zinc-700 bg-zinc-100 border-zinc-200" },
              { id: "Đang ở", label: "Đang ở", count: stayingCount, color: "text-[#2AC1BC] bg-[#2AC1BC]/10 border-[#2AC1BC]/30" },
              { id: "Sắp hết hợp đồng", label: "Sắp hết HĐ", count: expiringCount, color: "text-orange-700 bg-orange-50 border-orange-200" },
              { id: "Đã rời", label: "Đã rời", count: leftCount, color: "text-blue-700 bg-blue-50 border-blue-200" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer whitespace-nowrap ${
                  statusFilter === tab.id
                    ? "bg-[#2AC1BC] text-white border-[#2AC1BC] shadow-xs"
                    : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                <span className="whitespace-nowrap">{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black whitespace-nowrap ${
                  statusFilter === tab.id ? "bg-white/20 text-white" : tab.color
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
              <div className="relative w-full md:w-64 flex-shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Tìm tên, SĐT, CCCD..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2AC1BC]/20 focus:border-[#2AC1BC]"
                />
              </div>

              {/* Sắp xếp */}
              <div className="relative flex-shrink-0">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                <select
                  value={sortFilter}
                  onChange={(e) => setSortFilter(e.target.value)}
                  className="pl-9 pr-8 py-2 text-sm text-zinc-700 bg-white border border-zinc-200 rounded-lg appearance-none hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#2AC1BC]/20 focus:border-[#2AC1BC] cursor-pointer transition-colors font-medium whitespace-nowrap"
                >
                  <option value="">Sắp xếp</option>
                  <option value="name_asc">Theo tên (A-Z)</option>
                  <option value="room_asc">Theo số phòng</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {/* View Mode Switcher */}
            <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200 shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "grid" ? "bg-white text-[#2AC1BC] shadow-xs font-bold" : "text-zinc-500 hover:text-zinc-900"
                }`}
                title="Xem dạng thẻ (Grid)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "list" ? "bg-white text-[#2AC1BC] shadow-xs font-bold" : "text-zinc-500 hover:text-zinc-900"
                }`}
                title="Xem dạng danh sách (List)"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Customer View: Grid or List */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedCustomers.length === 0 ? (
                <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-zinc-200 text-zinc-500">
                  Không tìm thấy khách thuê phù hợp
                </div>
              ) : (
                paginatedCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-xs hover:shadow-md transition-all space-y-3 relative group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center font-black text-sm uppercase shrink-0">
                          {customer.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/landlord/customers/${customer.id}`} className="font-bold text-zinc-900 text-sm hover:text-[#2AC1BC] cursor-pointer transition-colors truncate block">
                            {customer.name}
                          </Link>
                          <p className="text-xs text-zinc-500 font-medium truncate">CCCD: {customer.cccd}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full shrink-0 whitespace-nowrap ${
                        customer.status === 'Đang ở'
                          ? 'bg-[#2AC1BC]/10 text-[#2AC1BC] border border-[#2AC1BC]/30'
                          : customer.status === 'Sắp hết hợp đồng'
                            ? 'bg-orange-50 text-orange-700 border border-orange-200 animate-pulse'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {customer.status}
                      </span>
                    </div>

                    <div className="p-2.5 bg-zinc-50 rounded-xl space-y-1.5 text-xs text-zinc-600">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 font-medium whitespace-nowrap">Tòa & Phòng:</span>
                        <span className="font-bold text-zinc-900 whitespace-nowrap">{customer.building === 'dormio' ? 'Dormio' : 'VinaHouse'} — Phòng {customer.status === 'Đã rời' ? "—" : customer.room}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 font-medium whitespace-nowrap">Ngày ở:</span>
                        <span className="font-semibold text-zinc-800 whitespace-nowrap">{customer.joinDate}</span>
                      </div>
                      {customer.status === 'Sắp hết hợp đồng' && (
                        <div className="flex justify-between items-center pt-1 border-t border-orange-200/60 text-orange-800 font-bold">
                          <span className="whitespace-nowrap">⏳ Hạn hợp đồng:</span>
                          <span className="text-orange-600 animate-pulse whitespace-nowrap">Còn 5 ngày</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Inline Action Buttons */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      <a
                        href={`tel:${customer.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="py-1.5 bg-white text-zinc-800 border border-zinc-200 rounded-lg text-[11px] font-bold hover:bg-zinc-50 transition-colors text-center flex items-center justify-center gap-1 shadow-2xs whitespace-nowrap"
                      >
                        📞 Gọi
                      </a>
                      <a
                        href={`https://zalo.me/${customer.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="py-1.5 bg-[#0068FF] text-white rounded-lg text-[11px] font-bold hover:bg-[#0052cc] transition-colors text-center flex items-center justify-center gap-1 shadow-2xs whitespace-nowrap"
                      >
                        💬 Zalo
                      </a>
                      <Link
                        href={`/landlord/customers/${customer.id}`}
                        className="py-1.5 bg-[#2AC1BC]/10 text-[#2AC1BC] border border-[#2AC1BC]/30 rounded-lg text-[11px] font-bold hover:bg-[#2AC1BC]/20 transition-colors text-center flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        📄 Xem
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
              <div className="overflow-auto max-h-[500px]">
                <table className="w-full text-sm text-left relative">
                  <thead className="text-[11px] font-bold text-zinc-500 uppercase bg-zinc-50/80 border-b border-zinc-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 whitespace-nowrap">Tên khách thuê</th>
                      <th className="px-6 py-4 whitespace-nowrap">SĐT</th>
                      <th className="px-6 py-4 whitespace-nowrap">CCCD/CMND</th>
                      <th className="px-6 py-4 whitespace-nowrap">Tòa nhà</th>
                      <th className="px-6 py-4 whitespace-nowrap">Phòng hiện tại</th>
                      <th className="px-6 py-4 whitespace-nowrap">Trạng thái</th>
                      <th className="px-6 py-4 text-right whitespace-nowrap">Thao tác nhanh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {sortedCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">
                          Không tìm thấy khách thuê phù hợp
                        </td>
                      </tr>
                    ) : (
                      paginatedCustomers.map((customer) => (
                        <tr
                          key={customer.id}
                          className="hover:bg-zinc-50/80 transition-colors group cursor-pointer"
                          onClick={() => router.push(`/landlord/customers/${customer.id}`)}
                        >
                          <td className="px-6 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center font-black text-xs uppercase shrink-0">
                                {customer.name.charAt(0)}
                              </div>
                              <span className="font-bold text-zinc-900 group-hover:text-[#2AC1BC] transition-colors">{customer.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 font-medium text-zinc-700 whitespace-nowrap">{customer.phone}</td>
                          <td className="px-6 py-3.5 font-medium text-zinc-700 whitespace-nowrap">{customer.cccd}</td>
                          <td className="px-6 py-3.5 font-medium text-zinc-700 capitalize whitespace-nowrap">{customer.building === 'dormio' ? 'Dormio' : 'VinaHouse'}</td>
                          <td className="px-6 py-3.5 font-medium text-zinc-700 whitespace-nowrap">{customer.status === 'Đã rời' ? "—" : customer.room}</td>
                          <td className="px-6 py-3.5 whitespace-nowrap">
                            <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border whitespace-nowrap ${customer.status === 'Đang ở'
                                ? 'bg-[#2AC1BC]/10 text-[#2AC1BC] border-[#2AC1BC]/30'
                                : customer.status === 'Sắp hết hợp đồng'
                                  ? 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                              {customer.status}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <a
                                href={`tel:${customer.phone}`}
                                title="Gọi điện"
                                className="px-2 py-1 bg-white text-zinc-800 border border-zinc-200 rounded-lg text-xs font-bold hover:bg-zinc-50 transition-colors shadow-2xs flex items-center gap-1 whitespace-nowrap"
                              >
                                📞 Gọi
                              </a>
                              <a
                                href={`https://zalo.me/${customer.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Chat Zalo"
                                className="px-2 py-1 bg-[#0068FF] text-white rounded-lg text-xs font-bold hover:bg-[#0052cc] transition-colors shadow-2xs flex items-center gap-1"
                              >
                                💬 Zalo
                              </a>
                              <Link
                                href={`/landlord/customers/${customer.id}`}
                                className="px-2 py-1 bg-[#2AC1BC]/10 text-[#2AC1BC] border border-[#2AC1BC]/30 rounded-lg text-xs font-bold hover:bg-[#2AC1BC]/20 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                📄 Xem
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
            <div className="flex items-center gap-2 text-sm text-zinc-600 bg-white/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-200/50 shadow-sm">
              <span className="font-medium">Hiển thị</span>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-transparent focus:outline-none font-bold text-primary cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="font-medium">/ trang</span>
            </div>

            <div className="flex items-center gap-4 bg-white/70 backdrop-blur-md px-4 py-1.5 rounded-xl border border-zinc-200/50 shadow-sm">
              <span className="text-sm font-medium text-zinc-600">
                {sortedCustomers.length === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + itemsPerPage, sortedCustomers.length)} của <span className="font-bold text-zinc-900">{sortedCustomers.length}</span>
              </span>
              <div className="flex gap-1 border-l border-zinc-200/50 pl-3 ml-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-500"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-500"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

      {/* Add Tenant Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" onInput={() => setIsDirty(true)} onChange={() => setIsDirty(true)}>
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 text-accent rounded-lg">
                  <User className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900">{selectedCustomer ? "Chỉnh sửa khách thuê" : "Thêm khách thuê mới"}</h2>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar bg-zinc-50/50">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Họ tên <span className="text-red-500">*</span></label>
                  <input type="text" defaultValue={selectedCustomer?.name || ""} placeholder="Nguyễn Văn A" className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Số CCCD/CMND</label>
                  <input type="text" defaultValue={selectedCustomer?.cccd || ""} placeholder="001234567890" className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Ngày sinh</label>
                  <input type="date" defaultValue={selectedCustomer?.dob || ""} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white text-zinc-700" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Giới tính</label>
                  <select defaultValue={selectedCustomer?.gender || "nam"} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white">
                    <option value="nam">Nam</option>
                    <option value="nu">Nữ</option>
                    <option value="khac">Khác</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700">Địa chỉ thường trú</label>
                <textarea rows={2} defaultValue={selectedCustomer?.address || ""} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/TP" className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white resize-none"></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Số điện thoại</label>
                  <input type="tel" defaultValue={selectedCustomer?.phone || ""} placeholder="0901234567" className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Email</label>
                  <input type="email" defaultValue={selectedCustomer?.email || ""} placeholder="email@example.com" className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Nghề nghiệp</label>
                  <input type="text" defaultValue={selectedCustomer?.job || ""} placeholder="VD: Kỹ sư, Sinh viên..." className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Nơi làm việc</label>
                  <input type="text" defaultValue={selectedCustomer?.workplace || ""} placeholder="VD: Công ty ABC..." className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Ảnh mặt trước</label>
                  <div className="border border-dashed border-blue-300 bg-blue-50/50 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-blue-50 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                      <UploadCloud className="w-5 h-5 text-zinc-400 group-hover:text-accent transition-colors" />
                    </div>
                    <span className="text-sm font-bold text-zinc-900">Kéo thả hoặc nhấn để chọn</span>
                    <span className="text-xs text-zinc-500 mt-1">Tối đa 5MB</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Ảnh mặt sau</label>
                  <div className="border border-dashed border-blue-300 bg-blue-50/50 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-blue-50 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                      <UploadCloud className="w-5 h-5 text-zinc-400 group-hover:text-accent transition-colors" />
                    </div>
                    <span className="text-sm font-bold text-zinc-900">Kéo thả hoặc nhấn để chọn</span>
                    <span className="text-xs text-zinc-500 mt-1">Tối đa 5MB</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700">Ghi chú</label>
                <textarea rows={3} defaultValue={selectedCustomer?.note || ""} placeholder="Ghi chú thêm về khách thuê" className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white resize-none"></textarea>
              </div>

            </div>

            <div className="p-6 border-t border-zinc-100 flex items-center justify-end gap-3 bg-zinc-50/50">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => { setIsModalOpen(false); setIsDirty(false); }}
                className="px-6 py-2.5 text-sm font-bold text-white bg-accent rounded-xl hover:bg-accent-hover shadow-sm shadow-accent/20 transition-all"
              >
                {selectedCustomer ? "Lưu thay đổi" : "Lưu khách thuê"}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }: { isOpen: boolean, title: string, message: string, onConfirm: () => void, onCancel: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-500 shadow-inner">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 mb-2">{title}</h3>
          <p className="text-sm text-zinc-500">{message}</p>
        </div>
        <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">Hủy</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-bold text-white bg-danger rounded-lg hover:bg-danger-hover shadow-md shadow-orange-600/20 transition-colors">Đồng ý</button>
        </div>
      </div>
    </div>
  );
}
