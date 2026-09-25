"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShieldCheck, AlertTriangle, Loader2, User, CreditCard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import { userService } from "@/services/user.service";

// ─── Types ────────────────────────────────────────────────────────────────────
interface IdentityCheckResult {
  checked: boolean;
  hasIdentification: boolean;
  hasBankAccount: boolean;
}

// ─── Checking spinner screen ──────────────────────────────────────────────────
function IdentityCheckingScreen({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 rounded-full bg-[#2AC1BC]/10 flex items-center justify-center mx-auto">
          <Loader2 className="w-8 h-8 text-[#2AC1BC] animate-spin" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-black text-zinc-900">{title}</h2>
          <p className="text-sm text-zinc-500 font-medium">{desc}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Missing info blocker screen ──────────────────────────────────────────────
function IdentityBlockerScreen({
  missingId,
  missingBank,
  t,
}: {
  missingId: boolean;
  missingBank: boolean;
  t: (key: string) => string;
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-lg p-8 max-w-md w-full space-y-6 animate-in fade-in duration-300">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8 text-amber-500" />
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black text-zinc-900">
            {t("identityGuardMissingTitle")}
          </h2>
          <p className="text-sm text-zinc-500 font-medium leading-relaxed">
            {t("identityGuardMissingDesc")}
          </p>
        </div>

        {/* Missing items checklist */}
        <div className="space-y-3">
          <div
            className={`flex items-center gap-3 p-3 rounded-2xl border ${
              missingId
                ? "bg-red-50 border-red-200"
                : "bg-emerald-50 border-emerald-200"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                missingId ? "bg-red-100" : "bg-emerald-100"
              }`}
            >
              <User
                className={`w-4 h-4 ${missingId ? "text-red-500" : "text-emerald-600"}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-xs font-bold ${
                  missingId ? "text-red-700" : "text-emerald-700"
                }`}
              >
                {missingId ? "✗ " : "✓ "}
                {t("identityGuardMissingId")}
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-3 p-3 rounded-2xl border ${
              missingBank
                ? "bg-red-50 border-red-200"
                : "bg-emerald-50 border-emerald-200"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                missingBank ? "bg-red-100" : "bg-emerald-100"
              }`}
            >
              <CreditCard
                className={`w-4 h-4 ${missingBank ? "text-red-500" : "text-emerald-600"}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-xs font-bold ${
                  missingBank ? "text-red-700" : "text-emerald-700"
                }`}
              >
                {missingBank ? "✗ " : "✓ "}
                {t("identityGuardMissingBank")}
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push("/profile?tab=bank&from=identity_guard")}
          className="w-full py-3.5 bg-[#2AC1BC] hover:bg-[#23B3AE] text-white font-extrabold text-sm
            rounded-2xl shadow-lg shadow-[#2AC1BC]/25 transition-all hover:scale-[1.02] cursor-pointer"
        >
          {t("identityGuardGoToProfile")}
        </button>
      </div>
    </div>
  );
}

// ─── IdentityGuard ────────────────────────────────────────────────────────────
/**
 * IdentityGuard wraps pages that require financial actions.
 *
 * Flow:
 * 1. If user is not logged in → renders children (AuthGuard/middleware handles login redirect)
 * 2. Fetches UserIdentification and BankAccount in parallel
 * 3. If both present → renders children
 * 4. If either missing → shows a blocker screen with a link to /profile?tab=bank
 *    AND shows a toast notification
 *
 * Applied to:
 * - /rooms/[id]/deposit
 * - /pricing/[plan]
 */
export default function IdentityGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isHydrating } = useAuth();
  const t = useTranslations("guest");
  const { toast } = useToast();
  const pathname = usePathname();

  const [status, setStatus] = useState<"checking" | "ok" | "blocked">("checking");
  const [checkResult, setCheckResult] = useState<IdentityCheckResult>({
    checked: false,
    hasIdentification: false,
    hasBankAccount: false,
  });

  // Track which path was already checked to avoid re-running on locale switch
  const [checkedForPath, setCheckedForPath] = useState<string | null>(null);

  const runCheck = useCallback(async () => {
    if (!isLoggedIn) {
      setStatus("ok"); // not logged in → let AuthGuard handle
      return;
    }

    try {
      const [idRes, bankRes] = await Promise.all([
        userService.getIdentification().catch(() => ({ hasIdentification: false })),
        userService.getBankAccount().catch(() => ({ hasBankAccount: false })),
      ]);

      const hasId = idRes.hasIdentification;
      const hasBank = bankRes.hasBankAccount;

      setCheckResult({
        checked: true,
        hasIdentification: hasId,
        hasBankAccount: hasBank,
      });

      if (hasId && hasBank) {
        setStatus("ok");
      } else {
        setStatus("blocked");
        toast.warning(t("identityGuardToastDesc"), {
          title: t("identityGuardToastTitle"),
          duration: 6000,
        });
      }
    } catch {
      // On error, allow through — do not block the user
      setStatus("ok");
    }
  }, [isLoggedIn, t, toast]);

  useEffect(() => {
    // Wait for auth hydration before checking
    if (isHydrating) return;

    // Only run once per pathname mount (prevent re-check on locale switch)
    if (checkedForPath === pathname) return;

    setStatus("checking");
    setCheckedForPath(pathname);
    runCheck();
  }, [isHydrating, pathname, checkedForPath, runCheck]);

  if (isHydrating || status === "checking") {
    return (
      <IdentityCheckingScreen
        title={t("identityGuardCheckingTitle")}
        desc={t("identityGuardCheckingDesc")}
      />
    );
  }

  if (status === "blocked") {
    return (
      <IdentityBlockerScreen
        missingId={!checkResult.hasIdentification}
        missingBank={!checkResult.hasBankAccount}
        t={t}
      />
    );
  }

  return <>{children}</>;
}
