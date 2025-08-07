import React from "react";

interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
  rounded?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  height = "h-4",
  width = "w-full",
  rounded = true,
}) => {
  return (
    <div
      className={`
        skeleton 
        ${height} 
        ${width} 
        ${rounded ? "rounded" : ""} 
        bg-gray-200 
        dark:bg-gray-700 
        ${className}
      `}
    />
  );
};

// Card Skeleton for project/task cards
export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton width="w-3/4" height="h-5" />
        <Skeleton width="w-16" height="h-4" />
      </div>
      <Skeleton width="w-full" height="h-3" />
      <Skeleton width="w-2/3" height="h-3" />
      <div className="flex items-center justify-between mt-4">
        <Skeleton width="w-20" height="h-6" rounded />
        <Skeleton width="w-8" height="h-8" rounded />
      </div>
    </div>
  );
};

// Table Skeleton for data tables
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} width="flex-1" height="h-6" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} width="flex-1" height="h-5" />
          ))}
        </div>
      ))}
    </div>
  );
};

// User Card Skeleton
export const UserCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-3">
        <Skeleton width="w-12" height="h-12" rounded />
        <div className="flex-1 space-y-2">
          <Skeleton width="w-3/4" height="h-5" />
          <Skeleton width="w-1/2" height="h-4" />
        </div>
      </div>
    </div>
  );
};

// Dashboard Stats Skeleton
export const StatsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton width="w-8" height="h-8" rounded />
            <Skeleton width="w-12" height="h-4" />
          </div>
          <Skeleton width="w-16" height="h-8" />
          <Skeleton width="w-3/4" height="h-4" />
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
