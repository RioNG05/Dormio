'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getMyBoardingHouses } from '@/services/boarding-house.service'
import { getMyTenancies, TenantTenancyItem } from '@/services/contract.service'
import { api } from '@/services/api'

export type { TenantTenancyItem }

export interface UserProfile {
  id?: string
  name: string
  email: string
  phone?: string
  role: 'tenant' | 'landlord' | 'admin' | 'poster' | 'employee'
  avatar: string
  houseName?: string
  houseAddress?: string
  mustChangePassword?: boolean
}

export interface BuildingItem {
  id: string
  name: string
  address: string
  totalRooms: number
  occupiedRooms: number
  vacantRooms: number
  expiringRooms: number
  depositRooms: number
  occupancyRate: string
}

export type DemoPreset =
  'guest' | 'tenant' | 'landlord_empty' | 'landlord_active' | 'admin' | 'staff'

/**
 * Live multi-role capabilities for the current user.
 * Derived from relationship queries on the backend (BoardingHouse, TenantContract, EmployeeAssignment).
 * Per spec 07-auth_roles.md: User.role is only a display marker — these flags are the real source of truth
 * for deciding which dashboard links to show.
 */
export interface UserCapabilities {
  isLandlord: boolean
  isTenant: boolean
  isEmployee: boolean
  isAdmin: boolean
}

const DEFAULT_CAPABILITIES: UserCapabilities = {
  isLandlord: false,
  isTenant: false,
  isEmployee: false,
  isAdmin: false,
}

interface AuthContextType {
  isLoggedIn: boolean
  /**
   * True while the auth state is being read from localStorage on first mount.
   * Guards should wait for this to become false before redirecting.
   */
  isHydrating: boolean
  user: UserProfile | null
  /** Live multi-role capabilities fetched from backend — use these for dashboard switching, not user.role */
  capabilities: UserCapabilities
  login: (userData?: Partial<UserProfile>) => void
  loginWithToken: (token: string, userData: Partial<UserProfile>) => void
  logout: () => void
  toggleLoginDemo: () => void
  upgradeToLandlord: (houseDetails: { houseName: string; houseAddress: string }) => void
  setDemoPreset: (preset: DemoPreset) => void
  refreshCapabilities: () => Promise<void>
  updateAvatar: (avatarUrl: string) => void
  updateUserProfile: (data: Partial<UserProfile>) => void

  // Multi-Building Management for Landlord Dashboard
  buildings: BuildingItem[]
  isBuildingsLoading: boolean
  activeBuildingId: string
  activeBuilding: BuildingItem
  selectBuilding: (id: string) => void
  refreshBuildings: () => Promise<void>

  // Multi-Room Tenancy Management for Tenant Dashboard
  tenancies: TenantTenancyItem[]
  isTenanciesLoading: boolean
  activeTenancyId: string
  activeTenancy: TenantTenancyItem | null
  selectTenancy: (contractId: string) => void
  refreshTenancies: () => Promise<void>
}

const EMPTY_BUILDING: BuildingItem = {
  id: '',
  name: '',
  address: '',
  totalRooms: 0,
  occupiedRooms: 0,
  vacantRooms: 0,
  expiringRooms: 0,
  depositRooms: 0,
  occupancyRate: '0%',
}

/**
 * Synchronize auth state into browser cookies so Next.js middleware can perform
 * instant server-side redirects on unauthorized routes before HTML rendering.
 */
function syncAuthCookies(
  role?: string | null,
  token?: string | null,
  capabilities?: UserCapabilities | null,
) {
  if (typeof document === 'undefined') return
  if (role) {
    document.cookie = `dormio_user_role=${encodeURIComponent(role)}; path=/; max-age=2592000; SameSite=Lax`
    document.cookie = `dormio_logged_in=true; path=/; max-age=2592000; SameSite=Lax`
  } else if (role === null) {
    document.cookie = `dormio_user_role=; path=/; max-age=0; SameSite=Lax`
    document.cookie = `dormio_logged_in=; path=/; max-age=0; SameSite=Lax`
  }
  if (token) {
    document.cookie = `auth_token=${encodeURIComponent(token)}; path=/; max-age=2592000; SameSite=Lax`
  } else if (token === null) {
    document.cookie = `auth_token=; path=/; max-age=0; SameSite=Lax`
  }
  if (capabilities) {
    document.cookie = `dormio_user_capabilities=${encodeURIComponent(JSON.stringify(capabilities))}; path=/; max-age=2592000; SameSite=Lax`
  } else if (capabilities === null) {
    document.cookie = `dormio_user_capabilities=; path=/; max-age=0; SameSite=Lax`
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
  updateAvatar: () => {},
  updateUserProfile: () => {},

  buildings: [],
  isBuildingsLoading: true,
  activeBuildingId: '',
  activeBuilding: EMPTY_BUILDING,
  selectBuilding: () => {},
  refreshBuildings: async () => {},

  tenancies: [],
  isTenanciesLoading: true,
  activeTenancyId: '',
  activeTenancy: null,
  selectTenancy: () => {},
  refreshTenancies: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const [user, setUser] = useState<UserProfile | null>(null)

  // True until localStorage has been read on the first client mount.
  // AuthGuard waits for this to be false before performing any redirect.
  const [isHydrating, setIsHydrating] = useState<boolean>(true)

  // Buildings loaded from API — starts empty until API responds
  const [buildings, setBuildings] = useState<BuildingItem[]>([])
  const [isBuildingsLoading, setIsBuildingsLoading] = useState<boolean>(true)

  // No active building until API loads real data
  const [activeBuildingId, setActiveBuildingId] = useState<string>('')

  // Tenancies loaded from API for tenant multi-room scoping
  const [tenancies, setTenancies] = useState<TenantTenancyItem[]>([])
  const [isTenanciesLoading, setIsTenanciesLoading] = useState<boolean>(true)
  const [activeTenancyId, setActiveTenancyId] = useState<string>('')

  // Live multi-role capabilities — initialized from localStorage cache if available
  const [capabilities, setCapabilities] = useState<UserCapabilities>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dormio_user_capabilities')
        if (saved) return JSON.parse(saved)
      } catch {
        // ignore parse error
      }
    }
    return DEFAULT_CAPABILITIES
  })

  /**
   * Fetch live multi-role capabilities from `GET /v1/users/me/capabilities`.
   * Called after every successful login (including dev auto-login) and exposed
   * as `refreshCapabilities()` for callers that need to re-check after a role
   * transition (e.g. after a tenant contract is created).
   */
  const loadCapabilitiesFromApi = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (!token) return
    try {
      const res = await api.get<{ role: string; capabilities: UserCapabilities }>(
        '/v1/users/me/capabilities',
        { silent: true },
      )
      const data = (res as any)?.data ?? res
      if (data?.capabilities) {
        setCapabilities(data.capabilities)
        if (typeof window !== 'undefined') {
          localStorage.setItem('dormio_user_capabilities', JSON.stringify(data.capabilities))
        }
        syncAuthCookies(undefined, undefined, data.capabilities)
      }
    } catch {
      // Silently fail — capabilities will remain at current or cached state
    }
  }, [])

  /**
   * Fetch real boarding houses from the backend and sync the buildings state.
   */
  const loadBuildingsFromApi = useCallback(async () => {
    setIsBuildingsLoading(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      if (!token) {
        setBuildings([])
        setActiveBuildingId('')
        return
      }

      let houses: any[] = []
      try {
        houses = await getMyBoardingHouses({ silent: true })
      } catch {
        houses = []
      }

      if (houses && houses.length > 0) {
        const mapped = houses.map(h => ({
          id: h.id,
          name: h.name,
          address: [h.houseNumber, h.street, h.ward, h.district, h.province]
            .filter(Boolean)
            .join(', '),
          totalRooms: h.totalRooms,
          occupiedRooms: 0,
          vacantRooms: 0,
          expiringRooms: 0,
          depositRooms: 0,
          occupancyRate: '0%',
        }))
        setBuildings(mapped)
        setActiveBuildingId(prev => {
          const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          const saved =
            typeof window !== 'undefined' ? localStorage.getItem('dormio_active_building_id') : null
          const validSaved = saved && UUID_RE.test(saved) && mapped.some(b => b.id === saved)
          const validPrev = prev && UUID_RE.test(prev) && mapped.some(b => b.id === prev)
          const nextId = validPrev ? prev : validSaved ? saved! : mapped[0].id
          if (typeof window !== 'undefined')
            localStorage.setItem('dormio_active_building_id', nextId)
          return nextId
        })
      } else {
        setBuildings([])
        setActiveBuildingId('')
      }
    } catch (e) {
      console.error('Failed to load buildings from API:', e)
    } finally {
      setIsBuildingsLoading(false)
    }
  }, [])

  /**
   * Fetch real active tenancies for tenant across boarding houses and sync activeTenancyId
   */
  const loadTenanciesFromApi = useCallback(async () => {
    setIsTenanciesLoading(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      if (!token) {
        setTenancies([])
        setActiveTenancyId('')
        return
      }

      let fetchedTenancies: TenantTenancyItem[] = []
      try {
        fetchedTenancies = await getMyTenancies({ silent: true })
      } catch {
        fetchedTenancies = []
      }

      if (fetchedTenancies && fetchedTenancies.length > 0) {
        setTenancies(fetchedTenancies)
        setActiveTenancyId(prev => {
          const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          const saved =
            typeof window !== 'undefined' ? localStorage.getItem('dormio_active_tenancy_id') : null
          const validSaved =
            saved && UUID_RE.test(saved) && fetchedTenancies.some(t => t.contractId === saved)
          const validPrev =
            prev && UUID_RE.test(prev) && fetchedTenancies.some(t => t.contractId === prev)
          const primary = fetchedTenancies.find(t => t.isPrimary)
          const nextId = validPrev
            ? prev
            : validSaved
              ? saved!
              : primary
                ? primary.contractId
                : fetchedTenancies[0].contractId
          if (typeof window !== 'undefined')
            localStorage.setItem('dormio_active_tenancy_id', nextId)
          return nextId
        })
      } else {
        setTenancies([])
        setActiveTenancyId('')
      }
    } catch (e) {
      console.error('Failed to load tenancies from API:', e)
    } finally {
      setIsTenanciesLoading(false)
    }
  }, [])

  // Read initial session from localStorage
  useEffect(() => {
    const savedState =
      typeof window !== 'undefined' ? localStorage.getItem('dormio_logged_in') : null
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    const savedRole = (
      typeof window !== 'undefined' ? localStorage.getItem('dormio_user_role') : null
    ) as 'tenant' | 'landlord' | 'admin' | 'poster' | 'employee' | null
    const savedHouseName =
      typeof window !== 'undefined' ? localStorage.getItem('dormio_house_name') : null
    const savedHouseAddress =
      typeof window !== 'undefined' ? localStorage.getItem('dormio_house_address') : null
    const savedBuildingId =
      typeof window !== 'undefined' ? localStorage.getItem('dormio_active_building_id') : null
    const savedTenancyId =
      typeof window !== 'undefined' ? localStorage.getItem('dormio_active_tenancy_id') : null
    const savedName =
      typeof window !== 'undefined' ? localStorage.getItem('dormio_user_name') : null
    const savedEmail =
      typeof window !== 'undefined' ? localStorage.getItem('dormio_user_email') : null
    const savedPhone =
      typeof window !== 'undefined' ? localStorage.getItem('dormio_user_phone') : null
    const savedAvatar =
      typeof window !== 'undefined' ? localStorage.getItem('dormio_user_avatar') : null
    const savedId = typeof window !== 'undefined' ? localStorage.getItem('dormio_user_id') : null
    const savedCapsStr =
      typeof window !== 'undefined' ? localStorage.getItem('dormio_user_capabilities') : null

    if (savedState === 'true' && savedToken) {
      const resolvedRole = savedRole || 'tenant'
      setIsLoggedIn(true)
      setUser({
        id: savedId || undefined,
        name: savedName || 'User',
        email: savedEmail || '',
        phone: savedPhone || '',
        role: resolvedRole,
        avatar:
          savedAvatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        houseName: savedHouseName || undefined,
        houseAddress: savedHouseAddress || undefined,
      })

      if (savedBuildingId) {
        setActiveBuildingId(savedBuildingId)
      }
      if (savedTenancyId) {
        setActiveTenancyId(savedTenancyId)
      }

      let parsedCaps: UserCapabilities | null = null
      if (savedCapsStr) {
        try {
          parsedCaps = JSON.parse(savedCapsStr)
          if (parsedCaps && typeof parsedCaps === 'object') {
            setCapabilities(parsedCaps)
          }
        } catch {
          parsedCaps = null
        }
      }

      // If no valid cached capabilities exist, establish baseline from resolved role
      if (!parsedCaps) {
        const baselineCaps: UserCapabilities = {
          isLandlord: resolvedRole === 'landlord',
          isTenant: resolvedRole === 'tenant',
          isEmployee: resolvedRole === 'employee',
          isAdmin: resolvedRole === 'admin',
        }
        setCapabilities(baselineCaps)
        if (typeof window !== 'undefined') {
          localStorage.setItem('dormio_user_capabilities', JSON.stringify(baselineCaps))
        }
        parsedCaps = baselineCaps
      }

      // Hydration complete — user state and capabilities are resolved from localStorage
      setIsHydrating(false)
      syncAuthCookies(resolvedRole, savedToken, parsedCaps)
      loadBuildingsFromApi()
      loadCapabilitiesFromApi()
      loadTenanciesFromApi()
    } else {
      // User is logged out / unauthenticated guest
      setIsLoggedIn(false)
      setUser(null)
      setBuildings([])
      setActiveBuildingId('')
      setIsBuildingsLoading(false)
      setTenancies([])
      setActiveTenancyId('')
      setIsTenanciesLoading(false)
      setCapabilities(DEFAULT_CAPABILITIES)
      setIsHydrating(false)
      syncAuthCookies(null, null, null)
    }
  }, [loadBuildingsFromApi, loadCapabilitiesFromApi, loadTenanciesFromApi])

  const selectBuilding = (id: string) => {
    setActiveBuildingId(id)
    localStorage.setItem('dormio_active_building_id', id)
  }

  const selectTenancy = (id: string) => {
    setActiveTenancyId(id)
    if (typeof window !== 'undefined') {
      localStorage.setItem('dormio_active_tenancy_id', id)
    }
  }

  const login = (userData?: Partial<UserProfile>) => {
    const role = userData?.role || 'tenant'
    const updatedUser: UserProfile = {
      id: userData?.id,
      name: userData?.name || 'User',
      email: userData?.email || '',
      phone: userData?.phone || '',
      role,
      avatar:
        userData?.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      houseName: userData?.houseName,
      houseAddress: userData?.houseAddress,
    }
    const initialCaps: UserCapabilities = {
      isLandlord: role === 'landlord',
      isTenant: role === 'tenant',
      isEmployee: role === 'employee',
      isAdmin: role === 'admin',
    }
    setIsLoggedIn(true)
    setUser(updatedUser)
    setCapabilities(initialCaps)
    localStorage.setItem('dormio_logged_in', 'true')
    localStorage.setItem('dormio_user_role', updatedUser.role)
    localStorage.setItem('dormio_user_capabilities', JSON.stringify(initialCaps))
    syncAuthCookies(updatedUser.role, undefined, initialCaps)
    if (updatedUser.id) localStorage.setItem('dormio_user_id', updatedUser.id)
    if (updatedUser.name) localStorage.setItem('dormio_user_name', updatedUser.name)
    if (updatedUser.email) localStorage.setItem('dormio_user_email', updatedUser.email)
    if (updatedUser.phone) localStorage.setItem('dormio_user_phone', updatedUser.phone)
    if (updatedUser.avatar) localStorage.setItem('dormio_user_avatar', updatedUser.avatar)
  }

  // Called by login/register pages after receiving a real JWT token from the backend
  const loginWithToken = (token: string, userData: Partial<UserProfile>) => {
    const resolvedRole = (userData.role as UserProfile['role']) || 'poster'
    const updatedUser: UserProfile = {
      id: userData.id,
      name: userData.name || 'User',
      email: userData.email || '',
      phone: userData.phone || '',
      role: resolvedRole,
      avatar:
        userData.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      houseName: userData.houseName,
      houseAddress: userData.houseAddress,
      mustChangePassword: userData.mustChangePassword,
    }
    const initialCaps: UserCapabilities = {
      isLandlord: resolvedRole === 'landlord',
      isTenant: resolvedRole === 'tenant',
      isEmployee: resolvedRole === 'employee',
      isAdmin: resolvedRole === 'admin',
    }
    setIsLoggedIn(true)
    setUser(updatedUser)
    setCapabilities(initialCaps)
    localStorage.setItem('auth_token', token)
    localStorage.setItem('dormio_logged_in', 'true')
    localStorage.setItem('dormio_user_role', resolvedRole)
    localStorage.setItem('dormio_user_capabilities', JSON.stringify(initialCaps))
    syncAuthCookies(resolvedRole, token, initialCaps)
    if (userData.id) localStorage.setItem('dormio_user_id', userData.id)
    if (userData.name) localStorage.setItem('dormio_user_name', userData.name)
    if (userData.email) localStorage.setItem('dormio_user_email', userData.email)
    if (userData.phone) localStorage.setItem('dormio_user_phone', userData.phone)
    if (updatedUser.avatar) localStorage.setItem('dormio_user_avatar', updatedUser.avatar)

    // Immediately load real buildings so all dashboard pages use real UUIDs
    if (resolvedRole === 'landlord') {
      loadBuildingsFromApi()
    }

    // Immediately load real tenancies if tenant
    if (resolvedRole === 'tenant') {
      loadTenanciesFromApi()
    }

    // Load live capabilities for all roles — a landlord may also be a tenant, etc.
    loadCapabilitiesFromApi()
  }

  const upgradeToLandlord = (houseDetails: { houseName: string; houseAddress: string }) => {
    const updatedUser: UserProfile = {
      id: user?.id,
      name: user?.name || 'Landlord',
      email: user?.email || '',
      phone: user?.phone || '',
      role: 'landlord',
      avatar:
        user?.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      houseName: houseDetails.houseName,
      houseAddress: houseDetails.houseAddress,
    }
    const updatedCaps: UserCapabilities = {
      ...capabilities,
      isLandlord: true,
    }
    setIsLoggedIn(true)
    setUser(updatedUser)
    setCapabilities(updatedCaps)
    if (typeof window !== 'undefined') {
      localStorage.setItem('dormio_user_capabilities', JSON.stringify(updatedCaps))
    }

    // Reload buildings + capabilities from API after profile upgrade
    loadBuildingsFromApi()
    loadCapabilitiesFromApi()

    localStorage.setItem('dormio_logged_in', 'true')
    localStorage.setItem('dormio_user_role', 'landlord')
    syncAuthCookies('landlord', undefined, updatedCaps)
    localStorage.setItem('dormio_house_name', houseDetails.houseName)
    localStorage.setItem('dormio_house_address', houseDetails.houseAddress)
  }

  const logout = () => {
    setIsLoggedIn(false)
    setUser(null)
    setBuildings([])
    setActiveBuildingId('')
    setIsBuildingsLoading(false)
    setTenancies([])
    setActiveTenancyId('')
    setIsTenanciesLoading(false)
    setCapabilities(DEFAULT_CAPABILITIES)
    syncAuthCookies(null, null, null)
    localStorage.removeItem('dormio_logged_in')
    localStorage.removeItem('dormio_user_role')
    localStorage.removeItem('dormio_house_name')
    localStorage.removeItem('dormio_house_address')
    localStorage.removeItem('dormio_active_building_id')
    localStorage.removeItem('dormio_active_tenancy_id')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('dormio_user_id')
    localStorage.removeItem('dormio_user_name')
    localStorage.removeItem('dormio_user_email')
    localStorage.removeItem('dormio_user_phone')
    localStorage.removeItem('dormio_user_capabilities')
    localStorage.removeItem('dormio_user_avatar')
  }

  const updateAvatar = useCallback((avatarUrl: string) => {
    setUser(prev => (prev ? { ...prev, avatar: avatarUrl } : null))
    if (typeof window !== 'undefined') {
      localStorage.setItem('dormio_user_avatar', avatarUrl)
    }
  }, [])

  const updateUserProfile = useCallback((data: Partial<UserProfile>) => {
    setUser(prev => (prev ? { ...prev, ...data } : null))
    if (typeof window !== 'undefined') {
      if (data.avatar) localStorage.setItem('dormio_user_avatar', data.avatar)
      if (data.name) localStorage.setItem('dormio_user_name', data.name)
      if (data.email) localStorage.setItem('dormio_user_email', data.email)
      if (data.phone) localStorage.setItem('dormio_user_phone', data.phone)
    }
  }, [])

  const toggleLoginDemo = () => {
    if (isLoggedIn) {
      logout()
    } else {
      login({ role: 'tenant' })
    }
  }

  const setDemoPreset = (preset: DemoPreset) => {
    if (preset === 'guest') {
      logout()
    } else if (preset === 'tenant') {
      api
        .post<any>('/v1/auth/login', {
          identifier: '0912345678',
          password: 'Secret@123',
        })
        .then(res => {
          const data = res?.data || res
          if (data?.token && data?.user) {
            loginWithToken(data.token, {
              id: data.user.id,
              name: data.user.username || 'Trần Thị Thuỳ Dung (Khách thuê)',
              email: data.user.email || 'dung.tran@gmail.com',
              role: 'tenant',
            })
          }
        })
        .catch(() => {
          login({
            name: 'Trần Thị Thuỳ Dung (Khách thuê)',
            email: 'dung.tran@gmail.com',
            role: 'tenant',
            houseName: undefined,
            houseAddress: undefined,
          })
        })
      localStorage.removeItem('dormio_house_name')
      localStorage.removeItem('dormio_house_address')
    } else if (preset === 'landlord_empty') {
      login({
        name: 'Trần Văn Chủ Trọ (Mới)',
        email: 'chutromoi@dormio.vn',
        role: 'landlord',
        houseName: undefined,
        houseAddress: undefined,
      })
      localStorage.removeItem('dormio_house_name')
      localStorage.removeItem('dormio_house_address')
    } else if (preset === 'landlord_active' || preset === 'admin') {
      api
        .post<any>('/v1/auth/login', {
          identifier: '0353563279',
          password: '123456789',
        })
        .then(res => {
          const data = res?.data || res
          if (data?.token && data?.user) {
            loginWithToken(data.token, {
              id: data.user.id,
              name: data.user.username || 'Nguyễn Quang Huy (Chủ trọ)',
              email: data.user.email || 'ngquanghuy.work@gmail.com',
              role: preset === 'admin' ? 'admin' : 'landlord',
            })
          }
        })
        .catch(() => {
          login({
            name: 'Nguyễn Quang Huy (Chủ trọ)',
            email: 'ngquanghuy.work@gmail.com',
            role: preset === 'admin' ? 'admin' : 'landlord',
          })
        })
    } else if (preset === 'staff') {
      api
        .post<any>('/v1/auth/login', {
          identifier: '0901122334',
          password: 'Secret@123',
        })
        .then(res => {
          const data = res?.data || res
          if (data?.token && data?.user) {
            loginWithToken(data.token, {
              id: data.user.id,
              name: data.user.username || 'Phạm Văn Bảo (Nhân viên)',
              email: data.user.email || 'bao.pham@dormio.vn',
              role: 'employee',
            })
          }
        })
        .catch(() => {
          login({
            name: 'Phạm Văn Bảo (Nhân viên)',
            email: 'bao.pham@dormio.vn',
            role: 'employee',
          })
        })
      localStorage.removeItem('dormio_house_name')
      localStorage.removeItem('dormio_house_address')
    }
  }

  // Find active building — returns EMPTY_BUILDING sentinel if buildings not loaded yet
  const activeBuilding =
    buildings.find(b => b.id === activeBuildingId) || buildings[0] || EMPTY_BUILDING

  // Find active tenancy for tenant dashboard
  const activeTenancy =
    tenancies.find(t => t.contractId === activeTenancyId) ||
    tenancies.find(t => t.isPrimary) ||
    tenancies[0] ||
    null

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
        updateAvatar,
        updateUserProfile,
        buildings,
        isBuildingsLoading,
        activeBuildingId,
        activeBuilding,
        selectBuilding,
        refreshBuildings: loadBuildingsFromApi,
        tenancies,
        isTenanciesLoading,
        activeTenancyId,
        activeTenancy,
        selectTenancy,
        refreshTenancies: loadTenanciesFromApi,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
