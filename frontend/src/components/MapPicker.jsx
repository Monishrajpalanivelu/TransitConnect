// React 19 + React-Leaflet 5 compatible MapPicker

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useState } from "react";
import L from "leaflet";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
});

// Handles map click to select a location
function ClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function MapPicker({ lat, lng, onChange, darkMode = false }) {
  const [position, setPosition] = useState(
    lat && lng ? [lat, lng] : [12.9716, 77.5946] // default Bangalore
  );

  const handleSelect = (pos) => {
    setPosition(pos);
    onChange({ lat: pos[0], lng: pos[1] });
  };

  return (
    <div style={{ height: 250, width: "100%", marginTop: 10 }}>
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        {darkMode ? (
          <TileLayer
            attribution='© OpenStreetMap contributors, CartoDB'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        ) : (
          <TileLayer
            attribution='© OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}

        <ClickHandler onSelect={handleSelect} />

        <Marker position={position} />
      </MapContainer>
    </div>
  );
}
