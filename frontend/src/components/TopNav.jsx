export default function TopNav({ onHome, onAdd, onManage }) {
  return (
    <div style={{ position: "fixed", top: "1rem", left: 0, right: 0, zIndex: 1000, display: "flex", justifyContent: "center" }}>
      <div className="glass-card flex-center animate-slide-up" style={{ padding: "0.5rem", borderRadius: "9999px", gap: "0.5rem", marginBottom: 0 }}>
        <button className="btn-ghost" onClick={onHome} style={{ padding: "0.5rem 1.5rem", borderRadius: "9999px", fontWeight: 600 }}>Home</button>
        <button className="btn-primary" onClick={onAdd} style={{ padding: "0.5rem 1.5rem", borderRadius: "9999px" }}>Add Route</button>
        <button className="btn-ghost" onClick={onManage} style={{ padding: "0.5rem 1.5rem", borderRadius: "9999px", fontWeight: 600 }}>Manage Routes</button>
      </div>
    </div>
  );
}
