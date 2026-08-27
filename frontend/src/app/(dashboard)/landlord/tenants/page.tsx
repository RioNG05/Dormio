"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TenantsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/landlord/customers");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2AC1BC]"></div>
    </div>
  );
}