import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getAssets, createAsset, updateAsset, deleteAsset, getAssignments, sendAssignmentReminder, getCategories } from "../api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AssetTable from "../components/AssetTable";
import AssetModal from "../components/AssetModal";
import ActionManagerModal from "../components/ActionManagerModal";
import DeleteConfirm from "../components/DeleteConfirm";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [assets, setAssets] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editAssetData, setEditAssetData] = useState(null);
  const [transactionAsset, setTransactionAsset] = useState(null); // Used for Manage Modal
  const [deleteId, setDeleteId] = useState(null);

  const fetchAssetsAndAssignments = async () => {
    try {
      const [assetsData, assignmentsData] = await Promise.all([
        getAssets(),
        getAssignments()
      ]);
      setAssets(Array.isArray(assetsData) ? assetsData : []);

      const aList = Array.isArray(assignmentsData) ? assignmentsData : [];
      // To show helpful info, map asset names to assignments
      const enrichedAssignments = aList.map(a => {
        const assetObj = Array.isArray(assetsData) ? assetsData.find(ast => ast.asset_id === a.asset_id) : null;
        return {
          ...a,
          asset_tag: assetObj ? assetObj.asset_tag : `ID: ${a.asset_id}`,
          model: assetObj ? assetObj.model : "Unknown"
        }
      });

      setAssignments(enrichedAssignments);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAssetsAndAssignments();
  }, []);

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
      console.error(e);
      alert(e.message);
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteAsset(deleteId);
      fetchAssetsAndAssignments();
      setDeleteId(null);
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  };

  const handleSendReminder = async (assignmentId) => {
    try {
      await sendAssignmentReminder(assignmentId);
      alert("Reminder email sent successfully.");
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  };

  return (
    <div>
      <Navbar />

      <div style={{ display: "flex" }}>
        <Sidebar />

        <div style={{ padding: "20px", width: "100%" }}>
          <h2>Inventory Dashboard</h2>
          <p>Welcome {user?.full_name} ({user?.role})</p>

          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <button onClick={() => setShowAssetModal(true)}>Register New Asset</button>
            {user?.role === "Admin" && (
              <Link to="/register">
                <button>Register New User</button>
              </Link>
            )}
          </div>

          <h3>Assets Library</h3>

          <AssetTable
            assets={assets}
            onEdit={setEditAssetData}
            onDelete={setDeleteId}
            onTransaction={setTransactionAsset} // Open up action manager
          />

          <h3 style={{ marginTop: "30px" }}>Active Assignments</h3>
          <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f2f2f2" }}>
                <th style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>Asset</th>
                <th style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>User ID</th>
                <th style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>Assigned On</th>
                <th style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>Status</th>
                <th style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.filter(a => a.status === "Active").map(a => (
                <tr key={a.assignment_id}>
                  <td style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>{a.model} ({a.asset_tag})</td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>{a.user_id}</td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>{a.assigned_date}</td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>{a.status}</td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>
                    <button
                      style={{ padding: "4px 8px", fontSize: "12px", background: "#f39c12", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                      onClick={() => handleSendReminder(a.assignment_id)}
                    >
                      Send Reminder
                    </button>
                  </td>
                </tr>
              ))}
              {assignments.filter(a => a.status === "Active").length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: "8px", textAlign: "center", fontStyle: "italic", color: "#888" }}>
                    No active assignments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAssetModal && (
        <AssetModal close={() => setShowAssetModal(false)} onSave={handleSaveAsset} />
      )}

      {editAssetData && (
        <AssetModal
          close={() => setEditAssetData(null)}
          onSave={handleSaveAsset}
          asset={editAssetData}
        />
      )}

      {transactionAsset && (
        <ActionManagerModal
          asset={transactionAsset}
          close={() => setTransactionAsset(null)}
          onRefresh={fetchAssetsAndAssignments}
        />
      )}

      {deleteId && (
        <DeleteConfirm
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
