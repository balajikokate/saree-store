import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Backend origin without the /api suffix — used to resolve relative image
// paths like "/images/products/..." into full, loadable URLs.
export const ASSET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Normalize errors so components can just read `error.message`
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || error.message || "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  }
);

export const productApi = {
  list: (params) => api.get("/products", { params }),
  getBySlug: (slug) => api.get(`/products/${slug}`),
  categories: () => api.get("/categories"),
  home: (params) => api.get("/home", { params }),
};

export const orderApi = {
  checkout: (payload) => api.post("/orders/checkout", payload),
  verifyPayment: (payload) => api.post("/orders/verify-payment", payload),
  getByNumber: (orderNumber) => api.get(`/orders/${orderNumber}`),
};

export default api;
