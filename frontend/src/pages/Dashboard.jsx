import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getAssets, createAsset, updateAsset, deleteAsset, getAssignments, sendAssignmentReminder, getUsers, getCategories, getMaintenanceRequests } from "../api";
import { exportToCSV, exportToExcel, exportToPDF } from "../utils/exportUtils";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AssetTable from "../components/AssetTable";
import CategoryAssetView from "../components/CategoryAssetView";
import AssetModal from "../components/AssetModal";
import ActionManagerModal from "../components/ActionManagerModal";
import DeleteConfirm from "../components/DeleteConfirm";
import AnalyticsDashboard from "../components/AnalyticsDashboard";

const StatCard = ({ label, value, icon, variant = "accent", sub, onClick }) => (
  <div className={`stat-card ${variant}`} onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
    {sub && <div className="stat-sub">{sub}</div>}
  </div>
);

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showAnalytics, setShowAnalytics] = useState(false);

  const [assets, setAssets] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);

  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editAssetData, setEditAssetData] = useState(null);
  const [transactionAsset, setTransactionAsset] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const [viewMode, setViewMode] = useState("all"); // 'all' or 'maintenance'
  const [maintenanceFilter, setMaintenanceFilter] = useState("All");

  const addToast = (title, msg, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const fetchAssetsAndAssignments = async (successMsg) => {
    try {
      setLoading(true);
      if (successMsg && typeof successMsg === "string") {
        addToast("Success", successMsg, "success");
      }

      // Safe fetch helper
      const safeFetch = async (fn, name) => {
        try {
          const res = await fn();
          const items = Array.isArray(res) ? res : (res?.items || res?.data || []);
          console.log(`Dashboard fetched ${items.length} ${name}`);
          return items;
        } catch (err) {
          console.error(`Dashboard error fetching ${name}:`, err);
          return [];
        }
      };

      const [assetsData, assignmentsData, usersData, categoriesData, maintData] = await Promise.all([
        safeFetch(getAssets, "assets"),
        safeFetch(getAssignments, "assignments"),
        safeFetch(getUsers, "users"),
        safeFetch(getCategories, "categories"),
        safeFetch(getMaintenanceRequests, "maintenance")
      ]);

      setAssets(assetsData);
      setUsers(usersData);
      setCategories(categoriesData);
      setMaintenanceRequests(maintData);

      console.log(`Dashboard summary: ${assetsData.length} assets, ${usersData.length} users, ${assignmentsData.length} assignments`);

      const enriched = assignmentsData.map(a => {
        const assetObj = assetsData.find(ast => ast.asset_id === a.asset_id) || {};
        const userObj = usersData.find(usr => usr.user_id === a.user_id) || {};
        const categoriesList = Array.isArray(categoriesData) ? categoriesData : [];
        const categoryObj = categoriesList.find(cat => cat.category_id === assetObj?.category_id);

        return {
          ...a,
          asset_tag: assetObj?.asset_tag || `ID: ${a.asset_id}`,
          model: assetObj?.model || "Unknown",
          category_id: assetObj?.category_id,
          category_name: categoryObj?.category_name || "Unknown",
          user_name: userObj?.full_name || "Unknown",
          user_email: userObj?.email || "—",
          assignment_summary: `This ${categoryObj?.category_name || "Unknown"} asset is assigned to ${userObj?.full_name || "Unknown"}`
        };
      });
      setAssignments(enriched);
    } catch (e) {
      console.error("Dashboard massive fail:", e);
      addToast("Connection Error", "Could not reach backend. Please ensure the server is running on port 8000.", "error");
    } finally {
      setLoading(false);
    }
  };

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setShowAnalytics(params.get("view") === "analytics");
  }, [location.search]);

  useEffect(() => { fetchAssetsAndAssignments(); }, []);

  const handleSaveAsset = async (assetData) => {
    try {
      console.log("Submitting asset data:", assetData);
      if (editAssetData) {
        await updateAsset(editAssetData.asset_id, assetData);
      } else {
        await createAsset(assetData);
      }
      fetchAssetsAndAssignments();
      setShowAssetModal(false);
      setEditAssetData(null);
    } catch (e) {
      console.error("Asset save error:", e);
      alert(e.message || "Failed to save asset");
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteAsset(deleteId);
      fetchAssetsAndAssignments();
      setDeleteId(null);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleSendReminder = async (assignmentId) => {
    try {
      await sendAssignmentReminder(assignmentId);
      alert("Reminder sent successfully.");
    } catch (e) {
      alert(e.message);
    }
  };

  // Prepare data for export
  const getExportData = () => {
    return filteredAssets.map(a => ({
      "Asset Tag": a.asset_tag || "—",
      "Brand": a.brand || "—",
      "Model": a.model || "—",
      "Serial Number": a.serial_number || "—",
      "Category": categories.find(c => c.category_id === a.category_id)?.category_name || "—",
      "Assigned To": getAssignedUser(a.asset_id)?.full_name || "Unassigned",
      "Status": a.status || "—",
      "Condition": a.condition_status || "—",
      "Location": a.location || "—",
      "Purchase Cost": a.purchase_cost || "—",
      "Purchase Date": a.purchase_date || "—",
    }));
  };

  const getAssignedUser = (assetId) => {
    const assignment = assignments.find(a => a.asset_id === assetId && a.status === "Active");
    return assignment ? users.find(u => u.user_id === assignment.user_id) : null;
  };

  // Stats
  const total = assets.length;
  const available = assets.filter(a => a.status?.toLowerCase() === "available").length;
  const assigned = assets.filter(a => a.status?.toLowerCase() === "assigned").length;
  const maintenance = assets.filter(a => a.status?.toLowerCase() === "maintenance").length;
  const retired = assets.filter(a => a.status?.toLowerCase() === "retired").length;

  const activeAssignments = assignments.filter(a => a.status === "Active");

  const filteredAssets = assets.filter(a => {
    // 1) View Mode Filter
    if (viewMode === "maintenance" && a.status?.toLowerCase() !== "maintenance") return false;

    // 2) Maintenance Sub-Filter
    if (viewMode === "maintenance" && maintenanceFilter !== "All") {
      const activeReq = maintenanceRequests.find(m => m.asset_id === a.asset_id && m.status !== "Resolved" && m.status !== "Cannot Be Resolved");
      const reqStatus = activeReq ? activeReq.status : "Resolved"; // Simplification for finding latest

      // Let's refine how we find the request matching the asset
      // Find the most recent maintenance request for this asset
      const assetReqs = maintenanceRequests.filter(m => m.asset_id === a.asset_id);
      let latestStatus = "Unknown";
      if (assetReqs.length > 0) {
        assetReqs.sort((r1, r2) => new Date(r2.reported_date) - new Date(r1.reported_date));
        latestStatus = assetReqs[0].status;
      }

      if (maintenanceFilter === "Under Process") {
        if (!["Open", "In Progress", "Under Process"].includes(latestStatus)) return false;
      } else if (maintenanceFilter === "Resolved") {
        if (latestStatus !== "Resolved") return false;
      } else if (maintenanceFilter === "Cannot Be Resolved") {
        if (latestStatus !== "Cannot Be Resolved") return false;
      }
    }

    // 3) Search Query
    if (search) {
      const q = search.toLowerCase();
      return `${a.asset_tag} ${a.brand} ${a.model} ${a.serial_number} ${a.location}`.toLowerCase().includes(q);
    }
    return true;
  });

  // Dashboard View (default)
  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-body">
        <Sidebar />
        <main className="page-content">
          {/* Header */}
          <div className="page-header">
            <div className="page-header-left">
              <div className="page-eyebrow">Overview</div>
              <h2>Inventory Dashboard</h2>
              <p style={{ marginTop: "3px", fontSize: "13.5px" }}>
                Welcome back, <strong>{user?.full_name}</strong> · {user?.role}
              </p>
            </div>
            <div className="page-header-actions">
              {viewMode === "maintenance" && (
                <button className="btn btn-secondary" onClick={() => setViewMode("all")}>
                  ← Back to All Assets
                </button>
              )}
              {user?.role === "Admin" && (
                <Link to="/register" className="btn btn-secondary">
                  👤 Add User
                </Link>
              )}
              <button className="btn btn-primary" onClick={() => setShowAssetModal(true)}>
                + New Asset
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <StatCard label="Total Users" value={users.length} icon="👥" variant="info" />
            <StatCard label="Total Assets" value={total} icon="📦" variant="accent" />
            <StatCard label="Available" value={available} icon="✅" variant="success" onClick={() => setViewMode("all")} />
            <StatCard label="Assigned" value={assigned} icon="👤" variant="info" onClick={() => setViewMode("all")} />
            <StatCard
              label="Maintenance"
              value={maintenance}
              icon="🔧"
              variant="warning"
              onClick={() => {
                setViewMode(viewMode === "maintenance" ? "all" : "maintenance");
                setMaintenanceFilter("All");
              }}
            />
          </div>

          {/* Assets Table */}
          <div className="section">
            <div className="section-header">
              <h3 className="section-title">
                {viewMode === "maintenance" ? "Maintenance Assets" : "Assets Library"}
              </h3>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {viewMode === "maintenance" && (
                  <select
                    className="form-input"
                    value={maintenanceFilter}
                    onChange={e => setMaintenanceFilter(e.target.value)}
                    style={{ width: "auto" }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Under Process">Under Process</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Cannot Be Resolved">Cannot Be Resolved</option>
                  </select>
                )}
                <div className="search-input">
                  <span className="search-icon">🔍</span>
                  <input
                    placeholder="Search assets…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn btn-sm" style={{ background: "var(--info-light)", color: "var(--info)", border: "none" }} onClick={() => exportToCSV(getExportData(), "assets.csv")}>
                    📄 CSV
                  </button>
                  <button className="btn btn-sm" style={{ background: "var(--success-light)", color: "var(--success)", border: "none" }} onClick={() => exportToExcel(getExportData(), "assets.xlsx")}>
                    📊 Excel
                  </button>
                  <button className="btn btn-sm" style={{ background: "var(--danger-light)", color: "var(--danger)", border: "none" }} onClick={() => exportToPDF(getExportData(), "assets.pdf")}>
                    📋 PDF
                  </button>
                </div>
              </div>
            </div>


            {loading ? (
              <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
                <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
              </div>
            ) : (
              <AssetTable
                assets={filteredAssets}
                assignments={assignments}
                users={users}
                onEdit={setEditAssetData}
                onDelete={setDeleteId}
                onTransaction={setTransactionAsset}
                viewMode={viewMode}
                maintenanceRequests={maintenanceRequests}
              />
            )}
          </div>

          {/* Active Assignments */}
          <div className="section">
            <div className="section-header">
              <h3 className="section-title">Active Assignments</h3>
              <span className="badge badge-info">{activeAssignments.length} active</span>
            </div>

            <div className="table-container">
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Category</th>
                      <th>Assigned User</th>
                      <th>Email ID</th>
                      <th>Assigned Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeAssignments.map(a => {
                      const category = categories.find(c => c.category_id === a.category_id);
                      return (
                        <tr key={a.assignment_id}>
                          <td>
                            <span className="td-bold">{a.model}</span>
                            <span className="td-muted"> · {a.asset_tag}</span>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                              {a.assignment_summary}
                            </div>
                          </td>
                          <td className="td-muted">{category?.category_name || "—"}</td>
                          <td className="td-bold">{a.user_name}</td>
                          <td className="td-muted" style={{ fontSize: "12px" }}>{a.user_email}</td>
                          <td className="td-muted">{a.assigned_date}</td>
                          <td><span className="badge badge-info">Active</span></td>
                          <td>
                            <button
                              className="btn btn-sm"
                              style={{ background: "var(--warning-light)", color: "var(--warning)", border: "none" }}
                              onClick={() => handleSendReminder(a.assignment_id)}
                            >
                              📧 Remind
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {activeAssignments.length === 0 && (
                      <tr>
                        <td colSpan="7">
                          <div className="empty-state">
                            <div className="empty-icon">📋</div>
                            <p>No active assignments</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Category by Asset and User Section */}
          <div className="section" style={{ marginTop: "2rem" }}>
            <div className="section-header">
              <h3 className="section-title">Category by Asset and User</h3>
            </div>
            <div className="table-container" style={{ padding: "20px" }}>
              <CategoryAssetView
                assets={assets}
                assignments={assignments}
                users={users}
                categories={categories}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      {showAssetModal && (
        <AssetModal close={() => setShowAssetModal(false)} onSave={handleSaveAsset} />
      )}
      {editAssetData && (
        <AssetModal close={() => setEditAssetData(null)} onSave={handleSaveAsset} asset={editAssetData} />
      )}
      {transactionAsset && (
        <ActionManagerModal
          asset={transactionAsset}
          close={() => setTransactionAsset(null)}
          onRefresh={fetchAssetsAndAssignments}
          maintenanceRequests={maintenanceRequests}
        />
      )}
      {deleteId && (
        <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />
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

export default Dashboard;
