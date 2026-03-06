import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { mapService } from '../services/mapService';
import { settingsService } from '../services/settingsService';

interface LocationPickerProps {
  onLocationSelect: (location: {
    address: string;
    lat: number;
    lng: number;
    distance: number;
    deliveryFee: number;
    warning?: string;
    isOutOfRange?: boolean;
  }) => void;
  initialLat?: number;
  initialLng?: number;
}

const DEFAULT_RESTAURANT_COORDS = { lat: -20.1609, lng: 57.4966 };
const DEFAULT_BASE_FEE = 50;
const DEFAULT_PER_KM_FEE = 15;
const DEFAULT_MAX_DISTANCE_KM = 15;

export default function LocationPicker({ onLocationSelect, initialLat, initialLng }: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Settings state
  const [restaurantCoords, setRestaurantCoords] = useState(DEFAULT_RESTAURANT_COORDS);
  const [baseFee, setBaseFee] = useState(DEFAULT_BASE_FEE);
  const [perKmFee, setPerKmFee] = useState(DEFAULT_PER_KM_FEE);
  const [maxDistanceEnabled, setMaxDistanceEnabled] = useState(false);
  const [maxDistanceKm, setMaxDistanceKm] = useState(DEFAULT_MAX_DISTANCE_KM);

  // Refs for settings to avoid stale closures in map event listeners
  const restaurantCoordsRef = useRef(DEFAULT_RESTAURANT_COORDS);
  const baseFeeRef = useRef(DEFAULT_BASE_FEE);
  const perKmFeeRef = useRef(DEFAULT_PER_KM_FEE);
  const maxDistanceEnabledRef = useRef(false);
  const maxDistanceKmRef = useRef(DEFAULT_MAX_DISTANCE_KM);
  const onLocationSelectRef = useRef(onLocationSelect);

  const handleMapMove = React.useCallback(() => {
    if (!map.current) return;
    const center = map.current.getCenter();
    const lat = center.lat;
    const lng = center.lng;

    // Debounce OSRM and reverse geocoding
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setLoading(true);
    
    debounceTimer.current = setTimeout(async () => {
      try {
        let formattedAddress = 'Unknown Location';
        let roadDist = 0;
        let calculatedFee = 0;
        let warningMsg: string | undefined = undefined;

        // Use refs to get current settings values
        const currentRestaurantCoords = restaurantCoordsRef.current;
        const currentBaseFee = baseFeeRef.current;
        const currentPerKmFee = perKmFeeRef.current;
        const isMaxDistanceEnabled = maxDistanceEnabledRef.current;
        const maxDistance = maxDistanceKmRef.current;

        // Parallel fetch: Reverse Geocode AND OSRM Route
        const geocodePromise = (async () => {
            try {
                // Try Nominatim first
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.display_name) {
                        return data.display_name;
                    }
                }
                throw new Error('Nominatim failed');
            } catch (e) {
                console.warn('Nominatim failed, trying fallback:', e);
                // Fallback to BigDataCloud
                const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
                if (response.ok) {
                    const data = await response.json();
                    return [data.locality, data.city, data.principalSubdivision, data.countryName].filter(Boolean).join(', ');
                }
                return 'Unknown Location';
            }
        })();

        const routePromise = mapService.getRoute(currentRestaurantCoords.lat, currentRestaurantCoords.lng, lat, lng);

        const [addressResult, routeResult] = await Promise.all([geocodePromise, routePromise]);
        
        formattedAddress = addressResult;

        if (routeResult) {
            roadDist = routeResult.distance_km;
        } else {
            // Fallback to straight line if OSRM fails
             roadDist = mapService.calculateDistance(currentRestaurantCoords.lat, currentRestaurantCoords.lng, lat, lng);
        }

        calculatedFee = currentBaseFee + (roadDist * currentPerKmFee);

        let isOutOfRange = false;

        if (isMaxDistanceEnabled && roadDist > maxDistance) {
            warningMsg = `⚠️ This location is outside our ${maxDistance}km delivery zone`;
            isOutOfRange = true;
        } else if (!isMaxDistanceEnabled && roadDist > DEFAULT_MAX_DISTANCE_KM) {
             // Fallback warning if not strictly enforced but still far
             warningMsg = '⚠️ This location may be outside our delivery zone';
        }
        
        if (onLocationSelectRef.current) {
            onLocationSelectRef.current({
                address: formattedAddress,
                lat,
                lng,
                distance: roadDist,
                deliveryFee: calculatedFee,
                warning: warningMsg,
                isOutOfRange
            });
        }
      } catch (error) {
        console.error('Location resolution failed:', error);
         if (onLocationSelectRef.current) {
            onLocationSelectRef.current({
                address: 'Location selected (Address lookup failed)',
                lat,
                lng,
                distance: 0,
                deliveryFee: baseFeeRef.current,
                warning: 'Address lookup failed'
            });
         }
      } finally {
        setLoading(false);
      }
    }, 1000);
  }, []);

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    restaurantCoordsRef.current = restaurantCoords;
    if (map.current) {
        handleMapMove();
    }
  }, [restaurantCoords, handleMapMove]);

  useEffect(() => {
    baseFeeRef.current = baseFee;
    if (map.current) {
        handleMapMove();
    }
  }, [baseFee, handleMapMove]);

  useEffect(() => {
    perKmFeeRef.current = perKmFee;
    if (map.current) {
        handleMapMove();
    }
  }, [perKmFee, handleMapMove]);

  useEffect(() => {
    maxDistanceEnabledRef.current = maxDistanceEnabled;
    if (map.current) {
        handleMapMove();
    }
  }, [maxDistanceEnabled, handleMapMove]);

  useEffect(() => {
    maxDistanceKmRef.current = maxDistanceKm;
    if (map.current) {
        handleMapMove();
    }
  }, [maxDistanceKm, handleMapMove]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await settingsService.getSettings();
        if (settings) {
          if (settings.latitude && settings.longitude) {
            setRestaurantCoords({ lat: settings.latitude, lng: settings.longitude });
          }
          if (settings.delivery_base_fee !== undefined) setBaseFee(settings.delivery_base_fee);
          if (settings.delivery_per_km_fee !== undefined) setPerKmFee(settings.delivery_per_km_fee);
          if (settings.delivery_max_distance_enabled !== undefined) setMaxDistanceEnabled(settings.delivery_max_distance_enabled);
          if (settings.delivery_max_distance_km !== undefined) setMaxDistanceKm(settings.delivery_max_distance_km);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (map.current) return; // Initialize only once

    if (mapContainer.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://tiles.openfreemap.org/styles/bright',
        center: [initialLng || 57.5522, initialLat || -20.2833],
        zoom: 11,
        cooperativeGestures: true, // Requires 2 fingers to move map on mobile
      });

      map.current.on('moveend', () => {
        handleMapMove();
      });

      // Initial resolve if coordinates provided
      if (initialLat && initialLng) {
          // Small delay to ensure map is ready or just call it
          setTimeout(handleMapMove, 500);
      }
    }

    return () => {
        // Cleanup if needed
        // map.current?.remove(); // React strict mode might cause issues if we remove too early, but usually good practice.
    };
  }, []); // Empty dependency array as we use refs inside handleMapMove



  const handleGPS = () => {
    setErrorMsg(null);
    if (!navigator.geolocation) {
        setErrorMsg('Geolocation is not supported by your browser');
        return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            map.current?.flyTo({
                center: [longitude, latitude],
                zoom: 15
            });
            setLoading(false);
            // handleMapMove will trigger on moveend
        },
        (error) => {
            console.error('GPS Error:', error);
            setLoading(false);

            let errorMessage = 'Unable to retrieve your location.';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Location access is blocked. Please enable location permissions in your browser settings (usually the lock icon in the address bar) and try again.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information is unavailable. Please check your network connection.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'The request to get your location timed out. Please try again.';
                    break;
                default:
                    errorMessage = 'An unknown error occurred while retrieving location.';
            }
            
            setErrorMsg(errorMessage);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
  };

  return (
    <div className="space-y-3">
        {errorMsg && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-3 flex items-start gap-3">
                <span className="material-symbols-outlined text-red-500 text-xl mt-0.5">error</span>
                <div className="flex-1">
                    <p className="text-sm font-bold text-red-800 dark:text-red-200">Location Error</p>
                    <p className="text-xs text-red-600 dark:text-red-300 mt-1">{errorMsg}</p>
                    <button 
                        onClick={handleGPS}
                        className="mt-2 text-xs font-bold bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-200 px-3 py-1.5 rounded-lg hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors"
                    >
                        Retry Permission
                    </button>
                </div>
                <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600 dark:hover:text-red-200">
                    <span className="material-symbols-outlined text-lg">close</span>
                </button>
            </div>
        )}

        <div className="relative w-full h-[250px] md:h-[300px] rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-inner">
            <div ref={mapContainer} className="w-full h-full" />
            
            {/* Center Pin */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 -mt-4 transition-opacity opacity-100">
                <span className="material-symbols-outlined text-4xl text-primary drop-shadow-lg">location_on</span>
            </div>

            {/* GPS Button */}
            <button 
                onClick={handleGPS}
                className="absolute bottom-4 right-4 h-10 w-10 bg-white dark:bg-[#1e1411] rounded-full shadow-lg flex items-center justify-center text-slate-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors z-10"
                title="Use My Location"
            >
                <span className="material-symbols-outlined">my_location</span>
            </button>

            {/* Loading Overlay */}
            {loading && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-black/80 px-3 py-1 rounded-full text-xs font-bold shadow-sm z-10 flex items-center gap-2 backdrop-blur-sm">
                    <span className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                    <span className="text-slate-900 dark:text-white">Resolving location...</span>
                </div>
            )}
        </div>
    </div>
  );
}
