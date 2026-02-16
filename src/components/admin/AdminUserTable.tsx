"use client";

import { useState, useMemo } from "react";
import type { Profile, UserRole, UserStatus } from "@/types/database";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Shield, 
  User as UserIcon, 
  UserX, 
  Trash2, 
  Eye,
  ShieldAlert,
  ShieldCheck,
  MoreHorizontal,
  Clock,
  Mail,
  Calendar
} from "lucide-react";
import Link from "next/link";

interface UserWithProgress extends Profile {
  courses_enrolled: number;
}

interface AdminUserTableProps {
  users: UserWithProgress[];
}

export function AdminUserTable({ users: initialUsers }: AdminUserTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const name = u.full_name || "";
      const email = u.email || "";
      const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || 
                             email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = filterRole === "all" || u.role === filterRole;
      const matchesStatus = filterStatus === "all" || u.status === filterStatus;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, filterRole, filterStatus]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleUpdateStatus = async (userId: string, newStatus: UserStatus) => {
    if (newStatus === 'deleted' && !window.confirm("Are you sure you want to delete this user? This will mark them as deleted.")) return;
    
    setLoadingId(userId);
    try {
      const response = await fetch("/api/admin/update-user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: newStatus }),
      });
      const result = await response.json();
      if (result.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    if (!window.confirm(`Change user role to ${newRole.toUpperCase()}?`)) return;

    setLoadingId(userId);
    try {
      const response = await fetch("/api/admin/update-user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const result = await response.json();
      if (result.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      }
    } finally {
      setLoadingId(null);
    }
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-800 dark:bg-neutral-950"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neutral-400" />
            <select
              value={filterRole}
              onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }}
              className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium focus:outline-none dark:border-neutral-800 dark:bg-neutral-950"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="student">Student</option>
            </select>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium focus:outline-none dark:border-neutral-800 dark:bg-neutral-950"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/50">
                <th className="px-6 py-4 font-semibold text-neutral-900 dark:text-white">User</th>
                <th className="px-6 py-4 font-semibold text-neutral-900 dark:text-white">Role</th>
                <th className="px-6 py-4 font-semibold text-neutral-900 dark:text-white text-center">Courses</th>
                <th className="hidden md:table-cell px-6 py-4 font-semibold text-neutral-900 dark:text-white">Joined</th>
                <th className="hidden lg:table-cell px-6 py-4 font-semibold text-neutral-900 dark:text-white">Last Login</th>
                <th className="px-6 py-4 text-center font-semibold text-neutral-900 dark:text-white">Status</th>
                <th className="px-6 py-4 text-right font-semibold text-neutral-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                    No users found
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const isLoading = loadingId === user.id;

                  return (
                    <tr
                      key={user.id}
                      className={`group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${isLoading ? "opacity-50" : ""}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                            <span className="font-bold text-sm">
                              {(user.full_name || user.email || "?")[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-neutral-900 dark:text-white truncate max-w-[150px]">
                              {user.full_name || "Anonymous User"}
                            </p>
                            <p className="text-xs text-neutral-500 truncate max-w-[150px]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          user.role === 'admin' 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                            : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                        }`}>
                          {user.role === 'admin' ? <Shield className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-medium tabular-nums">
                        {user.courses_enrolled}
                      </td>
                      <td className="px-6 py-4 text-xs text-neutral-500 whitespace-nowrap font-mono">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 text-xs text-neutral-500 whitespace-nowrap font-mono">
                        {formatDate(user.last_login)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          user.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          user.status === 'suspended' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <div className="relative group/actions">
                            <button className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            <div className="absolute right-0 bottom-full mb-2 w-48 invisible group-hover/actions:visible bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xl z-50 overflow-hidden">
                              <div className="p-1">
                                {user.role === 'student' ? (
                                  <button 
                                    onClick={() => handleUpdateRole(user.id, 'admin')}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg"
                                  >
                                    <ShieldCheck className="h-3.5 w-3.5" /> Promote to Admin
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleUpdateRole(user.id, 'student')}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                  >
                                    <ShieldAlert className="h-3.5 w-3.5" /> Demote to Student
                                  </button>
                                )}
                                
                                <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />
                                
                                {user.status === 'active' ? (
                                  <button 
                                    onClick={() => handleUpdateStatus(user.id, 'suspended')}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                  >
                                    <UserX className="h-3.5 w-3.5" /> Suspend User
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleUpdateStatus(user.id, 'active')}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                                  >
                                    <ShieldCheck className="h-3.5 w-3.5" /> Activate User
                                  </button>
                                )}
                                
                                <button 
                                  onClick={() => handleUpdateStatus(user.id, 'deleted')}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 rounded-lg"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Delete User
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of <span className="font-medium">{filteredUsers.length}</span> users
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
