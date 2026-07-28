// FULL UPDATED RouteCard.jsx (with MapView + MultiRoute support)

import { useState, useEffect } from "react";
import { styles } from "../styles/styles";
import MapView from "./MapView";

export default function RouteCard({ data }) {
  // data is now a map: { fastest: { ... }, shortest: { ... }, cheapest: { ... } }
  
  const [selectedRouteId, setSelectedRouteId] = useState("shortest");

  // Reset selection if the current one isn't in the new search results
  useEffect(() => {
    if (data && Object.keys(data).length > 0 && !data[selectedRouteId]) {
      setSelectedRouteId(Object.keys(data)[0]);
    }
  }, [data, selectedRouteId]);

  if (!data || Object.keys(data).length === 0) {
    return (
      <div style={styles.card}>
        <h3 style={{ color: "red" }}>No Route Found</h3>
      </div>
    );
  }

  // Convert the map to an array for MapView
  const routeColors = {
    shortest: "#1E74D6", // Blue
    fastest: "#28a745",  // Green
    cheapest: "#fd7e14"  // Orange
  };

  const multiRoutes = Object.entries(data).map(([key, routeData]) => ({
    id: key,
    stops: routeData.segmentStops,
    hops: routeData.segmentHops,
    color: routeColors[key] || "#1E74D6",
    ...routeData
  }));

  const selectedRouteData = data[selectedRouteId] || multiRoutes[0];
  const stops = selectedRouteData.segmentStops;
  const hops = selectedRouteData.segmentHops;

  return (
    <div style={styles.card}>
      <h3 style={{ color: "#1E74D6", marginBottom: "10px" }}>Route Options</h3>
      
      <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
        {multiRoutes.map(r => (
          <button 
            key={r.id}
            onClick={() => setSelectedRouteId(r.id)}
            style={{
              padding: "8px 12px",
              borderRadius: "4px",
              border: `2px solid ${r.color}`,
              backgroundColor: selectedRouteId === r.id ? r.color : "transparent",
              color: selectedRouteId === r.id ? "white" : r.color,
              cursor: "pointer",
              fontWeight: "bold",
              textTransform: "capitalize"
            }}
          >
            {r.id}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", marginBottom: "10px" }}>
        {stops.map((stop, index) => (
          <div key={index} style={{ display: "flex", alignItems: "center" }}>
            <strong style={{ fontSize: 16 }}>{stop.location}</strong>
            {index < hops.length && <Hop hop={hops[index]} />}
          </div>
        ))}
      </div>

      {/* MAP VIEW */}
      <MapView 
        multiRoutes={multiRoutes} 
        onRouteSelect={(id) => setSelectedRouteId(id)} 
        selectedRouteId={selectedRouteId} 
      />

      <div style={{ marginTop: 20 }}>
        <strong>Selected:</strong> <span style={{textTransform: 'capitalize'}}>{selectedRouteId}</span> Path <br />
        <strong>Total Cost:</strong> ₹{selectedRouteData.totalCost} <br />
        <strong>Total Duration:</strong> {selectedRouteData.totalDuration || 0} mins <br />
        <strong>Total Distance:</strong> {(selectedRouteData.totalDistance / 1000).toFixed(1)} km <br />
        <strong>Total Stops:</strong> {selectedRouteData.stopsCount} <br />
        <strong>Transfers:</strong>{" "}
        {selectedRouteData.transferCount === 0 || !selectedRouteData.transferCount
          ? <span style={{ color: "#28a745", fontWeight: "bold" }}>0 — Direct service ✓</span>
          : <span style={{ color: "#fd7e14" }}>{selectedRouteData.transferCount} change{selectedRouteData.transferCount > 1 ? "s" : ""}</span>
        }
      </div>
    </div>
  );
}

// ============================
// Hop indicator with emojis
// ============================
const modeEmoji = (m) => {
  if (!m) return "";
  const mm = m.toLowerCase();
  if (mm === "bus") return "🚌";
  if (mm === "metro") return "🚇";
  if (mm === "walk") return "🚶";
  if (mm === "auto") return "🛺";
  if (mm === "bike") return "🛺"; // convert bike → auto
  return "➡️";
};

function Hop({ hop }) {
  const isZero = hop.cost === 0;

  let finalMode = isZero ? "Walk" : hop.mode;

  // convert bike → auto
  if (finalMode?.toLowerCase() === "bike") {
    finalMode = "Auto";
  }

  const finalEmoji = isZero ? "🚶" : modeEmoji(finalMode);

  return (
    <div style={{ fontSize: 15, textAlign: "center", margin: "0 15px" }}>
      {isZero ? (
        <>---- {finalMode.toUpperCase()} ({finalEmoji}) ----→</>
      ) : (
        <>---- ₹{hop.cost} • {hop.duration || 0}m • {finalMode.toUpperCase()} ({finalEmoji}) ----→</>
      )}
    </div>
  );
}
