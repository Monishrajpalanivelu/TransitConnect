import { useState } from "react";
import { styles } from "../styles/styles";
// NOTE: Ensure your SearchBar component file is named SearchBar.jsx under /src/components
import SearchBar from "./SearchBox"; // Assuming this is correct based on original App.js
import RouteCard from "./RouteCard";
import BottomNav from "./BottomNav";
import AddRouteModal from "./AddRouteModal";
import { searchRoutes } from "../services/api";
import { logout } from "../services/auth";
import { useNavigate } from "react-router-dom";

import Welcome from "./Welcome";

export default function Dashboard() {
      const [result, setResult] = useState(null);
      const [showAdd, setShowAdd] = useState(false);
      const [error, setError] = useState("");
      const navigate = useNavigate();

      // handleSearch now calls searchRoutes without mode
      const handleSearch = async (from, to) => {
            setError("");
            setResult(null);

            if (!from || !to) {
                  alert("Enter both fields");
                  return;
            }

            try {
                  const data = await searchRoutes(from, to);
                  setResult(data);
            } catch (e) {
                  const msg = e?.message || "Search failed";
                  setError(msg);
            }
      };

      const handleLogout = () => {
            logout();
            navigate("/login");
      };

      return (
            <div style={styles.page}>
                  <div style={styles.container}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                              <h2 style={{ margin: 0 }}>TransitConnect</h2>
                              <button onClick={handleLogout} style={{ padding: '5px 10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
                        </div>

                        {/* Welcome / Guidelines */}
                        {!showAdd && !result && <Welcome />}

                        {/* Search */}
                        {!showAdd && <SearchBar onSearch={handleSearch} />}

                        {/* Error */}
                        {!showAdd && error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}

                        {/* Results */}
                        {!showAdd && result && <RouteCard data={result} />}

                        {/* Add Route */}
                        {showAdd && <AddRouteModal onClose={() => setShowAdd(false)} />}

                        <BottomNav
                              onHome={() => { setShowAdd(false); setResult(null); setError(""); }}
                              onAdd={() => setShowAdd(true)}
                              onTop={() => alert("Coming soon")}
                        />
                  </div>
            </div>
      );
}
