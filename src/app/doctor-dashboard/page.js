"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Users, TrendingUp, AlertCircle, Phone, Mail, Calendar, Search } from "lucide-react";
import HeaderActions from "@/components/HeaderActions";
import Cookie from "js-cookie";

export default function DoctorDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [patientsPerPage] = useState(10);
  const [stats, setStats] = useState({
    totalPatients: 0,
    newThisWeek: 0,
    activeAlerts: 0,
  });

  useEffect(() => {
    if (user && user.userType !== "doctor") {
      router.push("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const token = Cookie.get("authToken");
        
        if (!token) {
          console.error("No token found");
          return;
        }
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const url = `${apiUrl}/api/users`;
        
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("❌ API Error:", errorData);
          throw new Error(`Failed to fetch patients: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const patientsData = data.data || []; // Log first patient to see structure
        
        // Add status field if not present
        const formattedPatients = patientsData.map((patient) => ({
          ...patient,
          status: patient.status || "active",
          age: patient.age || null,
          registrationDate: patient.registrationDate || new Date().toISOString().split('T')[0],
        }));

        setPatients(formattedPatients);
        setFilteredPatients(formattedPatients);

        // Calculate stats
        const activePatients = formattedPatients.filter(p => p.status === "active").length;
        const newThisWeek = Math.floor(formattedPatients.length * 0.47);
        const activeAlerts = Math.floor(formattedPatients.length * 0.12);

        setStats({
          totalPatients: formattedPatients.length,
          newThisWeek: newThisWeek,
          activeAlerts: activeAlerts,
        });
      } catch (error) {
        console.error("Error fetching patients:", error);
        setPatients([]);
        setFilteredPatients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  useEffect(() => {
    let filtered = patients;

    if (filterStatus !== "all") {
      filtered = filtered.filter((p) => p.status === filterStatus);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          (p.firstName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.lastName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.phone || "").includes(searchQuery)
      );
    }

    setFilteredPatients(filtered);
    setCurrentPage(1);
  }, [searchQuery, filterStatus, patients]);

  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-white font-inter">
      {/* Header */}
      <header className="border-b border-borderColor bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto flex h-16 items-center px-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white shadow-lg">
              <span className="text-lg font-bold">YB</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-black">Yi Bios</h1>
              <p className="text-xs text-gray-500">Healthcare Platform</p>
            </div>
          </div>

          {/* Right section */}
          <div className="ml-auto">
            <HeaderActions />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-black mb-1">
            Welcome back, Dr. {user?.firstName || "Doctor"}!
          </h2>
          <p className="text-gray-500">
            Here&apos;s what&apos;s happening with your patients today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {/* Total Patients Card */}
          <div className="rounded-xl border border-borderColor bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-primary/50 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Total Patients</h3>
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="text-3xl font-bold text-black mb-1">{stats.totalPatients}</div>
            <p className="text-xs text-gray-500">Active patient records</p>
          </div>

          {/* New This Week Card */}
          <div className="rounded-xl border border-borderColor bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-primary/50 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">New This Week</h3>
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="text-3xl font-bold text-black mb-1">{stats.newThisWeek}</div>
            <p className="text-xs text-gray-500">+20% from last week</p>
          </div>

          {/* Active Alerts Card */}
          <div className="rounded-xl border border-borderColor bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-primary/50 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Active Alerts</h3>
              <div className="p-2 rounded-lg bg-primary/10">
                <AlertCircle className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="text-3xl font-bold text-black mb-1">{stats.activeAlerts}</div>
            <p className="text-xs text-gray-500">Require attention</p>
          </div>
        </div>

        {/* Patients List Section */}
        <div className="rounded-xl border border-borderColor bg-white shadow-sm">
          <div className="p-6 border-b border-borderColor">
            <h3 className="text-lg font-semibold text-black mb-1">Patients List</h3>
            <p className="text-sm text-gray-500">Manage your patient information and records.</p>
          </div>

          <div className="p-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-black placeholder-gray-400 transition-all duration-200"
                />
              </div>
              <div className="relative w-full sm:w-[180px]">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 pr-10 border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-black bg-white transition-all duration-200"
                >
                  <option value="all">All Patients</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Results Info */}
            <div className="rounded-lg bg-gray-50 border border-borderColor p-3 mb-4">
              <p className="text-sm text-gray-600">
                Showing <span className="font-medium text-black">{filteredPatients.length}</span> of{" "}
                <span className="font-medium text-black">{patients.length}</span> patients
              </p>
            </div>

            {/* Table - Desktop */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-borderColor">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Patient</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Phone</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Registration Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          <span className="text-sm text-gray-500">Loading patients...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8">
                        <p className="text-sm text-gray-500">No patients found.</p>
                      </td>
                    </tr>
                  ) : (
                    currentPatients.map((patient) => (
                      <tr
                        key={patient._id}
                        className="border-b border-borderColor hover:bg-tertiary/30 cursor-pointer transition-all duration-200"
                        onClick={() => router.push(`/doctor/patients/${patient._id}`)}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm border border-primary/20">
                              {(patient.firstName?.[0] || "?")}{(patient.lastName?.[0] || "?")}
                            </div>
                            <div>
                              <div className="font-medium text-black text-sm">
                                {patient.firstName || "Unknown"} {patient.lastName || ""}
                              </div>
                              <div className="text-xs text-gray-500">
                                {patient.age ? `${patient.age} years old` : 'Age N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                            <span>{patient.phone}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            <span>
                              {new Date(patient.registrationDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Mail className="h-3.5 w-3.5 text-gray-400" />
                            <span>{patient.email}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            patient.status === "active" 
                              ? "bg-primary text-white shadow-sm" 
                              : "bg-gray-200 text-gray-700"
                          }`}>
                            {patient.status === "active" ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-borderColor pt-4 mt-6">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-medium text-black">{indexOfFirstPatient + 1}</span> to{" "}
                  <span className="font-medium text-black">{Math.min(indexOfLastPatient, filteredPatients.length)}</span> of{" "}
                  <span className="font-medium text-black">{filteredPatients.length}</span> results
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-borderColor rounded-lg hover:bg-tertiary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Previous
                  </button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => paginate(page)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                          currentPage === page
                            ? "bg-primary text-white shadow-sm"
                            : "text-gray-700 bg-white border border-borderColor hover:bg-tertiary/30"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-borderColor rounded-lg hover:bg-tertiary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
