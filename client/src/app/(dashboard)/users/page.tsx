"use client";

import Header from "@/components/Header";
import { useDeleteUserMutation, useGetUsersQuery, User } from "@/state/api";
import React, { useState, useEffect } from "react";
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import { useAppSelector } from "@/app/redux";
import { dataGridSxStyles } from "@/lib/utils";
import Image from "next/image";
import { Plus, Edit, Trash2 } from "lucide-react";
import ModalNewUser from "@/components/ModalNewUser";
import ModalEditUser from "@/components/ModalEditUser";
import { selectCurrentUser } from "@/state/authSlice";
import toast from "react-hot-toast";
import ModalConfirm from "@/components/ModalConfirm";

// --- Avatar Cell Component ---
const AvatarCell = ({ value, username }: { value: string | null; username: string | null }) => {
    const [imageError, setImageError] = useState(false);
    const hasImage = value && !imageError;

    useEffect(() => {
        setImageError(false);
    }, [value]);

    return (
        <div className="flex items-center justify-center h-full w-full">
            {hasImage ? (
                <Image
                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${value}`}
                    alt={username || 'User avatar'}
                    width={40}
                    height={40}
                    className="rounded-full object-cover h-10 w-10"
                    onError={() => setImageError(true)}
                />
            ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-500 text-white font-bold">
                    {username ? username.substring(0, 2).toUpperCase() : '??'}
                </div>
            )}
        </div>
    );
};

const Users = () => {
  const { data: users, isLoading, isError } = useGetUsersQuery();
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const currentUser = useAppSelector(selectCurrentUser);
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

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
        field: 'profilePictureUrl', headerName: 'Avatar', width: 100,
        renderCell: (params) => <AvatarCell value={params.value} username={params.row.username} />,
        sortable: false, filterable: false,
    },
    { field: "userId", headerName: "User ID", width: 100 },
    { field: "username", headerName: "Username", width: 200 },
    { field: "email", headerName: "Email", width: 250 },
    { field: "NIK", headerName: "NIK", width: 150 },
    { field: "isAdmin", headerName: "Admin", width: 100, type: 'boolean' },
  ];

  // Conditionally add the Actions column if the user is an admin
  if (currentUser?.isAdmin) {
      columns.push({
        field: 'actions',
        type: 'actions',
        headerName: 'Actions',
        width: 100,
        cellClassName: 'actions',
        getActions: ({ row }) => [
          <GridActionsCellItem
            key="edit"
            icon={<Edit />}
            label="Edit"
            onClick={() => handleEditClick(row)}
          />,
          <GridActionsCellItem
            key="delete"
            icon={<Trash2 />}
            label="Delete"
            onClick={() => handleDeleteClick(row)}
            disabled={row.userId === currentUser?.userId} // Prevent admin from deleting themselves
          />,
        ],
      });
  }

  if (isLoading) return <div className="p-8">Loading users...</div>;
  if (isError || !users) return <div className="p-8">Error fetching users.</div>;

  return (
    <div className="flex w-full flex-col p-8">
      <ModalNewUser isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} />
      <ModalEditUser isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} user={selectedUser} />

      <ModalConfirm 
        isOpen={isConfirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete the user "${selectedUser?.username}"? This action cannot be undone.`}
        isLoading={isDeleting}
      />

      <Header 
        name="Users"
        buttonComponent={
            currentUser?.isAdmin && (
                <button
                    onClick={() => setIsNewModalOpen(true)}
                    className="flex items-center gap-2 rounded-md bg-blue-primary px-4 py-2 text-sm font-semibold text-white"
                >
                    <Plus size={18} /> Add User
                </button>
            )
        }
      />
      <div className="mt-6" style={{ height: 650, width: "100%" }}>
        <DataGrid
          rows={users || []}
          columns={columns}
          getRowId={(row) => row.userId}
          rowHeight={60}
          sx={dataGridSxStyles(isDarkMode)}
        />
      </div>
    </div>
  );
};

export default Users;