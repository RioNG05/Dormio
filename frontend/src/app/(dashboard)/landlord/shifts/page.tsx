"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ShiftsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/landlord/workforce/schedule");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-xs text-zinc-400 font-semibold animate-pulse">
        Đang chuyển hướng đến Lịch phân ca...
      </div>
    </div>
  );
}