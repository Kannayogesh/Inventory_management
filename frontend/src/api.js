import { getAuthToken } from './utils';

export const API_BASE_URL = "http://localhost:8000/api";

export const setAuthToken = (token) => {
    if (token) {
        localStorage.setItem("token", token);
    } else {
        localStorage.removeItem("token");
    }
};

export const apiFetch = async (endpoint, options = {}) => {
    const token = getAuthToken();
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || data.detail || "Something went wrong");
    }

    return data;
};

// Auth
export const login = (credentials) => apiFetch("/auth/login", { method: "POST", body: JSON.stringify(credentials) });
export const register = (userData) => apiFetch("/auth/register", { method: "POST", body: JSON.stringify(userData) });

// Categories
export const getCategories = () => apiFetch("/categories/");

// Assets
export const getAssets = () => apiFetch("/assets/");
export const getAsset = (id) => apiFetch(`/assets/${id}`);
export const createAsset = (assetData) => apiFetch("/assets/", { method: "POST", body: JSON.stringify(assetData) });
export const updateAsset = (id, assetData) => apiFetch(`/assets/${id}`, { method: "PUT", body: JSON.stringify(assetData) });
export const deleteAsset = (id) => apiFetch(`/assets/${id}`, { method: "DELETE" });

// Assignments
export const getAssignments = () => apiFetch("/assignments/");
export const createAssignment = (data) => apiFetch("/assignments/", { method: "POST", body: JSON.stringify(data) });
export const updateAssignment = (id, data) => apiFetch(`/assignments/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const sendAssignmentReminder = (id) => apiFetch(`/assignments/${id}/remind`, { method: "POST" });
export const returnAssignment = (id, data) => apiFetch(`/assignments/${id}/return`, { method: "POST", body: JSON.stringify(data) });

// Maintenance
export const getMaintenanceRequests = () => apiFetch("/maintenance/");
export const createMaintenanceRequest = (data) => apiFetch("/maintenance/", { method: "POST", body: JSON.stringify(data) });
export const updateMaintenanceRequest = (id, data) => apiFetch(`/maintenance/${id}`, { method: "PUT", body: JSON.stringify(data) });

// Procurement
export const getProcurementRequests = () => apiFetch("/procurement/");
export const createProcurementRequest = (data) => apiFetch("/procurement/", { method: "POST", body: JSON.stringify(data) });
export const updateProcurementRequest = (id, data) => apiFetch(`/procurement/${id}`, { method: "PUT", body: JSON.stringify(data) });
