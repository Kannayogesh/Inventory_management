import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const { login, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loginType, setLoginType] = useState("Employee");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await login(email, password);
    if (res.success) {
      if (loginType === "Management" && res.role === "Employee") {
        setError("Please use the Employee Login tab for employee accounts.");
        logout();
        return;
      }
      if (loginType === "Employee" && (res.role === "Admin" || res.role === "Asset Manager")) {
        setError("Please use the Management Login tab for administrative accounts.");
        logout();
        return;
      }

      if (res.role === "Admin" || res.role === "Asset Manager") {
        navigate("/dashboard");
      } else {
        navigate("/user-dashboard");
      }
    } else {
      setError(res.message);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
      <h2>{loginType} Login</h2>

      <div style={{ display: "flex", marginBottom: "20px" }}>
        <button
          type="button"
          onClick={() => setLoginType("Employee")}
          style={{ flex: 1, padding: "10px", backgroundColor: loginType === "Employee" ? "#007bff" : "#f1f1f1", color: loginType === "Employee" ? "white" : "black", border: "none", cursor: "pointer" }}
        >
          Employee
        </button>
        <button
          type="button"
          onClick={() => setLoginType("Management")}
          style={{ flex: 1, padding: "10px", backgroundColor: loginType === "Management" ? "#007bff" : "#f1f1f1", color: loginType === "Management" ? "white" : "black", border: "none", cursor: "pointer" }}
        >
          Management
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
          />
        </div>
        <button type="submit" style={{ width: "100%", padding: "10px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
