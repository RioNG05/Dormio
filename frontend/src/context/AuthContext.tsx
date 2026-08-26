"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface UserProfile {
  name: string;
  email: string;
  role: "tenant" | "landlord" | "admin";
  avatar: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: UserProfile | null;
  login: (userData?: Partial<UserProfile>) => void;
  logout: () => void;
  toggleLoginDemo: () => void;
}

const defaultUser: UserProfile = {
  name: "Nguyễn Văn A",
  email: "nguyenvana@gmail.com",
  role: "tenant",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
};

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: null,
  login: () => {},
  logout: () => {},
  toggleLoginDemo: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Read initial state from localStorage if available
  useEffect(() => {
    const savedState = localStorage.getItem("dormio_logged_in");
    if (savedState === "true") {
      setIsLoggedIn(true);
      setUser(defaultUser);
    }
  }, []);

  const login = (userData?: Partial<UserProfile>) => {
    const updatedUser = { ...defaultUser, ...userData };
    setIsLoggedIn(true);
    setUser(updatedUser);
    localStorage.setItem("dormio_logged_in", "true");
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem("dormio_logged_in");
  };

  const toggleLoginDemo = () => {
    if (isLoggedIn) {
      logout();
    } else {
      login();
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
