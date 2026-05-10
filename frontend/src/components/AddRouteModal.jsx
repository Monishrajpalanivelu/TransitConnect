import { useState } from "react";
import { addRoute } from "../services/api";
import { styles } from "../styles/styles";
import MapPicker from "./MapPicker";

export default function AddRouteModal({ onClose, darkMode = false }) {
  const cardStyle = {
    ...styles.card,
    background: darkMode ? '#1e1e1e' : styles.card.background,
    color: darkMode ? '#fff' : '#000',
  };

  const inputStyle = {
    ...styles.input,
    background: darkMode ? '#333' : styles.input.background,
    color: darkMode ? '#fff' : '#000',
    border: darkMode ? '1px solid #555' : styles.input.border,
    marginBottom: '8px'
  };

  const numberInputStyle = {
    width: 100,
    background: darkMode ? '#333' : '#fff',
    color: darkMode ? '#fff' : '#000',
    border: darkMode ? '1px solid #555' : '1px solid #ccc',
    padding: '4px'
  };

  const selectStyle = {
    background: darkMode ? '#333' : '#fff',
    color: darkMode ? '#fff' : '#000',
    border: darkMode ? '1px solid #555' : '1px solid #ccc',
    padding: '4px'
  };
  const [stops, setStops] = useState([
    { location: "", latitude: null, longitude: null },
    { location: "", latitude: null, longitude: null }
  ]);

  const [hops, setHops] = useState([{ cost: 0, duration: 0, mode: "Bus" }]);

  const addStop = () => {
    setStops(prev => [...prev, { location: "", latitude: null, longitude: null }]);
    setHops(prev => [...prev, { cost: 0, duration: 0, mode: "Bus" }]);
  };

  const updateStop = (idx, key, val) =>
    setStops(prev => prev.map((s, i) => (i === idx ? { ...s, [key]: val } : s)));

  const updateHop = (idx, key, val) =>
    setHops(prev => prev.map((h, i) => (i === idx ? { ...h, [key]: val } : h)));

  const submit = async () => {
    // Validation
    for (let s of stops) {
      if (!s.location) return alert("Each stop must have a name");
      if (s.latitude == null || s.longitude == null)
        return alert("Each stop must be selected on the map!");
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
    <div style={cardStyle}>
      <h3>Add Route (with Map Picker)</h3>

      {stops.map((s, i) => (
        <div key={i} style={{ marginBottom: 20 }}>
          <input
            style={inputStyle}
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
            darkMode={darkMode}
          />

          {i < hops.length && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 12, fontWeight: "bold" }}>Cost (₹)</span>
                <input
                  type="number"
                  style={numberInputStyle}
                  min="0"
                  value={hops[i].cost}
                  placeholder="0"
                  onChange={(e) => updateHop(i, "cost", Math.max(0, Number(e.target.value)))}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 12, fontWeight: "bold" }}>Duration (mins)</span>
                <input
                  type="number"
                  style={numberInputStyle}
                  min="0"
                  value={hops[i].duration}
                  placeholder="0"
                  onChange={(e) => updateHop(i, "duration", Math.max(0, Number(e.target.value)))}
                />
              </div>

              <select
                style={selectStyle}
                value={hops[i].mode}
                onChange={(e) => updateHop(i, "mode", e.target.value)}
              >
                <option>Bus</option>
                <option>Metro</option>
                <option>Walk</option>
                <option>Auto</option>
              </select>

              <span style={{ fontSize: 13, color: darkMode ? '#aaa' : "#555" }}>
                (Hop from {s.location || `stop ${i + 1}`})
              </span>
            </div>
          )}
        </div>
      ))}

      <div style={{ marginTop: 10 }}>
        <button style={styles.blueBtn} onClick={addStop}>+ Add Stop</button>
        <button style={{ ...styles.blueBtn, marginLeft: 12 }} onClick={submit}>Submit Route</button>
        <button style={{ marginLeft: 8, background: darkMode ? '#333' : '#e0e0e0', color: darkMode ? '#fff' : '#000', border: 'none', padding: '12px 18px', borderRadius: '12px', cursor: 'pointer' }} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
