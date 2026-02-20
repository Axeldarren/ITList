import React, { useState } from 'react';
import { formatISO } from 'date-fns';
import { useAppSelector } from '@/app/redux';
import { selectCurrentUser } from '@/state/authSlice';
import { toast } from 'react-hot-toast';
import Modal from '@/components/Modal';
import { useCreateProjectMutation, useGetTeamsQuery, useGetTicketsWithStatusCRQuery, useGetUsersQuery } from '@/state/api';

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

const ModalNewProject = ({ isOpen, onClose }: Props) => {
    const [createProject, { isLoading }] = useCreateProjectMutation();
    const { data: teams, isLoading: teamsLoading } = useGetTeamsQuery();
    const { data: ticketsCR } = useGetTicketsWithStatusCRQuery();
    const { data: users } = useGetUsersQuery();
    const currentUser = useAppSelector(selectCurrentUser);

    const [projectName, setProjectName] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [docUrl, setDocUrl] = useState('');
    const [teamId, setTeamId] = useState('');
    const [ticketId, setTicketId] = useState('');
    const [productOwnerUserId, setProductOwnerUserId] = useState('');

    const resetForm = () => {
        setProjectName('');
        setDescription('');
        setStartDate('');
        setEndDate('');
        setDocUrl('');
        setTeamId('');
        setTicketId('');
        setProductOwnerUserId('');
    };

    const handleSubmit = async () => {
        const isTicketRequired = !(currentUser?.role === 'ADMIN');
        if (!projectName || !startDate || !endDate || !teamId || (isTicketRequired && !ticketId)) {
            toast.error('All required fields must be filled.');
            return;
        }
        const formattedStartDate = formatISO(new Date(startDate), { representation: 'complete' });
        const formattedEndDate = formatISO(new Date(endDate), { representation: 'complete' });

            const payload: {
                name: string;
                description: string;
                startDate: string;
                endDate: string;
                teamId: number;
                ticket_id: string;
                docUrl?: string;
                productOwnerUserId?: string;
            } = {
            name: projectName,
            description,
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            teamId: Number(teamId),
            ticket_id: ticketId,
        };
        if (docUrl) payload.docUrl = docUrl;
        if (productOwnerUserId) payload.productOwnerUserId = productOwnerUserId;

        const promise = createProject(payload).unwrap();

        toast.promise(promise, {
            loading: 'Creating project...',
            success: (data) => {
                resetForm();
                onClose();
                return `Project "${data.name}" created successfully!`;
            },
            error: 'Failed to create project.'
        });
    };

    const isFormValid = () => {
        const isTicketRequired = !(currentUser?.role === 'ADMIN');
        return projectName && description && startDate && endDate && teamId && (!isTicketRequired || ticketId);
    };

    const inputStyles = 'w-full rounded border border-gray-300 p-2 shadow-sm dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none';
    const selectStyles = 'w-full rounded border border-gray-300 p-2 shadow-sm dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none';

    return (
        <Modal isOpen={isOpen} onClose={onClose} name="Create New Project" closeOnBackdropClick={false}>
            <form
                className='mt-4 space-y-6'
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
            >
                <input
                    type='text'
                    className={inputStyles}
                    placeholder='Project Name'
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    required
                />
                <textarea
                    className={inputStyles}
                    placeholder='Description'
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                />
                <input
                    type='url'
                    className={inputStyles}
                    placeholder='Document URL'
                    value={docUrl}
                    onChange={(e) => setDocUrl(e.target.value)}
                />
                <select
                    className={selectStyles}
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    disabled={teamsLoading}
                    required
                >
                    <option value=''>Select a Team</option>
                    {teams?.map((team) => (
                        <option key={team.id} value={team.id}>
                            {team.teamName}
                        </option>
                    ))}
                </select>
                <select
                    className={selectStyles}
                    value={productOwnerUserId}
                    onChange={(e) => setProductOwnerUserId(e.target.value)}
                >
                    <option value=''>Select Business Owner (Optional)</option>
                    {users?.filter(u => u.role === 'BUSINESS_OWNER').map((user) => (
                        <option key={user.userId} value={user.userId}>
                            {user.username}
                        </option>
                    ))}
                </select>
                <select
                    className={selectStyles}
                    value={ticketId}
                    onChange={(e) => setTicketId(e.target.value)}
                    required={!(currentUser?.role === 'ADMIN')}
                >
                    <option value=''>
                        {currentUser?.role === 'ADMIN' ? 'Select a Ticket (Optional)' : 'Select a Ticket'}
                    </option>
                    {ticketsCR?.map((ticket) => (
                        <option key={ticket.ticket_id} value={String(ticket.ticket_id)}>
                            {ticket.ticket_id} - {ticket.description_ticket}
                        </option>
                    ))}
                </select>
                <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-2'>
                    <input
                        type='date'
                        className={inputStyles}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                    />
                    <input
                        type='date'
                        className={inputStyles}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                    />
                </div>
                <button
                    type='submit'
                    className={`mt-4 flex w-full justify-center rounded-md border-transparent bg-blue-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus-offset-2 ${!isFormValid() || isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                    disabled={!isFormValid() || isLoading}
                >
                    {isLoading ? 'Creating...' : 'Create Project'}
                </button>
            </form>
        </Modal>
    );
};

export default ModalNewProject;