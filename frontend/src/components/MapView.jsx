// React 19 + React-Leaflet 5 compatible MapView

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
});

export default function MapView({ stops = [], hops = [] }) {
  const [routeGeometry, setRouteGeometry] = useState([]);

  const validStops = stops.filter(s => s.latitude && s.longitude);
  const coords = validStops.map(s => [s.latitude, s.longitude]);

  useEffect(() => {
    async function fetchRoute() {
      if (validStops.length > 1) {
        try {
          // OSRM Routing API expects coordinates in longitude,latitude format separated by semicolon
          const coordinatesString = validStops
            .map(s => `${s.longitude},${s.latitude}`)
            .join(';');

          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson`);
          const data = await res.json();

          if (data.routes && data.routes.length > 0) {
            // GeoJSON coordinates come as [longitude, latitude], Leaflet Polyline expects [latitude, longitude]
            const decodedCoords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
            setRouteGeometry(decodedCoords);
          } else {
            setRouteGeometry(coords);
          }
        } catch (error) {
          console.error("Error fetching route from OSRM:", error);
          setRouteGeometry(coords); // Fallback to straight lines
        }
      } else {
        setRouteGeometry([]);
      }
    }

    fetchRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(stops)]);

  const center = coords.length ? coords[0] : [12.9716, 77.5946];

  return (
    <div style={{ height: 350, width: "100%", marginTop: 20 }}>
      <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='© OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Markers */}
        {stops.map((stop, idx) => (
          stop.latitude && stop.longitude && (
            <Marker key={idx} position={[stop.latitude, stop.longitude]}>
              <Popup>
                <strong>{stop.location}</strong>
                {hops[idx] && (
                  <>
                    <br />Cost: ₹{hops[idx].cost}
                    <br />Mode: {hops[idx].mode}
                  </>
                )}
              </Popup>
            </Marker>
          )
        ))}

        {/* Polyline Route */}
        {routeGeometry.length > 1 && (
          <Polyline positions={routeGeometry} color="#1E74D6" weight={5} />
        )}
      </MapContainer>
    </div>
  );
}
