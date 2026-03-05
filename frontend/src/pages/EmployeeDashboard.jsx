import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { getAssignments, getMaintenanceRequests, getAsset } from "../api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ReturnAssetModal from "../components/ReturnAssetModal";

const statusBadge = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "active") return <span className="badge badge-success">{status}</span>;
  if (s === "returned") return <span className="badge badge-muted">{status}</span>;
  return <span className="badge badge-muted">{status}</span>;
};

const maintenanceBadge = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "open" || s === "pending") return <span className="badge badge-warning">{status}</span>;
  if (s === "resolved" || s === "closed") return <span className="badge badge-success">{status}</span>;
  return <span className="badge badge-muted">{status}</span>;
};

const EmployeeDashboard = () => {
  const { user } = useContext(AuthContext);
  const [assignments, setAssignments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const aData = await getAssignments();
      const aList = Array.isArray(aData) ? aData : [];
      const myAssignments = aList.filter(a => a.user_id === user.user_id);

      for (let a of myAssignments) {
        try {
          const assetDetails = await getAsset(a.asset_id);
          a.asset_tag = assetDetails.asset_tag;
          a.model = assetDetails.model;
          a.brand = assetDetails.brand;
        } catch {
          a.asset_tag = `ID: ${a.asset_id}`;
          a.model = "Unknown";
        }
      }
      setAssignments(myAssignments);

      const mData = await getMaintenanceRequests();
      const mList = Array.isArray(mData) ? mData : [];
      setRequests(mList.filter(m => m.reported_by === user.user_id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.user_id) fetchData();
  }, [user]);

  const active = assignments.filter(a => a.status === "Active");
  const returned = assignments.filter(a => a.status !== "Active");

  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-body">
        <Sidebar />
        <main className="page-content">
          {/* Header */}
          <div className="page-header">
            <div className="page-header-left">
              <div className="page-eyebrow">My Workspace</div>
              <h2>My Assets</h2>
              <p style={{ marginTop: "3px", fontSize: "13.5px" }}>
                Welcome, <strong>{user?.full_name}</strong>
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
            <div className="stat-card accent">
              <div className="stat-icon">📦</div>
              <div className="stat-value">{assignments.length}</div>
              <div className="stat-label">Total Assigned</div>
            </div>
            <div className="stat-card success">
              <div className="stat-icon">✅</div>
              <div className="stat-value">{active.length}</div>
              <div className="stat-label">Currently Active</div>
            </div>
            <div className="stat-card info">
              <div className="stat-icon">↩️</div>
              <div className="stat-value">{returned.length}</div>
              <div className="stat-label">Returned</div>
            </div>
            <div className="stat-card warning">
              <div className="stat-icon">🔧</div>
              <div className="stat-value">{requests.length}</div>
              <div className="stat-label">Maintenance Requests</div>
            </div>
          </div>

          {/* My Assets */}
          <div className="section">
            <div className="section-header">
              <h3 className="section-title">My Assigned Assets</h3>
              <span className="badge badge-success">{active.length} active</span>
            </div>

            <div className="table-container">
              {loading ? (
                <div style={{ textAlign: "center", padding: "48px" }}>
                  <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Asset Tag</th>
                        <th>Device</th>
                        <th>Assigned On</th>
                        <th>Return By</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map(a => (
                        <tr key={a.assignment_id}>
                          <td><span className="td-mono">{a.asset_tag}</span></td>
                          <td>
                            <span className="td-bold">{a.brand}</span>
                            {a.model && <span className="td-muted"> {a.model}</span>}
                          </td>
                          <td className="td-muted">{a.assigned_date}</td>
                          <td className="td-muted">{a.expected_return_date || "—"}</td>
                          <td>{statusBadge(a.status)}</td>
                          <td>
                            {a.status === "Active" && (
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => setSelectedAssignment(a)}
                              >
                                Return
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {assignments.length === 0 && (
                        <tr>
                          <td colSpan="6">
                            <div className="empty-state">
                              <div className="empty-icon">📭</div>
                              <p>No assets assigned to you</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Maintenance Requests */}
          <div className="section">
            <div className="section-header">
              <h3 className="section-title">My Maintenance Requests</h3>
            </div>

            <div className="table-container">
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Asset ID</th>
                      <th>Issue</th>
                      <th>Status</th>
                      <th>Reported On</th>
                      <th>Resolved On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.slice(0, 10).map(r => (
                      <tr key={r.maintenance_id}>
                        <td className="td-mono">{r.asset_id}</td>
                        <td>{r.issue_description || "—"}</td>
                        <td>{maintenanceBadge(r.status)}</td>
                        <td className="td-muted">{new Date(r.reported_date).toLocaleDateString()}</td>
                        <td className="td-muted">{r.resolved_date ? new Date(r.resolved_date).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))}
                    {requests.length === 0 && (
                      <tr>
                        <td colSpan="5">
                          <div className="empty-state">
                            <div className="empty-icon">🔧</div>
                            <p>No maintenance requests</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {selectedAssignment && (
        <ReturnAssetModal
          assignment={selectedAssignment}
          close={() => setSelectedAssignment(null)}
          onRefresh={fetchData}
        />
      )}
    </div>
  );
};

export default EmployeeDashboard;