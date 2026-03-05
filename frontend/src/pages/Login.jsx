import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const Login = () => {
  const { login, logout } = useContext(AuthContext);
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loginType, setLoginType] = useState("Employee");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      if (loginType === "Management" && res.role === "Employee") {
        setError("Please use the Employee tab for employee accounts.");
        logout();
        return;
      }
      if (loginType === "Employee" && (res.role === "Admin" || res.role === "Asset Manager")) {
        setError("Please use the Management tab for admin accounts.");
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
    <div className="login-page">
      {/* Left Panel */}
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-logo">
            <div className="login-logo-icon">📦</div>
            <span className="login-logo-text">AssetFlow</span>
          </div>
          <h1 className="login-tagline">
            Smart asset<br />management for<br /><span>modern teams</span>
          </h1>
          <p className="login-desc">
            Track, assign, and maintain your organisation's assets with clarity and confidence.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="login-right">
        <div className="login-form-wrap">
          {/* Theme toggle top-right */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
            <button className="theme-toggle" onClick={toggle} title="Toggle theme">
              {theme === "light" ? "🌙" : "☀️"}
            </button>
          </div>

          <h2 className="login-form-title">Welcome back</h2>
          <p className="login-form-sub">Sign in to your account to continue</p>

          {/* Tab Switcher */}
          <div className="tab-switcher">
            <button
              type="button"
              className={`tab-btn${loginType === "Employee" ? " active" : ""}`}
              onClick={() => { setLoginType("Employee"); setError(""); }}
            >
              Employee
            </button>
            <button
              type="button"
              className={`tab-btn${loginType === "Management" ? " active" : ""}`}
              onClick={() => { setLoginType("Management"); setError(""); }}
            >
              Management
            </button>
          </div>

          {error && <div className="error-msg" style={{ marginBottom: "16px" }}>{error}</div>}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: "4px", padding: "11px" }} disabled={loading}>
              {loading ? <><span className="spinner" /> Signing in…</> : `Sign in as ${loginType}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;