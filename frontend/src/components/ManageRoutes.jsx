import { useState, useEffect } from "react";
import { getAllRoutes, deleteRoute } from "../services/api";

export default function ManageRoutes() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const data = await getAllRoutes();
      // Spring Data Page wraps content in data.content
      setRoutes(data.content || []);
    } catch (err) {
      setError(err.message || "Failed to fetch routes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleDelete = async (id) => {
    const password = window.prompt("Enter the admin password to delete this route:");
    if (!password) return; // User cancelled or left empty

    try {
      await deleteRoute(id, password);
      setRoutes(routes.filter(r => r.id !== id));
    } catch (err) {
      alert("Failed to delete route: " + err.message);
    }
  };

  if (loading) {
    return <div className="glass-card animate-slide-up flex-center" style={{ padding: "2rem" }}>Loading routes...</div>;
  }

  if (error) {
    return <div className="glass-card animate-slide-up flex-center" style={{ padding: "2rem", color: "var(--color-error)" }}>{error}</div>;
  }

  return (
    <div className="glass-card animate-slide-up">
      <h3 className="heading-3" style={{ marginTop: 0, marginBottom: "1.5rem" }}>Manage Routes</h3>
      
      {routes.length === 0 ? (
        <p className="text-muted">No routes found.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {routes.map(route => {
            const startNode = route.stops && route.stops.length > 0 ? route.stops[0].location : "Unknown";
            const endNode = route.stops && route.stops.length > 1 ? route.stops[route.stops.length - 1].location : "Unknown";
            const stopsCount = route.stops ? route.stops.length : 0;
            
            return (
              <div key={route.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-bg)" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>
                    {startNode} → {endNode}
                  </div>
                  <div className="text-muted" style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
                    ID: {route.id} • Stops: {stopsCount} • Created by: {route.createdBy}
                  </div>
                </div>
                <button 
                  className="btn-danger" 
                  onClick={() => handleDelete(route.id)}
                  style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
