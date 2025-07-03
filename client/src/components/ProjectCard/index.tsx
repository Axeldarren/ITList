import { Project, useDeleteProjectMutation } from '@/state/api'; // Import the mutation
import React from 'react';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react'; // Import an icon

type Props = {
    project: Project;
};

const ProjectCard = ({ project }: Props) => {
    const [deleteProject, { isLoading }] = useDeleteProjectMutation();

    const handleDelete = async () => {
        // IMPORTANT: Always confirm a destructive action
        if (window.confirm(`Are you sure you want to delete the "${project.name}" project? This cannot be undone.`)) {
            const promise = deleteProject(project.id).unwrap();

            toast.promise(promise, {
                loading: 'Deleting project...',
                success: `Project "${project.name}" deleted successfully!`,
                error: 'Failed to delete project.'
            });
        }
    };

    return (
        <div className='relative rounded border p-4 shadow'>
            <div className="absolute top-2 right-2">
                <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="p-1 text-gray-400 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Delete project"
                >
                    <Trash2 size={18} />
                </button>
            </div>
            <h3>{project.name}</h3>
            <p>{project.description}</p>
            <p>Start Date: {project.startDate}</p>
            <p>End Date: {project.endDate}</p>
        </div>
    );
};

export default ProjectCard;