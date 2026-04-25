"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Cookie from "js-cookie";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Bell,
  LogOut,
  Settings,
  UserCircle,
  X,
  UserPlus,
  FileCheck,
  ClipboardList,
  CheckCircle,
  AlertTriangle,
  Upload,
} from "lucide-react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

function getNotificationDisplay(notification) {
  switch (notification.type) {
    case "patient:registered":
      return {
        title: "New Patient Registered",
        message: `${notification.metadata?.patientName || "A patient"} joined via your referral code.`,
        Icon: UserPlus,
      };
    case "upload:success":
      return {
        title: "Report Uploaded",
        message: "A report has been uploaded and is being analyzed.",
        Icon: Upload,
      };
    case "report:ready":
      return {
        title: "Report Ready",
        message: "A blood report has been processed.",
        Icon: CheckCircle,
      };
    case "report:failed":
      return {
        title: "Report Failed",
        message: "A report could not be processed.",
        Icon: AlertTriangle,
      };
    case "analysis:ready":
      return {
        title: "Analysis Complete",
        message: "Blood report analysis is complete.",
        Icon: FileCheck,
      };
    case "action_plan_ready":
    case "actionPlan:ready":
      return {
        title: "Action Plan Ready",
        message: "A personalized action plan has been generated.",
        Icon: ClipboardList,
      };
    default:
      return {
        title: "Notification",
        message: "You have a new notification.",
        Icon: Bell,
      };
  }
}

export default function HeaderActions() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    const token = Cookie.get("authToken");
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (notificationOpen) {
      fetchNotifications();
    }
  }, [notificationOpen]);

  // Poll unread count
  useEffect(() => {
    const token = Cookie.get("authToken");
    if (!token) return;

    const poll = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setNotifications(data.data || []);
        }
      } catch (err) {
        // silent
      }
    };

    poll();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const handleMarkAllRead = async () => {
    const token = Cookie.get("authToken");
    if (!token) return;
    try {
      await fetch(`${apiUrl}/api/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const handleNotificationClick = async (notification) => {
    const token = Cookie.get("authToken");
    if (!token) return;
    try {
      await fetch(`${apiUrl}/api/notifications/${notification._id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      // silent
    }
    setNotifications((prev) =>
      prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n))
    );
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const profilePath = user?.userType === "doctor" ? "/doctor/profile" : "/profile";

  return (
    <div className="flex items-center gap-4">
      {/* Notification Bell */}
      <div className="relative" ref={notificationRef}>
        <button
          onClick={() => setNotificationOpen(!notificationOpen)}
          className="relative p-2 hover:bg-tertiary/50 rounded-full transition-all duration-200"
        >
          <Bell className="h-5 w-5 text-gray-700" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {notificationOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-borderColor z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-borderColor">
              <h3 className="font-semibold text-black">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setNotificationOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin inline-block">⟳</div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notif) => {
                  const { title, message, Icon } = getNotificationDisplay(notif);
                  return (
                    <button
                      key={notif._id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full text-left p-4 border-b border-borderColor hover:bg-gray-50 cursor-pointer transition-all ${
                        !notif.read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-black">
                            {title}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notif.createdAt).toLocaleDateString()}{" "}
                            {new Date(notif.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        {!notif.read && (
                          <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Avatar with Dropdown */}
      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white font-semibold text-sm hover:bg-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          {user?.firstName?.[0]?.toUpperCase() || "D"}
        </button>

        {userMenuOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-2xl border border-borderColor z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-borderColor">
              <p className="font-semibold text-black">
                Dr. {user?.firstName || "Doctor"} {user?.lastName || ""}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {user?.email || ""}
              </p>
            </div>
            <div className="py-2">
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  router.push(profilePath);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-all"
              >
                <UserCircle className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">My Profile</span>
              </button>
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  router.push("/settings");
                }}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-all"
              >
                <Settings className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">Settings</span>
              </button>
            </div>
            <div className="border-t border-borderColor py-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition-all text-red-600"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
