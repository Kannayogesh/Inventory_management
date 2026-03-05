import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getAssets, createAsset, updateAsset, deleteAsset, getAssignments, sendAssignmentReminder } from "../api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AssetTable from "../components/AssetTable";
import AssetModal from "../components/AssetModal";
import ActionManagerModal from "../components/ActionManagerModal";
import DeleteConfirm from "../components/DeleteConfirm";

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
  const [assets, setAssets] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editAssetData, setEditAssetData] = useState(null);
  const [transactionAsset, setTransactionAsset] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchAssetsAndAssignments = async () => {
    try {
      const [assetsData, assignmentsData] = await Promise.all([getAssets(), getAssignments()]);
      setAssets(Array.isArray(assetsData) ? assetsData : []);
      const aList = Array.isArray(assignmentsData) ? assignmentsData : [];
      const enriched = aList.map(a => {
        const assetObj = Array.isArray(assetsData) ? assetsData.find(ast => ast.asset_id === a.asset_id) : null;
        return { ...a, asset_tag: assetObj?.asset_tag || `ID: ${a.asset_id}`, model: assetObj?.model || "Unknown" };
      });
      setAssignments(enriched);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssetsAndAssignments(); }, []);

  const handleSaveAsset = async (assetData) => {
    try {
      if (editAssetData) {
        await updateAsset(editAssetData.asset_id, assetData);
      } else {
        await createAsset(assetData);
      }
      fetchAssetsAndAssignments();
      setShowAssetModal(false);
      setEditAssetData(null);
    } catch (e) {
      alert(e.message);
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
            <StatCard label="Total Assets" value={total} icon="📦" variant="accent" />
            <StatCard label="Available" value={available} icon="✅" variant="success" />
            <StatCard label="Assigned" value={assigned} icon="👤" variant="info" />
            <StatCard label="Maintenance" value={maintenance} icon="🔧" variant="warning" />
            <StatCard label="Retired" value={retired} icon="🗃️" variant="danger" />
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
                <a href="/dashboard.html" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                  📊 Analytics
                </a>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
                <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
              </div>
            ) : (
              <AssetTable
                assets={filteredAssets}
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
                      <th>User ID</th>
                      <th>Assigned On</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeAssignments.map(a => (
                      <tr key={a.assignment_id}>
                        <td>
                          <span className="td-bold">{a.model}</span>
                          <span className="td-muted"> · {a.asset_tag}</span>
                        </td>
                        <td className="td-mono" style={{ fontSize: "12px" }}>{a.user_id}</td>
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
                    ))}
                    {activeAssignments.length === 0 && (
                      <tr>
                        <td colSpan="5">
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
    </div>
  );
};

export default Dashboard;