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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      // Auto-redirect based on role
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
            <div className="login-logo-icon">
              <img src="/PAL logo.jpeg" alt="PAL logo" style={{ height: "40px", width: "auto", borderRadius: "4px" }} />
            </div>
            <span className="login-logo-text">PAL Inventory System</span>
          </div>
          <h1 className="login-tagline">
            Welcome to
            <br />PAL Inventory
            <br /><span>IT Asset Management</span>
          </h1>
          <p className="login-desc">
            Efficiently manage, track, and maintain your organization's assets with our comprehensive inventory management system.
          </p>
          <div style={{ marginTop: "32px", fontSize: "12px", color: "var(--text-muted)" }}>
            <div style={{ marginBottom: "8px" }}>✓ Real-time asset tracking</div>
            <div style={{ marginBottom: "8px" }}>✓ User assignment management</div>
            <div style={{ marginBottom: "8px" }}>✓ Maintenance scheduling</div>
            <div>✓ Comprehensive reporting</div>
          </div>
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
              {loading ? <><span className="spinner" /> Signing in…</> : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;