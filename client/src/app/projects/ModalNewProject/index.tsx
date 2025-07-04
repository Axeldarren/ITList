import Modal from '@/components/Modal';
// Import the useGetTeamsQuery hook
import { useCreateProjectMutation, useGetTeamsQuery } from '@/state/api';
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

  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState('');
  // Add state for the selected team
  const [teamId, setTeamId] = useState('');

  const resetForm = () => {
    setProjectName('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setTeamId(''); // Reset the teamId as well
  };

  const handleSubmit = async () => {
    // Include teamId in the validation
    if (!projectName || !startDate || !endDate || !teamId) return;
    
    const formattedStartDate = formatISO(new Date(startDate), { representation: 'complete' });
    const formattedEndDate = formatISO(new Date(endDate), { representation: 'complete' });

    const promise = createProject({
      name: projectName,
      description,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      teamId: Number(teamId), // Send the teamId to the backend
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
    // Add teamId to the form validation
    return projectName && description && startDate && endDate && teamId;
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