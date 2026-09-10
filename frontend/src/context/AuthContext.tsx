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

export type DemoPreset = "guest" | "tenant" | "landlord_empty" | "landlord_active" | "admin";

interface AuthContextType {
  isLoggedIn: boolean;
  user: UserProfile | null;
  login: (userData?: Partial<UserProfile>) => void;
  loginWithToken: (token: string, userData: Partial<UserProfile>) => void;
  logout: () => void;
  toggleLoginDemo: () => void;
  upgradeToLandlord: (houseDetails: { houseName: string; houseAddress: string }) => void;
  setDemoPreset: (preset: DemoPreset) => void;

  // Multi-Building Management for Landlord Dashboard
  buildings: BuildingItem[];
  isBuildingsLoading: boolean;
  activeBuildingId: string;
  activeBuilding: BuildingItem;
  selectBuilding: (id: string) => void;
  refreshBuildings: () => Promise<void>;
}

const defaultUser: UserProfile = {
  name: "Nguyễn Văn A",
  email: "nguyenvana@gmail.com",
  phone: "0987654321",
  role: "tenant",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
};

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

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: null,
  login: () => {},
  loginWithToken: () => {},
  logout: () => {},
  toggleLoginDemo: () => {},
  upgradeToLandlord: () => {},
  setDemoPreset: () => {},

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

  // Buildings loaded from API — starts empty until API responds
  const [buildings, setBuildings] = useState<BuildingItem[]>([]);
  const [isBuildingsLoading, setIsBuildingsLoading] = useState<boolean>(true);

  // No active building until API loads real data
  const [activeBuildingId, setActiveBuildingId] = useState<string>("");

  // NOTE: houseName/houseAddress from localStorage are legacy fields.
  // Buildings are now fully managed by the API — no local override needed.
  /**
   * Fetch real boarding houses from the backend and sync the buildings state.
   * Falls back silently — mock data remains if the landlord has no properties yet.
   */
  const loadBuildingsFromApi = useCallback(async () => {
    setIsBuildingsLoading(true);
    try {
      let token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!token && typeof window !== "undefined") {
        // Auto-login to obtain token in dev
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

  // Read initial state from localStorage if available
  useEffect(() => {
    const savedState = localStorage.getItem("dormio_logged_in");
    const savedToken = localStorage.getItem("auth_token");
    const savedRole = localStorage.getItem("dormio_user_role") as "tenant" | "landlord" | "admin" | null;
    const savedHouseName = localStorage.getItem("dormio_house_name");
    const savedHouseAddress = localStorage.getItem("dormio_house_address");
    const savedBuildingId = localStorage.getItem("dormio_active_building_id");
    const savedName = localStorage.getItem("dormio_user_name");
    const savedEmail = localStorage.getItem("dormio_user_email");
    const savedPhone = localStorage.getItem("dormio_user_phone");
    const savedId = localStorage.getItem("dormio_user_id");

    if (savedState === "true" && (savedToken || savedRole)) {
      const resolvedRole = (savedRole as UserProfile["role"]) || "tenant";
      setIsLoggedIn(true);
      setUser({
        ...defaultUser,
        id: savedId || undefined,
        name: savedName || defaultUser.name,
        email: savedEmail || defaultUser.email,
        phone: savedPhone || defaultUser.phone,
        role: resolvedRole,
        houseName: savedHouseName || undefined,
        houseAddress: savedHouseAddress || undefined,
      });

      if (savedBuildingId) {
        setActiveBuildingId(savedBuildingId);
      }

      loadBuildingsFromApi();
    } else {
      // In local dev, auto-authenticate default test landlord so real API requests are active
      loadBuildingsFromApi().then(() => {
        setIsLoggedIn(true);
        setUser({
          ...defaultUser,
          id: typeof window !== "undefined" ? localStorage.getItem("dormio_user_id") || undefined : undefined,
          name: "Nguyễn Quang Huy",
          email: "ngquanghuy.work@gmail.com",
          role: "landlord",
        });
        if (typeof window !== "undefined") {
          localStorage.setItem("dormio_logged_in", "true");
          localStorage.setItem("dormio_user_role", "landlord");
        }
      });
    }
  }, [loadBuildingsFromApi]);

  const selectBuilding = (id: string) => {
    setActiveBuildingId(id);
    localStorage.setItem("dormio_active_building_id", id);
  };

  const login = (userData?: Partial<UserProfile>) => {
    const updatedUser: UserProfile = {
      ...defaultUser,
      ...userData,
      role: userData?.role || "tenant",
    };
    setIsLoggedIn(true);
    setUser(updatedUser);
    localStorage.setItem("dormio_logged_in", "true");
    localStorage.setItem("dormio_user_role", updatedUser.role);
  };

  // Called by login/register pages after receiving a real JWT token from the backend
  const loginWithToken = (token: string, userData: Partial<UserProfile>) => {
    const resolvedRole = (userData.role as UserProfile["role"]) || "poster";
    const updatedUser: UserProfile = {
      ...defaultUser,
      ...userData,
      role: resolvedRole,
    };
    setIsLoggedIn(true);
    setUser(updatedUser);
    localStorage.setItem("auth_token", token);
    localStorage.setItem("dormio_logged_in", "true");
    localStorage.setItem("dormio_user_role", resolvedRole);
    if (userData.id) localStorage.setItem("dormio_user_id", userData.id);
    if (userData.name) localStorage.setItem("dormio_user_name", userData.name);
    if (userData.email) localStorage.setItem("dormio_user_email", userData.email);
    if (userData.phone) localStorage.setItem("dormio_user_phone", userData.phone);

    // Immediately load real buildings so all dashboard pages use real UUIDs
    if (resolvedRole === "landlord") {
      loadBuildingsFromApi();
    }
  };

  const upgradeToLandlord = (houseDetails: { houseName: string; houseAddress: string }) => {
    const updatedUser: UserProfile = {
      ...(user || defaultUser),
      role: "landlord",
      houseName: houseDetails.houseName,
      houseAddress: houseDetails.houseAddress,
    };
    setIsLoggedIn(true);
    setUser(updatedUser);

    // Reload buildings from API after profile upgrade
    loadBuildingsFromApi();

    localStorage.setItem("dormio_logged_in", "true");
    localStorage.setItem("dormio_user_role", "landlord");
    localStorage.setItem("dormio_house_name", houseDetails.houseName);
    localStorage.setItem("dormio_house_address", houseDetails.houseAddress);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
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
    }
  };

  // Find active building — returns EMPTY_BUILDING sentinel if buildings not loaded yet
  const activeBuilding = buildings.find(b => b.id === activeBuildingId) || buildings[0] || EMPTY_BUILDING;

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        login,
        loginWithToken,
        logout,
        toggleLoginDemo,
        upgradeToLandlord,
        setDemoPreset,
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
