import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div style={styles.nav}>
      <h3>Inventory Manager</h3>
      <div>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "15px",
    backgroundColor: "#1e293b",
    color: "white",
  },
};

export default Navbar;
