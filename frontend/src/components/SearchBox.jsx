import { useEffect, useState } from "react";
import { fetchStops } from "../services/api";

export default function SearchBar({ onSearch }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mode, setMode] = useState("shortest");

  const [allStops, setAllStops] = useState([]);
  const [fromSug, setFromSug] = useState([]);
  const [toSug, setToSug] = useState([]);

  useEffect(() => {
    fetchStops().then((data) => {
      setAllStops(data || []);
    });
  }, []);

  const filterStops = (val) => {
    if (!val) return [];
    return allStops.filter((s) =>
      s.toLowerCase().includes(val.toLowerCase())
    );
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
              setFromSug(filterStops(e.target.value));
            }}
          />
          {fromSug.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", zIndex: 10, boxShadow: "var(--shadow-md)", maxHeight: "200px", overflowY: "auto" }}>
              {fromSug.map((s, i) => (
                <div key={i}
                  style={{ padding: "0.75rem 1rem", cursor: "pointer", borderBottom: i === fromSug.length - 1 ? "none" : "1px solid var(--color-border)" }}
                  onClick={() => { setFrom(s); setFromSug([]); }}
                  onMouseEnter={(e) => e.target.style.background = "var(--color-bg)"}
                  onMouseLeave={(e) => e.target.style.background = "transparent"}
                >
                  {s}
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
              setToSug(filterStops(e.target.value));
            }}
          />
          {toSug.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", zIndex: 10, boxShadow: "var(--shadow-md)", maxHeight: "200px", overflowY: "auto" }}>
              {toSug.map((s, i) => (
                <div key={i}
                  style={{ padding: "0.75rem 1rem", cursor: "pointer", borderBottom: i === toSug.length - 1 ? "none" : "1px solid var(--color-border)" }}
                  onClick={() => { setTo(s); setToSug([]); }}
                  onMouseEnter={(e) => e.target.style.background = "var(--color-bg)"}
                  onMouseLeave={(e) => e.target.style.background = "transparent"}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="label">Optimization Preference</label>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {['shortest', 'cheapest', 'fastest'].map((m) => (
              <label key={m} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", padding: "0.5rem 1rem", background: mode === m ? "var(--color-primary)" : "var(--color-bg)", color: mode === m ? "white" : "var(--color-text)", borderRadius: "var(--radius-full)", transition: "all var(--transition-fast)" }}>
                <input
                  type="radio"
                  value={m}
                  checked={mode === m}
                  onChange={() => setMode(m)}
                  style={{ display: "none" }}
                />
                <span style={{ textTransform: "capitalize", fontWeight: mode === m ? 600 : 400 }}>{m}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          className="btn-primary"
          style={{ marginTop: "1rem" }}
          onClick={() => onSearch(from, to, mode)}
        >
          Search Route
        </button>
      </div>
    </div>
  );
}
