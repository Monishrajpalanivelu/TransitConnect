import { useState } from "react";
import { addRoute } from "../services/api";
import { styles } from "../styles/styles";
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

  const updateStop = (idx, key, val) =>
    setStops(prev => prev.map((s, i) => (i === idx ? { ...s, [key]: val } : s)));

  const updateHop = (idx, key, val) =>
    setHops(prev => prev.map((h, i) => (i === idx ? { ...h, [key]: val } : h)));

  const submit = async () => {
    // Validation
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
      alert("Route added");
      onClose();
    } catch (e) {
      alert("Add route failed: " + e.message);
    }
  };

  return (
    <div style={styles.card}>
      <h3>Add Route (with Map Picker)</h3>

      {stops.map((s, i) => (
        <div key={i} style={{ marginBottom: 20 }}>
          <input
            style={styles.input}
            value={s.location}
            placeholder={`Stop ${i + 1} name`}
            onChange={(e) => updateStop(i, "location", e.target.value)}
          />

          {/* Map picker */}
          <MapPicker
            lat={s.latitude}
            lng={s.longitude}
            onChange={({ lat, lng }) => {
              updateStop(i, "latitude", lat);
              updateStop(i, "longitude", lng);
            }}
          />

          {i < hops.length && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 12, fontWeight: "bold" }}>Cost (₹)</span>
                <input
                  type="number"
                  style={{ width: 100 }}
                  min="0"
                  value={hops[i].cost}
                  placeholder="Cost"
                  onChange={(e) => updateHop(i, "cost", e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 12, fontWeight: "bold" }}>Duration (mins)</span>
                <input
                  type="number"
                  style={{ width: 100 }}
                  min="0"
                  value={hops[i].duration}
                  placeholder="Duration"
                  onChange={(e) => updateHop(i, "duration", e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <select
                value={hops[i].mode}
                onChange={(e) => updateHop(i, "mode", e.target.value)}
              >
                <option>Bus</option>
                <option>Metro</option>
                <option>Walk</option>
                <option>Auto</option>
              </select>

              <span style={{ fontSize: 13, color: "#555" }}>
                (Hop from {s.location || `stop ${i + 1}`})
              </span>
            </div>
          )}
        </div>
      ))}

      <div style={{ marginTop: 10 }}>
        <button style={styles.blueBtn} onClick={addStop}>+ Add Stop</button>
        <button style={{ ...styles.blueBtn, marginLeft: 12 }} onClick={submit}>Submit Route</button>
        <button style={{ marginLeft: 8 }} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
