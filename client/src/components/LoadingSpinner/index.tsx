import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "primary" | "secondary" | "white" | "gray";
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  color = "primary",
  text,
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const colorClasses = {
    primary: "text-blue-600",
    secondary: "text-gray-600",
    white: "text-white",
    gray: "text-gray-400",
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-transparent ${sizeClasses[size]} ${colorClasses[color]}`}
        style={{
          borderTopColor: "currentColor",
        }}
      />
      {text && (
        <p className={`mt-2 text-sm ${colorClasses[color]} animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );
};

// Loading Overlay Component for full page loading
export const LoadingOverlay: React.FC<{
  isVisible: boolean;
  text?: string;
}> = ({ isVisible, text = "Loading..." }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
        <LoadingSpinner size="lg" color="primary" text={text} />
      </div>
    </div>
  );
};

// Inline Loading Component for content areas
export const InlineLoading: React.FC<{
  height?: string;
  text?: string;
}> = ({ height = "200px", text = "Loading..." }) => {
  return (
    <div
      className="flex items-center justify-center w-full bg-gray-50 dark:bg-gray-800 rounded-lg"
      style={{ height }}
    >
      <LoadingSpinner size="lg" color="primary" text={text} />
    </div>
  );
};

// Button Loading State
export const ButtonSpinner: React.FC<{
  size?: "sm" | "md";
}> = ({ size = "sm" }) => {
  return (
    <LoadingSpinner
      size={size}
      color="white"
      className="inline-flex items-center"
    />
  );
};

export default LoadingSpinner;
