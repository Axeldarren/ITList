import React from 'react';
import TaskCardSkeleton from '@/components/TaskCardSkeleton';

const BoardViewSkeleton = () => {
  const columns = [1, 2, 3, 4]; // To render 4 skeleton columns
  const tasksPerColumn = [1, 2]; // To render 2 skeleton cards per column

  return (
    <div className='grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-4'>
      {columns.map(col => (
        <div key={col} className="sl:py-4 rounded-lg py-2 xl:px-2">
          {/* Column Header Skeleton */}
          <div className="mb-3 flex w-full">
            <div className="w-2 rounded-s-lg bg-gray-300 dark:bg-gray-600" />
            <div className="flex w-full items-center justify-between rounded-e-lg bg-white px-5 py-4 dark:bg-[#1d1f21]">
                <div className="h-6 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-6 w-1/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
          </div>
          {/* Task Card Skeletons */}
          {tasksPerColumn.map(task => (
            <TaskCardSkeleton key={task} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default BoardViewSkeleton;