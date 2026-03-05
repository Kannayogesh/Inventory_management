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
                remarks: remarks || undefined
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
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h3>Return Asset: {assignment.asset_tag}</h3>
                <p>Model: {assignment.model}</p>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div>
                        <label style={{ fontSize: "14px", display: "block", marginBottom: "5px" }}>
                            Condition at Return
                        </label>
                        <select
                            value={condition}
                            onChange={(e) => setCondition(e.target.value)}
                            style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                        >
                            <option value="New">New</option>
                            <option value="Good">Good</option>
                            <option value="Fair">Fair</option>
                            <option value="Damaged">Damaged</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ fontSize: "14px", display: "block", marginBottom: "5px" }}>
                            Remarks (Optional)
                        </label>
                        <textarea
                            placeholder="Add any notes about the return..."
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            style={{ ...styles.input, width: "100%", height: "80px", boxSizing: "border-box" }}
                        />
                    </div>

                    <div style={styles.actions}>
                        <button type="button" onClick={close} disabled={loading}>Cancel</button>
                        <button type="submit" disabled={loading}>{loading ? "Returning..." : "Confirm Return"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.5)", display: "flex",
        alignItems: "center", justifyContent: "center", zIndex: 1000
    },
    modal: { background: "white", padding: "20px", borderRadius: "8px", width: "400px", color: "#333" },
    form: { display: "flex", flexDirection: "column", gap: "15px", marginTop: "15px" },
    input: { padding: "8px", border: "1px solid #ccc", borderRadius: "4px" },
    actions: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }
};

export default ReturnAssetModal;
