import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="brand-icon" title="PAL Inventory System">
          <img src="/PAL logo.jpeg" alt="PAL logo" style={{ height: "30px", width: "auto" }} />
        </div>
        <span>PAL Inventory System</span>
      </div>

      <div className="navbar-right">
        <button className="theme-toggle" onClick={toggle} title="Toggle theme">
          {theme === "light" ? "🌙" : "☀️"}
        </button>

        {user && (
          <div className="user-pill">
            <div className="user-avatar">{initials}</div>
            <span className="user-name">{user.full_name?.split(" ")[0]}</span>
          </div>
        )}

        <button className="btn-logout" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;