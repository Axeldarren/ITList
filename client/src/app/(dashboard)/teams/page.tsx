"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAppSelector } from "../../redux";
import Header from "@/components/Header";
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
} from "@mui/x-data-grid";
import { dataGridSxStyles } from "@/lib/utils";
import {
  useGetTeamsQuery,
  useGetUsersQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
  Team,
  User,
} from "@/state/api";
import { Plus, Edit, Trash2, X, Eye } from "lucide-react"; // Import Eye icon
import Modal from "@/components/Modal";
import toast from "react-hot-toast";
import ModalConfirm from "@/components/ModalConfirm";
import { selectCurrentUser } from "@/state/authSlice";

// --- NEW: Modal to view all team members ---
const ViewMembersModal = ({ isOpen, onClose, team }: { isOpen: boolean, onClose: () => void, team: Team | null }) => {
    if (!isOpen || !team) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} name={`Members of ${team.teamName}`}>
            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                {team.users && team.users.length > 0 ? (
                    team.users.map((user: User) => (
                        <div key={user.userId} className="flex items-center gap-3 p-2 rounded-lg bg-gray-100 dark:bg-dark-tertiary">
                            <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-500 text-white text-sm font-bold'>
                                {user.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-semibold dark:text-white">{user.username}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">This team has no members assigned.</p>
                )}
            </div>
        </Modal>
    );
};


// --- Multi-select component for users (no changes needed here) ---
type MultiUserSelectorProps = {
    allUsers: User[];
    selectedIds: number[];
    onSelectionChange: (ids: number[]) => void;
    poId: string | number;
    pmId: string | number;
};

const MultiUserSelector = ({ allUsers, selectedIds, onSelectionChange, poId, pmId }: MultiUserSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const selectedUsers = useMemo(() => allUsers.filter(u => u.userId !== undefined && selectedIds.includes(u.userId)), [allUsers, selectedIds]);
    const availableUsers = useMemo(() => allUsers.filter(u => u.userId !== undefined && !selectedIds.includes(u.userId)), [allUsers, selectedIds]);

    const handleSelect = (userId: number) => {
        onSelectionChange([...selectedIds, userId]);
    };

    const handleRemove = (userId: number) => {
        onSelectionChange(selectedIds.filter(id => id !== userId));
    };
    
    const isRemovable = (userId: number) => {
        return userId !== Number(poId) && userId !== Number(pmId);
    };

    return (
        <div className="relative">
            <label className="block text-sm font-medium dark:text-white mb-2">Team Members</label>
            <div className="flex flex-wrap gap-2 rounded border border-gray-300 p-2 min-h-[40px] dark:border-dark-tertiary bg-white dark:bg-dark-tertiary" onClick={() => setIsOpen(true)}>
                {selectedUsers.map((user: User) => (
                    <span key={user.userId} className="flex items-center gap-1 bg-blue-primary/20 text-blue-800 dark:text-blue-200 text-sm font-medium px-2 py-1 rounded-full">
                        {user.username}
                        {user.userId !== undefined && isRemovable(user.userId) && (
                            <button type="button" onClick={(e) => { e.stopPropagation(); handleRemove(user.userId!); }} className="text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100">
                                <X size={14} />
                            </button>
                        )}
                    </span>
                ))}
                <div className="flex flex-grow">
                   <button type="button" onClick={() => setIsOpen(!isOpen)} className="text-sm text-gray-500 hover:text-black dark:hover:text-white">Add member...</button>
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-tertiary rounded-md shadow-lg max-h-48 overflow-y-auto">
                    <ul>
                        {availableUsers.length > 0 ? availableUsers.map((user: User) => (
                            <li key={user.userId} onClick={() => { if (user.userId !== undefined) handleSelect(user.userId); setIsOpen(false); }} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-tertiary cursor-pointer">
                                {user.username}
                            </li>
                        )) : <li className="px-4 py-2 text-gray-500">No other users available</li>}
                    </ul>
                </div>
            )}
        </div>
    );
};


// --- Reusable Team Form Component ---
type TeamFormProps = {
    initialData?: Partial<Team> & { users?: User[] };
    allUsers?: User[];
    onSubmit: (data: Partial<Team> & { memberIds: number[] }) => void;
    isLoading: boolean;
};

const TeamForm: React.FC<TeamFormProps> = ({ initialData, allUsers = [], onSubmit, isLoading }) => {
    const [teamName, setTeamName] = useState('');
    const [poId, setPoId] = useState('');
    const [pmId, setPmId] = useState('');
    const [memberIds, setMemberIds] = useState<number[]>([]);

    useEffect(() => {
        setTeamName(initialData?.teamName || '');
        const initialPoId = initialData?.productOwnerUserId || '';
        const initialPmId = initialData?.projectManagerUserId || '';
        setPoId(String(initialPoId));
        setPmId(String(initialPmId));

        const initialMemberIds = new Set(initialData?.users?.map(u => u.userId!) || []);
        if (initialPoId) initialMemberIds.add(initialPoId);
        if (initialPmId) initialMemberIds.add(initialPmId);
        setMemberIds(Array.from(initialMemberIds));
    }, [initialData]);

    const handlePoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPoId = Number(e.target.value);
        setPoId(e.target.value);
        setMemberIds(Array.from(new Set([...memberIds, newPoId])));
    };

    const handlePmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPmId = Number(e.target.value);
        setPmId(e.target.value);
        setMemberIds(Array.from(new Set([...memberIds, newPmId])));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ 
            teamName, 
            productOwnerUserId: Number(poId), 
            projectManagerUserId: Number(pmId),
            memberIds,
        });
    };

    const inputStyles = "w-full rounded border border-gray-300 p-2 shadow-sm dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";

    return (
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <input type="text" placeholder="Team Name" value={teamName} onChange={(e) => setTeamName(e.target.value)} className={inputStyles} required />
            <select value={poId} onChange={handlePoChange} className={inputStyles} required>
                <option value="">Select Product Owner</option>
                {allUsers.map((user: User) => <option key={user.userId} value={user.userId}>{user.username}</option>)}
            </select>
            <select value={pmId} onChange={handlePmChange} className={inputStyles} required>
                <option value="">Select Project Manager</option>
                {allUsers.map((user: User) => <option key={user.userId} value={user.userId}>{user.username}</option>)}
            </select>
            
            <MultiUserSelector
                allUsers={allUsers}
                selectedIds={memberIds}
                onSelectionChange={setMemberIds}
                poId={poId}
                pmId={pmId}
            />

            <button type="submit" disabled={isLoading} className="w-full justify-center rounded-md border-transparent bg-blue-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-600 focus:outline-none disabled:opacity-50">
                {isLoading ? 'Saving...' : 'Save'}
            </button>
        </form>
    );
};


const Teams = () => {
  const { data: teams, isLoading: teamsLoading, isError } = useGetTeamsQuery();
  const { data: users, isLoading: usersLoading } = useGetUsersQuery();
  const [createTeam, { isLoading: isCreating }] = useCreateTeamMutation();
  const [updateTeam, { isLoading: isUpdating }] = useUpdateTeamMutation();
  const [deleteTeam, { isLoading: isDeleting }] = useDeleteTeamMutation();

  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const currentUser = useAppSelector(selectCurrentUser);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false); // State for the view modal
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const handleViewClick = (team: Team) => {
    setSelectedTeam(team);
    setIsViewModalOpen(true);
  };

  const handleEditClick = (team: Team) => {
    setSelectedTeam(team);
    setIsEditModalOpen(true);
  };
  
  const handleDeleteClick = (team: Team) => {
    setSelectedTeam(team);
    setIsConfirmModalOpen(true);
  };

  const handleCreateSubmit = (teamData: Partial<Team> & { memberIds: number[] }) => {
    toast.promise(createTeam(teamData).unwrap(), {
        loading: 'Creating team...',
        success: 'Team created successfully!',
        error: 'Failed to create team.',
    }).finally(() => setIsNewModalOpen(false));
  };
  
  const handleUpdateSubmit = (teamData: Partial<Team> & { memberIds: number[] }) => {
    if (!selectedTeam) return;
    toast.promise(updateTeam({ id: selectedTeam.id, ...teamData }).unwrap(), {
        loading: 'Updating team...',
        success: 'Team updated successfully!',
        error: 'Failed to update team.',
    }).finally(() => setIsEditModalOpen(false));
  };

  const handleConfirmDelete = () => {
    if (!selectedTeam) return;
    toast.promise(deleteTeam(selectedTeam.id).unwrap(), {
        loading: 'Deleting team...',
        success: 'Team deleted successfully!',
        error: 'Failed to delete team.',
    }).finally(() => setIsConfirmModalOpen(false));
  };

  const columns: GridColDef[] = [
    { 
        field: "index", 
        headerName: "#", 
        width: 50,
        renderCell: (params) => teams ? teams.indexOf(params.row) + 1 : 0,
    },
    { field: "id", headerName: "Team ID", width: 80 },
    { field: "teamName", headerName: "Team Name", width: 200 },
    { 
        field: "users", 
        headerName: "Members", 
        width: 150,
        renderCell: (params) => (
            <div className="flex -space-x-3 overflow-hidden items-center h-full">
                {params.row.users?.slice(0, 4).map((user: User) => (
                    <div
                        key={user.userId}
                        title={user.username}
                        className='flex h-7 w-7 items-center justify-center rounded-full border-2 border-white object-cover dark:border-dark-secondary bg-gray-500 text-white text-xs font-bold'
                    >
                        {user.username.substring(0, 2).toUpperCase()}
                    </div>
                ))}
                {params.row.users?.length > 4 && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600 border-2 border-white dark:border-dark-secondary dark:bg-dark-tertiary dark:text-gray-300">
                        +{params.row.users.length - 4}
                    </div>
                )}
            </div>
        )
    },
    { field: "productOwnerUsername", headerName: "Product Owner", width: 180 },
    { field: "projectManagerUsername", headerName: "Project Manager", width: 180 },
  ];

  // Conditionally add the Actions column if the user is an admin
  if (currentUser?.isAdmin) {
      columns.push({
        field: 'actions',
        type: 'actions',
        headerName: 'Actions',
        width: 120,
        cellClassName: 'actions',
        getActions: ({ row }) => [
          <GridActionsCellItem key="view" icon={<Eye />} label="View" onClick={() => handleViewClick(row)} />,
          <GridActionsCellItem key="edit" icon={<Edit />} label="Edit" onClick={() => handleEditClick(row)} />,
          <GridActionsCellItem key="delete" icon={<Trash2 />} label="Delete" onClick={() => handleDeleteClick(row)} />,
        ],
      });
  }

  if (teamsLoading || usersLoading) return <div>Loading...</div>;
  if (isError || !teams) return <div>Error fetching teams</div>;

  return (
    <div className="flex w-full flex-col p-8">
      {/* Modals */}
      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} name="Create New Team">
        <TeamForm allUsers={users} onSubmit={handleCreateSubmit} isLoading={isCreating} />
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} name="Edit Team">
        <TeamForm initialData={selectedTeam ?? undefined} allUsers={users} onSubmit={handleUpdateSubmit} isLoading={isUpdating} />
      </Modal>

      <ModalConfirm 
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Team"
        message={`Are you sure you want to delete the team "${selectedTeam?.teamName}"? This will unassign all users and projects from this team.`}
        isLoading={isDeleting}
      />

      <ViewMembersModal 
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        team={selectedTeam}
      />
      
      <Header name="Teams" buttonComponent={
          currentUser?.isAdmin && (
            <button onClick={() => setIsNewModalOpen(true)} className="flex items-center gap-2 rounded-md bg-blue-primary px-4 py-2 text-sm font-semibold text-white">
                <Plus size={18} /> Add Team
            </button>
          )
      } />

      <div style={{ height: 650, width: "100%" }}>
        <DataGrid
          rows={teams || []}
          columns={columns}
          sx={dataGridSxStyles(isDarkMode)}
          getRowId={(row) => row.id}
        />
      </div>
    </div>
  );
};

export default Teams;