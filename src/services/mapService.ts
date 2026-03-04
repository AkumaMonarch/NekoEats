
export interface RouteResult {
  distance_km: number;
  estimated_minutes: number;
  geometry: any; // GeoJSON geometry
}

export const mapService = {
  // Haversine formula to calculate distance between two points
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = mapService.deg2rad(lat2 - lat1);
    const dLon = mapService.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(mapService.deg2rad(lat1)) * Math.cos(mapService.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return parseFloat(d.toFixed(2));
  },

  deg2rad: (deg: number): number => {
    return deg * (Math.PI / 180);
  },

  // Get route from OSRM
  getRoute: async (lat1: number, lon1: number, lat2: number, lon2: number): Promise<RouteResult | null> => {
    try {
      // OSRM expects longitude,latitude
      const url = `https://osrm.kaizen.indevs.in/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return {
          distance_km: parseFloat((route.distance / 1000).toFixed(2)), // OSRM returns meters
          estimated_minutes: Math.ceil(route.duration / 60), // OSRM returns seconds
          geometry: route.geometry,
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch route from OSRM:', error);
      return null;
    }
  }
};
