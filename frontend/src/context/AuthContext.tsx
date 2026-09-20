"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMyBoardingHouses } from "@/services/boarding-house.service";
import { api } from "@/services/api";

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: "tenant" | "landlord" | "admin" | "poster" | "employee";
  avatar: string;
  houseName?: string;
  houseAddress?: string;
  mustChangePassword?: boolean;
}

export interface BuildingItem {
  id: string;
  name: string;
  address: string;
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  expiringRooms: number;
  depositRooms: number;
  occupancyRate: string;
}

export type DemoPreset = "guest" | "tenant" | "landlord_empty" | "landlord_active" | "admin" | "staff";

/**
 * Live multi-role capabilities for the current user.
 * Derived from relationship queries on the backend (BoardingHouse, TenantContract, EmployeeAssignment).
 * Per spec 07-auth_roles.md: User.role is only a display marker — these flags are the real source of truth
 * for deciding which dashboard links to show.
 */
export interface UserCapabilities {
  isLandlord: boolean;
  isTenant: boolean;
  isEmployee: boolean;
  isAdmin: boolean;
}

const DEFAULT_CAPABILITIES: UserCapabilities = {
  isLandlord: false,
  isTenant: false,
  isEmployee: false,
  isAdmin: false,
};

interface AuthContextType {
  isLoggedIn: boolean;
  /**
   * True while the auth state is being read from localStorage on first mount.
   * Guards should wait for this to become false before redirecting.
   */
  isHydrating: boolean;
  user: UserProfile | null;
  /** Live multi-role capabilities fetched from backend — use these for dashboard switching, not user.role */
  capabilities: UserCapabilities;
  login: (userData?: Partial<UserProfile>) => void;
  loginWithToken: (token: string, userData: Partial<UserProfile>) => void;
  logout: () => void;
  toggleLoginDemo: () => void;
  upgradeToLandlord: (houseDetails: { houseName: string; houseAddress: string }) => void;
  setDemoPreset: (preset: DemoPreset) => void;
  refreshCapabilities: () => Promise<void>;

  // Multi-Building Management for Landlord Dashboard
  buildings: BuildingItem[];
  isBuildingsLoading: boolean;
  activeBuildingId: string;
  activeBuilding: BuildingItem;
  selectBuilding: (id: string) => void;
  refreshBuildings: () => Promise<void>;
}

const EMPTY_BUILDING: BuildingItem = {
  id: "",
  name: "",
  address: "",
  totalRooms: 0,
  occupiedRooms: 0,
  vacantRooms: 0,
  expiringRooms: 0,
  depositRooms: 0,
  occupancyRate: "0%",
};

/**
 * Synchronize auth state into browser cookies so Next.js middleware can perform
 * instant server-side redirects on unauthorized routes before HTML rendering.
 */
function syncAuthCookies(
  role?: string | null,
  token?: string | null,
  capabilities?: UserCapabilities | null
) {
  if (typeof document === "undefined") return;
  if (role) {
    document.cookie = `dormio_user_role=${encodeURIComponent(role)}; path=/; max-age=2592000; SameSite=Lax`;
    document.cookie = `dormio_logged_in=true; path=/; max-age=2592000; SameSite=Lax`;
  } else if (role === null) {
    document.cookie = `dormio_user_role=; path=/; max-age=0; SameSite=Lax`;
    document.cookie = `dormio_logged_in=; path=/; max-age=0; SameSite=Lax`;
  }
  if (token) {
    document.cookie = `auth_token=${encodeURIComponent(token)}; path=/; max-age=2592000; SameSite=Lax`;
  } else if (token === null) {
    document.cookie = `auth_token=; path=/; max-age=0; SameSite=Lax`;
  }
  if (capabilities) {
    document.cookie = `dormio_user_capabilities=${encodeURIComponent(JSON.stringify(capabilities))}; path=/; max-age=2592000; SameSite=Lax`;
  } else if (capabilities === null) {
    document.cookie = `dormio_user_capabilities=; path=/; max-age=0; SameSite=Lax`;
  }
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isHydrating: true,
  user: null,
  capabilities: DEFAULT_CAPABILITIES,
  login: () => {},
  loginWithToken: () => {},
  logout: () => {},
  toggleLoginDemo: () => {},
  upgradeToLandlord: () => {},
  setDemoPreset: () => {},
  refreshCapabilities: async () => {},

  buildings: [],
  isBuildingsLoading: true,
  activeBuildingId: "",
  activeBuilding: EMPTY_BUILDING,
  selectBuilding: () => {},
  refreshBuildings: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  // True until localStorage has been read on the first client mount.
  // AuthGuard waits for this to be false before performing any redirect.
  const [isHydrating, setIsHydrating] = useState<boolean>(true);

  // Buildings loaded from API — starts empty until API responds
  const [buildings, setBuildings] = useState<BuildingItem[]>([]);
  const [isBuildingsLoading, setIsBuildingsLoading] = useState<boolean>(true);

  // No active building until API loads real data
  const [activeBuildingId, setActiveBuildingId] = useState<string>("");

  // Live multi-role capabilities — fetched from backend after every login
  const [capabilities, setCapabilities] = useState<UserCapabilities>(DEFAULT_CAPABILITIES);

  /**
   * Fetch live multi-role capabilities from `GET /v1/users/me/capabilities`.
   * Called after every successful login (including dev auto-login) and exposed
   * as `refreshCapabilities()` for callers that need to re-check after a role
   * transition (e.g. after a tenant contract is created).
   */
  const loadCapabilitiesFromApi = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) return;
    try {
      const res = await api.get<{ role: string; capabilities: UserCapabilities }>(
        "/v1/users/me/capabilities",
        { silent: true }
      );
      const data = (res as any)?.data ?? res;
      if (data?.capabilities) {
        setCapabilities(data.capabilities);
        syncAuthCookies(undefined, undefined, data.capabilities);
      }
    } catch {
      // Silently fail — capabilities will remain at DEFAULT_CAPABILITIES
    }
  }, []);

  /**
   * Fetch real boarding houses from the backend and sync the buildings state.
   */
  const loadBuildingsFromApi = useCallback(async () => {
    setIsBuildingsLoading(true);
    try {
      let token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!token && typeof window !== "undefined") {
        // Auto-login to obtain token in dev with real seeded landlord account
        try {
          const loginRes = await api.post<any>(
            "/v1/auth/login",
            {
              identifier: "0344265925",
              password: "123456789",
            },
            { silent: true }
          );
          const data = loginRes?.data || loginRes;
          if (data?.token && typeof data.token === "string") {
            token = data.token;
            localStorage.setItem("auth_token", data.token);
            if (data.user?.id) localStorage.setItem("dormio_user_id", String(data.user.id));
            if (data.user?.username) localStorage.setItem("dormio_user_name", data.user.username);
            if (data.user?.email) localStorage.setItem("dormio_user_email", data.user.email);
            if (data.user?.phoneNumber) localStorage.setItem("dormio_user_phone", data.user.phoneNumber);
          }
        } catch {
          // Ignore dev login error
        }
      }

      let houses: any[] = [];
      try {
        houses = await getMyBoardingHouses({ silent: true });
      } catch {
        // If 401 Unauthorized, token might be invalid or stale, retry login once
        if (typeof window !== "undefined") {
          try {
            const loginRes = await api.post<any>(
              "/v1/auth/login",
              {
                identifier: "0344265925",
                password: "123456789",
              },
              { silent: true }
            );
            const data = loginRes?.data || loginRes;
            if (data?.token && typeof data.token === "string") {
              localStorage.setItem("auth_token", data.token);
              houses = await getMyBoardingHouses({ silent: true });
            }
          } catch {
            houses = [];
          }
        }
      }

      if (houses && houses.length > 0) {
        const mapped = houses.map((h) => ({
          id: h.id,
          name: h.name,
          address: [h.houseNumber, h.street, h.ward, h.district, h.province]
            .filter(Boolean)
            .join(", "),
          totalRooms: h.totalRooms,
          occupiedRooms: 0,
          vacantRooms: 0,
          expiringRooms: 0,
          depositRooms: 0,
          occupancyRate: "0%",
        }));
        setBuildings(mapped);
        setActiveBuildingId((prev) => {
          const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const saved = typeof window !== "undefined" ? localStorage.getItem("dormio_active_building_id") : null;
          const validSaved = saved && UUID_RE.test(saved) && mapped.some((b) => b.id === saved);
          const validPrev = prev && UUID_RE.test(prev) && mapped.some((b) => b.id === prev);
          const nextId = validPrev ? prev : validSaved ? saved! : mapped[0].id;
          if (typeof window !== "undefined") localStorage.setItem("dormio_active_building_id", nextId);
          return nextId;
        });
      } else {
        setBuildings([]);
        setActiveBuildingId("");
      }
    } catch (e) {
      console.error("Failed to load buildings from API:", e);
    } finally {
      setIsBuildingsLoading(false);
    }
  }, []);

  // Read initial session or auto-login default test landlord
  useEffect(() => {
    const savedState = localStorage.getItem("dormio_logged_in");
    const savedToken = localStorage.getItem("auth_token");
    const savedRole = localStorage.getItem("dormio_user_role") as "tenant" | "landlord" | "admin" | "poster" | "employee" | null;
    const savedHouseName = localStorage.getItem("dormio_house_name");
    const savedHouseAddress = localStorage.getItem("dormio_house_address");
    const savedBuildingId = localStorage.getItem("dormio_active_building_id");
    const savedName = localStorage.getItem("dormio_user_name");
    const savedEmail = localStorage.getItem("dormio_user_email");
    const savedPhone = localStorage.getItem("dormio_user_phone");
    const savedId = localStorage.getItem("dormio_user_id");

    if (savedState === "true" && (savedToken || savedRole)) {
      const resolvedRole = savedRole || "landlord";
      setIsLoggedIn(true);
      setUser({
        id: savedId || undefined,
        name: savedName || "Nguyễn Quang Huy",
        email: savedEmail || "ngquanghuy.work@gmail.com",
        phone: savedPhone || "0344265925",
        role: resolvedRole,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        houseName: savedHouseName || undefined,
        houseAddress: savedHouseAddress || undefined,
      });

      if (savedBuildingId) {
        setActiveBuildingId(savedBuildingId);
      }

      // Hydration complete — user state is resolved from localStorage
      setIsHydrating(false);
      syncAuthCookies(resolvedRole, savedToken || undefined);
      loadBuildingsFromApi();
      loadCapabilitiesFromApi();
    } else {
      // In local dev, auto-authenticate default test landlord so real API requests are active
      loadBuildingsFromApi().then(() => {
        setIsLoggedIn(true);
        setUser({
          id: typeof window !== "undefined" ? localStorage.getItem("dormio_user_id") || undefined : undefined,
          name: typeof window !== "undefined" ? localStorage.getItem("dormio_user_name") || "Nguyễn Quang Huy" : "Nguyễn Quang Huy",
          email: typeof window !== "undefined" ? localStorage.getItem("dormio_user_email") || "ngquanghuy.work@gmail.com" : "ngquanghuy.work@gmail.com",
          phone: typeof window !== "undefined" ? localStorage.getItem("dormio_user_phone") || "0344265925" : "0344265925",
          role: "landlord",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        });
        if (typeof window !== "undefined") {
          localStorage.setItem("dormio_logged_in", "true");
          localStorage.setItem("dormio_user_role", "landlord");
          localStorage.setItem("dormio_user_name", "Nguyễn Quang Huy");
          localStorage.setItem("dormio_user_email", "ngquanghuy.work@gmail.com");
          localStorage.setItem("dormio_user_phone", "0344265925");
        }
        // Hydration complete — dev auto-login resolved
        setIsHydrating(false);
        syncAuthCookies("landlord", null);
        loadCapabilitiesFromApi();
      });
    }
  }, [loadBuildingsFromApi, loadCapabilitiesFromApi]);

  const selectBuilding = (id: string) => {
    setActiveBuildingId(id);
    localStorage.setItem("dormio_active_building_id", id);
  };

  const login = (userData?: Partial<UserProfile>) => {
    const role = userData?.role || "tenant";
    const updatedUser: UserProfile = {
      id: userData?.id,
      name: userData?.name || "User",
      email: userData?.email || "",
      phone: userData?.phone || "",
      role,
      avatar: userData?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      houseName: userData?.houseName,
      houseAddress: userData?.houseAddress,
    };
    setIsLoggedIn(true);
    setUser(updatedUser);
    localStorage.setItem("dormio_logged_in", "true");
    localStorage.setItem("dormio_user_role", updatedUser.role);
    syncAuthCookies(updatedUser.role);
    if (updatedUser.id) localStorage.setItem("dormio_user_id", updatedUser.id);
    if (updatedUser.name) localStorage.setItem("dormio_user_name", updatedUser.name);
    if (updatedUser.email) localStorage.setItem("dormio_user_email", updatedUser.email);
    if (updatedUser.phone) localStorage.setItem("dormio_user_phone", updatedUser.phone);
  };

  // Called by login/register pages after receiving a real JWT token from the backend
  const loginWithToken = (token: string, userData: Partial<UserProfile>) => {
    const resolvedRole = (userData.role as UserProfile["role"]) || "poster";
    const updatedUser: UserProfile = {
      id: userData.id,
      name: userData.name || "User",
      email: userData.email || "",
      phone: userData.phone || "",
      role: resolvedRole,
      avatar: userData.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      houseName: userData.houseName,
      houseAddress: userData.houseAddress,
      mustChangePassword: userData.mustChangePassword,
    };
    setIsLoggedIn(true);
    setUser(updatedUser);
    localStorage.setItem("auth_token", token);
    localStorage.setItem("dormio_logged_in", "true");
    localStorage.setItem("dormio_user_role", resolvedRole);
    syncAuthCookies(resolvedRole, token);
    if (userData.id) localStorage.setItem("dormio_user_id", userData.id);
    if (userData.name) localStorage.setItem("dormio_user_name", userData.name);
    if (userData.email) localStorage.setItem("dormio_user_email", userData.email);
    if (userData.phone) localStorage.setItem("dormio_user_phone", userData.phone);

    // Immediately load real buildings so all dashboard pages use real UUIDs
    if (resolvedRole === "landlord") {
      loadBuildingsFromApi();
    }

    // Load live capabilities for all roles — a landlord may also be a tenant, etc.
    loadCapabilitiesFromApi();
  };

  const upgradeToLandlord = (houseDetails: { houseName: string; houseAddress: string }) => {
    const updatedUser: UserProfile = {
      id: user?.id,
      name: user?.name || "Landlord",
      email: user?.email || "",
      phone: user?.phone || "",
      role: "landlord",
      avatar: user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      houseName: houseDetails.houseName,
      houseAddress: houseDetails.houseAddress,
    };
    setIsLoggedIn(true);
    setUser(updatedUser);

    // Reload buildings + capabilities from API after profile upgrade
    loadBuildingsFromApi();
    loadCapabilitiesFromApi();

    localStorage.setItem("dormio_logged_in", "true");
    localStorage.setItem("dormio_user_role", "landlord");
    syncAuthCookies("landlord");
    localStorage.setItem("dormio_house_name", houseDetails.houseName);
    localStorage.setItem("dormio_house_address", houseDetails.houseAddress);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setCapabilities(DEFAULT_CAPABILITIES);
    syncAuthCookies(null, null, null);
    localStorage.removeItem("dormio_logged_in");
    localStorage.removeItem("dormio_user_role");
    localStorage.removeItem("dormio_house_name");
    localStorage.removeItem("dormio_house_address");
    localStorage.removeItem("dormio_active_building_id");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("dormio_user_id");
    localStorage.removeItem("dormio_user_name");
    localStorage.removeItem("dormio_user_email");
    localStorage.removeItem("dormio_user_phone");
  };

  const toggleLoginDemo = () => {
    if (isLoggedIn) {
      logout();
    } else {
      login({ role: "tenant" });
    }
  };

  const setDemoPreset = (preset: DemoPreset) => {
    if (preset === "guest") {
      logout();
    } else if (preset === "tenant") {
      api.post<any>("/v1/auth/login", {
        identifier: "0912345678",
        password: "Secret@123",
      })
        .then((res) => {
          const data = res?.data || res;
          if (data?.token && data?.user) {
            loginWithToken(data.token, {
              id: data.user.id,
              name: data.user.username || "Trần Thị Thuỳ Dung (Khách thuê)",
              email: data.user.email || "dung.tran@gmail.com",
              role: "tenant",
            });
          }
        })
        .catch(() => {
          login({
            name: "Trần Thị Thuỳ Dung (Khách thuê)",
            email: "dung.tran@gmail.com",
            role: "tenant",
            houseName: undefined,
            houseAddress: undefined,
          });
        });
      localStorage.removeItem("dormio_house_name");
      localStorage.removeItem("dormio_house_address");
    } else if (preset === "landlord_empty") {
      login({
        name: "Trần Văn Chủ Trọ (Mới)",
        email: "chutromoi@dormio.vn",
        role: "landlord",
        houseName: undefined,
        houseAddress: undefined,
      });
      localStorage.removeItem("dormio_house_name");
      localStorage.removeItem("dormio_house_address");
    } else if (preset === "landlord_active" || preset === "admin") {
      api.post<any>("/v1/auth/login", {
        identifier: "0344265925",
        password: "123456789",
      })
        .then((res) => {
          const data = res?.data || res;
          if (data?.token && data?.user) {
            loginWithToken(data.token, {
              id: data.user.id,
              name: data.user.username || "Nguyễn Quang Huy (Chủ trọ)",
              email: data.user.email || "ngquanghuy.work@gmail.com",
              role: preset === "admin" ? "admin" : "landlord",
            });
          }
        })
        .catch(() => {
          login({
            name: "Nguyễn Quang Huy (Chủ trọ)",
            email: "ngquanghuy.work@gmail.com",
            role: preset === "admin" ? "admin" : "landlord",
          });
        });
    } else if (preset === "staff") {
      api.post<any>("/v1/auth/login", {
        identifier: "0901122334",
        password: "Secret@123",
      })
        .then((res) => {
          const data = res?.data || res;
          if (data?.token && data?.user) {
            loginWithToken(data.token, {
              id: data.user.id,
              name: data.user.username || "Phạm Văn Bảo (Nhân viên)",
              email: data.user.email || "bao.pham@dormio.vn",
              role: "employee",
            });
          }
        })
        .catch(() => {
          login({
            name: "Phạm Văn Bảo (Nhân viên)",
            email: "bao.pham@dormio.vn",
            role: "employee",
          });
        });
      localStorage.removeItem("dormio_house_name");
      localStorage.removeItem("dormio_house_address");
    }
  };

  // Find active building — returns EMPTY_BUILDING sentinel if buildings not loaded yet
  const activeBuilding = buildings.find(b => b.id === activeBuildingId) || buildings[0] || EMPTY_BUILDING;

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isHydrating,
        user,
        capabilities,
        login,
        loginWithToken,
        logout,
        toggleLoginDemo,
        upgradeToLandlord,
        setDemoPreset,
        refreshCapabilities: loadCapabilitiesFromApi,
        buildings,
        isBuildingsLoading,
        activeBuildingId,
        activeBuilding,
        selectBuilding,
        refreshBuildings: loadBuildingsFromApi,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
