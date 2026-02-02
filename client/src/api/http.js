import axios from "axios";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:5000",
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("cinevault_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
