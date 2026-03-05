import { useState } from "react";
import { returnAssignment } from "../api";

const ReturnAssetModal = ({ assignment, close, onRefresh }) => {
  const [condition, setCondition] = useState(assignment.condition_at_issue || "Good");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await returnAssignment(assignment.assignment_id, {
        condition_at_return: condition,
        remarks: remarks || undefined,
      });
      onRefresh();
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
          <h3 className="modal-title">Return Asset</h3>
          <button className="modal-close" onClick={close}>✕</button>
        </div>
        <p className="modal-subtitle">
          <span style={{ background: "var(--bg-subtle)", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontFamily: "monospace" }}>{assignment.asset_tag}</span>
          {" "}{assignment.model}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Condition at Return</label>
              <select className="form-select" value={condition} onChange={e => setCondition(e.target.value)}>
                <option value="New">New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Remarks (Optional)</label>
              <textarea
                className="form-textarea"
                placeholder="Add any notes about the return..."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={close} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> Processing…</> : "Confirm Return"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnAssetModal;