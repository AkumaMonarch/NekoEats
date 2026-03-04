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
  };

  useEffect(() => {
    if (!delivery || !mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: [delivery.restaurant_lng, delivery.restaurant_lat],
      zoom: 13,
    });

    map.current.on('load', async () => {
      if (!map.current || !delivery) return;

      // Add Restaurant Marker
      new maplibregl.Marker({ color: '#EF4444' })
        .setLngLat([delivery.restaurant_lng, delivery.restaurant_lat])
        .setPopup(new maplibregl.Popup().setText('Restaurant'))
        .addTo(map.current);

      // Add Customer Marker
      new maplibregl.Marker({ color: '#3B82F6' })
        .setLngLat([delivery.customer_lng, delivery.customer_lat])
        .setPopup(new maplibregl.Popup().setText(delivery.customer_address))
        .addTo(map.current);

      // Initial Rider Marker
      if (delivery.rider_current_lng && delivery.rider_current_lat) {
        updateRiderMarker(delivery);
      }

      // Draw Route
      const route = await mapService.getRoute(
        delivery.restaurant_lat,
        delivery.restaurant_lng,
        delivery.customer_lat,
        delivery.customer_lng
      );

      if (route && route.geometry) {
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

        // Fit bounds
        const bounds = new maplibregl.LngLatBounds();
        bounds.extend([delivery.restaurant_lng, delivery.restaurant_lat]);
        bounds.extend([delivery.customer_lng, delivery.customer_lat]);
        map.current.fitBounds(bounds, { padding: 50 });
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

      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0" />
      </div>
    </div>
  );
}
