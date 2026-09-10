"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Check, X } from "lucide-react";
import { formatCurrency } from "@/utils";
import { useTranslations, useLanguage } from "@/context/LanguageContext";

export default function CompareRoomsPage() {
  const { currentLocale } = useLanguage();
  const t = useTranslations("guest");

  const roomsToCompare = [
    {
      id: "1",
      title: t("guestCompareRoom1Title"),
      price: 4500000,
      area: 25,
      address: t("guestCompareRoom1Address"),
      deposit: 1000000,
      wifi: true,
      ac: true,
      fridge: true,
      elevator: true,
      fingerprint: true,
      balcony: true,
      landlord: "Nguyễn Văn Rio"
    },
    {
      id: "2",
      title: t("guestCompareRoom2Title"),
      price: 5500000,
      area: 30,
      address: t("guestCompareRoom2Address"),
      deposit: 1500000,
      wifi: true,
      ac: true,
      fridge: true,
      elevator: true,
      fingerprint: true,
      balcony: false,
      landlord: "Trần Văn Cường"
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-in fade-in duration-500 pb-16">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/saved-posts">
          <button className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-500 cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">{t("guestCompareTitle")}</h1>
          <p className="text-xs text-zinc-500">{t("guestCompareSubtitle")}</p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-50 text-zinc-500 uppercase font-bold border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 w-48">{t("guestCompareColCriteria")}</th>
                {roomsToCompare.map((r) => (
                  <th key={r.id} className="px-6 py-4 min-w-[280px]">
                    <div className="space-y-1">
                      <span className="text-[#2ac1bc] font-extrabold text-xs block">
                        {t("guestCompareRoomNumber", { id: r.id })}
                      </span>
                      <h3 className="font-extrabold text-zinc-900 text-sm normal-case line-clamp-2">{r.title}</h3>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium">
              <tr>
                <td className="px-6 py-4 font-bold text-zinc-700 bg-zinc-50/50">{t("guestCompareRowPrice")}</td>
                {roomsToCompare.map((r) => (
                  <td key={r.id} className="px-6 py-4 text-rose-600 font-black text-base">
                    {formatCurrency(r.price, currentLocale)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-bold text-zinc-700 bg-zinc-50/50">{t("guestCompareRowDeposit")}</td>
                {roomsToCompare.map((r) => (
                  <td key={r.id} className="px-6 py-4 text-zinc-900 font-bold">
                    {formatCurrency(r.deposit, currentLocale)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-bold text-zinc-700 bg-zinc-50/50">{t("guestCompareRowArea")}</td>
                {roomsToCompare.map((r) => (
                  <td key={r.id} className="px-6 py-4 text-zinc-800 font-bold">
                    {r.area} m²
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-bold text-zinc-700 bg-zinc-50/50">{t("guestCompareRowAddress")}</td>
                {roomsToCompare.map((r) => (
                  <td key={r.id} className="px-6 py-4 text-zinc-600 font-semibold">
                    {r.address}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-bold text-zinc-700 bg-zinc-50/50">{t("guestCompareRowAc")}</td>
                {roomsToCompare.map((r) => (
                  <td key={r.id} className="px-6 py-4">
                    {r.ac ? <Check className="w-5 h-5 text-[#2ac1bc]" /> : <X className="w-5 h-5 text-zinc-300" />}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-bold text-zinc-700 bg-zinc-50/50">{t("guestCompareRowFridge")}</td>
                {roomsToCompare.map((r) => (
                  <td key={r.id} className="px-6 py-4">
                    {r.fridge ? <Check className="w-5 h-5 text-[#2ac1bc]" /> : <X className="w-5 h-5 text-zinc-300" />}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-bold text-zinc-700 bg-zinc-50/50">{t("guestCompareRowElevator")}</td>
                {roomsToCompare.map((r) => (
                  <td key={r.id} className="px-6 py-4">
                    {r.elevator ? <Check className="w-5 h-5 text-[#2ac1bc]" /> : <X className="w-5 h-5 text-zinc-300" />}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-bold text-zinc-700 bg-zinc-50/50">{t("guestCompareRowFingerprint")}</td>
                {roomsToCompare.map((r) => (
                  <td key={r.id} className="px-6 py-4">
                    {r.fingerprint ? <Check className="w-5 h-5 text-[#2ac1bc]" /> : <X className="w-5 h-5 text-zinc-300" />}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-bold text-zinc-700 bg-zinc-50/50">{t("guestCompareRowAction")}</td>
                {roomsToCompare.map((r) => (
                  <td key={r.id} className="px-6 py-4">
                    <Link href={`/rooms/${r.id}`}>
                      <button className="px-4 py-2 bg-[#FF6B35] hover:bg-[#ff5518] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#FF6B35]/20 cursor-pointer">
                        {t("guestCompareDepositNowBtn")}
                      </button>
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
