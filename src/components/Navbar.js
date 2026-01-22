"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CyborgLogo from "@/components/CyborgLogo";
import Image from "next/image";
import { Bell } from "lucide-react";
import { notificationAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar({ backHref = "/", showBack = true }) {
  const router = useRouter();
  const { token } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const handleNotificationClick = async (notification) => {
    // Mark as read
    try {
      await notificationAPI.markRead(notification._id);
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }

    // Navigate based on type
    if (notification.type === "actionPlan:ready") {
      const { planId } = notification.metadata;
      router.push(`/action-plan/${notification.userId}?planId=${planId}`);
      setShowDropdown(false);
    }

    // Update UI
    setNotifications((prev) =>
      prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <header className="w-full bg-pageBackground backdrop-blur px-4 pt-10 flex items-center justify-between font-inter">
      <div className="">
        {showBack && (
          <Link
            href={backHref}
            className="text-secondary text-[16px] font-semibold hover:text-black flex items-center gap-1"
          >
            <Image src="/assets/icons/arrow-left.svg" alt="Back" width={16} height={16} />
            <span>Back</span>
          </Link>
        )}
      </div>

      <div className="h-10 flex items-center justify-center">
        <CyborgLogo width={100} height={40} />
      </div>

      {/* Bell Icon + Dropdown */}
      {token && (
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative p-2 hover:bg-gray-200 rounded-full transition"
            aria-label="Notifications"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-borderColor rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-4 border-b border-borderColor flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
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
                  {notifications.map((notification) => (
                    <button
                      key={notification._id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                        !notification.read ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">📋</div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {notification.type === "actionPlan:ready"
                              ? "Action Plan Ready"
                              : "Notification"}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.type === "actionPlan:ready"
                              ? "Your personalized action plan has been generated. View it now."
                              : "You have a new notification."}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notification.createdAt).toLocaleDateString()}{" "}
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
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
