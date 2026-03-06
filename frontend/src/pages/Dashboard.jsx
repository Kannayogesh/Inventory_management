import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getAssets, createAsset, updateAsset, deleteAsset, getAssignments, sendAssignmentReminder, getUsers, getCategories } from "../api";
import { exportToCSV, exportToExcel, exportToPDF } from "../utils/exportUtils";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AssetTable from "../components/AssetTable";
import CategoryAssetView from "../components/CategoryAssetView";
import AssetModal from "../components/AssetModal";
import ActionManagerModal from "../components/ActionManagerModal";
import DeleteConfirm from "../components/DeleteConfirm";
import AnalyticsDashboard from "../components/AnalyticsDashboard";

const StatCard = ({ label, value, icon, variant = "accent", sub }) => (
  <div className={`stat-card ${variant}`}>
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
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editAssetData, setEditAssetData] = useState(null);
  const [transactionAsset, setTransactionAsset] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

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

      const [assetsData, assignmentsData, usersData, categoriesData] = await Promise.all([
        safeFetch(getAssets, "assets"),
        safeFetch(getAssignments, "assignments"),
        safeFetch(getUsers, "users"),
        safeFetch(getCategories, "categories")
      ]);

      setAssets(assetsData);
      setUsers(usersData);
      setCategories(categoriesData);

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
    if (!search) return true;
    const q = search.toLowerCase();
    return `${a.asset_tag} ${a.brand} ${a.model} ${a.serial_number} ${a.location}`.toLowerCase().includes(q);
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
            <StatCard label="Available" value={available} icon="✅" variant="success" />
            <StatCard label="Assigned" value={assigned} icon="👤" variant="info" />
            <StatCard label="Maintenance" value={maintenance} icon="🔧" variant="warning" />
          </div>

          {/* Assets Table */}
          <div className="section">
            <div className="section-header">
              <h3 className="section-title">Assets Library</h3>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
                  <button
                    onClick={() => setShowAnalytics(v => !v)}
                    className="btn btn-secondary btn-sm"
                    style={{ minWidth: "110px" }}
                  >
                    {showAnalytics ? "📊 Hide Analytics" : "📊 Analytics"}
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

          {/* Inline Analytics Section (toggled) */}
          {showAnalytics && (
            <div className="section" style={{ animation: "fadeSlideIn 0.3s ease both" }}>
              <div className="section-header">
                <div>
                  <h3 className="section-title">📊 Analytics Dashboard</h3>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>Asset and inventory analytics</p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <div className="stats-grid" style={{ marginBottom: 0, display: "grid", gridTemplateColumns: "repeat(4, auto)", gap: "10px" }}>
                    <StatCard label="Users" value={users.length} icon="👥" variant="info" />
                    <StatCard label="Categories" value={categories.length} icon="📂" variant="success" />
                    <StatCard label="Active" value={activeAssignments.length} icon="📋" variant="warning" />
                    <StatCard label="Retired" value={retired} icon="🗃️" variant="danger" />
                  </div>
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
                  <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
                </div>
              ) : (
                <>
                  <AnalyticsDashboard
                    assets={assets}
                    assignments={assignments}
                    users={users}
                    categories={categories}
                  />

                  {/* Full Asset Library inside Analytics */}
                  <div style={{ marginTop: "1.5rem" }}>
                    <div className="section-header">
                      <h3 className="section-title">Asset Library (All Assets)</h3>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="btn btn-sm" style={{ background: "var(--info-light)", color: "var(--info)", border: "none" }} onClick={() => exportToCSV(getExportData(), "assets.csv")}>📄 CSV</button>
                        <button className="btn btn-sm" style={{ background: "var(--success-light)", color: "var(--success)", border: "none" }} onClick={() => exportToExcel(getExportData(), "assets.xlsx")}>📊 Excel</button>
                        <button className="btn btn-sm" style={{ background: "var(--danger-light)", color: "var(--danger)", border: "none" }} onClick={() => exportToPDF(getExportData(), "assets.pdf")}>📋 PDF</button>
                      </div>
                    </div>
                    <div className="table-container">
                      <div style={{ overflowX: "auto" }}>
                        <table>
                          <thead>
                            <tr>
                              <th>Asset Tag</th>
                              <th>Brand / Model</th>
                              <th>Serial Number</th>
                              <th>Category</th>
                              <th>Assigned To</th>
                              <th>Location</th>
                              <th>Status</th>
                              <th>Condition</th>
                            </tr>
                          </thead>
                          <tbody>
                            {assets.map(a => {
                              const assignedUser = getAssignedUser(a.asset_id);
                              const category = categories.find(c => c.category_id === a.category_id);
                              return (
                                <tr key={a.asset_id}>
                                  <td className="td-bold">{a.asset_tag || "—"}</td>
                                  <td className="td-muted">{a.brand || "—"} {a.model || "—"}</td>
                                  <td className="td-muted" style={{ fontSize: "12px" }}>{a.serial_number || "—"}</td>
                                  <td className="td-muted">{category?.category_name || "—"}</td>
                                  <td className="td-bold">{assignedUser?.full_name || "Unassigned"}</td>
                                  <td className="td-muted">{a.location || "—"}</td>
                                  <td><span className={`badge badge-${a.status?.toLowerCase() === "available" ? "success" : "info"}`}>{a.status || "—"}</span></td>
                                  <td className="td-muted">{a.condition_status || "—"}</td>
                                </tr>
                              );
                            })}
                            {assets.length === 0 && (
                              <tr><td colSpan="8"><div className="empty-state"><div className="empty-icon">📦</div><p>No assets found</p></div></td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Category & User Asset Breakdown */}
          <div className="section">
            <div className="section-header">
              <h3 className="section-title">Assets by Category & User</h3>
              <span className="badge badge-accent">{categories.length} categories</span>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
                <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
              </div>
            ) : (
              <CategoryAssetView
                assets={assets}
                assignments={assignments}
                users={users}
                categories={categories}
              />
            )}
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
        <ActionManagerModal asset={transactionAsset} close={() => setTransactionAsset(null)} onRefresh={fetchAssetsAndAssignments} />
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