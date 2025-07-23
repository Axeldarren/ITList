"use client";

import { Attachment } from "@/state/api";
import { Trash2 } from "lucide-react";
import React from "react";

// --- THIS IS THE FIX ---
// The 'attachment' prop was missing from the type definition.
type Props = {
  attachment: Attachment;
  readOnly?: boolean;
  onDelete?: (attachmentId: number) => void;
};

const AttachmentViewer = ({ attachment, readOnly = false, onDelete = () => {} }: Props) => {
  return (
    <div className="dark:bg-dark-tertiary flex items-center justify-between rounded bg-gray-200 p-2">
      <a
        href={`${process.env.NEXT_PUBLIC_API_BASE_URL}${attachment.fileURL}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-grow truncate pr-4 hover:underline dark:text-gray-200"
      >
        {attachment.fileName || "Untitled Attachment"}
      </a>
      {!readOnly && (
        <button
          onClick={() => onDelete(attachment.id)}
          className="ml-4 flex-shrink-0 rounded-full p-1 text-red-500 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/50"
          aria-label="Delete attachment"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
};

export default AttachmentViewer;