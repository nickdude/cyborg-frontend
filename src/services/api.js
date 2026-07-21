import axios from "axios";
import Cookie from "js-cookie";
import { cachedQuery } from "./queryCache";

if (
  typeof process !== "undefined" &&
  process.env.NODE_ENV === "production" &&
  !process.env.NEXT_PUBLIC_API_URL
) {
  throw new Error("NEXT_PUBLIC_API_URL must be set in production builds");
}

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001",
  // Without a timeout a stalled backend request hangs the UI forever. 30s is
  // generous for the slower AI/report endpoints while still bounding failures.
  timeout: 30000,
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = Cookie.get("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-otp",
  // Marketplace is browsable logged-out (industry-standard catalog UX);
  // auth is enforced at the cart/checkout actions instead.
  "/market-place",
];

API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      Cookie.remove("authToken");
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
        const path = window.location.pathname;
        const onPublicRoute =
          path === "/" ||
          PUBLIC_ROUTES.some((r) => path === r || path.startsWith(`${r}/`));
        if (!onPublicRoute) {
          window.location.href = "/login";
        }
      }
    }
    // Preserve the HTTP status + original response on the thrown error. Pages
    // branch on `err.statusCode === 404` / `err.response?.data?.message`; without
    // this those branches were dead (the flattened Error dropped them), so real
    // failures fell through to misleading "no data" empty states.
    const msg = error.response?.data?.message || error.message || "Request failed";
    const err = new Error(msg);
    err.status = error.response?.status;
    err.statusCode = error.response?.status;
    err.response = error.response;
    err.code = error.code; // e.g. "ECONNABORTED" on timeout
    throw err;
  }
);

// Auth endpoints (prefix with /api to match backend)
export const authAPI = {
  register: (data) => API.post("/api/auth/register", data),
  verifyOTP: (data) => API.post("/api/auth/verify-otp", data),
  login: (data) => API.post("/api/auth/login", data),
  verifyLoginOTP: (data) => API.post("/api/auth/verify-login-otp", data),
  forgotPassword: (data) => API.post("/api/auth/forgot-password", data),
  resetPassword: (data) => API.post("/api/auth/reset-password", data),
  resendOTP: (data) => API.post("/api/auth/resend-otp", data),
  socialLogin: (data) => API.post("/api/auth/social-login", data),
};

// Marketplace product endpoints
export const productAPI = {
  // params: { type, section, category, q, onSale, page, limit }
  getProducts: (params = {}) => API.get("/api/products", { params }),
  getProduct: (id) => API.get(`/api/products/${id}`),
  createProduct: (data) => API.post("/api/products", data),
  updateProduct: (id, data) => API.put(`/api/products/${id}`, data),
  deleteProduct: (id) => API.delete(`/api/products/${id}`),
};

// Delivery address endpoints
export const addressAPI = {
  list: () => API.get("/api/addresses"),
  create: (data) => API.post("/api/addresses", data),
  update: (id, data) => API.put(`/api/addresses/${id}`, data),
  setDefault: (id) => API.patch(`/api/addresses/${id}/default`),
  remove: (id) => API.delete(`/api/addresses/${id}`),
};

// Shopping cart endpoints
export const cartAPI = {
  get: () => API.get("/api/cart"),
  addItem: (productId, quantity = 1) => API.post("/api/cart/items", { productId, quantity }),
  updateItem: (productId, quantity) => API.put(`/api/cart/items/${productId}`, { quantity }),
  removeItem: (productId) => API.delete(`/api/cart/items/${productId}`),
  clear: () => API.delete("/api/cart"),
};

// Checkout endpoints
export const checkoutAPI = {
  // data: { addressId, paymentMethod: "online" | "cod" }
  create: (data) => API.post("/api/checkout", data),
  verify: (data) => API.post("/api/checkout/verify", data),
  retry: (orderId) => API.post(`/api/checkout/${orderId}/retry`),
};

// Order endpoints
export const orderAPI = {
  list: () => API.get("/api/orders"),
  get: (id) => API.get(`/api/orders/${id}`),
  tracking: (id) => API.get(`/api/orders/${id}/tracking`),
  cancel: (id, reason) => API.post(`/api/orders/${id}/cancel`, { reason }),
  updateStatus: (id, status, note) => API.patch(`/api/orders/${id}/status`, { status, note }),
};

// Unified purchase history (plans + product orders)
export const purchaseHistoryAPI = {
  get: () => API.get("/api/purchase-history"),
};

// User endpoints (prefix with /api to match backend)
export const userAPI = {
  getProfile: (userId) => API.get(`/api/users/${userId}/profile`),
  updateProfile: (userId, data) => API.put(`/api/users/${userId}/profile`, data),
  linkDoctor: (referralCode) => API.post(`/api/users/link-doctor`, { referralCode }),
  getOnboarding: (userId) => API.get(`/api/users/${userId}/onboarding`),
  saveOnboarding: (userId, data) => API.post(`/api/users/${userId}/onboarding`, data),
  getHearAboutUs: (userId) => API.get(`/api/users/${userId}/hear-about-us`),
  saveHearAboutUs: (userId, data) => API.post(`/api/users/${userId}/hear-about-us`, data),
  markWelcomeSeen: (userId) => API.post(`/api/users/${userId}/welcome-seen`),
  uploadBloodReport: (userId, formData, { onUploadProgress } = {}) =>
    API.post(`/api/users/${userId}/blood-reports`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 180000,
      onUploadProgress,
    }),
  getBloodReports: (userId) => API.get(`/api/users/${userId}/blood-reports`),
  getBloodReport: (reportId) => API.get(`/api/users/blood-reports/${reportId}`),
  getBloodReportFile: (reportId) =>
    API.get(`/api/users/blood-reports/${reportId}/file`, {
      responseType: "blob",
    }),
  deleteBloodReport: (userId, reportId) =>
    API.delete(`/api/users/${userId}/blood-reports/${reportId}`),
};

// Action Plan endpoints (new async flow)
export const actionPlanAPI = {
  create: (reportId) => API.post("/api/action-plans", { reportId }),
  get: (planId) => API.get(`/api/action-plans/${planId}`),
  getLatest: () => API.get("/api/action-plans/latest"),
  retry: (planId) => API.post(`/api/action-plans/${planId}/retry`),
  exportPDF: (planId) => API.get(`/api/action-plans/${planId}/pdf`, {
    responseType: "blob",
  }),
  getAdherence: (date) => API.get(`/api/action-plans/adherence${date ? `?date=${date}` : ""}`),
  toggleAdherence: (itemKey, date) => API.post(`/api/action-plans/adherence/toggle`, { itemKey, date }),
};

// Goals endpoints
export const goalsAPI = {
  list: () => API.get("/api/goals"),
  get: (goalId) => API.get(`/api/goals/${goalId}`),
};

// Biomarker endpoints (individual biomarker data)
export const biomarkerAPI = {
  timeline: (canonicalName) => API.get(`/api/users/blood-reports/timeline/${encodeURIComponent(canonicalName)}`),
  // Cached + deduped: the panel is the heaviest read and 3 screens (dashboard,
  // data, biological-age) fetch it independently. 20s stale-window is safe for a
  // computed aggregate and makes back-navigation instant.
  panel: () =>
    cachedQuery("biomarker-panel", () => API.get("/api/users/blood-reports/biomarker-panel")),
  list: () => API.get("/api/users/blood-reports/biomarkers"),
  trends: () =>
    cachedQuery("biomarker-trends", () => API.get("/api/users/blood-reports/trends")),
  // Fast one-shot AI summary for a category card (no tools/thinking).
  categorySummary: (data) => API.post("/api/users/blood-reports/category-summary", data),
};

// Meal endpoints (all user-scoped; backend routes under /api/users/:userId/meals)
export const mealAPI = {
  analyze: (userId, formData) =>
    API.post(`/api/users/${userId}/meals/analyze`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  commit: (userId, body) =>
    API.post(`/api/users/${userId}/meals`, body),
  list: (userId, date) =>
    API.get(`/api/users/${userId}/meals`, { params: { date } }),
  history: (userId, days = 14) =>
    API.get(`/api/users/${userId}/meals/history`, { params: { days } }),
  summary: (userId, date) =>
    API.get(`/api/users/${userId}/meals/summary`, { params: { date } }),
  recentItems: (userId, limit = 20) =>
    API.get(`/api/users/${userId}/meals/recent-items`, { params: { limit } }),
  get: (userId, mealId) =>
    API.get(`/api/users/${userId}/meals/${mealId}`),
  update: (userId, mealId, body) =>
    API.patch(`/api/users/${userId}/meals/${mealId}`, body),
  delete: (userId, mealId) =>
    API.delete(`/api/users/${userId}/meals/${mealId}`),
  insights: (userId, mealId) =>
    API.get(`/api/users/${userId}/meals/${mealId}/insights`),
  // Deterministic engine score for an unsaved draft basket (no persistence).
  scorePreview: (userId, body) =>
    API.post(`/api/users/${userId}/meals/score-preview`, body),
};

// Notification endpoints
export const notificationAPI = {
  list: () => API.get("/api/notifications"),
  markRead: (notificationId) => API.patch(`/api/notifications/${notificationId}/read`),
  markAllRead: () => API.patch("/api/notifications/read-all"),
};

// Payment endpoints
export const paymentAPI = {
  getAllPlans: () => API.get("/api/payments/plans"),
  createOrder: (data) => API.post("/api/payments/create-order", data),
  verifyPayment: (data) => API.post("/api/payments/verify-payment", data),
  activateFreePlan: (data) => API.post("/api/payments/activate-free", data),
  // Cached 60s + deduped: LayoutWrapper fetches this on every hard page load to
  // gate free members; the plan rarely changes mid-session.
  getUserSubscription: (userId) =>
    cachedQuery(`subscription:${userId}`, () => API.get(`/api/payments/${userId}/subscription`), 60000),
};

// Questionnaire endpoints
export const questionnaireAPI = {
  get: () => API.get("/api/questionnaire"),
  update: (data) => API.put("/api/questionnaire", data),
};

export { streamMessage } from "./sse";

export const conciergeAPI = {
  listChats: () => API.get("/api/chats"),
  createChat: () => API.post("/api/chats"),
  getChat: (chatId) => API.get(`/api/chats/${chatId}`),
  updateTitle: (chatId, title) => API.patch(`/api/chats/${chatId}`, { title }),
  deleteChat: (chatId) => API.delete(`/api/chats/${chatId}`),
};

export const doctorAPI = {
  listChats: (patientId) =>
    API.get(`/api/doctor/chats${patientId ? `?patientId=${patientId}` : ""}`),
  createChat: (patientId) => API.post("/api/doctor/chats", { patientId }),
  getChat: (chatId) => API.get(`/api/doctor/chats/${chatId}`),
  updateTitle: (chatId, title) =>
    API.patch(`/api/doctor/chats/${chatId}`, { title }),
  deleteChat: (chatId) => API.delete(`/api/doctor/chats/${chatId}`),
  getPatientActionPlan: (patientId) =>
    API.get(`/api/doctor/patients/${patientId}/action-plan`),
  updatePatientGoals: (patientId, goals) =>
    API.put(`/api/doctor/patients/${patientId}/goals`, { goals }),
  addGoal: (patientId, goalData) =>
    API.post(`/api/doctor/patients/${patientId}/goals`, goalData),
  deleteGoal: (patientId, goalId) =>
    API.delete(`/api/doctor/patients/${patientId}/goals/${goalId}`),
  approveActionPlan: (patientId) =>
    API.post(`/api/doctor/patients/${patientId}/action-plan/approve`),
};

// Activity endpoints (all user-scoped)
export const activityAPI = {
  catalog: (userId, q = "") =>
    API.get(`/api/users/${userId}/activities/catalog`, { params: { q } }),
  create: (userId, body) =>
    API.post(`/api/users/${userId}/activities`, body),
  list: (userId, date) =>
    API.get(`/api/users/${userId}/activities`, { params: { date } }),
  get: (userId, activityId) =>
    API.get(`/api/users/${userId}/activities/${activityId}`),
  // AI post-workout recovery analysis (cached server-side; pass
  // { refresh: true } to force a regeneration).
  recovery: (userId, activityId, { refresh } = {}) =>
    API.get(`/api/users/${userId}/activities/${activityId}/recovery`, {
      params: refresh ? { refresh: 1 } : {},
    }),
  update: (userId, activityId, body) =>
    API.patch(`/api/users/${userId}/activities/${activityId}`, body),
  delete: (userId, activityId) =>
    API.delete(`/api/users/${userId}/activities/${activityId}`),
};

// Timeline endpoint (aggregated feed of meals + activities)
export const timelineAPI = {
  get: (userId, date) =>
    API.get(`/api/users/${userId}/timeline`, { params: { date } }),
};

// Food Score endpoints
export const foodScoreAPI = {
  get: (userId, mealId) =>
    API.get(`/api/users/${userId}/meals/${mealId}/score`),
  compute: (userId, mealId) =>
    API.post(`/api/users/${userId}/meals/${mealId}/score/compute`),
  listByDate: (userId, date) =>
    API.get(`/api/users/${userId}/meals/scores`, { params: { date } }),
};

// Glucose intelligence endpoints
export const glucoseAPI = {
  dayReview: (userId, date) =>
    API.get(`/api/users/${userId}/glucose/day-review`, { params: { date } }),
  predictions: (userId, date) =>
    API.get(`/api/users/${userId}/glucose/predictions`, { params: { date } }),
};

// Food Search endpoints
export const foodSearchAPI = {
  search: (userId, q) =>
    API.get(`/api/users/${userId}/foods/search`, { params: { q } }),
  // Deterministic single-item insight: engine score + GI + community stats.
  itemInsight: (userId, payload) =>
    API.post(`/api/users/${userId}/foods/insight`, payload),
};

export default API;
