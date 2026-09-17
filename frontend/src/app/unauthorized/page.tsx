"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldOff, Home, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LanguageContext";

/**
 * Unauthorized page — shown when a logged-in user attempts to access a route
 * their role is not permitted to view (HTTP 403 Forbidden).
 *
 * Provides three recovery actions:
 *  1. Return to the public homepage.
 *  2. Go to the login page (without logging out) to log in as a different account.
 *  3. Log out and redirect to login (switch account).
 */
export default function UnauthorizedPage() {
  const t = useTranslations("auth");
  const { logout } = useAuth();
  const router = useRouter();

  const handleSwitchAccount = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-4 py-12">

      {/* Card */}
      <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-sm border border-zinc-100 px-8 py-10 space-y-6">

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-[11px] font-black text-red-500 uppercase tracking-widest">
          <ShieldOff className="w-3.5 h-3.5" />
          {t("unauthorizedTagCode")}
        </div>

        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shadow-sm">
          <ShieldOff className="w-10 h-10 text-red-400" strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
            {t("unauthorizedTitle")}
          </h1>
          <p className="text-sm font-semibold text-zinc-500">
            {t("unauthorizedSubtitle")}
          </p>
        </div>

        {/* Description */}
        <p className="text-sm text-zinc-400 leading-relaxed">
          {t("unauthorizedDesc")}
        </p>

        {/* Divider */}
        <div className="h-px bg-zinc-100" />

        {/* Actions */}
        <div className="flex flex-col gap-3">

          {/* Primary: Back to home */}
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-xl bg-[#2AC1BC] text-white text-sm font-semibold shadow-sm hover:bg-[#22a8a4] active:scale-[0.98] transition-all"
          >
            <Home className="w-4 h-4" strokeWidth={2.5} />
            {t("unauthorizedBtnHome")}
          </Link>

          {/* Secondary: Log in (keep session, just navigate) */}
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-700 text-sm font-semibold hover:bg-zinc-50 active:scale-[0.98] transition-all"
          >
            <LogIn className="w-4 h-4" />
            {t("unauthorizedBtnLogin")}
          </Link>

          {/* Tertiary: Logout and switch account */}
          <button
            type="button"
            onClick={handleSwitchAccount}
            className="inline-flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm font-semibold hover:bg-red-100 active:scale-[0.98] transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            {t("unauthorizedBtnSwitchAcc")}
          </button>
        </div>
      </div>

      {/* Footer branding */}
      <p className="mt-8 text-xs text-zinc-400 font-medium">
        Dormio<span className="text-[#FF6B35]">.</span>
      </p>
    </div>
  );
}

