import { useState } from "react";
import { addRoute } from "../services/api";
import MapPicker from "./MapPicker";

export default function AddRouteModal({ onClose }) {
  const [stops, setStops] = useState([
    { location: "", latitude: null, longitude: null },
    { location: "", latitude: null, longitude: null }
  ]);

  const [hops, setHops] = useState([{ cost: "", duration: "", mode: "Bus" }]);

  const addStop = () => {
    setStops(prev => [...prev, { location: "", latitude: null, longitude: null }]);
    setHops(prev => [...prev, { cost: "", duration: "", mode: "Bus" }]);
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

  const submit = async () => {
    for (let s of stops) {
      if (!s.location || !s.location.trim()) return alert("Each stop must have a name");
      if (s.latitude == null || s.longitude == null)
        return alert("Each stop must be selected on the map!");
    }
    for (let h of hops) {
      if (h.cost === "" || h.cost <= 0) return alert("Please enter a valid cost (greater than 0) for all hops");
      if (h.duration === "" || h.duration <= 0) return alert("Please enter a valid duration (greater than 0) for all hops");
    }

    const payload = { stops, hops };

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
      <div className="modal-content animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 className="heading-3" style={{ margin: 0 }}>Add a New Route</h3>
          <button className="btn-ghost" onClick={onClose} style={{ fontSize: "1.25rem", padding: "0.25rem 0.5rem" }}>×</button>
        </div>
        
        <div style={{ padding: "1.5rem" }}>
          <div className="alert-info" style={{ marginBottom: "1.5rem", fontSize: "0.875rem" }}>
            Add stops in order, specify the transit mode, and drop pins on the map.
          </div>

          {stops.map((s, i) => (
            <div key={i} style={{ marginBottom: "2rem", background: "var(--color-bg)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label className="label" style={{ margin: 0 }}>Stop {i + 1}</label>
                {stops.length > 2 && (
                  <button 
                    className="btn-ghost" 
                    onClick={() => removeStop(i)} 
                    style={{ color: "#DC2626", fontSize: "0.8rem", padding: "0.25rem 0.5rem", fontWeight: 600 }}
                  >
                    Remove Stop
                  </button>
                )}
              </div>
              <input
                className="input-field"
                style={{ marginBottom: "1rem" }}
                value={s.location}
                placeholder={`Name of Stop ${i + 1}`}
                onChange={(e) => updateStop(i, "location", e.target.value)}
              />

              <div style={{ borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--color-border)", height: "200px" }}>
                <MapPicker
                  lat={s.latitude}
                  lng={s.longitude}
                  onChange={({ lat, lng }) => {
                    updateStop(i, "latitude", lat);
                    updateStop(i, "longitude", lng);
                  }}
                />
              </div>

              {i < hops.length && (
                <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
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
                </div>
              )}
            </div>
          ))}

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
            <button className="btn-secondary" onClick={addStop}>
              + Add Another Stop
            </button>
          </div>
        </div>

        <div style={{ padding: "1.25rem 1.5rem", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "flex-end", gap: "1rem", background: "var(--color-bg)", borderBottomLeftRadius: "var(--radius-xl)", borderBottomRightRadius: "var(--radius-xl)" }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={submit}>Submit Route</button>
        </div>
      </div>
    </div>
  );
}
