import { Link, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const Sidebar = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const isAdminOrManager = user?.role === "Admin" || user?.role === "Asset Manager";

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar">
      {isAdminOrManager && (
        <>
          <span className="sidebar-label">Management</span>
          <Link
            to="/dashboard"
            className={`sidebar-link${isActive("/dashboard") ? " active" : ""}`}
          >
            <span className="link-icon">🏠</span>
            Dashboard
          </Link>
          <a
            href="/dashboard.html"
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar-link"
          >
            <span className="link-icon">📊</span>
            Analytics
          </a>
          <Link
            to="/register"
            className={`sidebar-link${isActive("/register") ? " active" : ""}`}
          >
            <span className="link-icon">👤</span>
            Add User
          </Link>
        </>
      )}
      {!isAdminOrManager && (
        <>
          <span className="sidebar-label">My Workspace</span>
          <Link
            to="/user-dashboard"
            className={`sidebar-link${isActive("/user-dashboard") ? " active" : ""}`}
          >
            <span className="link-icon">🖥️</span>
            My Assets
          </Link>
        </>
      )}
    </aside>
  );
};

export default Sidebar;