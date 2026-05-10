import { styles } from "../styles/styles";

export default function BottomNav({ onHome, onAdd, onTop, darkMode = false }) {
  const navBarStyle = {
    ...styles.navBar,
    background: darkMode ? '#1e1e1e' : styles.navBar.background,
  };

  const navBtnStyle = {
    ...styles.navBtn,
    color: darkMode ? '#4DA8FF' : styles.navBtn.color,
  };

  return (
    <div style={styles.bottomNav}>
      <div style={navBarStyle}>
        <button style={navBtnStyle} onClick={onHome}>Home</button>
        <button style={navBtnStyle} onClick={onAdd}>Add Route</button>
        <button style={navBtnStyle} onClick={onTop}>Top</button>
      </div>
    </div>
  );
}
