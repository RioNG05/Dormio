import { api } from '@/services/api'

export interface MapsConfig {
  apiKey: string | null
  isGoogleAvailable: boolean
  provider: 'google' | 'osm'
}

let cachedMapsConfig: MapsConfig | null = null

export const mapService = {
  /**
   * Retrieves runtime map configuration and Google Maps API key from backend.
   * Caches in memory to avoid redundant network requests across component mounts.
   */
  async getMapsConfig(): Promise<MapsConfig> {
    if (cachedMapsConfig) {
      return cachedMapsConfig
    }

    try {
      const res = await api.get<MapsConfig>('/v1/maps/config', { silent: true })
      const data = (res as any)?.data ?? res
      cachedMapsConfig = {
        apiKey: data?.apiKey ?? null,
        isGoogleAvailable: Boolean(data?.isGoogleAvailable),
        provider: data?.provider ?? (data?.isGoogleAvailable ? 'google' : 'osm'),
      }
      return cachedMapsConfig
    } catch {
      return {
        apiKey: null,
        isGoogleAvailable: false,
        provider: 'osm',
      }
    }
  },
}
