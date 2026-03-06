import { createContext, useState, useEffect } from "react";
import { apiFetch, setAuthToken } from "../api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setUser(response.user);
      setAuthToken(response.access_token);
      localStorage.setItem("user", JSON.stringify(response.user));
      return { success: true, role: response.user.role };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const register = async (employeeCode, name, email, password, role, phone = null, designation = null, department = null, location = null, joining_date = null) => {
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          employee_code: employeeCode,
          full_name: name,
          email,
          password,
          role,
          phone,
          designation,
          department,
          location,
          joining_date,
        }),
      });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
