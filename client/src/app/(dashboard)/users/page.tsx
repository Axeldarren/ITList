"use client";

import Header from "@/components/Header";
import { useDeleteUserMutation, useGetUsersQuery, User } from "@/state/api";
import { useState, useEffect } from "react";
import { DataGrid, GridColDef, GridActionsCellItem, GridToolbarContainer } from "@mui/x-data-grid";
import { useAppSelector } from "@/app/redux";
import { dataGridSxStyles } from "@/lib/utils";
import { getProfilePictureSrc } from "@/lib/profilePicture";
import { Plus, Edit, Trash2, Users as UsersIcon, Shield, Building2 } from "lucide-react";
import ModalNewUser from "@/components/ModalNewUser";
import ModalEditUser from "@/components/ModalEditUser";
import { selectCurrentUser } from "@/state/authSlice";
import toast from "react-hot-toast";
import ModalConfirm from "@/components/ModalConfirm";

const AvatarCell = ({ value, username }: { value: string | null; username: string | null }) => {
    const [imageError, setImageError] = useState(false);
    const hasImage = value && !imageError;

    useEffect(() => {
        setImageError(false);
    }, [value]);

    return (
        <div className="flex items-center justify-center h-full w-full">
            {hasImage ? (
                <img
                    src={getProfilePictureSrc(value)!}
                    alt={username || 'User avatar'}
                    className="rounded-full object-cover h-9 w-9 ring-2 ring-white dark:ring-dark-secondary"
                    onError={() => setImageError(true)}
                />
            ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xs font-bold ring-2 ring-white dark:ring-dark-secondary">
                    {username ? username.substring(0, 2).toUpperCase() : '??'}
                </div>
            )}
        </div>
    );
};

const StatCard = ({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent: string }) => (
    <div className={`relative overflow-hidden rounded-2xl border border-gray-100 bg-white dark:bg-dark-secondary dark:border-gray-800 p-5 shadow-sm transition-shadow hover:shadow-md`}>
        <div className={`absolute left-0 top-0 h-full w-1 ${accent}`} />
        <div className="flex items-center gap-3 pl-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 dark:bg-dark-tertiary">
                {icon}
            </div>
            <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
        </div>
    </div>
);

const Users = () => {
  const { data: users, isLoading, isError } = useGetUsersQuery();
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const currentUser = useAppSelector(selectCurrentUser);
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [deptFilter, setDeptFilter] = useState<string>("");

  const handleEditClick = (user: User) => {
      setSelectedUser(user);
      setIsEditModalOpen(true);
  };

  const handleDeleteClick = (user: User) => {
      setSelectedUser(user);
      setConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
      if (!selectedUser || !selectedUser.userId) return;
      toast.promise(deleteUser(selectedUser.userId).unwrap(), {
          loading: 'Deleting user...',
          success: `User "${selectedUser.username}" deleted successfully!`,
          error: (err) => err.data?.message || 'Failed to delete user.'
      }).finally(() => {
          setConfirmModalOpen(false);
          setSelectedUser(null);
      });
  };

  const columns: GridColDef[] = [
    {
        field: 'index', headerName: '#', width: 60,
        renderCell: (params) => params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
        sortable: false, filterable: false,
    },
    {
        field: 'profilePictureUrl', headerName: 'Avatar', width: 80,
        renderCell: (params) => <AvatarCell value={params.value} username={params.row.username} />,
        sortable: false, filterable: false,
    },
    { field: "username", headerName: "Username", width: 200 },
    { field: "email", headerName: "Email", width: 250 },
    { field: "department", headerName: "Department", width: 180 },
    { field: "NIK", headerName: "NIK", width: 150 },
    {
        field: "role", headerName: "Role", width: 150,
        renderCell: (params) => {
            const roleStyles: Record<string, string> = {
                ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
                DEVELOPER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
                BUSINESS_OWNER: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
            };
            const style = roleStyles[params.value] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
            return (
                <div className="flex items-center h-full">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}>
                        {params.value}
                    </span>
                </div>
            );
        }
    },
  ];

  if (currentUser?.role === 'ADMIN') {
      columns.push({
        field: 'actions',
        type: 'actions',
        headerName: 'Actions',
        width: 100,
        cellClassName: 'actions',
        getActions: ({ row }) => [
          <GridActionsCellItem key="edit" icon={<Edit size={16} />} label="Edit" onClick={() => handleEditClick(row)} />,
          <GridActionsCellItem
            key="delete"
            icon={<Trash2 size={16} />}
            label="Delete"
            onClick={() => handleDeleteClick(row)}
            disabled={row.userId === currentUser?.userId}
          />,
        ],
      });
  }

  if (isLoading) return (
    <div className="flex w-full flex-col p-6 lg:p-8">
      <div className="animate-pulse h-8 w-28 rounded-lg bg-gray-200 dark:bg-gray-700 mb-6" />
      <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white dark:bg-dark-secondary dark:border-gray-800 p-5 shadow-sm">
            <div className="flex items-center gap-3 pl-2">
              <div className="animate-pulse h-10 w-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-2">
                <div className="animate-pulse h-3 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="animate-pulse h-6 w-10 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="flex gap-4 bg-gray-50 dark:bg-dark-tertiary px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          {[60, 80, 200, 250, 180, 150, 150].map((w, i) => (
            <div key={i} className="animate-pulse h-4 rounded bg-gray-300 dark:bg-gray-600 flex-shrink-0" style={{ width: w }} />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-t border-gray-100 dark:border-gray-800 px-4 py-3">
            <div className="animate-pulse h-4 w-8 rounded bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
            <div className="animate-pulse h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
            <div className="animate-pulse h-4 w-48 rounded bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
            <div className="animate-pulse h-4 w-60 rounded bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
            <div className="animate-pulse h-4 w-44 rounded bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
            <div className="animate-pulse h-4 w-36 rounded bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
            <div className="animate-pulse h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
  if (isError || !users) return <div className="p-8 text-red-500">Error fetching users.</div>;

  const filteredRows = deptFilter
    ? users.filter(u => (u.department || "").toLowerCase().includes(deptFilter.toLowerCase()))
    : users;

  const departments = Array.from(new Set(users.map(u => (u.department || '').trim()).filter(Boolean))).sort();
  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const devCount = users.filter(u => u.role === 'DEVELOPER').length;
  const boCount = users.filter(u => u.role === 'BUSINESS_OWNER').length;

  const Toolbar = () => (
    <GridToolbarContainer>
      <div className="flex items-center gap-2 p-2">
        <label htmlFor="deptFilter" className="text-sm text-gray-600 dark:text-gray-400 font-medium">Department</label>
        <select
          id="deptFilter"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-dark-tertiary dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
    </GridToolbarContainer>
  );

  return (
    <div className="flex w-full flex-col p-6 lg:p-8">
      <ModalNewUser isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} />
      <ModalEditUser isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} user={selectedUser} />
      <ModalConfirm
        isOpen={isConfirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${selectedUser?.username}"? This action cannot be undone.`}
        isLoading={isDeleting}
      />

      <Header
        name="Users"
        buttonComponent={
            currentUser?.role === 'ADMIN' && (
                <button
                    onClick={() => setIsNewModalOpen(true)}
                    className="flex items-center gap-2 rounded-xl bg-blue-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-600 transition-all cursor-pointer"
                >
                    <Plus size={16} /> Add User
                </button>
            )
        }
      />

      {/* Stats Bar */}
      <div className="mt-4 mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={users.length}
          accent="bg-blue-500"
          icon={<UsersIcon size={18} className="text-blue-500" />}
        />
        <StatCard
          label="Admins"
          value={adminCount}
          accent="bg-purple-500"
          icon={<Shield size={18} className="text-purple-500" />}
        />
        <StatCard
          label="Developers"
          value={devCount}
          accent="bg-blue-400"
          icon={<UsersIcon size={18} className="text-blue-400" />}
        />
        <StatCard
          label="Business Owners"
          value={boCount}
          accent="bg-amber-500"
          icon={<Building2 size={18} className="text-amber-500" />}
        />
      </div>

      <div className="overflow-x-auto w-full">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm min-w-[640px]" style={{ height: 620 }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          getRowId={(row) => row.userId}
          rowHeight={60}
          sx={dataGridSxStyles(isDarkMode)}
          slots={{ toolbar: Toolbar }}
        />
      </div>
      </div>
    </div>
  );
};

export default Users;
