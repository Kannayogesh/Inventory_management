import { useState, useContext, useEffect } from "react";
import { createAssignment, createMaintenanceRequest, updateMaintenanceRequest } from "../api";
import { AuthContext } from "../context/AuthContext";

const ActionManagerModal = ({ asset, close, onRefresh, maintenanceRequests = [] }) => {
  const { user } = useContext(AuthContext);
  const [action, setAction] = useState(asset.status === "Maintenance" ? "update_maintenance" : "assign");
  const [employeeCode, setEmployeeCode] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [condition, setCondition] = useState(asset.condition_status || "Good");
  const [issue, setIssue] = useState("");
  const [loading, setLoading] = useState(false);

  // New states for updating maintenance
  const [maintStatus, setMaintStatus] = useState("Under Process");
  const [maintNotes, setMaintNotes] = useState("");

  const activeRequest = maintenanceRequests.find(
    m => m.asset_id === asset.asset_id && m.status !== "Resolved" && m.status !== "Cannot Be Resolved"
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (action === "assign") {
        await createAssignment({
          asset_id: asset.asset_id,
          employee_code: employeeCode.trim(),
          expected_return_date: expectedReturnDate || null,
          condition_at_issue: condition,
          remarks: "Assigned via Admin Dashboard",
        });
      } else if (action === "maintenance") {
        await createMaintenanceRequest({
          asset_id: asset.asset_id,
          issue_description: issue,
          remarks: "Logged by Admin",
        });
      } else if (action === "update_maintenance") {
        if (!activeRequest) throw new Error("Could not find active maintenance request for this asset.");
        await updateMaintenanceRequest(activeRequest.maintenance_id, {
          status: maintStatus,
          notes: maintNotes || "Updated via dashboard"
        });
      }

      const successMsg = action === "assign"
        ? `Asset assigned to ${employeeCode}. Email notification sent.`
        : action === "maintenance"
          ? "Maintenance request logged successfully."
          : `Maintenance status updated to ${maintStatus}.`;
      onRefresh(successMsg);
      close();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">Manage Asset</h3>
          <button className="modal-close" onClick={close}>✕</button>
        </div>
        <p className="modal-subtitle">
          <span className="td-mono" style={{ background: "var(--bg-subtle)", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" }}>{asset.asset_tag}</span>
          {" "}{asset.brand} {asset.model}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Action Type */}
            <div className="form-group">
              <label className="form-label">Action</label>
              <div className="radio-group">
                <label className={`radio-option${action === "assign" ? " selected" : ""}${user?.role !== "Admin" ? " disabled" : ""}`}>
                  <input type="radio" value="assign" checked={action === "assign"} onChange={() => setAction("assign")} disabled={asset.status !== "Available" || user?.role !== "Admin"} />
                  📤 Assign to Employee {user?.role !== "Admin" && "(Admin Only)"}
                </label>

                {asset.status !== "Maintenance" ? (
                  <label className={`radio-option${action === "maintenance" ? " selected" : ""}`}>
                    <input type="radio" value="maintenance" checked={action === "maintenance"} onChange={() => setAction("maintenance")} />
                    🔧 Send to Maintenance
                  </label>
                ) : (
                  <label className={`radio-option${action === "update_maintenance" ? " selected" : ""}`}>
                    <input type="radio" value="update_maintenance" checked={action === "update_maintenance"} onChange={() => setAction("update_maintenance")} />
                    🔄 Update Maintenance Status
                  </label>
                )}
              </div>
            </div>

            {action === "assign" && (
              <>
                <div className="form-group">
                  <label className="form-label">Employee Code *</label>
                  <input
                    className="form-input"
                    placeholder="Enter employee code"
                    value={employeeCode}
                    onChange={e => setEmployeeCode(e.target.value)}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Expected Return Date</label>
                    <input type="date" className="form-input" value={expectedReturnDate} onChange={e => setExpectedReturnDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Condition at Issue</label>
                    <select className="form-select" value={condition} onChange={e => setCondition(e.target.value)}>
                      <option value="New">New</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {action === "maintenance" && (
              <div className="form-group">
                <label className="form-label">Issue Description *</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe the issue with this asset..."
                  value={issue}
                  onChange={e => setIssue(e.target.value)}
                  required
                />
              </div>
            )}

            {action === "update_maintenance" && (
              <>
                <div className="form-group">
                  <label className="form-label">Update Status To</label>
                  <select className="form-select" value={maintStatus} onChange={e => setMaintStatus(e.target.value)}>
                    <option value="Under Process">Under Process</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Cannot Be Resolved">Cannot Be Resolved</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Remarks / Notes</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Add details about the status update..."
                    value={maintNotes}
                    onChange={e => setMaintNotes(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={close} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> Processing…</> : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActionManagerModal;