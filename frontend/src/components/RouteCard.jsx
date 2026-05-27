import MapView from "./MapView";

export default function RouteCard({ data }) {
  if (!data) return null;

  if (Array.isArray(data) && data.length === 0) {
    return (
      <div className="glass-card animate-slide-up flex-center" style={{ padding: "2rem" }}>
        <h3 className="heading-3" style={{ color: "var(--color-error)", margin: 0 }}>No Route Found</h3>
        <p className="text-muted" style={{ marginTop: "0.5rem" }}>Try adjusting your search parameters.</p>
      </div>
    );
  }

  if (data.segmentStops && data.segmentHops) {
    const stops = data.segmentStops;
    const hops = data.segmentHops;

    return (
      <div className="glass-card animate-slide-up">
        <div className="flex-between" style={{ marginBottom: "1.5rem" }}>
          <h3 className="heading-2" style={{ margin: 0, color: "var(--color-primary)" }}>Your Journey</h3>
          <div style={{ background: "#EEF2FF", color: "var(--color-primary)", padding: "0.5rem 1rem", borderRadius: "var(--radius-full)", fontWeight: 600, fontSize: "0.875rem" }}>
            {data.totalDuration || 0} mins • ₹{data.totalCost}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "2rem", background: "var(--color-bg)", padding: "1.5rem", borderRadius: "var(--radius-md)" }}>
          {stops.map((stop, index) => (
            <div key={index} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: index === 0 || index === stops.length - 1 ? "var(--color-primary)" : "var(--color-border)", border: "2px solid white", boxShadow: "0 0 0 2px var(--color-primary)" }} />
                <strong style={{ fontSize: "1.1rem" }}>{stop.location}</strong>
              </div>
              {index < hops.length && <Hop hop={hops[index]} />}
            </div>
          ))}
        </div>

        <div style={{ borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--color-border)", marginBottom: "1.5rem" }}>
          <MapView stops={stops} hops={hops} />
        </div>

        <div style={{ display: "flex", gap: "2rem", borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem" }}>
          <div>
            <div className="text-muted">Total Cost</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>₹{data.totalCost}</div>
          </div>
          <div>
            <div className="text-muted">Duration</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{data.totalDuration || 0} mins</div>
          </div>
          <div>
            <div className="text-muted">Transfers</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{data.stopsCount}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card animate-slide-up">
      <h3 className="heading-3" style={{ color: "var(--color-error)" }}>No Route Found</h3>
    </div>
  );
}

const modeEmoji = (m) => {
  if (!m) return "";
  const mm = m.toLowerCase();
  if (mm === "bus") return "🚌";
  if (mm === "metro") return "🚇";
  if (mm === "walk") return "🚶";
  if (mm === "auto") return "🛺";
  if (mm === "bike") return "🛺";
  return "➡️";
};

const modeColor = (m) => {
  if (!m) return "#9CA3AF";
  const mm = m.toLowerCase();
  if (mm === "bus") return "#3B82F6";
  if (mm === "metro") return "#8B5CF6";
  if (mm === "walk") return "#10B981";
  if (mm === "auto" || mm === "bike") return "#F59E0B";
  return "#9CA3AF";
};

function Hop({ hop }) {
  const isZero = hop.cost === 0;
  let finalMode = isZero ? "Walk" : hop.mode;
  if (finalMode?.toLowerCase() === "bike") {
    finalMode = "Auto";
  }

  const finalEmoji = isZero ? "🚶" : modeEmoji(finalMode);
  const color = modeColor(finalMode);

  return (
    <div style={{ display: "flex", gap: "1rem", margin: "0.5rem 0 0.5rem 0.25rem" }}>
      <div style={{ width: "2px", background: color, minHeight: "3rem", margin: "0 4px", opacity: 0.5 }} />
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0" }}>
        <div style={{ background: "white", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", boxShadow: "var(--shadow-sm)", fontSize: "1.2rem" }}>
          {finalEmoji}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <strong style={{ color: color, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{finalMode}</strong>
          {!isZero && (
            <span className="text-muted" style={{ fontSize: "0.85rem" }}>₹{hop.cost} • {hop.duration || 0} mins</span>
          )}
          {isZero && (
            <span className="text-muted" style={{ fontSize: "0.85rem" }}>Short walk</span>
          )}
        </div>
      </div>
    </div>
  );
}
