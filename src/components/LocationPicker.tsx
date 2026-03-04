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
  }) => void;
  initialLat?: number;
  initialLng?: number;
}

const DEFAULT_RESTAURANT_COORDS = { lat: -20.1609, lng: 57.4966 };
const DEFAULT_BASE_FEE = 50;
const DEFAULT_PER_KM_FEE = 15;
const MAX_DISTANCE_KM = 15;

export default function LocationPicker({ onLocationSelect, initialLat, initialLng }: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [fee, setFee] = useState<number | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Settings state
  const [restaurantCoords, setRestaurantCoords] = useState(DEFAULT_RESTAURANT_COORDS);
  const [baseFee, setBaseFee] = useState(DEFAULT_BASE_FEE);
  const [perKmFee, setPerKmFee] = useState(DEFAULT_PER_KM_FEE);

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
  }, [restaurantCoords, baseFee, perKmFee]); // Re-run if settings change? No, map init should be independent. But handleMapMove depends on them.

  // Handle locking/unlocking map interactions
  useEffect(() => {
    if (!map.current) return;
    
    if (isLocked) {
        map.current.dragPan.disable();
        map.current.scrollZoom.disable();
        map.current.touchZoomRotate.disable();
        map.current.doubleClickZoom.disable();
        map.current.boxZoom.disable();
        map.current.keyboard.disable();
    } else {
        map.current.dragPan.enable();
        map.current.scrollZoom.enable();
        map.current.touchZoomRotate.enable();
        map.current.doubleClickZoom.enable();
        map.current.boxZoom.enable();
        map.current.keyboard.enable();
    }
  }, [isLocked]);

  const handleMapMove = () => {
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

        const routePromise = mapService.getRoute(restaurantCoords.lat, restaurantCoords.lng, lat, lng);

        const [addressResult, routeResult] = await Promise.all([geocodePromise, routePromise]);
        
        formattedAddress = addressResult;

        if (routeResult) {
            roadDist = routeResult.distance_km;
        } else {
            // Fallback to straight line if OSRM fails
             roadDist = mapService.calculateDistance(restaurantCoords.lat, restaurantCoords.lng, lat, lng);
        }

        calculatedFee = baseFee + (roadDist * perKmFee);

        setDistance(roadDist);
        setFee(calculatedFee);
        setAddress(formattedAddress);

        if (roadDist > MAX_DISTANCE_KM) {
            setWarning('⚠️ This location may be outside our delivery zone');
        } else {
            setWarning(null);
        }
        
        onLocationSelect({
            address: formattedAddress,
            lat,
            lng,
            distance: roadDist,
            deliveryFee: calculatedFee
        });
      } catch (error) {
        console.error('Location resolution failed:', error);
        setAddress('Location selected (Address lookup failed)');
         onLocationSelect({
            address: 'Location selected (Address lookup failed)',
            lat,
            lng,
            distance: 0,
            deliveryFee: baseFee
        });
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

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
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 -mt-4 transition-opacity ${isLocked ? 'opacity-50' : 'opacity-100'}`}>
                <span className="material-symbols-outlined text-4xl text-primary drop-shadow-lg">location_on</span>
            </div>

            {/* Locked Overlay */}
            {isLocked && (
                <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px] z-20 flex items-center justify-center pointer-events-none">
                    <div className="bg-white/90 dark:bg-black/80 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 border border-white/20">
                        <span className="material-symbols-outlined text-green-600 text-sm">lock</span>
                        <span className="font-bold text-xs text-slate-900 dark:text-white">Location Locked</span>
                    </div>
                </div>
            )}

            {/* GPS Button */}
            {!isLocked && (
                <button 
                    onClick={handleGPS}
                    className="absolute bottom-4 right-4 h-10 w-10 bg-white dark:bg-[#1e1411] rounded-full shadow-lg flex items-center justify-center text-slate-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors z-10"
                    title="Use My Location"
                >
                    <span className="material-symbols-outlined">my_location</span>
                </button>
            )}

            {/* Loading Overlay */}
            {loading && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-black/80 px-3 py-1 rounded-full text-xs font-bold shadow-sm z-10 flex items-center gap-2 backdrop-blur-sm">
                    <span className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                    <span className="text-slate-900 dark:text-white">Resolving location...</span>
                </div>
            )}
        </div>

        {/* Info Panel */}
        <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl space-y-2">
            <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-lg mt-0.5 shrink-0">location_on</span>
                <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Selected Location</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2">{address || 'Drag map to select location'}</p>
                </div>
            </div>
            
            {distance !== null && (
                <div className="flex items-center gap-4 pt-2 border-t border-dashed border-gray-200 dark:border-white/10">
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Distance</p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{distance.toFixed(1)} km <span className="text-[10px] font-normal text-slate-500">(by road)</span></p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Est. Fee</p>
                        <p className="text-xs font-bold text-primary">Rs {fee?.toFixed(0)}</p>
                    </div>
                </div>
            )}

            {warning && (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 text-xs font-bold bg-amber-50 dark:bg-amber-500/10 p-2 rounded-lg">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    {warning}
                </div>
            )}

            {/* Lock/Unlock Controls */}
            <div className="pt-2 mt-2 border-t border-dashed border-gray-200 dark:border-white/10">
                {!isLocked ? (
                    <button 
                        onClick={() => setIsLocked(true)}
                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2.5 rounded-lg font-bold shadow-sm hover:bg-slate-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        <span className="material-symbols-outlined text-lg">lock</span>
                        Confirm Location
                    </button>
                ) : (
                    <button 
                        onClick={() => setIsLocked(false)}
                        className="w-full bg-white dark:bg-white/10 text-slate-900 dark:text-white border border-gray-200 dark:border-white/10 py-2.5 rounded-lg font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-white/20 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        <span className="material-symbols-outlined text-lg">edit_location</span>
                        Change Location
                    </button>
                )}
            </div>
        </div>
    </div>
  );
}
