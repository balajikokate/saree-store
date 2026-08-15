import axios from "axios";
import { ASSET_BASE_URL } from "./api";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const adminApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  // REQUIRED for the httpOnly admin session cookie to be sent/received on
  // cross-origin requests (frontend and backend live on different domains
  // in production — e.g. vercel.app talking to onrender.com).
  withCredentials: true,
});

adminApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes("/admin/login")) {
      window.location.href = "/admin/login";
    }
    const message = error.response?.data?.message || error.message || "Something went wrong.";
    return Promise.reject(new Error(message));
  }
);

export const authApi = {
  login: (email, password) => adminApi.post("/admin/login", { email, password }),
  logout: () => adminApi.post("/admin/logout"),
  me: () => adminApi.get("/admin/me"),
};

export const adminProductApi = {
  list: (params) => adminApi.get("/admin/products", { params }),
  get: (id) => adminApi.get(`/admin/products/${id}`),
  create: (data) => adminApi.post("/admin/products", data),
  update: (id, data) => adminApi.put(`/admin/products/${id}`, data),
  remove: (id) => adminApi.delete(`/admin/products/${id}`),
  uploadImage: (file, category, filenamePrefix) => {
    const form = new FormData();
    // IMPORTANT: category (and filenamePrefix) must be appended BEFORE the
    // file. Multer's diskStorage destination/filename callbacks read
    // req.body while streaming the multipart body — fields that arrive
    // after the file are not yet parsed when those callbacks run.
    form.append("category", category);
    if (filenamePrefix) form.append("filenamePrefix", filenamePrefix);
    form.append("image", file);
    return adminApi.post("/admin/upload-image", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const adminCategoryApi = {
  list: () => adminApi.get("/admin/categories"),
  create: (name) => adminApi.post("/admin/categories", { name }),
};

export const adminOrderApi = {
  list: (params) => adminApi.get("/admin/orders", { params }),
  get: (id) => adminApi.get(`/admin/orders/${id}`),
  updateStatus: (id, status) => adminApi.patch(`/admin/orders/${id}/status`, { status }),
};

export const adminStatsApi = {
  get: () => adminApi.get("/admin/stats"),
};

export { ASSET_BASE_URL };
export default adminApi;
