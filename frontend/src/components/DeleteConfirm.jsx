const DeleteConfirm = ({ onConfirm, onCancel }) => {
  return (
    <div className="modal-overlay">
      <div className="modal confirm-modal">
        <div className="confirm-icon">🗑️</div>
        <div className="modal-header" style={{ justifyContent: "center", flexDirection: "column", textAlign: "center", gap: "6px" }}>
          <h4 className="modal-title">Delete Asset?</h4>
        </div>
        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "13.5px", padding: "0 26px 8px" }}>
          This action is permanent and cannot be undone. All related data will be removed.
        </p>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirm;