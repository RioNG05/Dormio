"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TenantProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/profile");
  }, [router]);

  return (
    <div className="p-8 text-center text-xs font-bold text-zinc-500">
      Đang chuyển hướng sang Trang Hồ Sơ Cá Nhân Dùng Chung (/profile)...
    </div>
  );
}
