import { useState, useRef } from "react";
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

  return (
    <div className="glass-card animate-slide-up">
      <h3 className="heading-3" style={{ marginTop: 0, marginBottom: "1.5rem" }}>Find your route</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

        <div style={{ position: "relative" }}>
          <label className="label">Origin</label>
          <input
            className="input-field"
            placeholder="Where are you starting?"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              searchStops(e.target.value, setFromSug, fromTimer);
            }}
            onBlur={() => setTimeout(() => setFromSug([]), 150)}
          />
          {fromSug.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", zIndex: 10, boxShadow: "var(--shadow-md)", maxHeight: "200px", overflowY: "auto" }}>
              {fromSug.map((s, i) => (
                <div key={i}
                  style={{ padding: "0.75rem 1rem", cursor: "pointer", borderBottom: i === fromSug.length - 1 ? "none" : "1px solid var(--color-border)" }}
                  onMouseDown={() => { setFrom(s); setFromSug([]); }}
                  onMouseEnter={(e) => e.target.style.background = "var(--color-bg)"}
                  onMouseLeave={(e) => e.target.style.background = "transparent"}
                >
                  📍 {s}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ position: "relative" }}>
          <label className="label">Destination</label>
          <input
            className="input-field"
            placeholder="Where do you want to go?"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              searchStops(e.target.value, setToSug, toTimer);
            }}
            onBlur={() => setTimeout(() => setToSug([]), 150)}
          />
          {toSug.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", zIndex: 10, boxShadow: "var(--shadow-md)", maxHeight: "200px", overflowY: "auto" }}>
              {toSug.map((s, i) => (
                <div key={i}
                  style={{ padding: "0.75rem 1rem", cursor: "pointer", borderBottom: i === toSug.length - 1 ? "none" : "1px solid var(--color-border)" }}
                  onMouseDown={() => { setTo(s); setToSug([]); }}
                  onMouseEnter={(e) => e.target.style.background = "var(--color-bg)"}
                  onMouseLeave={(e) => e.target.style.background = "transparent"}
                >
                  📍 {s}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          className="btn-primary"
          style={{ marginTop: "1rem" }}
          onClick={() => onSearch(from, to)}
        >
          Search Route
        </button>
      </div>
    </div>
  );
}
