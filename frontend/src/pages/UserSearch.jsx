import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { getUsers, searchUsers, updateUser } from "../api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const statusBadge = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "active") return <span className="badge badge-success">{status}</span>;
  if (s === "resigned") return <span className="badge badge-muted">{status}</span>;
  if (s === "suspended") return <span className="badge badge-danger">{status}</span>;
  return <span className="badge badge-muted">{status}</span>;
};

const roleBadge = (role) => {
  if (role === "Admin") return <span className="badge badge-danger">{role}</span>;
  if (role === "Asset Manager") return <span className="badge badge-warning">{role}</span>;
  return <span className="badge badge-info">{role}</span>;
};

const UserSearch = () => {
  const { user } = useContext(AuthContext);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        setLoading(true);
        const data = await getUsers();
        setUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllUsers();
  }, []);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearch(query);
    setHasSearched(true);

    if (!query.trim()) {
      setFilteredUsers([]);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      const data = await searchUsers(query);
      setFilteredUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Search error:", error);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (selectedUser) => {
    setEditingUser(selectedUser);
    setEditForm({
      full_name: selectedUser.full_name || "",
      email: selectedUser.email || "",
      phone: selectedUser.phone || "",
      role: selectedUser.role || "Employee",
      designation: selectedUser.designation || "",
      department: selectedUser.department || "",
      location: selectedUser.location || "",
      status: selectedUser.status || "Active",
    });
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      setEditLoading(true);
      const updated = await updateUser(editingUser.user_id, editForm);

      // Update the users list
      const updatedUsers = users.map(u => u.user_id === editingUser.user_id ? updated : u);
      setUsers(updatedUsers);

      // Update filtered users if searching
      if (filteredUsers.length > 0) {
        const updatedFiltered = filteredUsers.map(u => u.user_id === editingUser.user_id ? updated : u);
        setFilteredUsers(updatedFiltered);
      }

      setEditingUser(null);
      setEditForm({});
      alert("User updated successfully!");
    } catch (error) {
      console.error("Update error:", error);
      alert(error.message || "Failed to update user");
    } finally {
      setEditLoading(false);
    }
  };

  const displayUsers = search.trim() && hasSearched ? filteredUsers : users;

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to permanently remove this user? This cannot be undone.")) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api"}/auth/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed to delete user");

      setUsers(prev => prev.filter(u => u.user_id !== userId));
      setFilteredUsers(prev => prev.filter(u => u.user_id !== userId));
      alert("User deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      alert(error.message);
    }
  };

  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-body">
        <Sidebar />
        <main className="page-content">
          {/* Header */}
          <div className="page-header">
            <div className="page-header-left">
              <div className="page-eyebrow">Management</div>
              <h2>User Directory</h2>
              <p style={{ marginTop: "3px", fontSize: "13.5px" }}>
                Search and manage user accounts
              </p>
            </div>
          </div>

          {/* Search Section */}
          <div className="section">
            <div className="section-header">
              <h3 className="section-title">Search Users</h3>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <div className="search-input" style={{ maxWidth: "400px" }}>
                <span className="search-icon">🔍</span>
                <input
                  placeholder="Search by Name, Email, or Employee ID…"
                  value={search}
                  onChange={handleSearch}
                  autoFocus
                />
              </div>
              <div className="td-muted" style={{ marginTop: "8px", fontSize: "12px" }}>
                {search.trim()
                  ? `Found ${filteredUsers.length} user${filteredUsers.length !== 1 ? 's' : ''}`
                  : `Showing all ${users.length} user${users.length !== 1 ? 's' : ''}`
                }
              </div>
            </div>

            {/* Users Table */}
            <div className="table-container">
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Employee ID</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayUsers.map(u => (
                      <tr key={u.user_id}>
                        <td className="td-bold">{u.full_name}</td>
                        <td className="td-mono" style={{ fontSize: "12px" }}>{u.employee_code}</td>
                        <td className="td-muted">{u.email}</td>
                        <td>{roleBadge(u.role)}</td>
                        <td className="td-muted">{u.department || "—"}</td>
                        <td>{statusBadge(u.status)}</td>
                        <td>
                          <div className="action-btn-group" style={{ display: "flex", gap: "8px" }}>
                            {user && user.role === "Admin" && (
                              <>
                                <button
                                  onClick={() => handleEditClick(u)}
                                  className="btn btn-sm"
                                  style={{
                                    padding: "4px 10px",
                                    fontSize: "12px",
                                    backgroundColor: "var(--accent)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.user_id)}
                                  className="btn btn-sm"
                                  style={{
                                    padding: "4px 10px",
                                    fontSize: "12px",
                                    backgroundColor: "var(--danger)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                  }}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>

                      </tr>
                    ))}
                    {displayUsers.length === 0 && !loading && (
                      <tr>
                        <td colSpan="7">
                          <div className="empty-state">
                            <div className="empty-icon">👥</div>
                            <p>{search.trim() ? "No users found" : "No users available"}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {loading && (
                <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
                  <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit User: {editingUser.full_name}</h3>
              <button className="modal-close" onClick={() => setEditingUser(null)}>✕</button>
            </div>

            <div className="modal-body" style={{ maxHeight: "600px", overflowY: "auto" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.full_name}
                      onChange={(e) => handleEditChange("full_name", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={editForm.email}
                      onChange={(e) => handleEditChange("email", e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select
                      className="form-select"
                      value={editForm.role}
                      onChange={(e) => handleEditChange("role", e.target.value)}
                    >
                      <option value="Employee">Employee</option>
                      <option value="Asset Manager">Asset Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={editForm.status}
                      onChange={(e) => handleEditChange("status", e.target.value)}
                    >
                      <option value="Active">Active</option>
                      <option value="Resigned">Resigned</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={editForm.phone}
                      onChange={(e) => handleEditChange("phone", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.department}
                      onChange={(e) => handleEditChange("department", e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Designation</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.designation}
                      onChange={(e) => handleEditChange("designation", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.location}
                      onChange={(e) => handleEditChange("location", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setEditingUser(null)}
                disabled={editLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveEdit}
                disabled={editLoading}
              >
                {editLoading ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSearch;
