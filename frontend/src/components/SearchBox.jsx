import { useState, useRef } from "react";
import { styles } from "../styles/styles";
import { fetchStops } from "../services/api";

export default function SearchBar({ onSearch }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromSug, setFromSug] = useState([]);
  const [toSug, setToSug] = useState([]);
  const fromTimer = useRef(null);
  const toTimer = useRef(null);

  // Debounced server-side prefix search
  const searchStops = (val, setSug, timerRef) => {
    clearTimeout(timerRef.current);
    if (!val || val.length < 2) { setSug([]); return; }
    timerRef.current = setTimeout(async () => {
      try {
        const results = await fetchStops(val, 10);
        setSug(results || []);
      } catch (e) {
        setSug([]);
      }
    }, 250);
  };

  const suggestionStyle = {
    position: "absolute",
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: 6,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    zIndex: 999,
    width: "100%",
    maxHeight: 220,
    overflowY: "auto",
  };

  const suggestionItem = (hovered) => ({
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: 14,
    backgroundColor: hovered ? "#f0f4ff" : "#fff",
    borderBottom: "1px solid #f3f3f3",
  });

  return (
    <div style={styles.card}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* FROM INPUT */}
        <div style={{ position: "relative" }}>
          <label style={{ fontSize: 12, fontWeight: "bold", color: "#555", display: "block", marginBottom: 4 }}>From</label>
          <input
            style={styles.input}
            placeholder="Type stop name..."
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              searchStops(e.target.value, setFromSug, fromTimer);
            }}
            onBlur={() => setTimeout(() => setFromSug([]), 150)}
          />
          {fromSug.length > 0 && (
            <div style={suggestionStyle}>
              {fromSug.map((s, i) => (
                <div
                  key={i}
                  style={suggestionItem(false)}
                  onMouseEnter={e => e.target.style.backgroundColor = "#f0f4ff"}
                  onMouseLeave={e => e.target.style.backgroundColor = "#fff"}
                  onMouseDown={() => { setFrom(s); setFromSug([]); }}
                >
                  📍 {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TO INPUT */}
        <div style={{ position: "relative" }}>
          <label style={{ fontSize: 12, fontWeight: "bold", color: "#555", display: "block", marginBottom: 4 }}>To</label>
          <input
            style={styles.input}
            placeholder="Type stop name..."
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              searchStops(e.target.value, setToSug, toTimer);
            }}
            onBlur={() => setTimeout(() => setToSug([]), 150)}
          />
          {toSug.length > 0 && (
            <div style={suggestionStyle}>
              {toSug.map((s, i) => (
                <div
                  key={i}
                  style={suggestionItem(false)}
                  onMouseEnter={e => e.target.style.backgroundColor = "#f0f4ff"}
                  onMouseLeave={e => e.target.style.backgroundColor = "#fff"}
                  onMouseDown={() => { setTo(s); setToSug([]); }}
                >
                  📍 {s}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          style={styles.blueBtn}
          onClick={() => onSearch(from, to)}
        >
          Search Route
        </button>
      </div>
    </div>
  );
}
