"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TenantBillsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/tenant/invoices");
  }, [router]);

  return null;
}