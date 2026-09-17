"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StaffAttendancePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/staff/shift-history");
  }, [router]);

  return (
    <div className="p-12 text-center text-xs text-zinc-400 font-bold animate-pulse">
      Đang chuyển đến Lịch sử chấm công...
    </div>
  );
}
