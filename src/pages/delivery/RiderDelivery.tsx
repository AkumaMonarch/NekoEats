import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { deliveryService } from '../../services/deliveryService';
import { mapService } from '../../services/mapService';
import { Delivery } from '../../lib/types';

export default function RiderDelivery() {
  const { id } = useParams<{ id: string }>();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const riderMarker = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (id) {
      loadDelivery();
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
      new maplibregl.Marker({ color: '#EF4444' }) // Red
        .setLngLat([delivery.restaurant_lng, delivery.restaurant_lat])
        .setPopup(new maplibregl.Popup().setText('Restaurant'))
        .addTo(map.current);

      // Add Customer Marker
      new maplibregl.Marker({ color: '#3B82F6' }) // Blue
        .setLngLat([delivery.customer_lng, delivery.customer_lat])
        .setPopup(new maplibregl.Popup().setText(delivery.customer_address))
        .addTo(map.current);

      // Add Rider Marker if location exists
      if (delivery.rider_current_lng && delivery.rider_current_lat) {
        const el = document.createElement('div');
        el.className = 'rider-marker';
        el.style.backgroundImage = 'url(https://cdn-icons-png.flaticon.com/512/1986/1986937.png)'; // Simple bike icon
        el.style.width = '40px';
        el.style.height = '40px';
        el.style.backgroundSize = 'cover';

        riderMarker.current = new maplibregl.Marker({ element: el })
          .setLngLat([delivery.rider_current_lng, delivery.rider_current_lat])
          .addTo(map.current);
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

  const updateLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, heading } = position.coords;
        if (id) {
          await deliveryService.updateRiderLocation(id, latitude, longitude, heading || 0);
          
          // Update local state/marker
          if (riderMarker.current) {
            riderMarker.current.setLngLat([longitude, latitude]);
            if (heading) {
              riderMarker.current.setRotation(heading);
            }
          } else if (map.current) {
             const el = document.createElement('div');
            el.className = 'rider-marker';
            el.style.backgroundImage = 'url(https://cdn-icons-png.flaticon.com/512/1986/1986937.png)';
            el.style.width = '40px';
            el.style.height = '40px';
            el.style.backgroundSize = 'cover';
            
            riderMarker.current = new maplibregl.Marker({ element: el })
              .setLngLat([longitude, latitude])
              .addTo(map.current);
          }
          
          alert('Location updated!');
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to retrieve your location');
      }
    );
  };

  const updateStatus = async (status: Delivery['status']) => {
    if (!id) return;
    try {
      await deliveryService.updateStatus(id, status);
      loadDelivery(); // Refresh
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading delivery...</div>;
  if (!delivery) return <div className="p-8 text-center">Delivery not found</div>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#120c0a] flex flex-col">
      <div className="bg-white dark:bg-[#1e1411] p-4 shadow-md z-10">
        <h1 className="text-lg font-bold mb-2">Delivery #{delivery.order?.order_code}</h1>
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="font-bold">{delivery.order?.customer_name}</p>
            <p className="text-sm text-slate-500">{delivery.customer_address}</p>
          </div>
          <a href={`tel:${delivery.order?.customer_phone}`} className="bg-green-500 text-white p-2 rounded-full shadow-lg">
            <span className="material-symbols-outlined">call</span>
          </a>
        </div>
        
        <div className="flex gap-2">
          {delivery.status === 'assigned' && (
            <button 
              onClick={() => updateStatus('picked_up')}
              className="flex-1 bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20"
            >
              PICKED UP
            </button>
          )}
          {delivery.status === 'picked_up' && (
            <button 
              onClick={() => updateStatus('delivered')}
              className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-600/20"
            >
              DELIVERED
            </button>
          )}
          {delivery.status === 'delivered' && (
            <div className="flex-1 bg-gray-100 text-green-600 py-3 rounded-xl font-bold text-center border border-green-200">
              COMPLETED
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0" />
        
        <button 
          onClick={updateLocation}
          className="absolute bottom-6 right-6 bg-white text-slate-900 p-3 rounded-full shadow-xl z-20 flex items-center justify-center"
        >
          <span className="material-symbols-outlined">my_location</span>
        </button>
      </div>
    </div>
  );
}
