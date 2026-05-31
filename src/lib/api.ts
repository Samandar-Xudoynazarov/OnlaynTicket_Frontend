import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  register: (data: { firstName: string; lastName: string; email: string; phone?: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
};

// Events (public)
export const eventsApi = {
  list: (params?: { category?: string; region?: string; isFree?: string; q?: string; page?: number; limit?: number }) =>
    api.get("/events", { params }),
  get: (id: string) => api.get(`/events/${id}`),
};

// Orders
export const ordersApi = {
  create: (data: { eventId: string; items: { zoneId: string; qty: number }[] }) =>
    api.post("/orders", data),
  mockPayment: (data: { orderId: string; status: "paid" | "failed" }) =>
    api.post("/payments/mock", data),
};

// My tickets
export const myApi = {
  tickets: () => api.get("/my/tickets"),
  ticketDetail: (ticketId: string) => api.get(`/my/tickets/${ticketId}`),
  notifications: () => api.get("/my/notifications"),
  markRead: (id: string) => api.post(`/my/notifications/${id}/read`),
  updateProfile: (data: { firstName?: string; lastName?: string; phone?: string }) =>
    api.put("/my/profile", data),
};

// Organizer
export const organizerApi = {
  createEvent: (formData: FormData) =>
    api.post("/organizer/events", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  updateEvent: (id: string, formData: FormData) =>
    api.put(`/organizer/events/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  myEvents: () => api.get("/organizer/events"),
  getEvent: (id: string) => api.get(`/organizer/events/${id}`),
  getStats: (id: string) => api.get(`/organizer/events/${id}/stats`),
};

// Admin
export const adminApi = {
  stats: () => api.get("/admin/stats"),
  pendingEvents: () => api.get("/admin/events/pending"),
  approveEvent: (id: string) => api.post(`/admin/events/${id}/approve`),
  rejectEvent: (id: string, reason: string) => api.post(`/admin/events/${id}/reject`, { reason }),
  approvedReport: () => api.get("/admin/events/approved-report"),
  makeOrganizer: (userId: string) => api.post(`/admin/users/${userId}/make-organizer`),
  listUsers: (params?: { page?: number; limit?: number; role?: string; q?: string }) =>
    api.get("/admin/users", { params }),
};

// Ads
export const adsApi = {
  listPublic: () => api.get("/ads"),
  listAdmin: () => api.get("/ads/admin/list"),
  create: (formData: FormData) =>
    api.post("/ads/admin", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  delete: (id: string) => api.delete(`/ads/admin/${id}`),
};

export default api;