import { useState } from "react";

export default function Welcome() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <div
        className="glass-card animate-slide-up"
        onClick={() => setIsOpen(true)}
        style={{
          padding: "1rem",
          textAlign: "center",
          cursor: "pointer",
          backgroundColor: "#E0E7FF",
          border: "1px solid #C7D2FE",
          color: "var(--color-primary)",
          fontWeight: 600,
          marginBottom: "1.5rem"
        }}
      >
        👋 New to TransitConnect? Click to read guidelines
      </div>
    );
  }

  return (
    <div className="glass-card animate-slide-up" style={{ marginBottom: "1.5rem" }}>
      <div className="flex-between" style={{ marginBottom: "1rem" }}>
        <h3 className="heading-3" style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>👋</span> Welcome to TransitConnect
        </h3>
        <button className="btn-ghost" onClick={() => setIsOpen(false)}>✖</button>
      </div>

      <div style={{ maxHeight: "350px", overflowY: "auto", paddingRight: "0.5rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h4 className="heading-3" style={{ fontSize: "1.1rem" }}>What is this?</h4>
          <p className="text-muted" style={{ marginTop: "0.25rem", lineHeight: "1.5" }}>
            TransitConnect is a community-driven platform for discovering local travel routes with clear, practical details.
          </p>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <h4 className="heading-3" style={{ fontSize: "1.1rem" }}>How does it work?</h4>
          <p className="text-muted" style={{ marginTop: "0.25rem", lineHeight: "1.5" }}>
            You don’t just consume data — you help shape it.
          </p>
          <ul className="text-muted" style={{ paddingLeft: "1.5rem", marginTop: "0.5rem", lineHeight: "1.6" }}>
            <li>Browse routes shared by others</li>
            <li>Add routes based on real travel experience</li>
            <li>Benefit from continuously updated local knowledge</li>
          </ul>
        </div>

        <div className="alert-warning" style={{ marginBottom: "1.5rem" }}>
          <strong style={{ display: "block", marginBottom: "0.25rem" }}>⚠️ Community responsibility</strong>
          This platform works only when shared information is accurate. Before posting, consider:
          <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem", marginBottom: 0 }}>
            <li>Is this route real and currently usable?</li>
            <li>Have I personally verified this?</li>
            <li>Will this genuinely help someone else?</li>
          </ul>
        </div>

        <div className="alert-info" style={{ marginBottom: "1.5rem" }}>
          <strong style={{ display: "block", marginBottom: "0.25rem" }}>🤝 Why this matters</strong>
          TransitConnect is built by people who travel locally. Every accurate contribution improves someone’s journey. Please do not post false or duplicate routes.
        </div>

        <p style={{ textAlign: "center", fontWeight: 600, color: "var(--color-primary)", margin: "2rem 0 1rem" }}>
          Ready to explore or contribute responsibly?
        </p>
      </div>
    </div>
  );
}