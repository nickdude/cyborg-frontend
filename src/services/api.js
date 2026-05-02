import axios from "axios";
import Cookie from "js-cookie";

if (
  typeof process !== "undefined" &&
  process.env.NODE_ENV === "production" &&
  !process.env.NEXT_PUBLIC_API_URL
) {
  throw new Error("NEXT_PUBLIC_API_URL must be set in production builds");
}

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001",
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
    const msg = error.response?.data?.message || error.message || "Request failed";
    throw new Error(msg);
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

// User endpoints (prefix with /api to match backend)
export const userAPI = {
  getProfile: (userId) => API.get(`/api/users/${userId}/profile`),
  updateProfile: (userId, data) => API.put(`/api/users/${userId}/profile`, data),
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
};

// Goals endpoints
export const goalsAPI = {
  list: () => API.get("/api/goals"),
  get: (goalId) => API.get(`/api/goals/${goalId}`),
};

// Biomarker endpoints (individual biomarker data)
export const biomarkerAPI = {
  timeline: (canonicalName) => API.get(`/api/users/blood-reports/timeline/${encodeURIComponent(canonicalName)}`),
  panel: () => API.get("/api/users/blood-reports/biomarker-panel"),
  list: () => API.get("/api/users/blood-reports/biomarkers"),
  trends: () => API.get("/api/users/blood-reports/trends"),
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
  get: (userId, mealId) =>
    API.get(`/api/users/${userId}/meals/${mealId}`),
  update: (userId, mealId, body) =>
    API.patch(`/api/users/${userId}/meals/${mealId}`, body),
  delete: (userId, mealId) =>
    API.delete(`/api/users/${userId}/meals/${mealId}`),
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
  getUserSubscription: (userId) => API.get(`/api/payments/${userId}/subscription`),
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

export default API;
