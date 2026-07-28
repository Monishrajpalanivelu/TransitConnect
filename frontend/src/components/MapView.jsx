// React 19 + React-Leaflet 5 compatible MapView

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
});

function ClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      if (onClick) onClick([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
}

function MapUpdater({ stops }) {
  const map = useMap();
  useEffect(() => {
    if (stops && stops.length > 0) {
      const bounds = L.latLngBounds(stops.map(s => [s.latitude, s.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [stops, map]);
  return null;
}

export default function MapView({ stops = [], hops = [], multiRoutes = [], onRouteSelect = null, selectedRouteId = null, onMapClick = null, height = 350, allowAlternatives = false }) {
  const [routeGeometries, setRouteGeometries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Normalize inputs: either use multiRoutes or the single stops/hops
  const routesToRender = multiRoutes.length > 0 
    ? multiRoutes 
    : [{ id: 'default', stops, hops, color: '#1E74D6' }];

  useEffect(() => {
    async function fetchRoutes() {
      setIsLoading(true);
      try {
        const geometries = await Promise.all(routesToRender.map(async (r) => {
          const validStops = (r.stops || []).filter(s => s.latitude && s.longitude);
          const coords = validStops.map(s => [s.latitude, s.longitude]);

          if (validStops.length > 1) {
            try {
              const coordinatesString = validStops
                .map(s => `${s.longitude},${s.latitude}`)
                .join(';');

              // Always fetch alternatives so we can match the correct path by distance
              const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson&alternatives=true`);
              const data = await res.json();

              if (data.routes && data.routes.length > 0) {
                if (multiRoutes.length > 0) {
                  // DASHBOARD MODE: Find the OSRM route whose distance matches the saved route distance
                  let bestMatchIndex = 0;
                  let minDiff = Infinity;

                  data.routes.forEach((osrmRoute, index) => {
                    const diff = Math.abs(osrmRoute.distance - (r.totalDistance || 0));
                    if (diff < minDiff) {
                      minDiff = diff;
                      bestMatchIndex = index;
                    }
                  });

                  const bestRoute = data.routes[bestMatchIndex];
                  const decodedCoords = bestRoute.geometry.coordinates.map(coord => [coord[1], coord[0]]);

                  return [{
                    id: r.id,
                    path: decodedCoords,
                    color: r.color || '#1E74D6',
                    route: r,
                    isAlt: false,
                    baseOpacity: 1.0,
                    osrmRoute: bestRoute
                  }];
                } else {
                  // ADD ROUTE MODE: Return all alternatives for the user to pick
                  return data.routes.map((osrmRoute, index) => {
                    const decodedCoords = osrmRoute.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                    const opacity = index === 0 ? 1.0 : 0.6;
                    return {
                      id: r.id + (index > 0 ? `-alt${index}` : ''),
                      path: decodedCoords,
                      color: r.color || '#1E74D6',
                      route: r,
                      isAlt: index > 0,
                      baseOpacity: opacity,
                      osrmRoute: osrmRoute
                    };
                  });
                }
              } else {
                return [{ id: r.id, path: coords, color: r.color || '#1E74D6', route: r, isAlt: false, baseOpacity: 1.0 }];
              }
            } catch (error) {
              console.error("Error fetching route from OSRM:", error);
              return [{ id: r.id, path: coords, color: r.color || '#1E74D6', route: r, isAlt: false, baseOpacity: 1.0 }];
            }
          }
          return [{ id: r.id, path: [], color: r.color || '#1E74D6', route: r, isAlt: false, baseOpacity: 1.0 }];
        }));

        setRouteGeometries(geometries.flat());
      } finally {
        setIsLoading(false);
      }
    }

    fetchRoutes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(routesToRender)]);

  // Get all unique valid stops to render markers
  const allStops = [];
  const stopSet = new Set();
  
  routesToRender.forEach(r => {
    (r.stops || []).forEach((stop, idx) => {
      if (stop.latitude && stop.longitude) {
        const key = `${stop.latitude},${stop.longitude}`;
        if (!stopSet.has(key)) {
          stopSet.add(key);
          allStops.push({ ...stop, hop: r.hops ? r.hops[idx] : null });
        }
      }
    });
  });

  const center = allStops.length ? [allStops[0].latitude, allStops[0].longitude] : [12.9716, 77.5946];

  return (
    <div style={{ height: height, width: "100%", marginTop: 20, position: "relative" }}>
      {isLoading && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          backgroundColor: "rgba(255,255,255,0.75)", zIndex: 1000, borderRadius: 8
        }}>
          <span style={{ fontSize: 14, color: "#1E74D6", fontWeight: "bold" }}>
            ⏳ Loading route...
          </span>
        </div>
      )}
      <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='© OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater stops={allStops} />
        {onMapClick && <ClickHandler onClick={onMapClick} />}

        {/* Markers */}
        {allStops.map((stop, idx) => (
          <Marker key={idx} position={[stop.latitude, stop.longitude]}>
            <Popup>
              <strong>{stop.location}</strong>
              {stop.hop && (
                <>
                  <br />Cost: ₹{stop.hop.cost}
                  <br />Mode: {stop.hop.mode}
                </>
              )}
            </Popup>
          </Marker>
        ))}

        {/* Polylines */}
        {routeGeometries.map((geom, idx) => {
          if (geom.path.length < 2) return null;
          // Determine if this exact path is selected
          const isSelected = selectedRouteId === geom.id || (!geom.isAlt && selectedRouteId === geom.route.id);
          const isParentSelected = selectedRouteId?.startsWith(geom.route.id);
          
          if (selectedRouteId && !isParentSelected) return null;

          const hasSelection = selectedRouteId != null && selectedRouteId !== 'default' && selectedRouteId !== geom.route.id;

          let currentOpacity = geom.baseOpacity;
          let currentWeight = geom.isAlt ? 4 : 5;
          let currentColor = geom.color;

          // If we are in Add Route mode (no multiRoutes passed)
          if (multiRoutes.length === 0) {
             if (hasSelection) {
                 currentColor = isSelected ? '#1E74D6' : '#28a745'; // Blue for selected, Green for deselected
                 currentOpacity = isSelected ? 1.0 : 0.6; // Keep green visible
                 currentWeight = isSelected ? 8 : 4; // Broad for selected, thin for deselected
             } else {
                 currentColor = geom.isAlt ? '#28a745' : '#1E74D6';
                 currentOpacity = geom.isAlt ? 0.6 : 1.0;
                 currentWeight = geom.isAlt ? 4 : 8;
             }
          } else {
             // Standard multi-route logic (e.g. Dashboard)
             if (hasSelection) {
                if (isSelected) {
                    currentOpacity = 1.0;
                    currentWeight = 8;
                } else {
                    currentOpacity = 0.15;
                    currentWeight = 4;
                }
             } else if (isSelected) {
                currentWeight = 8;
                currentOpacity = 1.0;
             }
          }

          return (
            <Polyline 
              key={`${geom.id}-${isSelected}`} 
              positions={geom.path} 
              pathOptions={{
                color: currentColor,
                weight: currentWeight,
                opacity: currentOpacity
              }}
              eventHandlers={{
                click: (e) => {
                  if (e.originalEvent) e.originalEvent.stopPropagation();
                  if (onRouteSelect) onRouteSelect(geom.id, geom.osrmRoute);
                },
              }}
              style={{ cursor: onRouteSelect ? 'pointer' : 'default' }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
