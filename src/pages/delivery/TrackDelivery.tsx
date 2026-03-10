import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { deliveryService } from '../../services/deliveryService';
import { mapService } from '../../services/mapService';
import { Delivery } from '../../lib/types';
import { supabase } from '../../lib/supabase';

export default function TrackDelivery() {
  const { id } = useParams<{ id: string }>();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const riderMarker = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (id) {
      loadDelivery();
      
      // Real-time subscription
      const subscription = supabase
        .channel(`public:deliveries:id=eq.${id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'deliveries', filter: `id=eq.${id}` }, (payload) => {
          setDelivery(prev => prev ? { ...prev, ...payload.new } : null);
          updateRiderMarker(payload.new);
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [id]);

  const loadDelivery = async () => {
    try {
      if (!id) return;
      const data = await deliveryService.getDelivery(id);
      setDelivery(data);
    } catch (error) {
      console.error('Failed to load delivery:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRiderMarker = (data: any) => {
    if (!map.current || !data.rider_current_lat || !data.rider_current_lng) return;

    if (riderMarker.current) {
      riderMarker.current.setLngLat([data.rider_current_lng, data.rider_current_lat]);
      if (data.rider_heading) {
        riderMarker.current.setRotation(data.rider_heading);
      }
    } else {
      // Create marker if it doesn't exist
      const el = document.createElement('div');
      el.className = 'rider-marker';
      el.style.backgroundImage = 'url(https://cdn-icons-png.flaticon.com/512/1986/1986937.png)';
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.backgroundSize = 'cover';

      riderMarker.current = new maplibregl.Marker({ element: el })
        .setLngLat([data.rider_current_lng, data.rider_current_lat])
        .addTo(map.current);
    }
    
    // Update route when rider moves
    if (delivery) {
      updateRouteAndBounds({ ...delivery, ...data });
    }
  };

  const updateRouteAndBounds = async (currentDelivery: Delivery) => {
    if (!map.current) return;

    let startLat = Number(currentDelivery.restaurant_lat) || 0;
    let startLng = Number(currentDelivery.restaurant_lng) || 0;
    let endLat = Number(currentDelivery.customer_lat) || 0;
    let endLng = Number(currentDelivery.customer_lng) || 0;

    // If we have rider location, use it as the start point
    if (currentDelivery.rider_current_lat && currentDelivery.rider_current_lng) {
      startLat = currentDelivery.rider_current_lat;
      startLng = currentDelivery.rider_current_lng;
      
      // If status is assigned, rider is going to restaurant
      if (currentDelivery.status === 'assigned') {
        endLat = Number(currentDelivery.restaurant_lat) || 0;
        endLng = Number(currentDelivery.restaurant_lng) || 0;
      }
    }

    try {
      const route = await mapService.getRoute(startLat, startLng, endLat, endLng);

      if (route && route.geometry) {
        const source = map.current.getSource('route') as maplibregl.GeoJSONSource;
        if (source) {
          source.setData({
            type: 'Feature',
            properties: {},
            geometry: route.geometry,
          });
        } else {
          map.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: route.geometry,
            },
          });

          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#3B82F6',
              'line-width': 4,
            },
          });
        }

        // Fit bounds
        const bounds = new maplibregl.LngLatBounds();
        bounds.extend([startLng, startLat]);
        bounds.extend([endLng, endLat]);
        
        // Also include customer if rider is going to restaurant, so customer sees the whole picture
        if (currentDelivery.status === 'assigned') {
          bounds.extend([Number(currentDelivery.customer_lng) || 0, Number(currentDelivery.customer_lat) || 0]);
        }
        
        map.current.fitBounds(bounds, { padding: 50 });
      }
    } catch (error) {
      console.error('Failed to update route:', error);
    }
  };

  useEffect(() => {
    if (!delivery || !mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: [Number(delivery.restaurant_lng) || 0, Number(delivery.restaurant_lat) || 0],
      zoom: 13,
    });

    map.current.on('load', async () => {
      if (!map.current || !delivery) return;

      // Add Restaurant Marker
      new maplibregl.Marker({ color: '#EF4444' })
        .setLngLat([Number(delivery.restaurant_lng) || 0, Number(delivery.restaurant_lat) || 0])
        .setPopup(new maplibregl.Popup().setText('Restaurant'))
        .addTo(map.current);

      // Add Customer Marker
      new maplibregl.Marker({ color: '#3B82F6' })
        .setLngLat([Number(delivery.customer_lng) || 0, Number(delivery.customer_lat) || 0])
        .setPopup(new maplibregl.Popup().setText(delivery.customer_address || 'Customer'))
        .addTo(map.current);

      // Initial Rider Marker
      if (delivery.rider_current_lng && delivery.rider_current_lat) {
        updateRiderMarker(delivery);
      } else {
        // Draw initial static route if rider location not known yet
        updateRouteAndBounds(delivery);
      }
    });
  }, [delivery]);

  if (loading) return <div className="p-8 text-center">Loading tracking...</div>;
  if (!delivery) return <div className="p-8 text-center">Delivery not found</div>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#120c0a] flex flex-col">
      <div className="bg-white dark:bg-[#1e1411] p-4 shadow-md z-10">
        <h1 className="text-lg font-bold mb-2">Tracking Order #{delivery.order?.order_code}</h1>
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-slate-500">Estimated Arrival</p>
            <p className="font-bold text-xl">{delivery.estimated_minutes} mins</p>
          </div>
          <div className="text-right">
             <p className="text-sm text-slate-500">Status</p>
             <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                delivery.status === 'delivered' ? 'bg-green-100 text-green-600' :
                delivery.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                'bg-blue-100 text-blue-600'
             }`}>
                {delivery.status.replace('_', ' ')}
             </span>
          </div>
        </div>
        
        {delivery.rider && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">{delivery.rider.name}</p>
              <p className="text-xs text-slate-500">Your Rider</p>
            </div>
            <a href={`tel:${delivery.rider.phone}`} className="bg-green-500 text-white p-2 rounded-full shadow-lg">
              <span className="material-symbols-outlined">call</span>
            </a>
          </div>
        )}
      </div>

      <div className="flex-1 relative min-h-[50vh] w-full overflow-hidden">
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
        
        {delivery.rider_current_lat && delivery.rider_current_lng && (
          <button 
            onClick={() => {
              if (map.current && delivery.rider_current_lat && delivery.rider_current_lng) {
                map.current.flyTo({
                  center: [delivery.rider_current_lng, delivery.rider_current_lat],
                  zoom: 15
                });
              }
            }}
            className="absolute bottom-6 right-6 bg-white text-slate-900 p-3 rounded-full shadow-xl z-20 flex items-center justify-center"
            title="Center on Rider"
          >
            <span className="material-symbols-outlined">my_location</span>
          </button>
        )}
      </div>
    </div>
  );
}
