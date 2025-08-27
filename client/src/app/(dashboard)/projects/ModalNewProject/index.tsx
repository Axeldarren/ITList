import Modal from '@/components/Modal';
// Import the useGetTeamsQuery hook
import { useCreateProjectMutation, useGetTeamsQuery } from '@/state/api';
import { useGetTicketsWithStatusCRQuery } from '@/state/api';
import React, { useState } from 'react'
import { formatISO } from 'date-fns';
import toast from 'react-hot-toast';

type Props = {
    isOpen: boolean;
    onClose: () => void;
}

const ModalNewProject = ({isOpen, onClose}: Props) => {
  const [createProject, { isLoading }] = useCreateProjectMutation();
  
  // Fetch the list of teams
  const { data: teams, isLoading: teamsLoading } = useGetTeamsQuery();

    // Fetch the list of tickets
    const { data: ticketsCR } = useGetTicketsWithStatusCRQuery();

  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState('');
    const [prdUrl, setPrdUrl] = useState('');
  // Add state for the selected team
  const [teamId, setTeamId] = useState('');
    // Add state for the selected ticket
    const [ticketId, setTicketId] = useState('');

    const resetForm = () => {
        setProjectName('');
        setDescription('');
        setStartDate('');
        setEndDate('');
        setPrdUrl('');
        setTeamId('');
        setTicketId('');
    };

    const handleSubmit = async () => {
        // Include teamId and ticketId in the validation
        if (!projectName || !startDate || !endDate || !teamId || !ticketId) {
            toast.error('All fields are required.');
            return;
        }
        const formattedStartDate = formatISO(new Date(startDate), { representation: 'complete' });
        const formattedEndDate = formatISO(new Date(endDate), { representation: 'complete' });

        const promise = createProject({
            name: projectName,
            description,
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            teamId: Number(teamId), // Send the teamId to the backend
            ...(prdUrl ? { prdUrl } : {}),
            ticket_id: ticketId,
        }).unwrap();

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
        // Add teamId and ticketId to the form validation (prdUrl optional)
        return projectName && description && startDate && endDate && teamId && ticketId;
    }

  const inputStyles = 
    "w-full rounded border border-gray-300 p-2 shadow-sm dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none"

  const selectStyles =
    "w-full rounded border border-gray-300 p-2 shadow-sm dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";


  return (
    <Modal isOpen={isOpen} onClose={onClose} name="Create New Project">
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
                onChange={(e) => setProjectName(e.target.value)} required 
            />
            <textarea
                className={inputStyles} 
                placeholder='Description' 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} required 
            />
            <input 
                type='url' 
                className={inputStyles} 
                placeholder='PRD (Google Docs) URL'
                value={prdUrl}
                onChange={(e) => setPrdUrl(e.target.value)}
            />
            {/* Add the team selection dropdown */}
            <select
                className={selectStyles}
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                disabled={teamsLoading}
                required
            >
                <option value="">Select a Team</option>
                {teams?.map((team) => (
                    <option key={team.id} value={team.id}>
                        {team.teamName}
                    </option>
                ))}
            </select>
            {/* Ticket selection dropdown (required) */}
            <select
                className={selectStyles}
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                required
            >
                <option value="">Select a Ticket</option>
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
                    onChange={(e) => setStartDate(e.target.value)} required 
                />
                <input 
                    type='date' 
                    className={inputStyles} 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} required 
                />
            </div>
            <button
                type='submit'
                className={`mt-4 flex w-full justify-center rounded-md border-transparent bg-blue-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus-offset-2 ${
                    !isFormValid() || isLoading ? "cursor-not-allowed opacity-50" : ""
                }`}
                disabled={!isFormValid() || isLoading}
            >
                {isLoading ? 'Creating...' : 'Create Project'}
            </button>
        </form>
    </Modal>
  )
}

export default ModalNewProject