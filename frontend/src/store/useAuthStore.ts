import { create } from "zustand";
import { User, UserRole } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const DEFAULT_MOCK_USER: User = {
  id: "22222222-2222-2222-2222-222222222222",
  fullName: "Nguyễn Văn Chủ Nhà",
  email: "landlord@dormio.vn",
  phone: "0902000002",
  role: "LANDLORD",
  avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
  isActive: true,
  createdAt: new Date().toISOString(),
};

export const useAuthStore = create<AuthState>((set) => ({
  user: DEFAULT_MOCK_USER,
  token: "mock-jwt-token-dormio",
  isAuthenticated: true,

  setAuth: (user: User, token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    }
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
    set({ user: null, token: null, isAuthenticated: false });
  },

  switchRole: (role: UserRole) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, role };
      return { user: updatedUser };
    });
  },
}));
