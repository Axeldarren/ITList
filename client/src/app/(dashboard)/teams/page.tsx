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
import { Plus, Edit, Trash2, X, Eye, Users as UsersIcon, UserCog } from "lucide-react";
import Modal from "@/components/Modal";
import toast from "react-hot-toast";
import ModalConfirm from "@/components/ModalConfirm";
import { selectCurrentUser } from "@/state/authSlice";

const ViewMembersModal = ({ isOpen, onClose, team }: { isOpen: boolean, onClose: () => void, team: Team | null }) => {
    if (!isOpen || !team) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} name={`Members of ${team.teamName}`} closeOnBackdropClick>
            <div className="mt-4 space-y-2 max-h-96 overflow-y-auto pr-1">
                {team.users && team.users.length > 0 ? (
                    team.users.map((user: User) => (
                        <div key={user.userId} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-dark-tertiary transition-colors hover:bg-gray-100 dark:hover:bg-dark-tertiary/80">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xs font-bold flex-shrink-0">
                                {user.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{user.username}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                            </div>
                            {user.userId === team.projectManagerUserId && (
                                <span className="ml-auto flex-shrink-0 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                    PM
                                </span>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <UsersIcon size={32} className="text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No members assigned yet.</p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

type MultiUserSelectorProps = {
    allUsers: User[];
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    pmId: string;
};

const MultiUserSelector = ({ allUsers, selectedIds, onSelectionChange, pmId }: MultiUserSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedUsers = useMemo(() => allUsers.filter(u => u.userId !== undefined && selectedIds.includes(u.userId)), [allUsers, selectedIds]);
    const availableUsers = useMemo(() => allUsers.filter(u => u.userId !== undefined && !selectedIds.includes(u.userId)), [allUsers, selectedIds]);

    const handleSelect = (userId: string) => {
        onSelectionChange([...selectedIds, userId]);
    };

    const handleRemove = (userId: string) => {
        onSelectionChange(selectedIds.filter(id => id !== userId));
    };

    const isRemovable = (userId: string) => userId !== pmId;

    return (
        <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-1.5">Team Members</label>
            <div
                className="flex flex-wrap gap-1.5 rounded-xl border border-gray-200 p-2.5 min-h-[44px] dark:border-gray-700 bg-white dark:bg-dark-tertiary cursor-text"
                onClick={() => setIsOpen(true)}
            >
                {selectedUsers.map((user: User) => (
                    <span key={user.userId} className="flex items-center gap-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                        {user.username}
                        {user.userId !== undefined && isRemovable(user.userId) && (
                            <button type="button" onClick={(e) => { e.stopPropagation(); handleRemove(user.userId!); }} className="text-blue-400 hover:text-blue-700 dark:hover:text-blue-100 cursor-pointer">
                                <X size={12} />
                            </button>
                        )}
                    </span>
                ))}
                <button type="button" onClick={() => setIsOpen(!isOpen)} className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-white px-1 cursor-pointer">
                    + Add member
                </button>
            </div>
            {isOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white dark:bg-dark-secondary border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    <ul className="py-1">
                        {availableUsers.length > 0 ? availableUsers.map((user: User) => (
                            <li
                                key={user.userId}
                                onClick={() => { if (user.userId !== undefined) handleSelect(user.userId); setIsOpen(false); }}
                                className="px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-dark-tertiary cursor-pointer text-sm text-gray-800 dark:text-gray-200 transition-colors"
                            >
                                {user.username}
                            </li>
                        )) : (
                            <li className="px-4 py-3 text-sm text-gray-400 italic">No other users available</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

type TeamFormProps = {
    initialData?: Partial<Team> & { users?: User[] };
    allUsers?: User[];
    onSubmit: (data: Partial<Team> & { memberIds: string[] }) => void;
    isLoading: boolean;
};

const TeamForm: React.FC<TeamFormProps> = ({ initialData, allUsers = [], onSubmit, isLoading }) => {
    const [teamName, setTeamName] = useState('');
    const [pmId, setPmId] = useState('');
    const [memberIds, setMemberIds] = useState<string[]>([]);

    useEffect(() => {
        setTeamName(initialData?.teamName || '');
        const initialPmId = initialData?.projectManagerUserId || '';
        setPmId(String(initialPmId));
        const initialMemberIds = new Set(initialData?.users?.map(u => u.userId!) || []);
        if (initialPmId) initialMemberIds.add(initialPmId);
        setMemberIds(Array.from(initialMemberIds));
    }, [initialData]);

    const handlePmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPmId = e.target.value;
        setPmId(e.target.value);
        if (newPmId) setMemberIds(Array.from(new Set([...memberIds, newPmId])));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ teamName, projectManagerUserId: pmId, memberIds });
    };

    const inputStyles = "w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 text-sm shadow-sm dark:border-gray-700 dark:bg-dark-tertiary dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all";

    return (
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700 dark:text-white">Team Name</label>
                <input type="text" placeholder="e.g. Frontend Squad" value={teamName} onChange={(e) => setTeamName(e.target.value)} className={inputStyles} required />
            </div>
            <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700 dark:text-white">Project Manager</label>
                <select value={pmId} onChange={handlePmChange} className={inputStyles} required>
                    <option value="">Select Project Manager</option>
                    {allUsers.map((user: User) => <option key={user.userId} value={user.userId}>{user.username}</option>)}
                </select>
            </div>
            <MultiUserSelector allUsers={allUsers} selectedIds={memberIds} onSelectionChange={setMemberIds} pmId={pmId} />
            <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-600 transition-all disabled:opacity-50 cursor-pointer"
            >
                {isLoading ? 'Saving...' : 'Save Team'}
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
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const handleViewClick = (team: Team) => { setSelectedTeam(team); setIsViewModalOpen(true); };
  const handleEditClick = (team: Team) => { setSelectedTeam(team); setIsEditModalOpen(true); };
  const handleDeleteClick = (team: Team) => { setSelectedTeam(team); setIsConfirmModalOpen(true); };

  const handleCreateSubmit = (teamData: Partial<Team> & { memberIds: string[] }) => {
    toast.promise(createTeam(teamData).unwrap(), {
        loading: 'Creating team...',
        success: 'Team created successfully!',
        error: 'Failed to create team.',
    }).finally(() => setIsNewModalOpen(false));
  };

  const handleUpdateSubmit = (teamData: Partial<Team> & { memberIds: string[] }) => {
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
        field: "index", headerName: "#", width: 60,
        renderCell: (params) => teams ? teams.indexOf(params.row) + 1 : 0,
    },
    { field: "id", headerName: "Team ID", width: 80 },
    { field: "teamName", headerName: "Team Name", width: 220,
        renderCell: (params) => (
            <div className="flex items-center gap-2 h-full">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 flex-shrink-0">
                    <UsersIcon size={14} className="text-blue-500" />
                </div>
                <span className="font-semibold text-sm text-gray-900 dark:text-white">{params.value}</span>
            </div>
        )
    },
    {
        field: "users",
        headerName: "Members",
        width: 160,
        renderCell: (params) => (
            <div className="flex items-center h-full gap-2">
                <div className="flex -space-x-2 overflow-hidden">
                    {params.row.users?.slice(0, 4).map((user: User) => (
                        <div
                            key={user.userId}
                            title={user.username}
                            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white dark:border-dark-secondary bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs font-bold"
                        >
                            {user.username.substring(0, 2).toUpperCase()}
                        </div>
                    ))}
                    {params.row.users?.length > 4 && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 border-2 border-white dark:border-dark-secondary dark:bg-dark-tertiary dark:text-gray-300">
                            +{params.row.users.length - 4}
                        </div>
                    )}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{params.row.users?.length || 0}</span>
            </div>
        )
    },
    { field: "projectManagerUsername", headerName: "Project Manager", width: 200,
        renderCell: (params) => (
            <div className="flex items-center gap-2 h-full">
                <UserCog size={14} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm">{params.value || '—'}</span>
            </div>
        )
    },
  ];

  if (currentUser?.role === 'ADMIN') {
      columns.push({
        field: 'actions',
        type: 'actions',
        headerName: 'Actions',
        width: 120,
        cellClassName: 'actions',
        getActions: ({ row }) => [
          <GridActionsCellItem key="view" icon={<Eye size={16} />} label="View" onClick={() => handleViewClick(row)} />,
          <GridActionsCellItem key="edit" icon={<Edit size={16} />} label="Edit" onClick={() => handleEditClick(row)} />,
          <GridActionsCellItem key="delete" icon={<Trash2 size={16} />} label="Delete" onClick={() => handleDeleteClick(row)} />,
        ],
      });
  }

  if (teamsLoading || usersLoading) return (
    <div className="flex w-full flex-col p-6 lg:p-8">
      <div className="animate-pulse h-8 w-28 rounded-lg bg-gray-200 dark:bg-gray-700 mb-6" />
      <div className="mb-6 grid grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white dark:bg-dark-secondary dark:border-gray-800 p-5 shadow-sm">
            <div className="flex items-center gap-3">
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
          {[60, 80, 220, 160, 200, 120].map((w, i) => (
            <div key={i} className="animate-pulse h-4 rounded bg-gray-300 dark:bg-gray-600 flex-shrink-0" style={{ width: w }} />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-t border-gray-100 dark:border-gray-800 px-4 py-4">
            <div className="animate-pulse h-4 w-8 rounded bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
            <div className="animate-pulse h-4 w-12 rounded bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
            <div className="animate-pulse h-4 w-48 rounded bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
            <div className="flex -space-x-2">
              {[...Array(3)].map((_, j) => <div key={j} className="animate-pulse h-7 w-7 rounded-full bg-gray-200 dark:bg-gray-700" />)}
            </div>
            <div className="animate-pulse h-4 w-40 rounded bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );

  if (isError || !teams) return <div className="p-8 text-red-500">Error fetching teams</div>;

  const totalMembers = teams.reduce((acc, t) => acc + (t.users?.length || 0), 0);

  return (
    <div className="flex w-full flex-col p-6 lg:p-8">
      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} name="Create New Team" closeOnBackdropClick={false}>
          <TeamForm allUsers={users?.filter(u => u.role !== 'BUSINESS_OWNER')} onSubmit={handleCreateSubmit} isLoading={isCreating} />
      </Modal>
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} name="Edit Team" closeOnBackdropClick={false}>
          <TeamForm initialData={selectedTeam ?? undefined} allUsers={users?.filter(u => u.role !== 'BUSINESS_OWNER')} onSubmit={handleUpdateSubmit} isLoading={isUpdating} />
      </Modal>
      <ModalConfirm
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Team"
        message={`Are you sure you want to delete "${selectedTeam?.teamName}"? This will unassign all users and projects from this team.`}
        isLoading={isDeleting}
      />
      <ViewMembersModal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} team={selectedTeam} />

      <Header name="Teams" buttonComponent={
          currentUser?.role === 'ADMIN' && (
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-blue-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-600 transition-all cursor-pointer"
            >
                <Plus size={16} /> Add Team
            </button>
          )
      } />

      {/* Stats */}
      <div className="mt-4 mb-6 grid grid-cols-2 gap-4 max-w-sm">
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white dark:bg-dark-secondary dark:border-gray-800 p-5 shadow-sm">
          <div className="absolute left-0 top-0 h-full w-1 bg-blue-500" />
          <div className="flex items-center gap-3 pl-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 dark:bg-dark-tertiary">
              <UsersIcon size={18} className="text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Total Teams</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{teams.length}</p>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white dark:bg-dark-secondary dark:border-gray-800 p-5 shadow-sm">
          <div className="absolute left-0 top-0 h-full w-1 bg-green-500" />
          <div className="flex items-center gap-3 pl-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 dark:bg-dark-tertiary">
              <UsersIcon size={18} className="text-green-500" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Total Members</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalMembers}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm min-w-[640px]" style={{ height: 560 }}>
          <DataGrid
            rows={teams || []}
            columns={columns}
            sx={dataGridSxStyles(isDarkMode)}
            getRowId={(row) => row.id}
            rowHeight={60}
          />
        </div>
      </div>
    </div>
  );
};

export default Teams;
