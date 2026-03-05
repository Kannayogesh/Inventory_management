import { useState } from "react";
import { createAssignment, createMaintenanceRequest } from "../api";

const ActionManagerModal = ({ asset, close, onRefresh }) => {
    const [action, setAction] = useState("assign");
    const [employeeCode, setEmployeeCode] = useState("");
    const [expectedReturnDate, setExpectedReturnDate] = useState("");
    const [condition, setCondition] = useState(asset.condition_status || "Good");

    // Maintenance states
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
                    remarks: "Assigned via Admin Dashboard"
                });
            } else if (action === "maintenance") {
                await createMaintenanceRequest({
                    asset_id: asset.asset_id,
                    issue_description: issue,
                    remarks: "Logged by Admin"
                });
            }
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
                <h3>Manage Asset: {asset.asset_tag}</h3>

                <div style={{ marginBottom: "15px" }}>
                    <label style={{ marginRight: "10px" }}>
                        <input type="radio" value="assign" checked={action === "assign"} onChange={() => setAction("assign")} disabled={asset.status !== "Available"} />
                        Assign Asset
                    </label>
                    <label>
                        <input type="radio" value="maintenance" checked={action === "maintenance"} onChange={() => setAction("maintenance")} disabled={asset.status === "Maintenance"} />
                        Send to Maintenance
                    </label>
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    {action === "assign" && (
                        <>
                            <input
                                type="text"
                                placeholder="Employee ID to assign to"
                                value={employeeCode}
                                onChange={(e) => setEmployeeCode(e.target.value)}
                                required
                                style={styles.input}
                            />
                            <div style={{ display: "flex", gap: "10px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: "12px" }}>Expected Return Date</label>
                                    <input
                                        type="date"
                                        value={expectedReturnDate}
                                        onChange={(e) => setExpectedReturnDate(e.target.value)}
                                        style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: "12px" }}>Condition Issued</label>
                                    <select
                                        value={condition}
                                        onChange={(e) => setCondition(e.target.value)}
                                        style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                                    >
                                        <option value="New">New</option>
                                        <option value="Good">Good</option>
                                        <option value="Fair">Fair</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

                    {action === "maintenance" && (
                        <textarea
                            placeholder="Describe the issue with this asset..."
                            value={issue}
                            onChange={(e) => setIssue(e.target.value)}
                            required
                            style={{ ...styles.input, height: "80px" }}
                        />
                    )}

                    <div style={styles.actions}>
                        <button type="button" onClick={close} disabled={loading}>Cancel</button>
                        <button type="submit" disabled={loading}>{loading ? "Saving..." : "Submit"}</button>
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
    form: { display: "flex", flexDirection: "column", gap: "10px" },
    input: { padding: "8px", border: "1px solid #ccc", borderRadius: "4px" },
    actions: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }
};

export default ActionManagerModal;
