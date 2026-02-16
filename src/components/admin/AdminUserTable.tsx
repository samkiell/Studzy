"use client";

import { useState, useMemo } from "react";
import type { Profile, UserRole, UserStatus } from "@/types/database";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Shield, 
  User as UserIcon, 
  UserX, 
  Trash2, 
  CheckCircle2,
  XCircle,
  Download,
  LogOut
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

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
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "verify" | "demote" | "delete" | null;
    userId: string | null;
  }>({
    isOpen: false,
    type: null,
    userId: null
  });

  const openModal = (type: "verify" | "demote" | "delete", userId: string) => {
    setModalState({ isOpen: true, type, userId });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, userId: null });
  };

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
      } else {
        alert(result.error || "Failed to update status");
      }
    } finally {
      setLoadingId(null);
    }
  };


  const handleConfirmAction = async () => {
    const { type, userId } = modalState;
    if (!type || !userId) return;

    setLoadingId(userId);
    closeModal();

    try {
      let response;
      if (type === "delete") {
        response = await fetch("/api/admin/delete-user", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
      } else {
        const endpoint = type === "verify" ? "/api/admin/verify-user" : "/api/admin/demote-user";
        response = await fetch(endpoint, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
      }

      const result = await response.json();
      if (result.success) {
        if (type === "delete") {
          setUsers(prev => prev.filter(u => u.id !== userId));
        } else {
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: type === "verify" } : u));
        }
      } else {
        alert(result.error || `Failed to ${type} user`);
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
                <th className="px-6 py-4 font-semibold text-neutral-900 dark:text-white text-left">User</th>
                <th className="px-6 py-4 font-semibold text-neutral-900 dark:text-white text-left">Status</th>
                <th className="px-6 py-4 font-semibold text-neutral-900 dark:text-white text-left">Verification</th>
                <th className="px-6 py-4 font-semibold text-neutral-900 dark:text-white text-left">Role</th>
                <th className="px-6 py-4 font-semibold text-neutral-900 dark:text-white text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
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
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 overflow-hidden">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="font-bold text-sm">
                                {(user.username || user.full_name || user.email || "?")[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-neutral-900 dark:text-white truncate max-w-[150px]">
                              {user.username || user.full_name || "New Student"}
                            </p>
                            <p className="text-xs text-neutral-500 truncate max-w-[150px]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          user.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          user.status === 'suspended' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            user.is_verified
                              ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                              : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                          }`}>
                            {user.is_verified ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {user.is_verified ? 'Verified' : 'Unverified'}
                          </span>
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
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <div className="relative group/actions">
                            <button className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            <div className="absolute right-0 bottom-full mb-2 w-48 invisible group-hover/actions:visible bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xl z-50 overflow-hidden">
                              <div className="p-1">
                                {user.is_verified ? (
                                  <button
                                    onClick={() => openModal("demote", user.id)}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                  >
                                    <XCircle className="h-3.5 w-3.5" /> Demote Verification
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => openModal("verify", user.id)}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Verify Student
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
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Activate User
                                  </button>
                                )}
                                
                                <button 
                                  onClick={() => openModal("delete", user.id)}
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

      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type === "delete" ? "error" : modalState.type === "verify" ? "success" : "warning"}
        title={
          modalState.type === "delete" ? "Delete User" :
          modalState.type === "verify" ? "Verify Student" : "Demote Verification"
        }
        description={
          modalState.type === "delete" ? "Are you sure you want to PERMANENTLY delete this user? This action cannot be undone." :
          modalState.type === "verify" ? "Are you sure you want to verify this student for ID card generation?" :
          "Are you sure you want to demote this user's verification status? They will lose access to ID card generation."
        }
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={closeModal} disabled={!!loadingId}>
              Cancel
            </Button>
            <Button 
              variant={modalState.type === "delete" ? "danger" : "primary"}
              onClick={handleConfirmAction}
              disabled={!!loadingId}
            >
              {loadingId ? "Processing..." : "Confirm Action"}
            </Button>
          </div>
        }
      />
    </div>
  );
}
