import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { getAssignments, getMaintenanceRequests, getAsset } from "../api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const EmployeeDashboard = () => {
    const { user } = useContext(AuthContext);
    const [assignments, setAssignments] = useState([]);
    const [requests, setRequests] = useState([]);

    const fetchData = async () => {
        try {
            // Fetch my assignments
            const aData = await getAssignments();
            const aList = Array.isArray(aData) ? aData : [];
            const myAssignments = aList.filter(a => a.user_id === user.user_id);

            // Enrich assignments with asset details
            for (let a of myAssignments) {
                try {
                    const assetDetails = await getAsset(a.asset_id);
                    a.asset_tag = assetDetails.asset_tag;
                    a.model = assetDetails.model;
                } catch (e) {
                    a.asset_tag = `ID: ${a.asset_id}`;
                    a.model = "Unknown";
                }
            }
            setAssignments(myAssignments);

            // Fetch my maintenance requests
            const mData = await getMaintenanceRequests();
            const mList = Array.isArray(mData) ? mData : [];
            const myRequests = mList.filter(m => m.reported_by === user.user_id);
            setRequests(myRequests);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (user?.user_id) {
            fetchData();
        }
    }, [user]);

    return (
        <div>
            <Navbar />

            <div style={{ display: "flex" }}>
                <Sidebar />

                <div style={{ padding: "20px", width: "100%" }}>
                    <h2>Employee Dashboard</h2>
                    <p>Welcome {user?.full_name}</p>

                    <h3>My Assigned Assets</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Asset Tag</th>
                                <th>Model</th>
                                <th>Assigned On</th>
                                <th>Must Return By</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignments.map((a) => (
                                <tr key={a.assignment_id}>
                                    <td>{a.asset_tag}</td>
                                    <td>{a.model}</td>
                                    <td>{a.assigned_date}</td>
                                    <td>{a.expected_return_date || "-"}</td>
                                    <td>{a.status}</td>
                                </tr>
                            ))}
                            {assignments.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: "center", padding: "10px" }}>No assets assigned to you</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <h3>My Recent Maintenance Requests</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Asset ID</th>
                                <th>Issue</th>
                                <th>Status</th>
                                <th>Reported On</th>
                                <th>Resolved On</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.slice(0, 10).map((r) => (
                                <tr key={r.maintenance_id}>
                                    <td>{r.asset_id}</td>
                                    <td>{r.issue_description || "-"}</td>
                                    <td>{r.status}</td>
                                    <td>{new Date(r.reported_date).toLocaleDateString()}</td>
                                    <td>{r.resolved_date ? new Date(r.resolved_date).toLocaleDateString() : "-"}</td>
                                </tr>
                            ))}
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: "center", padding: "10px" }}>No recent maintenance requests</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
