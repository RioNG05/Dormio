"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldOff, Home } from "lucide-react";
import { useAuth, UserProfile } from "@/context/AuthContext";

/**
 * Route → allowed roles mapping.
 * A user whose role is NOT in the allowed list will see the "no permission" page.
 */
const ROUTE_ROLE_MAP: { prefix: string; allowed: UserProfile["role"][] }[] = [
  { prefix: "/landlord", allowed: ["landlord"] },
  { prefix: "/tenant", allowed: ["tenant"] },
  { prefix: "/staff", allowed: ["employee"] },
  { prefix: "/admin", allowed: ["admin"] },
];

function NoPermissionPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shadow-sm">
          <ShieldOff className="w-10 h-10 text-red-400" strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-extrabold text-zinc-900 mb-3 tracking-tight">
          Truy cập bị từ chối
        </h1>

        {/* Message */}
        <p className="text-zinc-500 text-sm leading-relaxed mb-8">
          You do not have permission to access this page.
          <br />
          Please contact your administrator if you believe this is a mistake.
        </p>

        {/* Return button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all"
        >
          <Home className="w-4 h-4" strokeWidth={2.5} />
          Return to homepage
        </Link>
      </div>
    </div>
  );
}

/**
 * AuthGuard wraps dashboard route children and enforces role-based access.
 *
 * - If the user is not yet loaded (hydrating), render nothing to avoid flash.
 * - If the current route requires a specific role and the user's role does not
 *   match, render the NoPermissionPage instead of children.
 * - If the route is not protected or the role matches, render children normally.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoggedIn } = useAuth();

  // Determine which rule applies to the current pathname
  const rule = ROUTE_ROLE_MAP.find(({ prefix }) => pathname?.startsWith(prefix));

  // If no rule applies (e.g. a public route somehow inside layout), just render
  if (!rule) {
    return <>{children}</>;
  }

  // While auth state is hydrating (user not yet resolved), render nothing to
  // avoid a flash of the permission-denied page for valid users.
  if (!isLoggedIn || user === null) {
    return <>{children}</>;
  }

  // Check role
  const hasPermission = rule.allowed.includes(user.role);

  if (!hasPermission) {
    return <NoPermissionPage />;
  }

  return <>{children}</>;
}
