import axios from "axios";

const localApiUrl =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:5000`
    : "http://localhost:5000";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || localApiUrl
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getApiError(error) {
  return error?.response?.data?.message || "Something went wrong. Please try again.";
}
