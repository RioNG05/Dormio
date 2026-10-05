"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User, Phone, Mail, Lock, Eye, EyeOff, ArrowRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LanguageContext";
import { api } from "@/services/api";
import { getHighestRoleRedirect } from "@/utils";
import { TextInput, Button, Checkbox } from "@/components/ui";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { loginWithToken } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setError(t("authRegisterErrPhoneRequired"));
      return;
    }

    // Validate phone number format (starts with 0, 10 digits)
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      setError(t("authRegisterErrPhoneInvalid"));
      return;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setError(t("authRegisterErrEmailInvalid"));
        return;
      }
    }

    if (password !== confirmPassword) {
      setError(t("authRegisterErrPassMismatch"));
      return;
    }

    if (password.length < 8) {
      setError(t("authRegisterErrPassLength"));
      return;
    }

    if (!agreed) {
      setError(t("authRegisterErrTermsRequired"));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload: {
        phoneNumber: string;
        password: string;
        fullName?: string;
        email?: string;
      } = {
        phoneNumber: trimmedPhone,
        password,
      };

      if (fullName.trim()) {
        payload.fullName = fullName.trim();
      }
      if (trimmedEmail) {
        payload.email = trimmedEmail;
      }

      const response = await api.post<any>("/v1/auth/register", payload);

      const authData = response?.data || response;
      const { token, user } = authData || {};

      if (!token || !user) {
        throw new Error(t("authRegisterErrCannotCreate"));
      }

      // Determine highest achieved role and target redirect path:
      // guest (/) -> leasing agent (/) -> tenant (/tenant) -> staff (/staff) -> landlord (/landlord) -> admin (/admin)
      const { role: displayRole, redirectPath } = getHighestRoleRedirect(user);

      loginWithToken(token, {
        id: user.id,
        name: user.username || fullName.trim() || trimmedPhone,
        email: user.email || trimmedEmail || "",
        phone: user.phoneNumber || trimmedPhone,
        role: displayRole,
        mustChangePassword: false,
      });

      router.push(redirectPath);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("authLoginErrGeneric");
      if (message.includes("phone_number_already_exists")) {
        setError(t("authRegisterErrPhoneExists"));
      } else if (message.includes("email_already_exists")) {
        setError(t("authRegisterErrEmailExists"));
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Top Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
          {t("authRegisterTitle")}
        </h1>
        <p className="text-xs text-zinc-500 font-medium leading-relaxed">
          {t("authRegisterSubtitle")}
        </p>
      </div>

      {/* Main Registration Form reusing Base Components */}
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* 1. Phone Number (Required) */}
        <TextInput
          label={t("authLoginPhoneLabel")}
          labelClassName="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider"
          type="tel"
          required
          placeholder={t("authRegisterPhonePlaceholder")}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          leftIcon={<Phone className="w-4 h-4 text-zinc-400" />}
          className="rounded-2xl py-3 border-zinc-200 focus:border-[#2AC1BC]"
        />

        {/* 2. Full Name (Optional) */}
        <TextInput
          label={t("authRegisterFullNameLabel")}
          labelClassName="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider"
          type="text"
          required={false}
          placeholder={t("authRegisterFullNamePlaceholder")}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          leftIcon={<User className="w-4 h-4 text-zinc-400" />}
          className="rounded-2xl py-3 border-zinc-200 focus:border-[#2AC1BC]"
        />

        {/* 3. Email (Optional) */}
        <TextInput
          label={t("authRegisterEmailOptionalLabel")}
          labelClassName="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider"
          type="email"
          required={false}
          placeholder={t("authRegisterEmailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4 text-zinc-400" />}
          className="rounded-2xl py-3 border-zinc-200 focus:border-[#2AC1BC]"
        />

        {/* 4. Password (Required) */}
        <TextInput
          label={t("authLoginPasswordLabel")}
          labelClassName="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider"
          type={showPassword ? "text" : "password"}
          required
          placeholder={t("authRegisterPassPlaceholder")}
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

        {/* 5. Confirm Password (Required) */}
        <TextInput
          label={t("authRegisterConfirmPassLabel")}
          labelClassName="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider"
          type={showConfirmPassword ? "text" : "password"}
          required
          placeholder={t("authRegisterConfirmPassPlaceholder")}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4 text-zinc-400" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-zinc-400 hover:text-zinc-700 cursor-pointer transition-colors p-1"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          className="rounded-2xl py-3 border-zinc-200 focus:border-[#2AC1BC]"
        />

        {/* 6. Terms Checkbox using Base Checkbox Component */}
        <div className="pt-1">
          <Checkbox
            id="register-terms"
            size="sm"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            label={
              <span className="text-xs text-zinc-600 font-medium">
                {t("authRegisterTermsAgree")}{" "}
                <Link href="/policy" className="font-extrabold text-[#2AC1BC] hover:underline">
                  {t("authRegisterTermsLink")}
                </Link>{" "}
                {t("authRegisterTermsAnd")}{" "}
                <Link href="/policy" className="font-extrabold text-[#2AC1BC] hover:underline">
                  {t("authRegisterPrivacyLink")}
                </Link>{" "}
                {t("authRegisterTermsSuffix")}
              </span>
            }
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-600 animate-in fade-in">
            {error}
          </div>
        )}

        {/* Submit Button using Base Button Component */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={!agreed || isLoading}
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="w-full py-3.5 bg-[#2AC1BC] hover:bg-[#72b3a3] disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#2AC1BC]/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01] mt-2"
        >
          {t("authRegisterSubmitBtn")}
        </Button>

      </form>

      {/* Bottom Auth Navigation Link */}
      <div className="text-center text-xs text-zinc-500 font-medium pt-2">
        {t("authRegisterAlreadyAccount")}{" "}
        <Link href="/login" className="font-extrabold text-[#2AC1BC] hover:underline">
          {t("authRegisterLoginLink")}
        </Link>
      </div>

    </div>
  );
}
