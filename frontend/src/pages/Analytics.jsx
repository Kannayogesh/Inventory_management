import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { getAssets, getAssignments, getUsers, getCategories } from "../api";
import { exportToCSV, exportToExcel, exportToPDF } from "../utils/exportUtils";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AnalyticsDashboard from "../components/AnalyticsDashboard";

const Analytics = () => {
    const { user } = useContext(AuthContext);
    const [assets, setAssets] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [users, setUsers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            const [assetsData, assignmentsData, usersData, categoriesData] = await Promise.all([
                getAssets(),
                getAssignments(),
                getUsers(),
                getCategories()
            ]);

            setAssets(Array.isArray(assetsData) ? assetsData : []);
            setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
            setUsers(Array.isArray(usersData) ? usersData : []);
            setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        } catch (e) {
            console.error("Analytics fetch error:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const activeAssignments = assignments.filter(a => a.status === "Active" || a.status === "active");

    const availableCount = assets.filter(a => (a.status || "").toLowerCase() === "available").length;
    const assignedCount = assets.filter(a => (a.status || "").toLowerCase() === "assigned").length;
    const maintenanceCount = assets.filter(a => (a.status || "").toLowerCase() === "maintenance").length;

    const getOverdueAssets = () => {
        const now = new Date();
        return assets.filter((a) => {
            if ((a.status || "").toLowerCase() !== "assigned") return false;
            const activeAssign = assignments.find(
                (x) => x.asset_id === a.asset_id && (x.status === "Active" || x.status === "active")
            );
            if (!activeAssign) return false;
            const expStr = activeAssign.expected_return_date || activeAssign.expectedReturnDate;
            if (!expStr) return false;
            const exp = new Date(expStr);
            return !isNaN(exp.getTime()) && exp < now;
        });
    };
    const overdueCount = getOverdueAssets().length;

    const getAssignedUser = (assetId) => {
        const assignment = assignments.find(a => a.asset_id === assetId && (a.status === "Active" || a.status === "active"));
        if (!assignment) return null;
        return users.find(u => u.user_id === assignment.user_id);
    };

    const getExpectedReturn = (assetId) => {
        const assignment = assignments.find(a => a.asset_id === assetId && (a.status === "Active" || a.status === "active"));
        return assignment?.expected_return_date || assignment?.expectedReturnDate || "—";
    };

    const filteredAssets = assets.filter(a => {
        const q = searchQuery.toLowerCase();
        return (
            a.asset_tag?.toLowerCase().includes(q) ||
            a.brand?.toLowerCase().includes(q) ||
            a.model?.toLowerCase().includes(q) ||
            a.serial_number?.toLowerCase().includes(q) ||
            a.location?.toLowerCase().includes(q)
        );
    });

    const getExportData = () => {
        return filteredAssets.map(a => {
            const user = getAssignedUser(a.asset_id);
            return {
                "Asset Tag": a.asset_tag,
                "Brand": a.brand,
                "Model": a.model,
                "Serial Number": a.serial_number,
                "Status": a.status,
                "Condition": a.condition_status,
                "Location": a.location,
                "Assigned To": user ? user.full_name : "Unassigned",
                "Email": user ? user.email : "—",
                "Cost": a.purchase_cost || "—",
                "Warranty Expiry": a.warranty_expiry ? new Date(a.warranty_expiry).toLocaleDateString() : "—"
            };
        });
    };

    const isExpiringSoon = (date) => {
        if (!date) return false;
        const expiry = new Date(date);
        const now = new Date();
        const diff = (expiry - now) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 30;
    };

    const isExpired = (date) => {
        if (!date) return false;
        return new Date(date) < new Date();
    };

    return (
        <div className="app-shell">
            <Navbar />
            <div className="app-body">
                <Sidebar />
                <main className="page-content">
                    <div className="page-header">
                        <div className="page-header-left">
                            <div className="page-eyebrow">Insights</div>
                            <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontSize: "1.4em" }}>📊</span> Inventory Analytics Dashboard
                            </h2>
                            <p style={{ marginTop: "3px", fontSize: "14px", color: "var(--text-secondary)" }}>
                                Assets · Assignments · Warranty · Overdue · Usage insights
                            </p>
                        </div>
                        <div className="page-header-right" style={{ display: "flex", gap: "12px" }}>
                            <button className="btn btn-secondary" onClick={fetchData} style={{ borderRadius: "10px" }}>
                                <span style={{ fontSize: "16px" }}>↺</span> Refresh Data
                            </button>
                        </div>
                    </div>

                    <div style={{ marginBottom: "2.5rem" }}>
                        <div className="kpi-grid">
                            <StatCard title="TOTAL USERS" value={users.length} sub="Active accounts" theme="blue" />
                            <StatCard title="TOTAL ASSETS" value={assets.length} sub="Registered items" theme="blue" />
                            <StatCard title="AVAILABLE" value={availableCount} sub="Ready to assign" theme="green" />
                            <StatCard title="ASSIGNED" value={assignedCount} sub="In employee usage" theme="indigo" />
                            <StatCard title="MAINTENANCE" value={maintenanceCount} sub="Service / Repair" theme="orange" />
                        </div>
                        <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
                            <StatCard title="OVERDUE RETURNS" value={overdueCount} sub="Return date crossed" theme="red" />
                            <div style={{ gridColumn: "span 4" }}></div>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: "center", padding: "100px", color: "var(--muted)" }}>
                            <span className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
                            <p style={{ marginTop: "16px", fontWeight: "600" }}>Generating analytics...</p>
                        </div>
                    ) : (
                        <div className="analytics-layout" style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
                            <div className="charts-section">
                                <AnalyticsDashboard
                                    assets={assets}
                                    assignments={assignments}
                                    users={users}
                                    categories={categories}
                                />
                            </div>

                            <div className="section" style={{ background: "var(--bg-surface)", borderRadius: "22px", border: "1px solid var(--border)", padding: "24px", boxShadow: "var(--shadow-sm)" }}>
                                <div className="section-header" style={{ marginBottom: "24px" }}>
                                    <div>
                                        <h3 className="section-title" style={{ fontSize: "18px", marginBottom: "4px" }}>Asset Library</h3>
                                        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Browse exhaustive asset details and tracking history</p>
                                    </div>
                                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                        <div className="search-input" style={{ background: "var(--bg-base)", borderRadius: "12px", padding: "6px 12px" }}>
                                            <span>🔍</span>
                                            <input
                                                placeholder="Search assets..."
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                style={{ fontSize: "13px", width: "180px" }}
                                            />
                                        </div>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button className="btn btn-sm btn-secondary" onClick={() => exportToCSV(getExportData(), "analytics_assets.csv")}>📄 CSV</button>
                                            <button className="btn btn-sm btn-secondary" onClick={() => exportToExcel(getExportData(), "analytics_assets.xlsx")}>📊 Excel</button>
                                            <button className="btn btn-sm btn-secondary" onClick={() => exportToPDF(getExportData(), "analytics_assets.pdf")}>📋 PDF</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="table-container" style={{ border: "none", boxShadow: "none" }}>
                                    <div style={{ overflowX: "auto" }}>
                                        <table className="premium-table">
                                            <thead>
                                                <tr>
                                                    <th>ASSET</th>
                                                    <th>SERIAL</th>
                                                    <th>STATUS</th>
                                                    <th>ASSIGNED TO</th>
                                                    <th>EXP. RETURN</th>
                                                    <th>CONDITION</th>
                                                    <th>LOCATION</th>
                                                    <th>COST</th>
                                                    <th>WARRANTY</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredAssets.map(a => {
                                                    const assignedUser = getAssignedUser(a.asset_id);
                                                    const expReturn = getExpectedReturn(a.asset_id);
                                                    const status = (a.status || "").toLowerCase();

                                                    return (
                                                        <tr key={a.asset_id}>
                                                            <td>
                                                                <div className="td-bold">{a.asset_tag}</div>
                                                                <div className="td-muted" style={{ fontSize: "12px" }}>{a.brand} {a.model}</div>
                                                            </td>
                                                            <td className="td-muted">{a.serial_number || "—"}</td>
                                                            <td>
                                                                <span className={`badge badge-${status === "available" ? "success" : status === "assigned" ? "info" : "warning"}`}>
                                                                    {a.status}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {assignedUser ? (
                                                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                                                        <span className="td-bold">{assignedUser.full_name}</span>
                                                                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>ID: {assignedUser.employee_code}</span>
                                                                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{assignedUser.email}</span>
                                                                    </div>
                                                                ) : "—"}
                                                            </td>
                                                            <td className="td-muted">{expReturn !== "—" ? new Date(expReturn).toLocaleDateString() : "—"}</td>
                                                            <td>
                                                                <span className={`badge badge-${(a.condition_status || "").toLowerCase() === "new" ? "success" : "info"}`} style={{ borderRadius: "6px", fontSize: "10px" }}>
                                                                    {a.condition_status}
                                                                </span>
                                                            </td>
                                                            <td className="td-muted">{a.location || "—"}</td>
                                                            <td className="td-bold">₹{Number(a.purchase_cost || 0).toLocaleString()}</td>
                                                            <td>
                                                                {a.warranty_expiry ? (
                                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                                        {isExpiringSoon(a.warranty_expiry) && <span style={{ color: "var(--warning)" }}>⚠️</span>}
                                                                        {isExpired(a.warranty_expiry) && <span style={{ color: "var(--danger)" }}>🚫</span>}
                                                                        <span className={isExpired(a.warranty_expiry) ? "td-danger" : isExpiringSoon(a.warranty_expiry) ? "td-warning" : "td-muted"}>
                                                                            {new Date(a.warranty_expiry).toLocaleDateString()}
                                                                        </span>
                                                                    </div>
                                                                ) : "—"}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div style={{ padding: "16px", borderTop: "1px solid var(--border)", textAlign: "right", color: "var(--text-muted)", fontSize: "12px" }}>
                                        Showing {filteredAssets.length} assets
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <style>{`
                .kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 12px;
                }
                .kpi-card {
                    background: var(--bg-surface);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 20px;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    box-shadow: var(--shadow-sm);
                    min-height: 125px;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .kpi-card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                }
                .kpi-card::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                }
                .kpi-card.blue::after { background: #3b82f6; }
                .kpi-card.green::after { background: #10b981; }
                .kpi-card.indigo::after { background: #6366f1; }
                .kpi-card.orange::after { background: #f59e0b; }
                .kpi-card.red::after { background: #ef4444; }

                .kpi-title {
                    font-size: 11px;
                    font-weight: 700;
                    color: var(--text-muted);
                    letter-spacing: 0.1em;
                }
                .kpi-value {
                    font-size: 32px;
                    font-weight: 800;
                    color: var(--text-primary);
                    line-height: 1;
                    font-family: var(--font-display);
                }
                .kpi-sub {
                    font-size: 13px;
                    color: var(--text-muted);
                }

                .premium-table thead th {
                    background: var(--bg-surface);
                    color: var(--text-muted);
                    font-weight: 700;
                    font-size: 11px;
                    padding: 16px;
                    letter-spacing: 0.05em;
                }
                .premium-table tbody td {
                    padding: 16px;
                    vertical-align: top;
                }
                .td-danger { color: var(--danger); font-weight: 600; }
                .td-warning { color: var(--warning); font-weight: 600; }
            `}</style>
        </div>
    );
};

const StatCard = ({ title, value, sub, theme }) => (
    <div className={`kpi-card ${theme}`}>
        <div className="kpi-title">{title}</div>
        <div className="kpi-value">{value}</div>
        <div className="kpi-sub">{sub}</div>
    </div>
);

export default Analytics;
