import React from "react";
import { redirect } from "next/navigation";
import { FEATURE_FLAGS } from "@/config/features";
import PricingUI from "../components/PricingUI";

export default function RentalPlatformPricingPage() {
  if (!FEATURE_FLAGS.ENABLE_BHRP) {
    redirect("/pricing");
  }
  return <PricingUI initialTab="bhrp" />;
}
