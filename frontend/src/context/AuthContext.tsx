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

export type DemoPreset = "guest" | "tenant" | "landlord_empty" | "landlord_active" | "admin";

interface AuthContextType {
  isLoggedIn: boolean;
  user: UserProfile | null;
  login: (userData?: Partial<UserProfile>) => void;
  logout: () => void;
  toggleLoginDemo: () => void;
  upgradeToLandlord: (houseDetails: { houseName: string; houseAddress: string }) => void;
  setDemoPreset: (preset: DemoPreset) => void;
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
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Read initial state from localStorage if available
  useEffect(() => {
    const savedState = localStorage.getItem("dormio_logged_in");
    const savedRole = localStorage.getItem("dormio_user_role") as "tenant" | "landlord" | "admin" | null;
    const savedHouseName = localStorage.getItem("dormio_house_name");
    const savedHouseAddress = localStorage.getItem("dormio_house_address");

    if (savedState === "true") {
      setIsLoggedIn(true);
      setUser({
        ...defaultUser,
        role: savedRole || "tenant",
        houseName: savedHouseName || undefined,
        houseAddress: savedHouseAddress || undefined,
      });
    }
  }, []);

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
