// FULL UPDATED RouteCard.jsx (with MapView + Auto instead of Bike)

import { styles } from "../styles/styles";
import MapView from "./MapView";

export default function RouteCard({ data, vehicle }) {
  if (!data) return null;

  // case: empty array → no route found
  if (Array.isArray(data) && data.length === 0) {
    return (
      <div style={styles.card}>
        <h3 style={{ color: "red" }}>No Route Found</h3>
      </div>
    );
  }

  // ============================
  // SEGMENT ROUTE (Shortest/Cheapest)
  // ============================
  if (data.segmentStops && data.segmentHops) {
    const stops = data.segmentStops;
    const hops = data.segmentHops;

    return (
      <div style={styles.card}>
        <h3 style={{ color: "#1E74D6" }}>Segment Route</h3>

        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
          {stops.map((stop, index) => (
            <div key={index} style={{ display: "flex", alignItems: "center" }}>
              <strong style={{ fontSize: 16 }}>{stop.location}</strong>
              {index < hops.length && <Hop hop={hops[index]} />}
            </div>
          ))}
        </div>

        {/* MAP VIEW FOR SEGMENT */}
        <MapView stops={stops} hops={hops} vehicle={vehicle} />

        <div style={{ marginTop: 20 }}>
          <strong>Total Cost:</strong> ₹{data.totalCost} <br />
          <strong>Total Duration:</strong> {data.totalDuration || 0} mins <br />
          <strong>Total Stops:</strong> {data.stopsCount}
        </div>
      </div>
    );
  }

  // ============================
  // FULL ROUTE (legacy smartSearch full route)
  // ============================
  const route = Array.isArray(data) ? data[0] : data;
  if (!route || !route.stops) {
    return (
      <div style={styles.card}>
        <h3 style={{ color: "red" }}>No Route Found</h3>
      </div>
    );
  }

  const stops = route.stops;
  const hops = route.hops || [];
  const totalCost = hops.reduce((sum, h) => sum + (h.cost || 0), 0);
  const totalDuration = hops.reduce((sum, h) => sum + (h.duration || 0), 0);

  return (
    <div style={styles.card}>
      <h3 style={{ color: "#1E74D6" }}>Full Route</h3>

      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
        {stops.map((stop, index) => (
          <div key={index} style={{ display: "flex", alignItems: "center" }}>
            <strong style={{ fontSize: 16 }}>{stop.location}</strong>
            {index < hops.length && <Hop hop={hops[index]} />}
          </div>
        ))}
      </div>

      {/* MAP VIEW FOR FULL ROUTE */}
      <MapView stops={stops} hops={hops} vehicle={vehicle} />

      <div style={{ marginTop: 20 }}>
        <strong>Total Cost:</strong> ₹{totalCost} <br />
        <strong>Total Duration:</strong> {totalDuration} mins <br />
        <strong>Total Stops:</strong> {stops.length}
      </div>
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
