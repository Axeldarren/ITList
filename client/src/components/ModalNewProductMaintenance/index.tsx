import React, { useState } from "react";
import { X, Plus } from "lucide-react";
import {
  useCreateProductMaintenanceMutation,
  useGetFinishedProjectsQuery,
  useGetUsersQuery,
} from "@/state/api";
import toast from "react-hot-toast";
import Modal from "@/components/Modal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const ModalNewProductMaintenance = ({ isOpen, onClose }: Props) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [projectId, setProjectId] = useState<number | "">(""); 
  const [selectedMaintainers, setSelectedMaintainers] = useState<string[]>([]);
  const [showUserSelect, setShowUserSelect] = useState(false);

  const [createProductMaintenance, { isLoading: isCreating }] = useCreateProductMaintenanceMutation();
  const { data: finishedProjects } = useGetFinishedProjectsQuery();
  const { data: users } = useGetUsersQuery();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Product maintenance name is required");
      return;
    }

    try {
      await createProductMaintenance({
        name: name.trim(),
        description: description.trim() || undefined,
        priority,
        projectId: projectId || undefined,
        maintainerIds: selectedMaintainers,
      }).unwrap();

      toast.success("Product maintenance created successfully!");
      onClose();
      resetForm();
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'data' in error && 
                          error.data && typeof error.data === 'object' && 'message' in error.data
                          ? (error.data as { message: string }).message
                          : "Failed to create product maintenance";
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPriority("Medium");
    setProjectId("");
    setSelectedMaintainers([]);
    setShowUserSelect(false);
  };

  const handleMaintainerToggle = (userId: string) => {
    setSelectedMaintainers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
  <Modal isOpen={isOpen} onClose={handleClose} name="Create Product Maintenance" closeOnBackdropClick={false}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium dark:text-white">
            Name *
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
            placeholder="Enter maintenance name..."
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="mb-2 block text-sm font-medium dark:text-white">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
            placeholder="Describe the maintenance work..."
          />
        </div>

        {/* Priority */}
        <div>
          <label htmlFor="priority" className="mb-2 block text-sm font-medium dark:text-white">
            Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        {/* Related Project */}
        <div>
          <label htmlFor="project" className="mb-2 block text-sm font-medium dark:text-white">
            Related Project (Optional)
          </label>
          <select
            id="project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : "")}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
          >
            <option value="">No related project</option>
            {finishedProjects?.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            You can create maintenance for finished projects or start fresh
          </p>
        </div>

        {/* Maintainers */}
        <div>
          <label className="mb-2 block text-sm font-medium dark:text-white">
            Maintainers
          </label>
          <div className="space-y-2">
            {selectedMaintainers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedMaintainers.map((userId) => {
                  const user = users?.find(u => u.userId === userId);
                  return (
                    <span
                      key={userId}
                      className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      {user?.username}
                      <button
                        type="button"
                        onClick={() => handleMaintainerToggle(userId)}
                        className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            
            <button
              type="button"
              onClick={() => setShowUserSelect(!showUserSelect)}
              className="flex items-center gap-1 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 dark:border-gray-600 dark:text-gray-400"
            >
              <Plus className="h-4 w-4" />
              Add Maintainer
            </button>

            {showUserSelect && (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-300 bg-white dark:border-gray-600 dark:bg-dark-tertiary">
                {users?.map((user) => {
                  if (!user.userId) return null;
                  return (
                    <label
                      key={user.userId}
                      className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMaintainers.includes(user.userId)}
                        onChange={() => user.userId && handleMaintainerToggle(user.userId)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm dark:text-white">{user.username}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isCreating}
            className="rounded-lg bg-blue-primary px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {isCreating ? "Creating..." : "Create Maintenance"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ModalNewProductMaintenance;
