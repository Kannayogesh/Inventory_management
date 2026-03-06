import { useState } from "react";
import { createAssignment, createMaintenanceRequest } from "../api";

const ActionManagerModal = ({ asset, close, onRefresh }) => {
  const [action, setAction] = useState("assign");
  const [employeeCode, setEmployeeCode] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [condition, setCondition] = useState(asset.condition_status || "Good");
  const [issue, setIssue] = useState("");
  const [loading, setLoading] = useState(false);

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
      }
      const successMsg = action === "assign"
        ? `Asset assigned to ${employeeCode}. Email notification sent.`
        : "Maintenance request logged successfully.";
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
                <label className={`radio-option${action === "assign" ? " selected" : ""}`}>
                  <input type="radio" value="assign" checked={action === "assign"} onChange={() => setAction("assign")} disabled={asset.status !== "Available"} />
                  📤 Assign to Employee
                </label>
                <label className={`radio-option${action === "maintenance" ? " selected" : ""}`}>
                  <input type="radio" value="maintenance" checked={action === "maintenance"} onChange={() => setAction("maintenance")} disabled={asset.status === "Maintenance"} />
                  🔧 Send to Maintenance
                </label>
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