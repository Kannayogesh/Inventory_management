import { useEffect, useState } from "react";

const CategoryAssetView = ({ assets, assignments, users, categories }) => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);

  // Group assets by category
  const groupedByCategory = categories.map(cat => {
    const catAssets = assets.filter(a => a.category_id === cat.category_id);
    return {
      ...cat,
      assets: catAssets
    };
  }).filter(cat => cat.assets.length > 0);

  // Get user assignment for an asset
  const getAssignmentForAsset = (assetId) => {
    const assignment = assignments.find(a => a.asset_id === assetId && a.status === "Active");
    if (!assignment) return null;
    const user = users.find(u => u.user_id === assignment.user_id);
    return { assignment, user };
  };

  const toggleCategory = (catId) => {
    setExpandedCategory(expandedCategory === catId ? null : catId);
  };

  const toggleUser = (key) => {
    setExpandedUser(expandedUser === key ? null : key);
  };

  return (
    <div className="category-asset-view">
      {groupedByCategory.map(category => (
        <div key={category.category_id} className="category-section">
          <div
            className="category-header"
            onClick={() => toggleCategory(category.category_id)}
            style={{
              cursor: "pointer",
              padding: "12px 16px",
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
              transition: "all var(--transition)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "18px" }}>📦</span>
              <div>
                <div className="td-bold">{category.category_name}</div>
                <div className="td-muted" style={{ fontSize: "12px", marginTop: "2px" }}>
                  {category.assets.length} asset{category.assets.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <span style={{ fontSize: "18px", transition: "transform var(--transition)" }}>
              {expandedCategory === category.category_id ? "▼" : "▶"}
            </span>
          </div>

          {expandedCategory === category.category_id && (
            <div style={{ marginLeft: "16px", marginBottom: "16px" }}>
              {category.assets.map(asset => {
                const assignmentData = getAssignmentForAsset(asset.asset_id);
                const userKey = `${category.category_id}-${assignmentData?.user?.user_id || 'unassigned'}`;
                const isExpanded = expandedUser === userKey;

                return (
                  <div key={asset.asset_id} style={{ marginBottom: "8px" }}>
                    <div
                      style={{
                        padding: "10px 12px",
                        backgroundColor: "var(--bg-subtle)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)",
                        cursor: assignmentData ? "pointer" : "default",
                        transition: "all var(--transition)"
                      }}
                      onClick={() => assignmentData && toggleUser(userKey)}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ flex: 1 }}>
                          <div className="td-bold">{asset.model || asset.brand}</div>
                          <div className="td-muted" style={{ fontSize: "11px", marginTop: "2px" }}>
                            {asset.serial_number && `SN: ${asset.serial_number}`}
                            {assignmentData ? ` · Assigned to ${assignmentData.user.full_name}` : " · Unassigned"}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className={`badge ${assignmentData ? "badge-info" : "badge-success"}`}>
                            {assignmentData ? "Assigned" : "Available"}
                          </span>
                          {assignmentData && (
                            <span style={{ fontSize: "14px" }}>
                              {isExpanded ? "▼" : "▶"}
                            </span>
                          )}
                        </div>
                      </div>

                      {isExpanded && assignmentData && (
                        <div style={{
                          marginTop: "12px",
                          paddingTop: "12px",
                          borderTop: "1px solid var(--border)",
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "12px",
                          fontSize: "12px"
                        }}>
                          <div>
                            <div style={{ color: "var(--text-muted)", marginBottom: "2px" }}>Name</div>
                            <div className="td-bold">{assignmentData.user.full_name}</div>
                          </div>
                          <div>
                            <div style={{ color: "var(--text-muted)", marginBottom: "2px" }}>Employee ID</div>
                            <div className="td-mono">{assignmentData.user.employee_code}</div>
                          </div>
                          <div>
                            <div style={{ color: "var(--text-muted)", marginBottom: "2px" }}>Email</div>
                            <div className="td-muted">{assignmentData.user.email}</div>
                          </div>
                          <div>
                            <div style={{ color: "var(--text-muted)", marginBottom: "2px" }}>Assigned On</div>
                            <div className="td-muted">{assignmentData.assignment.assigned_date}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {groupedByCategory.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <p>No assets available</p>
        </div>
      )}
    </div>
  );
};

export default CategoryAssetView;
