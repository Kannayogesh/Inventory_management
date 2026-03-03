import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getAssets, createAsset, updateAsset, deleteAsset } from "../api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AssetTable from "../components/AssetTable";
import AssetModal from "../components/AssetModal";
import ActionManagerModal from "../components/ActionManagerModal";
import DeleteConfirm from "../components/DeleteConfirm";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [assets, setAssets] = useState([]);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editAssetData, setEditAssetData] = useState(null);
  const [transactionAsset, setTransactionAsset] = useState(null); // Used for Manage Modal
  const [deleteId, setDeleteId] = useState(null);

  const fetchAssets = async () => {
    try {
      const data = await getAssets();
      setAssets(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleSaveAsset = async (assetData) => {
    try {
      if (editAssetData) {
        await updateAsset(editAssetData.asset_id, assetData);
      } else {
        await createAsset(assetData);
      }
      fetchAssets();
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
      fetchAssets();
      setDeleteId(null);
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
          onRefresh={fetchAssets}
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
