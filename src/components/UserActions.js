"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ClipboardList, Upload, FileCheck, CheckCircle, AlertTriangle, Activity, MessageSquare, Settings, LogOut } from "lucide-react";
import { notificationAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Maps a notification type to its display metadata: title, message, icon, and
 * optional navigation path (null means no navigation on click).
 */
function getNotificationDisplay(notification) {
  switch (notification.type) {
    case "upload:success":
      return {
        title: "Report Uploaded",
        message: "Your report has been uploaded and is being analyzed.",
        Icon: Upload,
        navigateTo: null,
      };
    case "analysis:ready":
      return {
        title: "Analysis Complete",
        message: "Your blood report analysis is complete.",
        Icon: FileCheck,
        navigateTo: null,
      };
    case "report:ready":
      return {
        title: "Report Ready",
        message: "Your blood report has been processed. View your results now.",
        Icon: CheckCircle,
        navigateTo: "/data",
      };
    case "report:failed":
      return {
        title: "Report Failed",
        message: "We couldn't process your report. Please try again.",
        Icon: AlertTriangle,
        navigateTo: "/data",
      };
    case "actionPlan:ready":
    case "action_plan_ready": {
      const planId = notification.metadata?.planId;
      return {
        title: "Action Plan Ready",
        message: "Your personalized action plan has been generated. View it now.",
        Icon: ClipboardList,
        navigateTo: planId
          ? `/action-plan/${notification.userId}?planId=${planId}`
          : null,
      };
    }
    default:
      return {
        title: "Notification",
        message: "You have a new notification.",
        Icon: Bell,
        navigateTo: null,
      };
  }
}

export default function UserActions() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (showDropdown && token) {
      fetchNotifications();
    }
  }, [showDropdown, token]);

  // Poll for unread count every 10 seconds
  useEffect(() => {
    if (!token) return;

    const pollUnread = async () => {
      try {
        const response = await notificationAPI.list();
        const unread = response.data.filter((n) => !n.read).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    pollUnread();
    const interval = setInterval(pollUnread, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationAPI.list();
      setNotifications(response.data || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const deduplicatedNotifications = useMemo(() => {
    const seen = new Map();
    const result = [];
    for (const n of notifications) {
      const key = n.type;
      if (seen.has(key)) {
        seen.get(key).count++;
      } else {
        const entry = { ...n, count: 1 };
        seen.set(key, entry);
        result.push(entry);
      }
    }
    return result;
  }, [notifications]);

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    try {
      await notificationAPI.markRead(notification._id);
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }

    // Navigate based on type
    const { navigateTo } = getNotificationDisplay(notification);
    if (navigateTo) {
      router.push(navigateTo);
      setShowDropdown(false);
    }

    // Update UI
    setNotifications((prev) =>
      prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    router.push("/login");
  };

  if (!token) return null;

  return (
    <div className="fixed top-6 right-6 lg:top-8 lg:right-8 flex items-center gap-3 z-40">{/* Bell Icon with Notifications Dropdown */}
      <div className="relative" ref={notificationRef}>
        <button
          onClick={() => {
            setShowDropdown(!showDropdown);
            setShowUserMenu(false);
          }}
          className="relative p-2.5 hover:bg-gray-100 rounded-full transition bg-white border border-borderColor lg:p-3"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 lg:w-6 lg:h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown */}
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-80 bg-white border border-borderColor rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-borderColor flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
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
                  onClick={() => setShowDropdown(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin">⟳</div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              <div className="divide-y divide-borderColor">
                {deduplicatedNotifications.map((notification) => {
                  const { title, message, Icon } = getNotificationDisplay(notification);
                  return (
                    <button
                      key={notification._id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                        !notification.read ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="w-6 h-6 text-gray-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {title}
                            {notification.count > 1 && (
                              <span className="ml-2 text-xs font-normal text-gray-400">
                                ({notification.count})
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{message}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notification.createdAt).toLocaleDateString()} {""}
                            {new Date(notification.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Menu Dropdown */}
      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => {
            setShowUserMenu((prev) => !prev);
            setShowDropdown(false);
          }}
          className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border border-borderColor bg-white flex items-center justify-center font-semibold text-gray-800 hover:ring-2 hover:ring-primary/50 transition text-sm lg:text-base"
          aria-label="User menu"
        >
          <span>{user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}</span>
        </button>

        {showUserMenu && (
          <div className="absolute right-0 mt-2 w-60 bg-white border border-borderColor rounded-xl shadow-lg z-50 p-2 space-y-1">
            <div className="px-3 py-2 text-sm text-gray-600 border-b border-borderColor">
              <p className="font-semibold text-gray-900">{user?.firstName || "User"}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <Link
              href="/orders"
              onClick={() => setShowUserMenu(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50"
            >
              <ClipboardList className="w-5 h-5 text-gray-700" />
              <span className="text-sm text-gray-800">Your Orders</span>
            </Link>
            <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50">
              <Settings className="w-5 h-5 text-gray-700" />
              <span className="text-sm text-gray-800">Settings</span>
            </Link>
            <Link href="/hear-about-us" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50">
              <MessageSquare className="w-5 h-5 text-gray-700" />
              <span className="text-sm text-gray-800">Refer a Friend</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-left"
            >
              <LogOut className="w-5 h-5 text-gray-700" />
              <span className="text-sm text-gray-800">Log Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
