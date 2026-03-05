import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [employeeCode, setEmployeeCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Employee");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await register(employeeCode, name, email, password, role);
    setLoading(false);
    if (res.success) {
      alert("User registered successfully!");
      navigate("/dashboard");
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-body">
        <Sidebar />
        <div className="page-content">
          <div style={{ maxWidth: "520px" }}>
            <div className="page-header">
              <div className="page-header-left">
                <div className="page-eyebrow">Administration</div>
                <h2>Register New User</h2>
                <p style={{ marginTop: "4px", fontSize: "13.5px" }}>Create an account for a new team member.</p>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                {error && <div className="error-msg" style={{ marginBottom: "18px" }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Employee Code *</label>
                      <input className="form-input" placeholder="e.g. EMP-001" value={employeeCode} onChange={e => setEmployeeCode(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Role *</label>
                      <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                        <option value="Employee">Employee</option>
                        <option value="Admin">Admin</option>
                        <option value="Asset Manager">Asset Manager</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input className="form-input" placeholder="John Smith" value={name} onChange={e => setName(e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input type="email" className="form-input" placeholder="john@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <input type="password" className="form-input" placeholder="Choose a strong password" value={password} onChange={e => setPassword(e.target.value)} required />
                  </div>

                  <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                    <Link to="/dashboard" className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }}>
                      Cancel
                    </Link>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={loading}>
                      {loading ? <><span className="spinner" /> Creating…</> : "Create User"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;