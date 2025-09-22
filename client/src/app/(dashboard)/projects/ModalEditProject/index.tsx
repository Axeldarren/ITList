import Modal from "@/components/Modal";
// Import useGetTeamsQuery to fetch the list of teams
import {
  Project,
  useUpdateProjectMutation,
  useGetTeamsQuery,
  useGetTicketsWithStatusCRQuery,
} from "@/state/api";
import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
};

const ModalEditProject = ({ isOpen, onClose, project }: Props) => {
  const [updateProject, { isLoading }] = useUpdateProjectMutation();
  // --- NEW: Fetch the list of all teams ---
  const { data: teams, isLoading: teamsLoading } = useGetTeamsQuery();
  const { data: ticketsCR } = useGetTicketsWithStatusCRQuery();

  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
    const [docUrl, setDocUrl] = useState("");
  // --- NEW: Add state for the selected team ---
  const [teamId, setTeamId] = useState<string>("");
  const [ticketId, setTicketId] = useState<string>("");

  useEffect(() => {
    if (project) {
      setProjectName(project.name);
      setDescription(project.description || "");
      setTeamId(project.teamId?.toString() || ""); // Set initial team
        setDocUrl(project.docUrl || "");
      setTicketId(
        project.projectTicket?.ticket_id
          ? String(project.projectTicket.ticket_id)
          : "",
      );
      if (project.startDate) {
        setStartDate(format(parseISO(project.startDate), "yyyy-MM-dd"));
      }
      if (project.endDate) {
        setEndDate(format(parseISO(project.endDate), "yyyy-MM-dd"));
      }
    }
  }, [project]);

  const handleSubmit = async () => {
    if (!project || !projectName || !teamId) return;

    const promise = updateProject({
      id: project.id,
      name: projectName,
      description,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      teamId: Number(teamId),
        docUrl: docUrl || undefined,
      ticket_id: ticketId || undefined,
    }).unwrap();

    toast.promise(
      promise.then(() => {
        // Wait a tick to allow refetch
        setTimeout(() => {
          onClose();
        }, 100);
      }),
      {
        loading: "Updating project...",
        success: "Project updated successfully!",
        error: "Failed to update project.",
      },
    );
  };

  const inputStyles =
    "w-full rounded border border-gray-300 p-2 shadow-sm dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";
  const selectStyles =
    "w-full rounded border border-gray-300 p-2 shadow-sm dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";

  return (
  <Modal isOpen={isOpen} onClose={onClose} name="Edit Project" closeOnBackdropClick={false}>
      <form
        className="mt-4 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <input
          type="text"
          className={inputStyles}
          placeholder="Project Name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          required
        />
        <textarea
          className={inputStyles}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
          <input
            type="url"
            className={inputStyles}
            placeholder="Document URL"
            value={docUrl}
            onChange={(e) => setDocUrl(e.target.value)}
          />
        {/* --- NEW: Team selection dropdown --- */}
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

        <select
          id="ticketId"
          value={ticketId}
          onChange={(e) => setTicketId(e.target.value)}
          className={selectStyles}
        >
          <option value="">No Ticket</option>
          {ticketsCR?.map((ticket) => (
            <option key={ticket.ticket_id} value={String(ticket.ticket_id)}>
              {ticket.ticket_id} - {ticket.description_ticket}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-2">
          <input
            type="date"
            className={inputStyles}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <input
            type="date"
            className={inputStyles}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className={`bg-blue-primary focus-offset-2 mt-4 flex w-full justify-center rounded-md border-transparent px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none ${isLoading ? "cursor-not-allowed opacity-50" : ""}`}
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </Modal>
  );
};

export default ModalEditProject;
