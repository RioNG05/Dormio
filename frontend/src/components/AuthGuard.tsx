"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth, UserProfile } from "@/context/AuthContext";

/**
 * Route → allowed roles mapping.
 * A user whose role is NOT in the allowed list will be redirected to /unauthorized.
 */
const ROUTE_ROLE_MAP: { prefix: string; allowed: UserProfile["role"][] }[] = [
  { prefix: "/landlord", allowed: ["landlord"] },
  { prefix: "/tenant", allowed: ["tenant"] },
  { prefix: "/staff", allowed: ["employee"] },
  { prefix: "/admin", allowed: ["admin"] },
];

/**
 * Full-screen loading skeleton shown while AuthContext is hydrating from localStorage.
 * Prevents a flash of login redirect for authenticated users on first render.
 */
function HydrationSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <Loader2 className="w-8 h-8 text-[#2AC1BC] animate-spin" />
    </div>
  );
}

/**
 * AuthGuard wraps dashboard route children and enforces authentication + role-based access.
 *
 * Flow:
 *  1. If isHydrating → show spinner (avoids flash of wrong redirect)
 *  2. If not logged in → redirect to /login?from=<pathname>
 *  3. If logged in but wrong role → redirect to /unauthorized
 *  4. If all checks pass → render children
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoggedIn, isHydrating } = useAuth();

  // Determine which rule applies to the current pathname
  const rule = ROUTE_ROLE_MAP.find(({ prefix }) => pathname?.startsWith(prefix));

  useEffect(() => {
    // Do nothing while auth state is still being read from localStorage
    if (isHydrating) return;

    // If this route has no role restriction, no redirect needed
    if (!rule) return;

    // Redirect unauthenticated users to login, preserving the intended destination
    if (!isLoggedIn || user === null) {
      router.replace(`/login?from=${encodeURIComponent(pathname ?? "/")}`);
      return;
    }

    // Redirect authenticated users with wrong role to the dedicated unauthorized page
    const hasPermission = rule.allowed.includes(user.role);
    if (!hasPermission) {
      router.replace("/unauthorized");
    }
  }, [isHydrating, isLoggedIn, user, rule, pathname, router]);

  // Show spinner while still reading auth state
  if (isHydrating) {
    return <HydrationSpinner />;
  }

  // If no rule applies, render freely (e.g. a shared dashboard route)
  if (!rule) {
    return <>{children}</>;
  }

  // While redirect is pending (not logged in or wrong role), render nothing
  if (!isLoggedIn || user === null) {
    return null;
  }

  const hasPermission = rule.allowed.includes(user.role);
  if (!hasPermission) {
    return null;
  }

  return <>{children}</>;
}
