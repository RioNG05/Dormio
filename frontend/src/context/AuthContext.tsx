"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  role: "tenant" | "landlord" | "admin";
  avatar: string;
  houseName?: string;
  houseAddress?: string;
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
  logout: () => void;
  toggleLoginDemo: () => void;
  upgradeToLandlord: (houseDetails: { houseName: string; houseAddress: string }) => void;
  setDemoPreset: (preset: DemoPreset) => void;

  // Multi-Building Management for Landlord Dashboard
  buildings: BuildingItem[];
  activeBuildingId: string;
  activeBuilding: BuildingItem;
  selectBuilding: (id: string) => void;
}

const defaultUser: UserProfile = {
  name: "Nguyễn Văn A",
  email: "nguyenvana@gmail.com",
  phone: "0987654321",
  role: "tenant",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
};

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: null,
  login: () => {},
  logout: () => {},
  toggleLoginDemo: () => {},
  upgradeToLandlord: () => {},
  setDemoPreset: () => {},

  buildings: [],
  activeBuildingId: "b1",
  activeBuilding: {
    id: "b1",
    name: "Dormio Premier Quận 1",
    address: "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
    totalRooms: 10,
    occupiedRooms: 7,
    vacantRooms: 2,
    expiringRooms: 1,
    depositRooms: 1,
    occupancyRate: "70%"
  },
  selectBuilding: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Default buildings list for landlord
  const [buildings, setBuildings] = useState<BuildingItem[]>([
    {
      id: "b1",
      name: "Dormio Premier Quận 1",
      address: "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
      totalRooms: 10,
      occupiedRooms: 7,
      vacantRooms: 2,
      expiringRooms: 1,
      depositRooms: 1,
      occupancyRate: "70%"
    },
    {
      id: "b2",
      name: "Dormio Campus Cầu Giấy",
      address: "88 Cầu Giấy, Phường Dịch Vọng, Cầu Giấy, Hà Nội",
      totalRooms: 15,
      occupiedRooms: 12,
      vacantRooms: 2,
      expiringRooms: 1,
      depositRooms: 0,
      occupancyRate: "80%"
    },
    {
      id: "b3",
      name: "Dormio Luxury Bình Thạnh",
      address: "456 Điện Biên Phủ, Phường 25, Quận Bình Thạnh, TP.HCM",
      totalRooms: 20,
      occupiedRooms: 18,
      vacantRooms: 1,
      expiringRooms: 1,
      depositRooms: 2,
      occupancyRate: "90%"
    }
  ]);

  // Initially default to FIRST configured building (b1)
  const [activeBuildingId, setActiveBuildingId] = useState<string>("b1");

  // Keep buildings synchronized if user updates houseName
  useEffect(() => {
    if (user?.houseName) {
      setBuildings(prev => [
        {
          ...prev[0],
          name: user.houseName || prev[0].name,
          address: user.houseAddress || prev[0].address,
        },
        ...prev.slice(1)
      ]);
    }
  }, [user?.houseName, user?.houseAddress]);

  // Read initial state from localStorage if available
  useEffect(() => {
    const savedState = localStorage.getItem("dormio_logged_in");
    const savedRole = localStorage.getItem("dormio_user_role") as "tenant" | "landlord" | "admin" | null;
    const savedHouseName = localStorage.getItem("dormio_house_name");
    const savedHouseAddress = localStorage.getItem("dormio_house_address");
    const savedBuildingId = localStorage.getItem("dormio_active_building_id");

    if (savedState === "true") {
      setIsLoggedIn(true);
      setUser({
        ...defaultUser,
        role: savedRole || "tenant",
        houseName: savedHouseName || undefined,
        houseAddress: savedHouseAddress || undefined,
      });

      if (savedBuildingId) {
        setActiveBuildingId(savedBuildingId);
      }
    }
  }, []);

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

  const upgradeToLandlord = (houseDetails: { houseName: string; houseAddress: string }) => {
    const updatedUser: UserProfile = {
      ...(user || defaultUser),
      role: "landlord",
      houseName: houseDetails.houseName,
      houseAddress: houseDetails.houseAddress,
    };
    setIsLoggedIn(true);
    setUser(updatedUser);

    setBuildings(prev => [
      {
        ...prev[0],
        name: houseDetails.houseName,
        address: houseDetails.houseAddress,
      },
      ...prev.slice(1)
    ]);

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
      login({
        name: "Nguyễn Văn A (Khách thuê)",
        email: "nguyenvana@gmail.com",
        role: "tenant",
        houseName: undefined,
        houseAddress: undefined,
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
    } else if (preset === "landlord_active") {
      login({
        name: "Lê Hoàng Nam (Chủ trọ)",
        email: "nam.le@dormio.vn",
        role: "landlord",
        houseName: "Dormio Premier Quận 1",
        houseAddress: "123 Nguyễn Huệ, Quận 1, TP.HCM",
      });
      localStorage.setItem("dormio_house_name", "Dormio Premier Quận 1");
      localStorage.setItem("dormio_house_address", "123 Nguyễn Huệ, Quận 1, TP.HCM");
    } else if (preset === "admin") {
      login({
        name: "Quản Trị Viên System",
        email: "admin@dormio.vn",
        role: "admin",
      });
    }
  };

  // Find active building or fallback to first
  const activeBuilding = buildings.find(b => b.id === activeBuildingId) || buildings[0];

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        login,
        logout,
        toggleLoginDemo,
        upgradeToLandlord,
        setDemoPreset,
        buildings,
        activeBuildingId,
        activeBuilding,
        selectBuilding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
