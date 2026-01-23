"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Bell,
  LogOut,
  Settings,
  UserCircle,
  X,
  AlertCircle,
} from "lucide-react";

export default function HeaderActions() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  // Sample notifications
  const notifications = [
    {
      id: 1,
      type: "alert",
      title: "Blood report uploaded",
      message: "New blood report for Sarah Johnson",
      time: "5 min ago",
      unread: true,
    },
    {
      id: 2,
      type: "info",
      title: "Appointment reminder",
      message: "Meeting with Michael Smith at 3 PM",
      time: "1 hour ago",
      unread: true,
    },
    {
      id: 3,
      type: "success",
      title: "Action plan completed",
      message: "John Anderson completed week 1 plan",
      time: "2 hours ago",
      unread: false,
    },
  ];

  // Close dropdowns when clicking outside
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

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const profilePath = user?.userType === "doctor" ? "/doctor/profile" : "/profile";

  return (
    <div className="flex items-center gap-4">
      {/* Notification Bell with Dropdown */}
      <div className="relative" ref={notificationRef}>
        <button
          onClick={() => setNotificationOpen(!notificationOpen)}
          className="relative p-2 hover:bg-tertiary/50 rounded-full transition-all duration-200"
        >
          <Bell className="h-5 w-5 text-gray-700" />
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white animate-pulse">
            {notifications.filter((n) => n.unread).length}
          </span>
        </button>

        {/* Notification Dropdown */}
        {notificationOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-borderColor z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-borderColor">
              <h3 className="font-semibold text-black">Notifications</h3>
              <button
                onClick={() => setNotificationOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 border-b border-borderColor hover:bg-gray-50 cursor-pointer transition-all ${
                    notif.unread ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        notif.type === "alert"
                          ? "bg-red-100 text-red-600"
                          : notif.type === "success"
                          ? "bg-green-100 text-green-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-black">
                        {notif.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                    </div>
                    {notif.unread && (
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 text-center border-t border-borderColor">
              <button className="text-sm text-primary hover:text-primary/80 font-medium">
                View all notifications
              </button>
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

        {/* User Dropdown */}
        {userMenuOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-2xl border border-borderColor z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-borderColor">
              <p className="font-semibold text-black">
                Dr. {user?.firstName || "Doctor"} {user?.lastName || ""}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {user?.email || "doctor@example.com"}
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
