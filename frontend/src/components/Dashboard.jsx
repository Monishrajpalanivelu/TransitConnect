import { useState } from "react";
import SearchBar from "./SearchBox";
import RouteCard from "./RouteCard";
import TopNav from "./TopNav";
import AddRouteModal from "./AddRouteModal";
import ManageRoutes from "./ManageRoutes";
import { searchRoutes } from "../services/api";
import { logout } from "../services/auth";
import { useNavigate } from "react-router-dom";
import Welcome from "./Welcome";

export default function Dashboard() {
      const [result, setResult] = useState(null);
      const [showAdd, setShowAdd] = useState(false);
      const [showManage, setShowManage] = useState(false);
      const [error, setError] = useState("");
      const navigate = useNavigate();

      const handleSearch = async (from, to, mode = "shortest") => {
            setError("");
            setResult(null);
            if (!from || !to) {
                  alert("Enter both fields");
                  return;
            }
            try {
                  const data = await searchRoutes(from, to, mode);
                  setResult(data);
            } catch (e) {
                  setError(e?.message || "Search failed");
            }
      };

      const handleLogout = () => {
            logout();
            navigate("/login");
      };

      return (
            <div className="page-container animate-fade-in">
                  <div className="flex-between" style={{ marginBottom: "2rem" }}>
                        <h2 className="heading-1" style={{ margin: 0, fontSize: "1.75rem" }}>TransitConnect</h2>
                        <button className="btn-danger" onClick={handleLogout} style={{ borderRadius: "9999px" }}>Logout</button>
                  </div>

                  {!showAdd && !showManage && !result && <Welcome />}
                  {!showAdd && !showManage && <SearchBar onSearch={handleSearch} />}
                  
                  {!showAdd && !showManage && error && (
                        <div className="glass-card animate-slide-up" style={{ color: "var(--color-error)", borderLeft: "4px solid var(--color-error)" }}>
                              {error}
                        </div>
                  )}

                  {!showAdd && !showManage && result && <RouteCard data={result} />}
                  {showAdd && <AddRouteModal onClose={() => setShowAdd(false)} />}
                  {showManage && <ManageRoutes />}

                  <TopNav
                        onHome={() => { setShowAdd(false); setShowManage(false); setResult(null); setError(""); }}
                        onAdd={() => { setShowAdd(true); setShowManage(false); }}
                        onManage={() => { setShowManage(true); setShowAdd(false); }}
                  />
            </div>
      );
}
