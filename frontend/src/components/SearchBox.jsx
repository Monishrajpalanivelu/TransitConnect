import { useEffect, useState } from "react";
import { styles } from "../styles/styles";
import { fetchStops } from "../services/api";

export default function SearchBar({ onSearch }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mode, setMode] = useState("shortest");

  const [allStops, setAllStops] = useState([]);
  const [fromSug, setFromSug] = useState([]);
  const [toSug, setToSug] = useState([]);

  // Load stops from backend
  useEffect(() => {
    fetchStops().then((data) => {
      setAllStops(data || []);
      console.log("Stops loaded from backend:", data);
    });
  }, []);

  const filterStops = (val) => {
    if (!val) return [];
    return allStops.filter((s) =>
      s.toLowerCase().includes(val.toLowerCase())
    );
  };

  return (
    <div style={styles.card}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

        {/* FROM INPUT */}
        <div style={{ position: "relative" }}>
          <input
            style={styles.input}
            placeholder="From"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setFromSug(filterStops(e.target.value));
            }}
          />
          {fromSug.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #ccc", borderRadius: 6, position: "absolute", zIndex: 10, width: "100%", marginTop: 4 }}>
              {fromSug.map((s, i) => (
                <div key={i}
                  style={{ padding: 6, cursor: "pointer" }}
                  onClick={() => { setFrom(s); setFromSug([]); }}>
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TO INPUT */}
        <div style={{ position: "relative" }}>
          <input
            style={styles.input}
            placeholder="To"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setToSug(filterStops(e.target.value));
            }}
          />
          {toSug.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #ccc", borderRadius: 6, position: "absolute", zIndex: 10, width: "100%", marginTop: 4 }}>
              {toSug.map((s, i) => (
                <div key={i}
                  style={{ padding: 6, cursor: "pointer" }}
                  onClick={() => { setTo(s); setToSug([]); }}>
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODE */}
        <div style={{ display: "flex", gap: 12 }}>
          <label>
            <input
              type="radio"
              value="shortest"
              checked={mode === "shortest"}
              onChange={() => setMode("shortest")}
            /> Shortest
          </label>
          <label>
            <input
              type="radio"
              value="cheapest"
              checked={mode === "cheapest"}
              onChange={() => setMode("cheapest")}
            /> Cheapest
          </label>
          <label>
            <input
              type="radio"
              value="fastest"
              checked={mode === "fastest"}
              onChange={() => setMode("fastest")}
            /> Fastest
          </label>
        </div>

        <button
          style={styles.blueBtn}
          onClick={() => onSearch(from, to, mode)}
        >
          Search Route
        </button>
      </div>
    </div>
  );
}
