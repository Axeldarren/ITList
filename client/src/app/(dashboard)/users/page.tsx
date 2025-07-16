"use client";

import Header from "@/components/Header";
import { useGetUsersQuery } from "@/state/api";
import React, { useState, useEffect } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useAppSelector } from "@/app/redux";
import { dataGridSxStyles } from "@/lib/utils";
import Image from "next/image";

// --- Avatar Cell Component ---
// This component handles displaying the image and the fallback initials.
const AvatarCell = ({ value, username }) => {
    const [imageError, setImageError] = useState(false);
    const hasImage = value && !imageError;

    useEffect(() => {
        setImageError(false); // Reset error state when the image URL changes
    }, [value]);

    return (
        <div className="flex items-center justify-center h-full w-full">
            {hasImage ? (
                <Image
                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${value}`}
                    alt={username}
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

const columns: GridColDef[] = [
    {
        field: 'index',
        headerName: '#',
        width: 60,
        renderCell: (params) => params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
        sortable: false,
        filterable: false,
    },
    {
        field: 'profilePictureUrl',
        headerName: 'Avatar',
        width: 100,
        renderCell: (params) => <AvatarCell value={params.value} username={params.row.username} />,
        sortable: false,
        filterable: false,
    },
    {
        field: "userId",
        headerName: "User ID",
        width: 100,
    },
    {
        field: "username",
        headerName: "Username",
        width: 200,
    },
    {
        field: "email",
        headerName: "Email",
        width: 250,
    },
    {
        field: "NIK",
        headerName: "NIK",
        width: 150,
    },
    {
        field: "isAdmin",
        headerName: "Admin",
        width: 100,
        type: 'boolean',
    },
];

const Users = () => {
  const { data: users, isLoading, isError } = useGetUsersQuery();
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  if (isLoading) return <div className="p-8">Loading users...</div>;
  if (isError || !users) return <div className="p-8">Error fetching users.</div>;

  return (
    <div className="flex w-full flex-col p-8">
      <Header name="Users" />
      <div className="mt-6" style={{ height: 650, width: "100%" }}>
        <DataGrid
          rows={users || []}
          columns={columns}
          getRowId={(row) => row.userId}
          rowHeight={60} // Set a consistent row height for the avatars
          sx={dataGridSxStyles(isDarkMode)}
        />
      </div>
    </div>
  );
};

export default Users;