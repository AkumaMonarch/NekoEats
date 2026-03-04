import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

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

const RESTAURANT_COORDS = { lat: -20.1609, lng: 57.4966 };
const BASE_FEE = 50;
const PER_KM_FEE = 15;
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
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (map.current) return; // Initialize only once

    if (mapContainer.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://tiles.openfreemap.org/styles/bright',
        center: [initialLng || 57.5522, initialLat || -20.2833],
        zoom: 11,
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
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  const handleMapMove = () => {
    if (!map.current) return;
    const center = map.current.getCenter();
    const lat = center.lat;
    const lng = center.lng;

    // Calculate distance and fee immediately
    const dist = calculateDistance(RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng, lat, lng);
    setDistance(dist);
    const calculatedFee = BASE_FEE + (dist * PER_KM_FEE);
    setFee(calculatedFee);

    if (dist > MAX_DISTANCE_KM) {
        setWarning('⚠️ This location may be outside our delivery zone');
    } else {
        setWarning(null);
    }

    // Debounce reverse geocoding
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setLoading(true);
    
    debounceTimer.current = setTimeout(async () => {
      try {
        let formattedAddress = 'Unknown Location';
        
        try {
            // Try Nominatim first (without custom User-Agent which is forbidden in browser fetch)
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            if (response.ok) {
                const data = await response.json();
                if (data.display_name) {
                    formattedAddress = data.display_name;
                }
            } else {
                throw new Error('Nominatim failed');
            }
        } catch (e) {
            console.warn('Nominatim failed, trying fallback:', e);
            // Fallback to BigDataCloud
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
            if (response.ok) {
                const data = await response.json();
                formattedAddress = [data.locality, data.city, data.principalSubdivision, data.countryName].filter(Boolean).join(', ');
            }
        }

        setAddress(formattedAddress);
        
        onLocationSelect({
            address: formattedAddress,
            lat,
            lng,
            distance: dist,
            deliveryFee: calculatedFee
        });
      } catch (error) {
        console.error('Reverse geocoding failed:', error);
        setAddress('Location selected (Address lookup failed)');
         onLocationSelect({
            address: 'Location selected (Address lookup failed)',
            lat,
            lng,
            distance: dist,
            deliveryFee: calculatedFee
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 -mt-4">
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
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{distance.toFixed(1)} km</p>
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
        </div>
    </div>
  );
}
