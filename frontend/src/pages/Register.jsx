import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [employeeCode, setEmployeeCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Employee");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await register(employeeCode, name, email, password, role);
    if (res.success) {
      alert("Registration successful! You can now login.");
      navigate("/"); // head to login
    } else {
      setError(res.message);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
      <h2>Register New User</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Employee Code:</label>
          <input
            type="text"
            value={employeeCode}
            onChange={(e) => setEmployeeCode(e.target.value)}
            required
            style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
          />
        </div>
        <div>
          <label>Full Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
          />
        </div>
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
          <label>Role:</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
          >
            <option value="Employee">Employee</option>
            <option value="Admin">Admin</option>
            <option value="Asset Manager">Asset Manager</option>
          </select>
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
        <button type="submit" style={{ width: "100%", padding: "10px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          Register User
        </button>
      </form>
      <p style={{ marginTop: "10px" }}>
        <Link to="/dashboard">Back to Dashboard</Link>
      </p>
    </div>
  );
};

export default Register;
