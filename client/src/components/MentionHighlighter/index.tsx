import React from "react";

interface MentionHighlighterProps {
  text: string;
  isOnDark?: boolean; // true when rendered inside a coloured bubble (e.g. own message)
}

const MentionHighlighter: React.FC<MentionHighlighterProps> = ({ text, isOnDark = false }) => {
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
              className={
                isOnDark
                  ? "text-white/90 font-semibold underline underline-offset-2 cursor-pointer"
                  : "text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
              }
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
