"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Phone, Mail, Lock, Eye, EyeOff, ArrowRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LanguageContext";
import { api } from "@/services/api";
import { getHighestRoleRedirect } from "@/utils";
import { TextInput, Button, Checkbox } from "@/components/ui";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { loginWithToken } = useAuth();

  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Form states
  const [accountIdentifier, setAccountIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountIdentifier || !password) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<any>("/v1/auth/login", {
        identifier: accountIdentifier.trim(),
        password,
      });

      const authData = response?.data || response;
      const { token, user, mustChangePassword } = authData || {};

      if (!token || !user) {
        throw new Error(t("authLoginErrCannotVerify"));
      }

      // Determine highest achieved role and target redirect path:
      // guest (/) -> leasing agent (/) -> tenant (/tenant) -> staff (/staff) -> landlord (/landlord) -> admin (/admin)
      const { role: displayRole, redirectPath } = getHighestRoleRedirect(user);

      loginWithToken(token, {
        id: user.id,
        name: user.username || accountIdentifier,
        email: user.email || "",
        phone: user.phoneNumber,
        role: displayRole,
        mustChangePassword: !!mustChangePassword,
      });

      // Spec: if mustChangePassword → redirect to change-password page
      if (mustChangePassword) {
        router.push("/change-password");
      } else {
        const redirectQuery =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("redirect")
            : null;
        const targetUrl =
          redirectQuery && redirectQuery.startsWith("/")
            ? redirectQuery
            : redirectPath;
        router.push(targetUrl);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("authLoginErrGeneric");
      if (message.includes("invalid_credentials") || message.includes("401")) {
        setError(t("authLoginErrInvalidCredentials"));
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Top Header & Badge */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
          {t("authLoginWelcomeTitle")}
        </h1>
        <p className="text-xs text-zinc-500 font-medium leading-relaxed">
          {t("authLoginWelcomeDesc")}
        </p>
      </div>

      {/* Input Method Selector Tabs (Phone vs Email) */}
      <div className="flex p-1 bg-zinc-100/80 rounded-2xl border border-zinc-200/60">
        <button
          type="button"
          onClick={() => { setMethod("phone"); setAccountIdentifier(""); setError(null); }}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            method === "phone" ? "bg-white text-[#2AC1BC] shadow-xs" : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Phone className="w-3.5 h-3.5" /> {t("authLoginMethodPhone")}
        </button>
        <button
          type="button"
          onClick={() => { setMethod("email"); setAccountIdentifier(""); setError(null); }}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            method === "email" ? "bg-white text-[#2AC1BC] shadow-xs" : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Mail className="w-3.5 h-3.5" /> {t("authLoginMethodEmail")}
        </button>
      </div>

      {/* Login Form reusing Base Components */}
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Phone or Email input */}
        <TextInput
          label={method === "phone" ? t("authLoginPhoneLabel") : t("authLoginEmailLabel")}
          labelClassName="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider"
          type={method === "phone" ? "tel" : "email"}
          required
          placeholder={method === "phone" ? t("authLoginPhonePlaceholder") : t("authLoginEmailPlaceholder")}
          value={accountIdentifier}
          onChange={(e) => setAccountIdentifier(e.target.value)}
          leftIcon={
            method === "phone" ? (
              <Phone className="w-4 h-4 text-zinc-400" />
            ) : (
              <Mail className="w-4 h-4 text-zinc-400" />
            )
          }
          className="rounded-2xl py-3 border-zinc-200 focus:border-[#2AC1BC]"
        />

        {/* Password Field & Forgot Link */}
        <TextInput
          label={t("authLoginPasswordLabel")}
          labelClassName="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider"
          labelRight={
            <Link href="/forgot-password" className="text-xs font-extrabold text-[#2AC1BC] hover:underline">
              {t("authForgotPassword")}
            </Link>
          }
          type={showPassword ? "text" : "password"}
          required
          placeholder={t("authLoginPassPlaceholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4 text-zinc-400" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-zinc-400 hover:text-zinc-700 cursor-pointer transition-colors p-1"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          className="rounded-2xl py-3 border-zinc-200 focus:border-[#2AC1BC]"
        />

        {/* Remember me Checkbox */}
        <div className="flex items-center justify-between pt-0.5">
          <Checkbox
            size="sm"
            id="remember-me"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            label={<span className="text-xs font-medium text-zinc-600">{t("authRememberMe")}</span>}
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-600 animate-in fade-in">
            {error}
          </div>
        )}

        {/* Submit Button reusing Base Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="w-full py-3.5 bg-[#2AC1BC] hover:bg-[#72b3a3] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#2AC1BC]/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01] mt-2"
        >
          {t("authLoginSubmitBtn")}
        </Button>

      </form>

      {/* Bottom Auth Navigation Link */}
      <div className="text-center text-xs text-zinc-500 font-medium pt-2">
        {t("authNoAccount")}{" "}
        <Link href="/register" className="font-extrabold text-[#2AC1BC] hover:underline">
          {t("authRegisterNow")}
        </Link>
      </div>

    </div>
  );
}
