"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Building2, Plus, Search, MapPin, Home, Users, ChevronDown, MoreHorizontal, Settings, ExternalLink
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function BoardingHousesPage() {
  const t = useTranslations("landlordDashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("dormio");

  const getBuildingTitle = (id: string) => {
    if (id === "vinahouse") return "Dormio Campus Cầu Giấy";
    if (id === "dormio") return "Dormio Premier Quận 1";
    return "Dormio Premier Quận 1";
  };

  const buildings = [
    {
      id: "dormio",
      name: "Dormio Premier Quận 1",
      address: "123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh",
      floors: 4,
      totalRooms: 128,
      occupied: 96,
      manager: "Nguyễn Văn Bảo",
      status: t("activeStatus")
    },
    {
      id: "vinahouse",
      name: "Dormio Campus Cầu Giấy",
      address: "45 Trần Thái Tông, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội",
      floors: 5,
      totalRooms: 85,
      occupied: 72,
      manager: "Trần Văn Cường",
      status: t("activeStatus")
    }
  ];

  const filteredBuildings = buildings.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Top Actions */}
      <div className="flex justify-end items-center gap-2 mb-2">
        <Link href="/landlord/setup">
          <button className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#2ac1bc] hover:bg-[#72b3a3] rounded-xl shadow-md shadow-[#2ac1bc]/20 transition-all cursor-pointer">
            <Plus className="w-4 h-4" /> {t("addNewBuilding")}
          </button>
        </Link>
      </div>

      {/* Dark Banner Card Hero */}
      <div className="bg-zinc-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden mb-6 border border-zinc-800">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <Building2 className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white">
              {getBuildingTitle(buildingFilter)}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {t("buildingOverviewSub")}
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-3 w-full lg:w-auto">
            <div className="grid grid-cols-2 lg:flex lg:flex-row lg:justify-end gap-3 w-full">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-2xl border border-rose-500/30 backdrop-blur-md min-w-[145px]">
                <Building2 className="w-4 h-4 text-rose-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">{t("totalBuildings")}</span>
                  <span className="font-black text-rose-500 text-lg leading-none mt-1">{t("buildingsCount", { count: buildings.length })}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#2ac1bc]/10 hover:bg-[#2ac1bc]/20 transition-colors rounded-2xl border border-[#2ac1bc]/30 backdrop-blur-md min-w-[145px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2ac1bc] shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-[#2ac1bc] tracking-wider">{t("activeStatus")}</span>
                  <span className="font-black text-[#2ac1bc] text-lg leading-none mt-1">{t("activeBuildingsCount", { count: 2 })}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:flex lg:flex-row lg:justify-end gap-3 w-full">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 transition-colors rounded-2xl border border-[#FF6B35]/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] shadow-[0_0_8px_rgba(255,107,53,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-[#FF6B35] tracking-wider">{t("statTotalRooms")}</span>
                  <span className="font-black text-[#FF6B35] text-lg leading-none mt-1">{t("totalRoomsCount", { count: 213 })}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-2xl border border-blue-500/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">{t("occupiedCount")}</span>
                  <span className="font-black text-blue-400 text-lg leading-none mt-1">{t("occupancyPercent", { percent: 88 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buildings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredBuildings.map((b) => (
          <div key={b.id} className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-xl font-extrabold text-zinc-900">{b.name}</h3>
                  <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> {b.address}
                  </p>
                </div>
                <span className="px-3 py-1 bg-[#2ac1bc]/10 text-[#2ac1bc] text-xs font-bold rounded-full border border-[#2ac1bc]/30 shrink-0">
                  {b.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 text-center">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase block">{t("floorsCount")}</span>
                  <span className="text-base font-black text-zinc-900 mt-0.5 block">{t("floorsValue", { count: b.floors })}</span>
                </div>
                <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 text-center">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase block">{t("statTotalRooms")}</span>
                  <span className="text-base font-black text-zinc-900 mt-0.5 block">{b.totalRooms}</span>
                </div>
                <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 text-center">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase block">{t("occupiedCount")}</span>
                  <span className="text-base font-black text-[#2ac1bc] mt-0.5 block">{b.occupied}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-100 mt-6 flex items-center justify-between">
              <div className="text-xs text-zinc-500 font-medium">
                {t("managerLabel", { name: b.manager })}
              </div>
              <Link href={`/landlord/rooms?building=${b.id}`}>
                <button className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer">
                  {t("enterRoomMgmt")} <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}