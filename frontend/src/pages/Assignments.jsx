import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { getAssignments, getAssets, getUsers, returnAssignment } from "../api";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ReturnAssetModal from "../components/ReturnAssetModal";

const Assignments = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [assignments, setAssignments] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toasts, setToasts] = useState([]);

  const addToast = (title, msg, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  useEffect(() => {
    if (user?.role !== "Admin" && user?.role !== "Asset Manager" && user?.role !== "Employee") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignmentsData, assetsData, usersData] = await Promise.all([
        getAssignments(),
        getAssets(),
        getUsers(),
      ]);
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      setAssets(Array.isArray(assetsData) ? assetsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getAssetInfo = (assetId) => {
    return assets.find(a => a.asset_id === assetId);
  };

  const getUserInfo = (userId) => {
    return users.find(u => u.user_id === userId);
  };

  const isOverdue = (expectedReturnDate) => {
    if (!expectedReturnDate) return false;
    const today = new Date();
    const returnDate = new Date(expectedReturnDate);
    return returnDate < today;
  };

  const daysUntilExpiry = (expectedReturnDate) => {
    if (!expectedReturnDate) return null;
    const today = new Date();
    const returnDate = new Date(expectedReturnDate);
    const diffTime = returnDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  // Filter assignments based on user role and search query
  let filteredAssignments = assignments
    .filter(a => user?.role === "Admin" || user?.role === "Asset Manager" || a.user_id === user?.user_id)
    .filter(a => a.status === "Active" || a.status === "Pending");

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredAssignments = filteredAssignments.filter(a => {
      const asset = getAssetInfo(a.asset_id);
      const assignedUser = getUserInfo(a.user_id);
      const hay = `${asset?.asset_tag || ""} ${asset?.brand || ""} ${asset?.model || ""} ${assignedUser?.full_name || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }

  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    const dateA = new Date(a.assigned_date || 0);
    const dateB = new Date(b.assigned_date || 0);
    return dateB - dateA;
  });

  const handleReturnClick = (assignment) => {
    const asset = getAssetInfo(assignment.asset_id);
    setSelectedAssignment({
      ...assignment,
      asset_tag: asset?.asset_tag,
      model: asset?.model,
      warranty_expiry: asset?.warranty_expiry,
    });
    setShowReturnModal(true);
  };

  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-body">
        <Sidebar />
        <main className="page-content">
          <div className="page-header">
            <div className="page-header-left">
              <div className="page-eyebrow">Management</div>
              <h2>Active Assignments</h2>
              <p style={{ marginTop: "3px", fontSize: "13.5px" }}>
                Manage asset assignments and returns
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="search-container" style={{ marginBottom: "2rem" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by asset tag, brand, model, or employee name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "10px 14px",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            />
          </div>

          {/* Stats Row */}
          <div className="stats-grid" style={{ marginBottom: "2rem" }}>
            <div style={{
              padding: "1.5rem",
              background: "var(--bg-subtle)",
              borderRadius: "10px",
              border: "1px solid var(--border)",
            }}>
              <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>Active Assignments</div>
              <div style={{ fontSize: "28px", fontWeight: "900", color: "var(--text)" }}>
                {sortedAssignments.length}
              </div>
            </div>
            <div style={{
              padding: "1.5rem",
              background: "var(--bg-subtle)",
              borderRadius: "10px",
              border: "1px solid var(--border)",
            }}>
              <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>Overdue Returns</div>
              <div style={{ fontSize: "28px", fontWeight: "900", color: "var(--danger)" }}>
                {sortedAssignments.filter(a => isOverdue(a.expected_return_date)).length}
              </div>
            </div>
          </div>

          {/* Assignments Table */}
          <div className="section">
            <div className="section-header">
              <h3 className="section-title">Assignments List</h3>
              <span style={{ color: "var(--muted)", fontSize: "13px" }}>
                Showing {sortedAssignments.length} assignment{sortedAssignments.length !== 1 ? "s" : ""}
              </span>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
                Loading assignments...
              </div>
            ) : sortedAssignments.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
                No active assignments found
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "14px",
                }}>
                  <thead>
                    <tr style={{
                      borderBottom: "2px solid var(--border)",
                      background: "var(--bg-subtle)",
                    }}>
                      <th style={{ padding: "12px", textAlign: "left", fontWeight: "900" }}>Asset</th>
                      <th style={{ padding: "12px", textAlign: "left", fontWeight: "900" }}>Assigned To</th>
                      <th style={{ padding: "12px", textAlign: "left", fontWeight: "900" }}>Assigned Date</th>
                      <th style={{ padding: "12px", textAlign: "left", fontWeight: "900" }}>Expected Return</th>
                      <th style={{ padding: "12px", textAlign: "left", fontWeight: "900" }}>Asset Expiry</th>
                      <th style={{ padding: "12px", textAlign: "left", fontWeight: "900" }}>Status</th>
                      <th style={{ padding: "12px", textAlign: "center", fontWeight: "900" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAssignments.map((assignment) => {
                      const asset = getAssetInfo(assignment.asset_id);
                      const assignedUser = getUserInfo(assignment.user_id);
                      const daysLeft = daysUntilExpiry(assignment.expected_return_date);
                      const overdue = isOverdue(assignment.expected_return_date);
                      const assetExpired = isOverdue(asset?.warranty_expiry);

                      return (
                        <tr
                          key={assignment.assignment_id}
                          style={{
                            borderBottom: "1px solid var(--border)",
                            background: overdue ? "rgba(239, 68, 68, 0.05)" : "transparent",
                          }}
                        >
                          <td style={{ padding: "12px" }}>
                            <div style={{ fontWeight: "900", fontSize: "13px" }}>
                              {asset?.asset_tag || "—"}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                              {asset?.brand} {asset?.model}
                            </div>
                          </td>
                          <td style={{ padding: "12px" }}>
                            <div style={{ fontWeight: "600" }}>
                              {assignedUser?.full_name || "—"}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                              {assignedUser?.employee_code || "—"}
                            </div>
                          </td>
                          <td style={{ padding: "12px" }}>
                            <div style={{ fontSize: "13px" }}>
                              {formatDate(assignment.assigned_date)}
                            </div>
                          </td>
                          <td style={{ padding: "12px" }}>
                            <div style={{ fontSize: "13px", fontWeight: "600" }}>
                              {formatDate(assignment.expected_return_date)}
                            </div>
                            {assignment.expected_return_date && (
                              <div
                                style={{
                                  fontSize: "11px",
                                  marginTop: "2px",
                                  color: overdue ? "var(--danger)" : daysLeft <= 7 ? "var(--warn)" : "var(--success)",
                                  fontWeight: "600",
                                }}
                              >
                                {overdue
                                  ? `⚠️ Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? "s" : ""}`
                                  : `📅 ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "12px" }}>
                            <div style={{ fontSize: "13px" }}>
                              {formatDate(asset?.warranty_expiry)}
                            </div>
                            {asset?.warranty_expiry && (
                              <div
                                style={{
                                  fontSize: "11px",
                                  marginTop: "2px",
                                  color: assetExpired ? "var(--danger)" : "var(--success)",
                                  fontWeight: "600",
                                }}
                              >
                                {assetExpired ? "❌ Expired" : "✅ Valid"}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "12px" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 10px",
                                borderRadius: "20px",
                                fontSize: "11px",
                                fontWeight: "900",
                                background: overdue ? "var(--danger-soft)" : "var(--info-light)",
                                color: overdue ? "var(--danger)" : "var(--info)",
                              }}
                            >
                              {overdue ? "⚠️ Overdue" : "✅ Active"}
                            </span>
                          </td>
                          <td style={{ padding: "12px", textAlign: "center" }}>
                            {(user?.role === "Admin" || user?.role === "Asset Manager") && (
                              <button
                                className="btn btn-sm"
                                style={{
                                  background: "var(--danger-light)",
                                  color: "var(--danger)",
                                  border: "none",
                                  padding: "6px 12px",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                }}
                                onClick={() => handleReturnClick(assignment)}
                              >
                                🔄 Return
                              </button>
                            )}
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Return Modal */}
      {showReturnModal && selectedAssignment && (
        <ReturnAssetModal
          assignment={selectedAssignment}
          close={() => {
            setShowReturnModal(false);
            setSelectedAssignment(null);
          }}
          onRefresh={(msg) => {
            fetchData();
            if (msg) addToast("Success", msg, "success");
          }}
        />
      )}

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`} onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>
            <div className="toast-icon">
              {toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : "ℹ️"}
            </div>
            <div className="toast-content">
              <div className="toast-title">{toast.title}</div>
              <div className="toast-msg">{toast.msg}</div>
            </div>
            <div className="toast-close">✕</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Assignments;
