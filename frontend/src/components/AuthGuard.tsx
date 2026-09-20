"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth, UserProfile, UserCapabilities } from "@/context/AuthContext";

/**
 * Checks whether the authenticated user has permission to access the given pathname.
 *
 * Rules:
 * - /landlord/setup: Open to ANY authenticated user (tenants, employees,
 * and leasing agents can create a boarding house to become a landlord).
 * - Multi-role capabilities from relationship queries are supported in addition to User.role.
 */
function checkUserPermission(
 pathname: string,
 user: UserProfile,
 capabilities?: UserCapabilities
): boolean {
 // 1. Setup wizard is accessible to any authenticated user to create a boarding house
 if (pathname === "/landlord/setup" || pathname.startsWith("/landlord/setup")) {
 return true;
 }

 // 2. Landlord dashboard area
 if (pathname.startsWith("/landlord")) {
 return user.role === "landlord" || Boolean(capabilities?.isLandlord);
 }

 // 3. Tenant portal area
 if (pathname.startsWith("/tenant")) {
 return user.role === "tenant" || Boolean(capabilities?.isTenant);
 }

 // 4. Staff portal area
 if (pathname.startsWith("/staff")) {
 return user.role === "employee" || Boolean(capabilities?.isEmployee);
 }

 // 5. System admin area
 if (pathname.startsWith("/admin")) {
 return user.role === "admin" || Boolean(capabilities?.isAdmin);
 }

 // Any other dashboard route has no role restriction
 return true;
}

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
 * 1. If isHydrating → show spinner (avoids flash of wrong redirect)
 * 2. If not logged in → redirect to /login?from=<pathname>
 * 3. If logged in but wrong role → redirect to /unauthorized
 * 4. If all checks pass → render children
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
 const pathname = usePathname();
 const router = useRouter();
 const { user, isLoggedIn, isHydrating, capabilities } = useAuth();

 const isProtectedRoute =
 Boolean(pathname?.startsWith("/landlord")) ||
 Boolean(pathname?.startsWith("/tenant")) ||
 Boolean(pathname?.startsWith("/staff")) ||
 Boolean(pathname?.startsWith("/admin"));

 useEffect(() => {
 // Do nothing while auth state is still being read from localStorage
 if (isHydrating) return;

 // If this route has no role restriction, no redirect needed
 if (!isProtectedRoute) return;

 // Redirect unauthenticated users to login, preserving the intended destination
 if (!isLoggedIn || user === null) {
 router.replace(`/login?from=${encodeURIComponent(pathname ?? "/")}`);
 return;
 }

 // Redirect authenticated users with wrong role to the dedicated unauthorized page
 const hasPermission = checkUserPermission(pathname ?? "", user, capabilities);
 if (!hasPermission) {
 router.replace("/unauthorized");
 }
 }, [isHydrating, isLoggedIn, user, capabilities, isProtectedRoute, pathname, router]);

 // Show spinner while still reading auth state
 if (isHydrating) {
 return <HydrationSpinner />;
 }

 // If no rule applies, render freely (e.g. a shared dashboard route)
 if (!isProtectedRoute) {
 return <>{children}</>;
 }

 // While redirect is pending (not logged in or wrong role), render spinner
 if (!isLoggedIn || user === null) {
 return <HydrationSpinner />;
 }

 const hasPermission = checkUserPermission(pathname ?? "", user, capabilities);
 if (!hasPermission) {
 return <HydrationSpinner />;
 }

 return <>{children}</>;
}
