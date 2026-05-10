import { useEffect, useState } from "react";
import { styles } from "../styles/styles";
import { fetchStops } from "../services/api";

export default function SearchBar({ onSearch, darkMode = false }) {
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
  };

  const dropdownStyle = {
    background: darkMode ? '#333' : '#fff',
    border: darkMode ? '1px solid #555' : '1px solid #ccc',
    borderRadius: 6,
    color: darkMode ? '#fff' : '#000'
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

        {/* FROM INPUT */}
        <div>
          <input
            style={inputStyle}
            placeholder="From"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setFromSug(filterStops(e.target.value));
            }}
          />
          {fromSug.length > 0 && (
            <div style={dropdownStyle}>
              {fromSug.map((s, i) => (
                <div key={i}
                  style={{ padding: 6, cursor: "pointer", borderBottom: i < fromSug.length - 1 ? (darkMode ? '1px solid #444' : '1px solid #eee') : 'none' }}
                  onClick={() => { setFrom(s); setFromSug([]); }}>
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TO INPUT */}
        <div>
          <input
            style={inputStyle}
            placeholder="To"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setToSug(filterStops(e.target.value));
            }}
          />
          {toSug.length > 0 && (
            <div style={dropdownStyle}>
              {toSug.map((s, i) => (
                <div key={i}
                  style={{ padding: 6, cursor: "pointer", borderBottom: i < toSug.length - 1 ? (darkMode ? '1px solid #444' : '1px solid #eee') : 'none' }}
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
