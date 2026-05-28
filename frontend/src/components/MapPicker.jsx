// React 19 + React-Leaflet 5 compatible MapPicker

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { useState, useEffect } from "react";
import L from "leaflet";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet-geosearch/dist/geosearch.css";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
});

function SearchControl({ onSelect }) {
  const map = useMap();

  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    const searchControl = new GeoSearchControl({
      provider: provider,
      style: "bar",
      showMarker: false, 
      retainZoomLevel: false,
      animateZoom: true,
      autoClose: true,
      searchLabel: "Search places...",
      keepResult: true,
    });

    map.addControl(searchControl);

    const handleLocationFound = (e) => {
      if (onSelect) {
        onSelect([e.location.y, e.location.x]);
      }
    };

    map.on('geosearch/showlocation', handleLocationFound);

    return () => {
      map.removeControl(searchControl);
      map.off('geosearch/showlocation', handleLocationFound);
    };
  }, [map, onSelect]);

  return null;
}

// Handles map click to select a location
function ClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function MapPicker({ lat, lng, onChange }) {
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
        <TileLayer
          attribution='© OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <SearchControl onSelect={handleSelect} />
        <ClickHandler onSelect={handleSelect} />

        <Marker position={position} />
      </MapContainer>
    </div>
  );
}
