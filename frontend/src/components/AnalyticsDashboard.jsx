import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const AnalyticsDashboard = ({ assets, assignments, users, categories }) => {
  const chartRefs = {
    status: useRef(null),
    employee: useRef(null),
    typeAssigned: useRef(null),
    typeAvailable: useRef(null),
    warranty: useRef(null),
    condition: useRef(null),
    location: useRef(null),
    overdue: useRef(null),
  };

  const chartsInstance = useRef({});

  // Helper: Get assigned user for an asset
  const getAssignedTo = (asset) => {
    const activeAssign = assignments.find(
      a => a.asset_id === asset.asset_id && a.status === "Active"
    );
    if (activeAssign) {
      const user = users.find(u => u.user_id === activeAssign.user_id);
      return user?.full_name || `Emp: ${activeAssign.user_id}`;
    }
    return "—";
  };

  // Helper: Check if assignment is active
  const assignmentIsActive = (a) => {
    return a.status === "Active" || a.status === "active";
  };

  // Helper: Convert string to date
  const toDate = (v) => {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  };

  // Helper: Get asset type
  const assetType = (a) => {
    const tag = (a.asset_tag || "").toUpperCase();
    const bm = ((a.brand || "") + " " + (a.model || "")).toUpperCase();
    if (tag.startsWith("LPT") || bm.includes("LAPTOP")) return "Laptop";
    if (tag.startsWith("DSK") || bm.includes("DESKTOP")) return "Desktop";
    if (tag.startsWith("MOU") || bm.includes("MOUSE")) return "Mouse";
    return "Other";
  };

  // Helper: Compute overdue assignments
  const computeOverdueAssignments = () => {
    const now = new Date();
    return assets.filter((a) => {
      if ((a.status || "").toLowerCase() !== "assigned") return false;
      const activeAssign = assignments.find(
        (x) => x.asset_id === a.asset_id && x.status === "Active"
      );
      if (!activeAssign) return false;
      const exp = toDate(activeAssign.expected_return_date || activeAssign.expectedReturnDate);
      return exp && exp < now;
    });
  };

  // Destroy existing chart instances
  const destroyCharts = () => {
    Object.values(chartsInstance.current).forEach(c => c && c.destroy());
    chartsInstance.current = {};
  };

  // Render all charts
  const renderCharts = () => {
    destroyCharts();

    const isDark = false;
    const tickColor = isDark ? "#cbd5e1" : "#475569";
    const gridColor = isDark ? "rgba(148,163,184,.18)" : "rgba(2,6,23,.10)";

    // --- Chart 1: Status Distribution (Pie)
    if (chartRefs.status.current) {
      const stCounts = {};
      assets.forEach(a => {
        const s = a.status || "Unknown";
        stCounts[s] = (stCounts[s] || 0) + 1;
      });
      
      chartsInstance.current.status = new Chart(chartRefs.status.current, {
        type: "doughnut",
        data: {
          labels: Object.keys(stCounts),
          datasets: [{
            data: Object.values(stCounts),
            backgroundColor: ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"]
          }]
        },
        options: {
          plugins: {
            legend: { position: "bottom", labels: { color: tickColor } },
            tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw}` } }
          }
        }
      });
    }

    // --- Chart 2: Assigned by Employee (Bar)
    if (chartRefs.employee.current) {
      const empCounts = {};
      assets.forEach(a => {
        if ((a.status || "").toLowerCase() !== "assigned") return;
        const who = getAssignedTo(a);
        empCounts[who] = (empCounts[who] || 0) + 1;
      });
      
      const sorted = Object.entries(empCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
      
      chartsInstance.current.employee = new Chart(chartRefs.employee.current, {
        type: "bar",
        data: {
          labels: sorted.map(x => x[0]),
          datasets: [{
            data: sorted.map(x => x[1]),
            backgroundColor: "#3b82f6"
          }]
        },
        options: {
          indexAxis: "y",
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx) => `Assigned: ${ctx.raw}` } }
          },
          scales: {
            x: { ticks: { color: tickColor }, grid: { color: gridColor }, beginAtZero: true },
            y: { ticks: { color: tickColor }, grid: { color: gridColor } }
          }
        }
      });
    }

    // --- Chart 3: Assigned by Type (Bar)
    if (chartRefs.typeAssigned.current) {
      const typeCount = {};
      assets.forEach(a => {
        if ((a.status || "").toLowerCase() !== "assigned") return;
        const t = assetType(a);
        typeCount[t] = (typeCount[t] || 0) + 1;
      });
      
      chartsInstance.current.typeAssigned = new Chart(chartRefs.typeAssigned.current, {
        type: "bar",
        data: {
          labels: Object.keys(typeCount),
          datasets: [{
            data: Object.values(typeCount),
            backgroundColor: "#3b82f6"
          }]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: tickColor }, grid: { color: gridColor } },
            y: { ticks: { color: tickColor }, grid: { color: gridColor }, beginAtZero: true }
          }
        }
      });
    }

    // --- Chart 4: Available by Type (Bar)
    if (chartRefs.typeAvailable.current) {
      const typeCount = {};
      assets.forEach(a => {
        if ((a.status || "").toLowerCase() !== "available") return;
        const t = assetType(a);
        typeCount[t] = (typeCount[t] || 0) + 1;
      });
      
      chartsInstance.current.typeAvailable = new Chart(chartRefs.typeAvailable.current, {
        type: "bar",
        data: {
          labels: Object.keys(typeCount),
          datasets: [{
            data: Object.values(typeCount),
            backgroundColor: "#3b82f6"
          }]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: tickColor }, grid: { color: gridColor } },
            y: { ticks: { color: tickColor }, grid: { color: gridColor }, beginAtZero: true }
          }
        }
      });
    }

    // --- Chart 5: Warranty Bucket (Bar)
    if (chartRefs.warranty.current) {
      const wb = { "Expired": 0, "0–30 days": 0, "31–90 days": 0, "90+ days": 0, "Unknown": 0 };
      const now = new Date();
      
      assets.forEach(a => {
        const w = a.warranty_expiry || null;
        const d = toDate(w);
        if (!d) { wb["Unknown"]++; return; }
        const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
        if (diff < 0) wb["Expired"]++;
        else if (diff <= 30) wb["0–30 days"]++;
        else if (diff <= 90) wb["31–90 days"]++;
        else wb["90+ days"]++;
      });
      
      chartsInstance.current.warranty = new Chart(chartRefs.warranty.current, {
        type: "bar",
        data: {
          labels: Object.keys(wb),
          datasets: [{
            data: Object.values(wb),
            backgroundColor: ["#ef4444", "#f59e0b", "#3b82f6", "#22c55e", "#9ca3b8"]
          }]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: tickColor }, grid: { color: gridColor } },
            y: { ticks: { color: tickColor }, grid: { color: gridColor }, beginAtZero: true }
          }
        }
      });
    }

    // --- Chart 6: Condition Distribution (Pie)
    if (chartRefs.condition.current) {
      const condCounts = {};
      assets.forEach(a => {
        const c = a.condition_status || "Unknown";
        condCounts[c] = (condCounts[c] || 0) + 1;
      });
      
      chartsInstance.current.condition = new Chart(chartRefs.condition.current, {
        type: "pie",
        data: {
          labels: Object.keys(condCounts),
          datasets: [{
            data: Object.values(condCounts),
            backgroundColor: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"]
          }]
        },
        options: {
          plugins: {
            legend: { position: "bottom", labels: { color: tickColor } }
          }
        }
      });
    }

    // --- Chart 7: Top Locations (Bar)
    if (chartRefs.location.current) {
      const locCounts = {};
      assets.forEach(a => {
        const loc = a.location || "Unknown";
        locCounts[loc] = (locCounts[loc] || 0) + 1;
      });
      
      const sorted = Object.entries(locCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
      
      chartsInstance.current.location = new Chart(chartRefs.location.current, {
        type: "bar",
        data: {
          labels: sorted.map(x => x[0]),
          datasets: [{
            data: sorted.map(x => x[1]),
            backgroundColor: "#3b82f6"
          }]
        },
        options: {
          indexAxis: "y",
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: tickColor }, grid: { color: gridColor }, beginAtZero: true },
            y: { ticks: { color: tickColor }, grid: { color: gridColor } }
          }
        }
      });
    }

    // --- Chart 8: Overdue by Employee (Bar)
    if (chartRefs.overdue.current) {
      const overdueList = computeOverdueAssignments();
      const overCounts = {};
      overdueList.forEach(o => {
        const who = getAssignedTo(o);
        overCounts[who] = (overCounts[who] || 0) + 1;
      });
      
      const sorted = Object.entries(overCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
      
      chartsInstance.current.overdue = new Chart(chartRefs.overdue.current, {
        type: "bar",
        data: {
          labels: sorted.map(x => x[0]),
          datasets: [{
            data: sorted.map(x => x[1]),
            backgroundColor: "#ef4444"
          }]
        },
        options: {
          indexAxis: "y",
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: tickColor }, grid: { color: gridColor }, beginAtZero: true },
            y: { ticks: { color: tickColor }, grid: { color: gridColor } }
          }
        }
      });
    }
  };

  useEffect(() => {
    renderCharts();
    return () => destroyCharts();
  }, [assets, assignments, users, categories]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginTop: "16px" }}>
      {/* Chart 1: Status Distribution */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "14px" }}>
        <h4 style={{ fontSize: "14px", fontWeight: "800", marginBottom: "10px" }}>Status Distribution</h4>
        <canvas ref={chartRefs.status} style={{ maxHeight: "260px" }}></canvas>
      </div>

      {/* Chart 2: Assigned by Employee */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "14px" }}>
        <h4 style={{ fontSize: "14px", fontWeight: "800", marginBottom: "10px" }}>Assigned by Employee</h4>
        <canvas ref={chartRefs.employee} style={{ maxHeight: "260px" }}></canvas>
      </div>

      {/* Chart 3: Assigned by Type */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "14px" }}>
        <h4 style={{ fontSize: "14px", fontWeight: "800", marginBottom: "10px" }}>Assigned by Asset Type</h4>
        <canvas ref={chartRefs.typeAssigned} style={{ maxHeight: "260px" }}></canvas>
      </div>

      {/* Chart 4: Available by Type */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "14px", gridColumn: "span 2" }}>
        <h4 style={{ fontSize: "14px", fontWeight: "800", marginBottom: "10px" }}>Available by Asset Type</h4>
        <canvas ref={chartRefs.typeAvailable} style={{ maxHeight: "260px" }}></canvas>
      </div>

      {/* Chart 5: Warranty Bucket */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "14px" }}>
        <h4 style={{ fontSize: "14px", fontWeight: "800", marginBottom: "10px" }}>Warranty Bucket</h4>
        <canvas ref={chartRefs.warranty} style={{ maxHeight: "260px" }}></canvas>
      </div>

      {/* Chart 6: Condition Distribution */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "14px" }}>
        <h4 style={{ fontSize: "14px", fontWeight: "800", marginBottom: "10px" }}>Condition Distribution</h4>
        <canvas ref={chartRefs.condition} style={{ maxHeight: "260px" }}></canvas>
      </div>

      {/* Chart 7: Top Locations */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "14px" }}>
        <h4 style={{ fontSize: "14px", fontWeight: "800", marginBottom: "10px" }}>Top Locations</h4>
        <canvas ref={chartRefs.location} style={{ maxHeight: "260px" }}></canvas>
      </div>

      {/* Chart 8: Overdue by Employee */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "14px" }}>
        <h4 style={{ fontSize: "14px", fontWeight: "800", marginBottom: "10px" }}>Overdue by Employee</h4>
        <canvas ref={chartRefs.overdue} style={{ maxHeight: "260px" }}></canvas>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
