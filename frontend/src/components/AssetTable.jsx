import { BASE_URL } from '../api';

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

const maintStatusBadge = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "resolved") return <span className="badge badge-success">{status}</span>;
  if (s === "cannot be resolved") return <span className="badge badge-danger">{status}</span>;
  if (s.includes("process") || s.includes("progress")) return <span className="badge badge-warning">{status}</span>;
  return <span className="badge badge-info">{status || "Open"}</span>;
};

const AssetTable = ({ assets, onEdit, onDelete, onTransaction, assignments = [], users = [], viewMode = "all", maintenanceRequests = [] }) => {
  const getAssignedUser = (assetId) => {
    const assignment = assignments.find(a => a.asset_id === assetId && a.status === "Active");
    return assignment ? users.find(u => u.user_id === assignment.user_id) : null;
  };

  const getMaintenanceDetails = (assetId) => {
    const reqs = maintenanceRequests.filter(m => m.asset_id === assetId);
    if (reqs.length === 0) return null;
    reqs.sort((r1, r2) => new Date(r2.reported_date) - new Date(r1.reported_date));
    return reqs[0];
  };

  const isMaint = viewMode === "maintenance";

  return (
    <div className="table-container">
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>{isMaint ? "Asset ID / Model" : "Brand / Model"}</th>
              <th>Serial No</th>
              <th>Assigned To</th>
              {isMaint ? (
                <>
                  <th>Location</th>
                  <th>Issue Description</th>
                  <th>Maint. Status</th>
                  <th>Last Updated</th>
                </>
              ) : (
                <>
                  <th>Status</th>
                  <th>Condition</th>
                  <th>Location</th>
                </>
              )}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => {
              const assignedUser = getAssignedUser(asset.asset_id);
              const maintDetails = isMaint ? getMaintenanceDetails(asset.asset_id) : null;

              return (
                <tr key={asset.asset_id}>
                  <td>
                    {isMaint ? (
                      <div>
                        <span className="td-bold">ID: {asset.asset_id}</span>
                        <br />
                        <span className="td-muted">{asset.brand} {asset.model}</span>
                      </div>
                    ) : (
                      <>
                        <span className="td-bold">{asset.brand}</span>
                        {asset.model && (
                          <span className="td-muted"> {asset.model}</span>
                        )}
                      </>
                    )}
                  </td>
                  <td className="td-muted">{asset.serial_number || "—"}</td>
                  <td className="td-bold">{assignedUser?.full_name || "Unassigned"}</td>

                  {isMaint ? (
                    <>
                      <td className="td-muted">{asset.location || "—"}</td>
                      <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={maintDetails?.issue_description || "—"}>
                        {maintDetails?.issue_description || "—"}
                      </td>
                      <td>{maintDetails ? maintStatusBadge(maintDetails.status) : "—"}</td>
                      <td className="td-muted">
                        {maintDetails ? new Date(maintDetails.resolved_date || maintDetails.reported_date).toLocaleDateString() : "—"}
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{statusBadge(asset.status)}</td>
                      <td>{conditionBadge(asset.condition_status)}</td>
                      <td className="td-muted">{asset.location || "—"}</td>
                    </>
                  )}

                  <td>
                    <div className="action-btn-group">
                      {asset.invoice_path && !isMaint && (
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          onClick={() => {
                            const url = asset.invoice_path.startsWith('http')
                              ? asset.invoice_path
                              : `${BASE_URL}${asset.invoice_path.startsWith('/') ? '' : '/'}${asset.invoice_path}`;
                            window.open(url, "_blank");
                          }}
                          title="View Invoice"
                          style={{ fontSize: "14px" }}
                        >
                          📄
                        </button>
                      )}

                      {!isMaint && (
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          onClick={() => onEdit(asset)}
                          title="Edit asset"
                        >
                          ✏️
                        </button>
                      )}

                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        onClick={() => onTransaction(asset)}
                        title="Manage asset"
                        style={{ fontSize: "14px" }}
                      >
                        ⚙️
                      </button>

                      {!isMaint && (
                        <button
                          className="btn btn-danger btn-sm btn-icon"
                          onClick={() => onDelete(asset.asset_id)}
                          title="Delete asset"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {assets.length === 0 && (
              <tr>
                <td colSpan={isMaint ? "8" : "7"}>
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