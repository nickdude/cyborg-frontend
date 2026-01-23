import axios from "axios";
import Cookie from "js-cookie";

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

// Handle responses
API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      Cookie.remove("authToken");
      window.location.href = "/login";
    }
    throw error.response?.data || error;
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
  uploadBloodReport: (userId, formData) =>
    API.post(`/api/users/${userId}/blood-reports`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getBloodReports: (userId) => API.get(`/api/users/${userId}/blood-reports`),
  deleteBloodReport: (userId, reportId) =>
    API.delete(`/api/users/${userId}/blood-reports/${reportId}`),
};

// Action Plan endpoints (new async flow)
export const actionPlanAPI = {
  create: (reportId) => API.post("/api/action-plans", { reportId }),
  get: (planId) => API.get(`/api/action-plans/${planId}`),
  retry: (planId) => API.post(`/api/action-plans/${planId}/retry`),
  exportPDF: (planId) => API.get(`/api/action-plans/${planId}/pdf`, {
    responseType: "blob",
  }),
};

// Notification endpoints
export const notificationAPI = {
  list: () => API.get("/api/notifications"),
  markRead: (notificationId) => API.patch(`/api/notifications/${notificationId}/read`),
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

export default API;
