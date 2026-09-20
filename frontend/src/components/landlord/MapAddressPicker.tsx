'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  Search,
  Check,
  ExternalLink,
  Loader2,
  Navigation,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  Province,
  matchProvince,
} from '@/services/vietnam-address.service';

export interface SelectedMapAddress {
  province: string;
  ward: string;
  street: string;
  houseNumber: string;
  fullAddress: string;
}

interface MapAddressPickerProps {
  provinces: Province[];
  onSelectAddress: (addr: SelectedMapAddress) => void;
  initialAddress?: string;
}

declare global {
  interface Window {
    google?: any;
    L?: any;
    initGoogleMapPicker?: () => void;
  }
}

export function MapAddressPicker({
  provinces,
  onSelectAddress,
  initialAddress,
}: MapAddressPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);

  const [searchQuery, setSearchQuery] = useState(initialAddress || '');
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<SelectedMapAddress | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const isGoogleAvailable = Boolean(apiKey && apiKey.trim() !== '');

  // Default coordinates: Ho Chi Minh City center
  const defaultCoords = { lat: 10.7769, lng: 106.7009 };

  // Parse reverse geocoding result into structured address fields
  const parseAddressComponents = (
    rawCity: string,
    rawWard: string,
    rawStreet: string,
    rawHouseNumber: string,
    formattedAddress: string
  ) => {
    const matched = matchProvince(rawCity, provinces);
    const resolvedProvince = matched ? matched.name : rawCity;

    const parsed: SelectedMapAddress = {
      province: resolvedProvince,
      ward: rawWard || '',
      street: rawStreet || '',
      houseNumber: rawHouseNumber || '',
      fullAddress: formattedAddress,
    };

    setResolvedAddress(parsed);
    setIsApplied(false);
  };

  // Reverse geocode via Nominatim (Leaflet fallback)
  const reverseGeocodeOSM = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'vi',
          },
        }
      );
      if (!res.ok) throw new Error(`OSM error ${res.status}`);
      const data = await res.json();
      const addr = data.address || {};

      const city =
        addr.city ||
        addr.state ||
        addr.province ||
        addr.county ||
        '';

      const ward =
        addr.suburb ||
        addr.quarter ||
        addr.neighbourhood ||
        addr.village ||
        '';

      const street = addr.road || addr.pedestrian || addr.street || '';
      const houseNumber = addr.house_number || '';

      parseAddressComponents(
        city,
        ward,
        street,
        houseNumber,
        data.display_name || ''
      );
    } catch (err) {
      console.error('OSM reverse geocoding error:', err);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Search address via Nominatim
  const handleSearchOSM = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchQuery
        )}&format=json&addressdetails=1&countrycodes=vn&limit=1`,
        {
          headers: {
            'Accept-Language': 'vi',
          },
        }
      );
      if (!res.ok) throw new Error(`OSM search error: ${res.status}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);

        if (mapInstanceRef.current && markerInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
          markerInstanceRef.current.setLatLng([lat, lng]);
        }

        const addr = item.address || {};
        const city = addr.city || addr.state || addr.province || '';
        const ward = addr.suburb || addr.quarter || addr.neighbourhood || '';
        const street = addr.road || '';
        const houseNumber = addr.house_number || '';

        parseAddressComponents(
          city,
          ward,
          street,
          houseNumber,
          item.display_name || searchQuery
        );
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Initialize Map
  useEffect(() => {
    let isMounted = true;

    if (isGoogleAvailable) {
      // 1. Load Google Maps API
      const scriptId = 'google-maps-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.onload = () => {
          if (isMounted) initGoogleMap();
        };
        document.body.appendChild(script);
      } else if (window.google?.maps) {
        initGoogleMap();
      }

      function initGoogleMap() {
        if (!mapContainerRef.current || !window.google?.maps) return;

        const map = new window.google.maps.Map(mapContainerRef.current, {
          center: defaultCoords,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
        });
        mapInstanceRef.current = map;

        const marker = new window.google.maps.Marker({
          position: defaultCoords,
          map,
          draggable: true,
        });
        markerInstanceRef.current = marker;

        const geocoder = new window.google.maps.Geocoder();

        const reverseGoogle = (latLng: any) => {
          setIsReverseGeocoding(true);
          geocoder.geocode({ location: latLng }, (results: any[], status: string) => {
            setIsReverseGeocoding(false);
            if (status === 'OK' && results?.[0]) {
              const res = results[0];
              let houseNumber = '';
              let street = '';
              let ward = '';
              let city = '';

              for (const comp of res.address_components) {
                const types = comp.types;
                if (types.includes('street_number')) houseNumber = comp.long_name;
                if (types.includes('route')) street = comp.long_name;
                if (types.includes('sublocality_level_1') || types.includes('administrative_area_level_2')) {
                  ward = comp.long_name;
                }
                if (types.includes('administrative_area_level_1')) {
                  city = comp.long_name;
                }
              }

              parseAddressComponents(
                city,
                ward,
                street,
                houseNumber,
                res.formatted_address
              );
            }
          });
        };

        map.addListener('click', (e: any) => {
          marker.setPosition(e.latLng);
          reverseGoogle(e.latLng);
        });

        marker.addListener('dragend', () => {
          reverseGoogle(marker.getPosition());
        });
      }
    } else {
      // 2. Fallback: Leaflet + OpenStreetMap
      const cssId = 'leaflet-css';
      if (!document.getElementById(cssId)) {
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const scriptId = 'leaflet-js';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => {
          if (isMounted) initLeaflet();
        };
        document.body.appendChild(script);
      } else if (window.L) {
        initLeaflet();
      }

      function initLeaflet() {
        if (!mapContainerRef.current || !window.L) return;
        if (mapInstanceRef.current) return;

        const L = window.L;
        const map = L.map(mapContainerRef.current).setView(
          [defaultCoords.lat, defaultCoords.lng],
          15
        );
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        // Custom pin icon
        const pinIcon = L.divIcon({
          html: `<div style="transform: translate(-50%, -100%);">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="#2AC1BC" stroke="#ffffff" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3" fill="#ffffff"></circle>
            </svg>
          </div>`,
          className: '',
          iconSize: [34, 34],
          iconAnchor: [17, 34],
        });

        const marker = L.marker([defaultCoords.lat, defaultCoords.lng], {
          draggable: true,
          icon: pinIcon,
        }).addTo(map);
        markerInstanceRef.current = marker;

        map.on('click', (e: any) => {
          marker.setLatLng(e.latlng);
          reverseGeocodeOSM(e.latlng.lat, e.latlng.lng);
        });

        marker.on('dragend', () => {
          const latlng = marker.getLatLng();
          reverseGeocodeOSM(latlng.lat, latlng.lat ? latlng.lng : 0);
        });
      }
    }

    return () => {
      isMounted = false;
      if (mapInstanceRef.current && !isGoogleAvailable) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isGoogleAvailable, apiKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current?.invalidateSize) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [isExpanded]);

  const handleApply = () => {
    if (!resolvedAddress) return;
    onSelectAddress(resolvedAddress);
    setIsApplied(true);
    setTimeout(() => setIsApplied(false), 3000);
  };

  const openGoogleMapsDirectly = () => {
    const query = resolvedAddress?.fullAddress || searchQuery || 'Việt Nam';
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
      '_blank'
    );
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2AC1BC]/10 text-[#2AC1BC]">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              Chọn địa chỉ từ bản đồ
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2AC1BC]/10 text-[#2AC1BC]">
                {isGoogleAvailable ? 'Google Maps' : 'Interactive Map'}
              </span>
            </h4>
            <p className="text-xs text-zinc-500">
              Tìm kiếm hoặc bấm ghim trực tiếp trên bản đồ để tự động điền form
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            {isExpanded ? (
              <>
                <Minimize2 className="h-3.5 w-3.5 text-zinc-500" />
                <span>Thu nhỏ</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5 text-zinc-500" />
                <span>Phóng to bản đồ</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={openGoogleMapsDirectly}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#2AC1BC]/30 bg-[#2AC1BC]/5 text-xs font-semibold text-[#2AC1BC] hover:bg-[#2AC1BC]/10 transition-colors"
          >
            <span>Mở trên Google Maps</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearchOSM();
              }
            }}
            placeholder="Nhập địa chỉ, tên đường hoặc địa danh để tìm kiếm..."
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-10 pr-3.5 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:border-[#2AC1BC] focus:ring-2 focus:ring-[#2AC1BC]/15"
          />
        </div>

        <button
          type="button"
          onClick={handleSearchOSM}
          disabled={isSearching || !searchQuery.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2AC1BC] text-white text-xs font-bold hover:bg-[#25aca7] disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
        >
          {isSearching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang tìm...</span>
            </>
          ) : (
            <>
              <Navigation className="h-3.5 w-3.5" />
              <span>Tìm vị trí</span>
            </>
          )}
        </button>
      </div>

      {/* Map Container */}
      <div
        className={`relative mt-3 w-full rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100 z-0 transition-all duration-300 ${
          isExpanded ? 'h-[620px]' : 'h-[460px]'
        }`}
      >
        <div ref={mapContainerRef} className="h-full w-full" />

        {isReverseGeocoding && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-1000 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 shadow-md border border-zinc-200 text-xs font-semibold text-zinc-700 backdrop-blur-xs">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#2AC1BC]" />
            <span>Đang nhận diện địa chỉ từ tọa độ...</span>
          </div>
        )}

        <div className="absolute bottom-2 left-2 z-1000 pointer-events-none rounded-lg bg-zinc-900/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-xs">
          💡 Bấm vào bản đồ hoặc kéo ghim để chọn vị trí
        </div>
      </div>

      {/* Resolved Address Banner & Apply Button */}
      {resolvedAddress && (
        <div className="mt-4 rounded-xl border border-[#2AC1BC]/25 bg-[#2AC1BC]/5 p-3.5 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#2AC1BC]">
                <MapPin className="h-3.5 w-3.5" />
                <span>Địa chỉ đã chọn từ bản đồ:</span>
              </div>
              <p className="text-sm font-semibold text-zinc-900">
                {resolvedAddress.fullAddress || 'Vị trí đã chọn'}
              </p>

              {/* Breakdown tags */}
              <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-medium text-zinc-600">
                {resolvedAddress.houseNumber && (
                  <span className="rounded-md bg-white px-2 py-0.5 border border-zinc-200">
                    Số nhà: <b>{resolvedAddress.houseNumber}</b>
                  </span>
                )}
                {resolvedAddress.street && (
                  <span className="rounded-md bg-white px-2 py-0.5 border border-zinc-200">
                    Đường: <b>{resolvedAddress.street}</b>
                  </span>
                )}
                {resolvedAddress.ward && (
                  <span className="rounded-md bg-white px-2 py-0.5 border border-zinc-200">
                    Phường/Xã: <b>{resolvedAddress.ward}</b>
                  </span>
                )}
                {resolvedAddress.province && (
                  <span className="rounded-md bg-white px-2 py-0.5 border border-zinc-200">
                    Tỉnh/TP: <b>{resolvedAddress.province}</b>
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleApply}
              className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 shadow-xs ${
                isApplied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#2AC1BC] text-white hover:bg-[#25aca7]'
              }`}
            >
              <Check className="h-4 w-4" />
              <span>{isApplied ? 'Đã áp dụng vào form!' : 'Áp dụng vào form'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
