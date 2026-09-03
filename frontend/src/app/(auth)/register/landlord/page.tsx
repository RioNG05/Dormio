import { useTranslations } from "@/context/LanguageContext";
import { redirect } from "next/navigation";

export default function RegisterLandlordPage() {
  const t = useTranslations("auth");
  redirect("/landlord");
}
