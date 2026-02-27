import React from "react";

interface MentionHighlighterProps {
  text: string;
}

const MentionHighlighter: React.FC<MentionHighlighterProps> = ({ text }) => {
  if (!text) return null;

  // Split text by mentions (e.g., @username)
  // The parentheses in the regex ensure the delimiter (the mention) is included in the result array
  const parts = text.split(/(@\w+)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("@")) {
          return (
            <span
              key={index}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
            >
              {part}
            </span>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
};

export default MentionHighlighter;
