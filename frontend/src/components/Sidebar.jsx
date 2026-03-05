import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const Sidebar = () => {
  const { user } = useContext(AuthContext);
  const isAdminOrManager = user?.role === "Admin" || user?.role === "Manager" || user?.role === "Storekeeper";

  return (
    <div style={styles.sidebar}>
      {isAdminOrManager && (
        <>
          <Link to="/dashboard">Admin Dashboard</Link>
          <a href="/dashboard.html" target="_blank" rel="noopener noreferrer" style={styles.externalLink}>📊 Analytics & Exports</a>
        </>
      )}
      {!isAdminOrManager && <Link to="/user-dashboard">My Assets</Link>}
    </div>
  );
};

const styles = {
  sidebar: {
    width: "200px",
    background: "#f1f5f9",
    height: "100vh",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  externalLink: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: "bold",
    marginTop: "10px",
    display: "flex",
    alignItems: "center",
    gap: "5px"
  }
};

export default Sidebar;
