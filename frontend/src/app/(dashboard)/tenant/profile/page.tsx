"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/context/LanguageContext";

export default function TenantProfileRedirect() {
  const t = useTranslations("tenantPortal");
  const router = useRouter();

  useEffect(() => {
    router.replace("/profile");
  }, [router]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center space-y-3">
      <div className="w-8 h-8 border-2 border-[#2AC1BC] border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-bold text-zinc-500">
        {t("tenantRedirectingToProfile")}
      </p>
    </div>
  );
}

