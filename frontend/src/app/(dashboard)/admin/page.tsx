"use client";

import React from "react";
import { useTranslations } from "@/context/LanguageContext";

export default function AdminDashboardPage() {
  const t = useTranslations("adminDashboard");

  const reports = [
    {
      title: t("totalUsers"),
      value: `1,248 ${t("userUnit")}`,
      status: `+12% ${t("thisWeek")}`,
    },
    {
      title: t("registeredLandlords"),
      value: `312 ${t("landlordUnit")}`,
      status: `+5% ${t("thisWeek")}`,
    },
    {
      title: t("roomListings"),
      value: `852 ${t("listingUnit")}`,
      status: `76 ${t("waitingApproval")}`,
    },
    {
      title: t("serviceRevenue"),
      value: "14.800.000 đ",
      status: `+18% ${t("thisMonth")}`,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {t("subtitle")}
        </p>
      </div>

      {/* Grid Reports */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {reports.map((report, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-950 flex flex-col gap-2"
          >
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {report.title}
            </span>
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {report.value}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-500 font-semibold">
              {report.status}
            </span>
          </div>
        ))}
      </div>

      {/* Pending Items List */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-950 flex flex-col gap-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          {t("pendingListingsTitle")}
        </h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 gap-4">
            <div>
              <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                {t("mockListingTitle")}
              </div>
              <div className="text-xs text-zinc-400">
                {t("postedBy", {
                  name: t("mockListingPoster"),
                  price: t("mockListingPrice"),
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 cursor-pointer">
                {t("approve")}
              </button>
              <button className="px-4 py-1.5 rounded-lg bg-zinc-200 text-zinc-700 text-xs font-semibold hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer">
                {t("reject")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
