import { useState } from "react";
import { addRoute } from "../services/api";
import { styles } from "../styles/styles";
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

  const updateStop = (idx, key, val) =>
    setStops(prev => prev.map((s, i) => (i === idx ? { ...s, [key]: val } : s)));

  const updateHop = (idx, key, val) =>
    setHops(prev => prev.map((h, i) => (i === idx ? { ...h, [key]: val } : h)));

  const handleMapClick = (latlng) => {
    const idx = stops.findIndex(s => s.latitude === null || s.longitude === null);
    if (idx !== -1) {
      updateStop(idx, "latitude", latlng[0]);
      updateStop(idx, "longitude", latlng[1]);
      // Do NOT auto-set a name — the user must type a real stop name
    } else {
      // All stops placed, ignore extra map clicks
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
    // Validation
    for (let s of stops) {
      if (!s.location || !s.location.trim()) return alert("Each stop must have a name.");
      if (s.latitude == null || s.longitude == null)
        return alert("Each stop must be placed on the map!");
    }
    for (let h of hops) {
      if (h.cost === "" || h.cost < 0) return alert("Enter a valid cost (0 or more) for all hops.");
      if (h.duration === "" || h.duration < 0) return alert("Enter a valid duration (0 or more) for all hops.");
    }

    // Extract selected alternative index
    let selectedIndex = 0;
    if (selectedRouteId && selectedRouteId.includes("-alt")) {
      const match = selectedRouteId.match(/-alt(\d+)/);
      if (match) selectedIndex = parseInt(match[1]);
    }

    // Fetch distance from OSRM for the ENTIRE route
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
    <div style={{ ...styles.card, width: "600px", maxWidth: "90vw", position: "relative" }}>
      {showMapOverlay ? (
        <div style={{
          display: "flex", flexDirection: "column", height: "600px",
          backgroundColor: "#fff", borderRadius: 8, overflow: "hidden"
        }}>
          <div style={{
            padding: "10px 15px", backgroundColor: "#f8f9fa",
            borderBottom: "1px solid #ddd", display: "flex",
            justifyContent: "space-between", alignItems: "center", flexShrink: 0
          }}>
            <div>
              <span style={{ fontWeight: "bold" }}>Map Selection</span>
              <p style={{ margin: 0, fontSize: 12, color: "#555" }}>
                Click map to place pins. Click a blue/green line to select a path.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                style={{ padding: "6px 12px", borderRadius: 4, border: "1px solid #ccc", cursor: "pointer" }}
                onClick={undoLastPin}
              >
                ↩ Undo Last Pin
              </button>
              <button
                style={{ ...styles.blueBtn, padding: "6px 12px" }}
                onClick={() => setShowMapOverlay(false)}
              >
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
        <>
          <h3>Add Route</h3>
          <p style={{ fontSize: 13, color: "#666", marginBottom: 15 }}>
            Enter stop names, fill in costs and durations, then pick pins on the map.
          </p>

          <div style={{ maxHeight: "50vh", overflowY: "auto", marginBottom: 15, paddingRight: 10 }}>
            {stops.map((s, i) => (
              <div key={i} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: "bold", minWidth: 18 }}>{i + 1}.</span>
                  <input
                    style={{ ...styles.input, flex: 1, marginBottom: 0 }}
                    value={s.location}
                    placeholder={`Stop ${i + 1} name (e.g. Majestic)`}
                    onChange={(e) => updateStop(i, "location", e.target.value)}
                  />
                  <span style={{ fontSize: 12, color: s.latitude ? "green" : "#e53e3e", minWidth: 80 }}>
                    {s.latitude ? "📍 Placed" : "No pin"}
                  </span>
                </div>

                {i < hops.length && (
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginTop: 8, paddingLeft: 26, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: 11, fontWeight: "bold", color: "#555" }}>Cost (₹)</span>
                      <input
                        type="number"
                        style={{ width: 75, padding: "5px 6px", borderRadius: 4, border: "1px solid #ccc" }}
                        min="0"
                        value={hops[i].cost}
                        placeholder="0"
                        onChange={(e) => updateHop(i, "cost", e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: 11, fontWeight: "bold", color: "#555" }}>Duration (min)</span>
                      <input
                        type="number"
                        style={{ width: 85, padding: "5px 6px", borderRadius: 4, border: "1px solid #ccc" }}
                        min="0"
                        value={hops[i].duration}
                        placeholder="0"
                        onChange={(e) => updateHop(i, "duration", e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: 11, fontWeight: "bold", color: "#555" }}>Mode</span>
                      <select
                        style={{ padding: "5px 6px", borderRadius: 4, border: "1px solid #ccc" }}
                        value={hops[i].mode}
                        onChange={(e) => updateHop(i, "mode", e.target.value)}
                      >
                        <option>Bus</option>
                        <option>Metro</option>
                        <option>Walk</option>
                        <option>Auto</option>
                      </select>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 2 }}>
                      <input
                        type="checkbox"
                        id={`oneway-${i}`}
                        checked={hops[i].isOneWay || false}
                        onChange={(e) => updateHop(i, "isOneWay", e.target.checked)}
                        style={{ width: 14, height: 14, cursor: "pointer" }}
                      />
                      <label htmlFor={`oneway-${i}`} style={{ fontSize: 12, color: "#555", cursor: "pointer" }}>
                        One-way →
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button
              style={{ ...styles.blueBtn, padding: "5px 10px", fontSize: 13, backgroundColor: "#6c757d" }}
              onClick={addStop}
            >
              + Add Stop
            </button>
          </div>

          <div style={{ marginTop: 15, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              style={{ ...styles.blueBtn, padding: "8px 16px", backgroundColor: "#28a745" }}
              onClick={() => setShowMapOverlay(true)}
            >
              🗺️ Pick Stops on Map
            </button>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ padding: "8px 16px", borderRadius: 5, border: "1px solid #ccc", cursor: "pointer", background: "white" }} onClick={onClose}>
                Cancel
              </button>
              <button style={{ ...styles.blueBtn, padding: "8px 16px" }} onClick={submit}>
                Submit Route
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
