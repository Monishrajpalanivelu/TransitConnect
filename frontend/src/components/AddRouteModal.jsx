import { useState } from "react";
import { addRoute } from "../services/api";
import MapView from "./MapView";

export default function AddRouteModal({ onClose }) {
  const [stops, setStops] = useState([
    { location: "", latitude: null, longitude: null },
    { location: "", latitude: null, longitude: null }
  ]);

  const [hops, setHops] = useState([{ cost: "", duration: "", mode: "Bus", isOneWay: false }]);
  const [selectedRouteId, setSelectedRouteId] = useState("default");
  const [showMapOverlay, setShowMapOverlay] = useState(false);

  const addStop = () => {
    setStops(prev => [...prev, { location: "", latitude: null, longitude: null }]);
    setHops(prev => [...prev, { cost: "", duration: "", mode: "Bus", isOneWay: false }]);
  };

  const removeStop = (idx) => {
    if (stops.length <= 2) {
      alert("A route must have at least 2 stops.");
      return;
    }
    setStops(prev => prev.filter((_, i) => i !== idx));
    setHops(prev => prev.filter((_, i) => i !== Math.min(idx, prev.length - 1)));
  };

  const updateStop = (idx, key, val) =>
    setStops(prev => prev.map((s, i) => (i === idx ? { ...s, [key]: val } : s)));

  const updateHop = (idx, key, val) =>
    setHops(prev => prev.map((h, i) => (i === idx ? { ...h, [key]: val } : h)));

  const handleMapClick = (latlng) => {
    const idx = stops.findIndex(s => s.latitude === null || s.longitude === null);
    if (idx !== -1) {
      updateStop(idx, "latitude", latlng[0]);
      updateStop(idx, "longitude", latlng[1]);
    }
  };

  const undoLastPin = () => {
    for (let i = stops.length - 1; i >= 0; i--) {
      if (stops[i].latitude !== null && stops[i].longitude !== null) {
        updateStop(i, "latitude", null);
        updateStop(i, "longitude", null);
        break;
      }
    }
  };

  const submit = async () => {
    for (let s of stops) {
      if (!s.location || !s.location.trim()) return alert("Each stop must have a name.");
      if (s.latitude == null || s.longitude == null)
        return alert("Each stop must be placed on the map!");
    }
    for (let h of hops) {
      if (h.cost === "" || h.cost < 0) return alert("Enter a valid cost (0 or more) for all hops.");
      if (h.duration === "" || h.duration < 0) return alert("Enter a valid duration (0 or more) for all hops.");
    }

    let selectedIndex = 0;
    if (selectedRouteId && selectedRouteId.includes("-alt")) {
      const match = selectedRouteId.match(/-alt(\d+)/);
      if (match) selectedIndex = parseInt(match[1]);
    }

    const updatedHops = hops.map(h => ({ ...h }));
    try {
      const coordsString = stops.map(s => `${s.longitude},${s.latitude}`).join(";");
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=false&alternatives=true`
      );
      const data = await res.json();

      const routeToUse =
        data.routes && data.routes[selectedIndex]
          ? data.routes[selectedIndex]
          : data.routes
          ? data.routes[0]
          : null;

      if (routeToUse && routeToUse.legs) {
        for (let i = 0; i < updatedHops.length; i++) {
          updatedHops[i].distance = Math.round(routeToUse.legs[i]?.distance || 1);
        }
      } else {
        updatedHops.forEach(h => (h.distance = 1));
      }
    } catch (err) {
      console.error("OSRM error:", err);
      updatedHops.forEach(h => (h.distance = 1));
    }

    const payload = { stops, hops: updatedHops };

    try {
      await addRoute(payload);
      alert("Route added successfully!");
      onClose();
    } catch (e) {
      alert("Add route failed: " + e.message);
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      {showMapOverlay ? (
        <div className="modal-content animate-slide-up" style={{ width: "90vw", height: "90vh", display: "flex", flexDirection: "column", padding: 0 }} onClick={(e) => e.stopPropagation()}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-bg)" }}>
            <div>
              <h3 className="heading-3" style={{ margin: 0 }}>Map Selection</h3>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-light)" }}>
                Click map to place pins. Click a blue/green line to select a path.
              </p>
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button className="btn-secondary" onClick={undoLastPin}>
                ↩ Undo Last Pin
              </button>
              <button className="btn-primary" onClick={() => setShowMapOverlay(false)}>
                ✓ Done
              </button>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <MapView
              stops={stops.map((s, idx) => ({ ...s, id: `stop-${idx}` }))}
              hops={hops}
              onMapClick={handleMapClick}
              onRouteSelect={(id) => setSelectedRouteId(id)}
              selectedRouteId={selectedRouteId}
              height="100%"
              allowAlternatives={true}
            />
          </div>
        </div>
      ) : (
        <div className="modal-content animate-slide-up" onClick={(e) => e.stopPropagation()}>
          <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="heading-3" style={{ margin: 0 }}>Add a New Route</h3>
            <button className="btn-ghost" onClick={onClose} style={{ fontSize: "1.25rem", padding: "0.25rem 0.5rem" }}>×</button>
          </div>
          
          <div style={{ padding: "1.5rem", maxHeight: "60vh", overflowY: "auto" }}>
            <div className="alert-info" style={{ marginBottom: "1.5rem", fontSize: "0.875rem" }}>
              Add stops in order, specify the transit mode, and drop pins on the map.
            </div>

            {stops.map((s, i) => (
              <div key={i} style={{ marginBottom: "2rem", background: "var(--color-bg)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <label className="label" style={{ margin: 0 }}>Stop {i + 1}</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span style={{ fontSize: "0.8rem", color: s.latitude ? "#10B981" : "#EF4444", fontWeight: 500 }}>
                      {s.latitude ? "📍 Placed on Map" : "No pin"}
                    </span>
                    {stops.length > 2 && (
                      <button 
                        className="btn-ghost" 
                        onClick={() => removeStop(i)} 
                        style={{ color: "#DC2626", fontSize: "0.8rem", padding: "0.25rem 0.5rem", fontWeight: 600 }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <input
                  className="input-field"
                  style={{ marginBottom: "1rem" }}
                  value={s.location}
                  placeholder={`Name of Stop ${i + 1}`}
                  onChange={(e) => updateStop(i, "location", e.target.value)}
                />

                {i < hops.length && (
                  <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem", alignItems: "end" }}>
                    <div>
                      <label className="label" style={{ fontSize: "0.75rem" }}>Cost (₹)</label>
                      <input
                        className="input-field"
                        type="number"
                        min="0"
                        value={hops[i].cost}
                        placeholder="e.g. 20"
                        onChange={(e) => updateHop(i, "cost", e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="label" style={{ fontSize: "0.75rem" }}>Duration (m)</label>
                      <input
                        className="input-field"
                        type="number"
                        min="0"
                        value={hops[i].duration}
                        placeholder="e.g. 15"
                        onChange={(e) => updateHop(i, "duration", e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="label" style={{ fontSize: "0.75rem" }}>Mode</label>
                      <select
                        className="input-field"
                        value={hops[i].mode}
                        onChange={(e) => updateHop(i, "mode", e.target.value)}
                        style={{ cursor: "pointer" }}
                      >
                        <option>Bus</option>
                        <option>Metro</option>
                        <option>Walk</option>
                        <option>Auto</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", paddingBottom: "0.6rem" }}>
                      <input
                        type="checkbox"
                        id={`oneway-${i}`}
                        checked={hops[i].isOneWay || false}
                        onChange={(e) => updateHop(i, "isOneWay", e.target.checked)}
                        style={{ marginRight: "0.5rem", cursor: "pointer" }}
                      />
                      <label htmlFor={`oneway-${i}`} style={{ fontSize: "0.8rem", cursor: "pointer", color: "var(--color-text-light)" }}>
                        One-way →
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
              <button className="btn-secondary" onClick={addStop}>
                + Add Another Stop
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
              <button className="btn-primary" style={{ backgroundColor: "#10B981", borderColor: "#10B981" }} onClick={() => setShowMapOverlay(true)}>
                🗺️ Pick Stops on Map
              </button>
            </div>
          </div>

          <div style={{ padding: "1.25rem 1.5rem", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "flex-end", gap: "1rem", background: "var(--color-bg)", borderBottomLeftRadius: "var(--radius-xl)", borderBottomRightRadius: "var(--radius-xl)" }}>
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={submit}>Submit Route</button>
          </div>
        </div>
      )}
    </div>
  );
}
