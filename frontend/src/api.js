import { getAuthToken } from './utils';

export const API_BASE_URL = "http://127.0.0.1:8000/api";
export const BASE_URL = "http://127.0.0.1:8000";

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

    // If body is FormData, let the browser set the boundary and content-type
    if (options.body instanceof FormData) {
        delete headers["Content-Type"];
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    // ... rest of the function remains same
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            data = { detail: `Server returned invalid JSON: ${await response.text()}` };
        }

        if (!response.ok) {
            if (response.status === 401) {
                console.warn("Unauthorized! Clearing session and redirecting to login...");
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                if (window.location.pathname !== "/") {
                    window.location.href = "/";
                }
            }
            const errorMessage = data.message || data.detail || `HTTP ${response.status}: ${response.statusText}`;
            console.error(`API Error [${response.status}] ${endpoint}:`, data);
            throw new Error(errorMessage);
        }

        return data;
    } catch (fetchError) {
        if (fetchError.message === "Unauthorized: Invalid or expired token" || fetchError.message === "Token is invalid or expired") {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/";
        }
        console.error(`Fetch Error ${endpoint}:`, fetchError);
        if (fetchError instanceof TypeError && fetchError.message === 'Failed to fetch') {
            throw new Error(`Cannot connect to server at ${API_BASE_URL}. Make sure the backend is running on port 8000.`);
        }
        throw fetchError;
    }
};

// Auth
export const login = (credentials) => apiFetch("/auth/login", { method: "POST", body: JSON.stringify(credentials) });
export const register = (userData) => apiFetch("/auth/register", { method: "POST", body: JSON.stringify(userData) });
export const getUsers = () => apiFetch("/auth/users");
export const searchUsers = (query) => apiFetch(`/auth/users/search?q=${encodeURIComponent(query)}`);
export const getUser = (userId) => apiFetch(`/auth/users/${userId}`);
export const updateUser = (userId, userData) => apiFetch(`/auth/users/${userId}`, { method: "PUT", body: JSON.stringify(userData) });

// Categories
export const getCategories = () => apiFetch("/categories/");
export const createCategory = (categoryData) => apiFetch("/categories/", { method: "POST", body: JSON.stringify(categoryData) });

// Assets
export const getAssets = () => apiFetch("/assets/");
export const getAsset = (id) => apiFetch(`/assets/${id}`);
export const createAsset = (assetData) => {
    const { _invoiceFile, ...cleanData } = assetData;
    if (_invoiceFile) {
        const formData = new FormData();
        formData.append("asset_json", JSON.stringify(cleanData));
        formData.append("invoice", _invoiceFile);
        return apiFetch("/assets/", { method: "POST", body: formData });
    }
    const formData = new FormData();
    formData.append("asset_json", JSON.stringify(cleanData));
    return apiFetch("/assets/", { method: "POST", body: formData });
};
export const updateAsset = (id, assetData) => {
    const { _invoiceFile, ...cleanData } = assetData;
    if (_invoiceFile) {
        const formData = new FormData();
        formData.append("asset_json", JSON.stringify(cleanData));
        formData.append("invoice", _invoiceFile);
        return apiFetch(`/assets/${id}`, { method: "PUT", body: formData });
    }
    const formData = new FormData();
    formData.append("asset_json", JSON.stringify(cleanData));
    return apiFetch(`/assets/${id}`, { method: "PUT", body: formData });
};
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

export const getAssetHistory = (assetId) => apiFetch(`/maintenance/history/asset/${assetId}`);
