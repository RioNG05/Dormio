import { getStoredLocale, setStoredLocale, type SupportedLocale } from "@/utils";

export interface AppState {
  locale: SupportedLocale;
  activeBuildingId: string;
  sidebarCollapsed: boolean;
}

class AppStore {
  private state: AppState = {
    locale: "vi",
    activeBuildingId: "b1",
    sidebarCollapsed: false,
  };

  private listeners: Set<(state: AppState) => void> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      this.state.locale = getStoredLocale();
      const savedBuilding = localStorage.getItem("dormio_active_building_id");
      if (savedBuilding) {
        this.state.activeBuildingId = savedBuilding;
      }
    }
  }

  getState(): AppState {
    return this.state;
  }

  setLocale(locale: SupportedLocale): void {
    this.state = { ...this.state, locale };
    setStoredLocale(locale);
    this.notify();
  }

  setActiveBuildingId(activeBuildingId: string): void {
    this.state = { ...this.state, activeBuildingId };
    if (typeof window !== "undefined") {
      localStorage.setItem("dormio_active_building_id", activeBuildingId);
    }
    this.notify();
  }

  setSidebarCollapsed(sidebarCollapsed: boolean): void {
    this.state = { ...this.state, sidebarCollapsed };
    this.notify();
  }

  subscribe(listener: (state: AppState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }
}

export const appStore = new AppStore();
