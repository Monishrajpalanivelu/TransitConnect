import { useState, useEffect } from "react";
import MapView from "./MapView";

export default function RouteCard({ data }) {
  const [selectedRouteId, setSelectedRouteId] = useState("shortest");

  useEffect(() => {
    if (data && Object.keys(data).length > 0 && !data[selectedRouteId]) {
      setSelectedRouteId(Object.keys(data)[0]);
    }
  }, [data, selectedRouteId]);

  if (!data || Object.keys(data).length === 0 || (Array.isArray(data) && data.length === 0)) {
    return (
      <div className="glass-card animate-slide-up flex-center" style={{ padding: "2rem" }}>
        <h3 className="heading-3" style={{ color: "var(--color-error)", margin: 0 }}>No Route Found</h3>
        <p className="text-muted" style={{ marginTop: "0.5rem" }}>Try adjusting your search parameters.</p>
      </div>
    );
  }

  const routeColors = {
    shortest: "#1E74D6",
    fastest: "#10B981", 
    cheapest: "#F59E0B" 
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
    <div className="glass-card animate-slide-up">
      <div className="flex-between" style={{ marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <h3 className="heading-2" style={{ margin: 0, color: "var(--color-primary)" }}>Your Journey Options</h3>
        
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {multiRoutes.map(r => (
            <button 
              key={r.id}
              onClick={() => setSelectedRouteId(r.id)}
              style={{
                padding: "0.4rem 1rem",
                borderRadius: "var(--radius-full)",
                border: `1.5px solid ${r.color}`,
                backgroundColor: selectedRouteId === r.id ? r.color : "transparent",
                color: selectedRouteId === r.id ? "white" : r.color,
                cursor: "pointer",
                fontWeight: 600,
                textTransform: "capitalize",
                fontSize: "0.875rem",
                transition: "all 0.2s"
              }}
            >
              {r.id}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "2rem", background: "var(--color-bg)", padding: "1.5rem", borderRadius: "var(--radius-md)" }}>
        {stops.map((stop, index) => (
          <div key={index} style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: index === 0 || index === stops.length - 1 ? "var(--color-primary)" : "var(--color-border)", border: "2px solid white", boxShadow: "0 0 0 2px var(--color-primary)" }} />
              <strong style={{ fontSize: "1.1rem" }}>{stop.location}</strong>
            </div>
            {index < hops.length && <Hop hop={hops[index]} />}
          </div>
        ))}
      </div>

      <div style={{ borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--color-border)", marginBottom: "1.5rem" }}>
        <MapView 
          multiRoutes={multiRoutes} 
          onRouteSelect={(id) => setSelectedRouteId(id)} 
          selectedRouteId={selectedRouteId} 
        />
      </div>

      <div style={{ display: "flex", gap: "2rem", borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem", flexWrap: "wrap" }}>
        <div>
          <div className="text-muted">Total Cost</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>₹{selectedRouteData.totalCost}</div>
        </div>
        <div>
          <div className="text-muted">Duration</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{selectedRouteData.totalDuration || 0} mins</div>
        </div>
        <div>
          <div className="text-muted">Distance</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{(selectedRouteData.totalDistance / 1000).toFixed(1)} km</div>
        </div>
        <div>
          <div className="text-muted">Transfers</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>
            {selectedRouteData.transferCount === 0 || !selectedRouteData.transferCount
              ? <span style={{ color: "#10B981" }}>Direct ✓</span>
              : <span style={{ color: "#F59E0B" }}>{selectedRouteData.transferCount}</span>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

const modeEmoji = (m) => {
  if (!m) return "";
  const mm = m.toLowerCase();
  if (mm === "bus") return "🚌";
  if (mm === "metro") return "🚇";
  if (mm === "walk") return "🚶";
  if (mm === "auto") return "🛺";
  if (mm === "bike") return "🛺";
  return "➡️";
};

const modeColor = (m) => {
  if (!m) return "#9CA3AF";
  const mm = m.toLowerCase();
  if (mm === "bus") return "#3B82F6";
  if (mm === "metro") return "#8B5CF6";
  if (mm === "walk") return "#10B981";
  if (mm === "auto" || mm === "bike") return "#F59E0B";
  return "#9CA3AF";
};

function Hop({ hop }) {
  const isZero = hop.cost === 0;
  let finalMode = isZero ? "Walk" : hop.mode;
  if (finalMode?.toLowerCase() === "bike") {
    finalMode = "Auto";
  }

  const finalEmoji = isZero ? "🚶" : modeEmoji(finalMode);
  const color = modeColor(finalMode);

  return (
    <div style={{ display: "flex", gap: "1rem", margin: "0.5rem 0 0.5rem 0.25rem" }}>
      <div style={{ width: "2px", background: color, minHeight: "3rem", margin: "0 4px", opacity: 0.5 }} />
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0" }}>
        <div style={{ background: "white", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", boxShadow: "var(--shadow-sm)", fontSize: "1.2rem" }}>
          {finalEmoji}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <strong style={{ color: color, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{finalMode}</strong>
          {!isZero && (
            <span className="text-muted" style={{ fontSize: "0.85rem" }}>₹{hop.cost} • {hop.duration || 0} mins</span>
          )}
          {isZero && (
            <span className="text-muted" style={{ fontSize: "0.85rem" }}>Short walk</span>
          )}
        </div>
      </div>
    </div>
  );
}
