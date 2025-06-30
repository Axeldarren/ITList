import React from 'react';

// A generic, reusable skeleton block component
const SkeletonBlock = ({ className }: { className: string }) => (
  <div className={`animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${className}`} />
);

const TaskCardSkeleton = () => {
  return (
    <div className='flex flex-col rounded-lg bg-white p-4 shadow-md dark:bg-[#1d1f21]'>
      {/* Header Skeleton */}
      <div className="mb-4 flex items-start justify-between">
        <SkeletonBlock className="h-6 w-3/4" />
        <SkeletonBlock className="h-5 w-5 rounded-full" />
      </div>

      {/* Description Skeleton */}
      <div className="space-y-2">
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-5/6" />
      </div>
      
      {/* Spacer */}
      <div className="flex-grow"></div>

      {/* Divider */}
      <div className="my-4 border-t border-gray-200 dark:border-[#2d3135]"></div>

      {/* Footer Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SkeletonBlock className="h-5 w-10" />
          <SkeletonBlock className="h-5 w-10" />
        </div>
        <div className="flex -space-x-3">
          <SkeletonBlock className="h-8 w-8 rounded-full border-2 border-white dark:border-[#1d1f21]" />
          <SkeletonBlock className="h-8 w-8 rounded-full border-2 border-white dark:border-[#1d1f21]" />
        </div>
      </div>
    </div>
  );
};

export default TaskCardSkeleton;