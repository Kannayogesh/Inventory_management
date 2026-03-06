const statusBadge = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "available") return <span className="badge badge-success">{status}</span>;
  if (s === "assigned") return <span className="badge badge-info">{status}</span>;
  if (s === "maintenance") return <span className="badge badge-warning">{status}</span>;
  if (s === "retired") return <span className="badge badge-muted">{status}</span>;
  return <span className="badge badge-muted">{status || "Unknown"}</span>;
};

const conditionBadge = (condition) => {
  const c = (condition || "").toLowerCase();
  if (c === "new") return <span className="badge badge-success">{condition}</span>;
  if (c === "good") return <span className="badge badge-info">{condition}</span>;
  if (c === "fair") return <span className="badge badge-warning">{condition}</span>;
  if (c === "damaged") return <span className="badge badge-danger">{condition}</span>;
  return <span className="badge badge-muted">{condition || "-"}</span>;
};

const AssetTable = ({ assets, onEdit, onDelete, onTransaction, assignments = [], users = [] }) => {
  const getAssignedUser = (assetId) => {
    const assignment = assignments.find(a => a.asset_id === assetId && a.status === "Active");
    return assignment ? users.find(u => u.user_id === assignment.user_id) : null;
  };

  return (
    <div className="table-container">
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Brand / Model</th>
              <th>Serial No</th>
              <th>Assigned To</th>
              <th>Status</th>
              <th>Condition</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => {
              const assignedUser = getAssignedUser(asset.asset_id);
              return (
                <tr key={asset.asset_id}>
                  <td>
                    <span className="td-bold">{asset.brand}</span>
                    {asset.model && (
                      <span className="td-muted"> {asset.model}</span>
                    )}
                  </td>
                  <td className="td-muted">{asset.serial_number || "—"}</td>
                  <td className="td-bold">{assignedUser?.full_name || "Unassigned"}</td>
                  <td>{statusBadge(asset.status)}</td>
                  <td>{conditionBadge(asset.condition_status)}</td>
                  <td className="td-muted">{asset.location || "—"}</td>
                  <td>
                    <div className="action-btn-group">
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        onClick={() => onEdit(asset)}
                        title="Edit asset"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        onClick={() => onTransaction(asset)}
                        title="Manage asset"
                        style={{ fontSize: "14px" }}
                      >
                        ⚙️
                      </button>
                      <button
                        className="btn btn-danger btn-sm btn-icon"
                        onClick={() => onDelete(asset.asset_id)}
                        title="Delete asset"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {assets.length === 0 && (
              <tr>
                <td colSpan="7">
                  <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <p>No assets found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssetTable;