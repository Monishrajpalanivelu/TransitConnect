import axios from "axios";

// This checks for the Netlify variable, otherwise defaults to Railway
const BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://transitconnect-production.up.railway.app";
const API_URL = `${BASE_URL}/auth`;

export const login = async (username, password) => {
      try {
            // Now it will hit https://transitconnect-production.up.railway.app/auth/login
            const response = await axios.post(`${API_URL}/login`, {
                  username,
                  password,
            });
            if (response.data.token) {
                  localStorage.setItem("token", response.data.token);
                  localStorage.setItem("role", response.data.role);
            }
            return response.data;
      } catch (error) {
            throw error;
      }
};

export const register = async (username, email, password) => {
      try {
            const response = await axios.post(`${API_URL}/register`, {
                  username,
                  email,
                  password,
            });
            return response.data;
      } catch (error) {
            throw error;
      }
};
// ... rest of your code
