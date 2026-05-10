import { useState, useEffect } from "react";
import { styles as defaultStyles } from "../styles/styles";
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
      const [darkMode, setDarkMode] = useState(false);
      const navigate = useNavigate();

      useEffect(() => {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark') {
                  setDarkMode(true);
            }
      }, []);

      const toggleTheme = () => {
            const newMode = !darkMode;
            setDarkMode(newMode);
            localStorage.setItem('theme', newMode ? 'dark' : 'light');
      };

      // Create dynamic styles based on theme
      const currentStyles = {
            ...defaultStyles,
            page: {
                  ...defaultStyles.page,
                  background: darkMode ? '#121212' : defaultStyles.page.background,
                  color: darkMode ? '#ffffff' : '#000000',
            },
            container: {
                  ...defaultStyles.container,
            }
      };

      // pass darkMode to other components, we might need to modify them later or use context if necessary
      // For now we just implement the toggle and apply styles


      // handleSearch now accepts mode (from SearchBar)
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
                  const msg = e?.message || "Search failed";
                  setError(msg);
            }
      };

      const handleLogout = () => {
            logout();
            navigate("/login");
      };

      return (
            <div style={currentStyles.page}>
                  <div style={currentStyles.container}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <h2 style={{ margin: 0 }}>TransitConnect</h2>
                                    <button 
                                          onClick={toggleTheme} 
                                          style={{ 
                                                padding: '5px 10px', 
                                                background: darkMode ? '#333' : '#e0e0e0', 
                                                color: darkMode ? '#fff' : '#000', 
                                                border: 'none', 
                                                borderRadius: '4px', 
                                                cursor: 'pointer' 
                                          }}
                                    >
                                          {darkMode ? '☀️ Light' : '🌙 Dark'}
                                    </button>
                              </div>
                              <button onClick={handleLogout} style={{ padding: '5px 10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
                        </div>

                        {/* Welcome / Guidelines */}
                        {!showAdd && !result && <Welcome darkMode={darkMode} />}

                        {/* Search */}
                        {!showAdd && <SearchBar onSearch={handleSearch} darkMode={darkMode} />}

                        {/* Error */}
                        {!showAdd && error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}

                        {/* Results */}
                        {!showAdd && result && <RouteCard data={result} darkMode={darkMode} />}

                        {/* Add Route */}
                        {showAdd && <AddRouteModal onClose={() => setShowAdd(false)} darkMode={darkMode} />}

                        <BottomNav
                              onHome={() => { setShowAdd(false); setResult(null); setError(""); }}
                              onAdd={() => setShowAdd(true)}
                              onTop={() => alert("Coming soon")}
                              darkMode={darkMode}
                        />
                  </div>
            </div>
      );
}
