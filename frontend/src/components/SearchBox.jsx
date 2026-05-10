import { useEffect, useState } from "react";
import { styles } from "../styles/styles";
import { fetchStops } from "../services/api";

export default function SearchBar({ onSearch }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mode, setMode] = useState("shortest");
  const [vehicle, setVehicle] = useState("car"); // Default to car

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
        <div>
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
            <div style={{ background: "#fff", border: "1px solid #ccc", borderRadius: 6 }}>
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
        <div>
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
            <div style={{ background: "#fff", border: "1px solid #ccc", borderRadius: 6 }}>
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

        {/* VEHICLE TYPE */}
        <div style={{ display: "flex", gap: 12 }}>
            <label>
                <input
                    type="radio"
                    value="car"
                    checked={vehicle === "car"}
                    onChange={() => setVehicle("car")}
                /> Car
            </label>
            <label>
                <input
                    type="radio"
                    value="bike"
                    checked={vehicle === "bike"}
                    onChange={() => setVehicle("bike")}
                /> Bike
            </label>
            <label>
                <input
                    type="radio"
                    value="walking"
                    checked={vehicle === "walking"}
                    onChange={() => setVehicle("walking")}
                /> Walking
            </label>
        </div>

        <button
          style={styles.blueBtn}
          onClick={() => onSearch(from, to, mode, vehicle)}
        >
          Search Route
        </button>
      </div>
    </div>
  );
}
