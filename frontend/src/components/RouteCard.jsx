// FULL UPDATED RouteCard.jsx (with MapView + Auto instead of Bike)

import { styles } from "../styles/styles";
import MapView from "./MapView";

export default function RouteCard({ data }) {
  if (!data) return null;

  // case: empty array → no route found
  if (Array.isArray(data) && data.length === 0) {
    return (
      <div style={styles.card}>
        <h3 style={{ color: "red" }}>No Route Found</h3>
      </div>
    );
  }

  if (data.segmentStops && data.segmentHops) {
    const stops = data.segmentStops;
    const hops = data.segmentHops;

    return (
      <div style={styles.card}>
        <h3 style={{ color: "#1E74D6" }}>Route Details</h3>

        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
          {stops.map((stop, index) => (
            <div key={index} style={{ display: "flex", alignItems: "center" }}>
              <strong style={{ fontSize: 16 }}>{stop.location}</strong>
              {index < hops.length && <Hop hop={hops[index]} />}
            </div>
          ))}
        </div>

        {/* MAP VIEW */}
        <MapView stops={stops} hops={hops} />

        <div style={{ marginTop: 20 }}>
          <strong>Total Cost:</strong> ₹{data.totalCost} <br />
          <strong>Total Duration:</strong> {data.totalDuration || 0} mins <br />
          <strong>Total Stops:</strong> {data.stopsCount}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <h3 style={{ color: "red" }}>No Route Found</h3>
    </div>
  );
}

// ============================
// Hop indicator with emojis
// ============================
const modeEmoji = (m) => {
  if (!m) return "";
  const mm = m.toLowerCase();
  if (mm === "bus") return "🚌";
  if (mm === "metro") return "🚇";
  if (mm === "walk") return "🚶";
  if (mm === "auto") return "🛺";
  if (mm === "bike") return "🛺"; // convert bike → auto
  return "➡️";
};

function Hop({ hop }) {
  const isZero = hop.cost === 0;

  let finalMode = isZero ? "Walk" : hop.mode;

  // convert bike → auto
  if (finalMode?.toLowerCase() === "bike") {
    finalMode = "Auto";
  }

  const finalEmoji = isZero ? "🚶" : modeEmoji(finalMode);

  return (
    <div style={{ fontSize: 15, textAlign: "center", margin: "0 15px" }}>
      {isZero ? (
        <>---- {finalMode.toUpperCase()} ({finalEmoji}) ----→</>
      ) : (
        <>---- ₹{hop.cost} • {hop.duration || 0}m • {finalMode.toUpperCase()} ({finalEmoji}) ----→</>
      )}
    </div>
  );
}
