import React, { useState, useMemo } from "react";
import Modal from "@/components/Modal";
import Calendar from "@/components/Calendar";
import { useGetTimeLogsQuery } from "@/state/api";
import { format, parseISO } from "date-fns";
import { Clock, Calendar as CalendarIcon, Play, Square, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

interface ModalViewTimeLogsProps {
  isOpen: boolean;
  onClose: () => void;
  developer: {
    userId: string;
    username: string;
    profilePictureUrl?: string;
    role?: string;
  };
  startMonth: string;
  endMonth: string;
  projectId?: number;
}

const LOGS_PER_PAGE = 4;

const ModalViewTimeLogs: React.FC<ModalViewTimeLogsProps> = ({
  isOpen,
  onClose,
  developer,
  startMonth,
  endMonth,
  projectId,
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'recent' | 'byDate'>('recent');
  
  const { data: timeLogs = [], isLoading } = useGetTimeLogsQuery({
    userId: developer.userId,
    startMonth,
    endMonth,
    projectId
  });

  // Format duration helper
  const formatDuration = (seconds: number): string => {
    if (!seconds || seconds < 60) return `0m`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return [h > 0 ? `${h}h` : '', m > 0 ? `${m}m` : ''].filter(Boolean).join(' ');
  };

  // Sort all logs by date descending (most recent first)
  const sortedLogs = useMemo(() => {
    return [...timeLogs].sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }, [timeLogs]);

  // Filter logs by selected date (only when viewMode is 'byDate')
  const filteredLogs = useMemo(() => {
    if (viewMode === 'recent' || !selectedDate) {
      return sortedLogs;
    }
    return sortedLogs.filter(log => {
      const logDate = format(parseISO(log.startTime), 'yyyy-MM-dd');
      return logDate === selectedDate;
    });
  }, [sortedLogs, selectedDate, viewMode]);

  // Pagination for filtered logs
  const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * LOGS_PER_PAGE;
    return filteredLogs.slice(start, start + LOGS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  // Reset page when date or view mode changes
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setViewMode('byDate');
    setCurrentPage(1);
  };

  const handleViewModeChange = (mode: 'recent' | 'byDate') => {
    setViewMode(mode);
    if (mode === 'recent') {
      setSelectedDate(null);
    }
    setCurrentPage(1);
  };

  // Group logs by date for date selector
  const logsByDate = useMemo(() => {
    const grouped = timeLogs.reduce((acc, log) => {
      const date = format(parseISO(log.startTime), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(log);
      return acc;
    }, {} as Record<string, typeof timeLogs>);

    // Sort dates in descending order
    return Object.keys(grouped)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .reduce((acc, date) => {
        acc[date] = grouped[date];
        return acc;
      }, {} as Record<string, typeof timeLogs>);
  }, [timeLogs]);

  // Calculate total time for selected date
  const totalTimeForDate = filteredLogs.reduce((sum, log) => {
    return sum + (log.endTime ? 
      (new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) / 1000 : 0);
  }, 0);

  // Format date range label
  const monthLabel = startMonth === endMonth
    ? format(new Date(`${startMonth}-01`), 'MMMM yyyy')
    : `${format(new Date(`${startMonth}-01`), 'MMM yyyy')} - ${format(new Date(`${endMonth}-01`), 'MMM yyyy')}`;

  return (
  <Modal isOpen={isOpen} onClose={onClose} name="" closeOnBackdropClick>
      <div className="max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-600 pb-4 mb-6">
          <div className="flex items-center gap-3 mb-4">
            {developer.profilePictureUrl ? (
              <Image
                src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${developer.profilePictureUrl}`}
                alt={developer.username}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-dark-bg"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white font-bold text-lg">
                {developer.username.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {developer.username}&apos;s Time Logs
                </h3>
                {developer.role === 'ADMIN' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {monthLabel}
              </p>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => handleViewModeChange('recent')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'recent'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-dark-tertiary text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => handleViewModeChange('byDate')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'byDate'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-dark-tertiary text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                By Date
              </button>
            </div>
          </div>

          {/* Date Filter - show when in byDate mode */}
          {viewMode === 'byDate' && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-400" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Filter by date:
                </label>
              </div>
              <Calendar
                value={selectedDate || format(new Date(), 'yyyy-MM-dd')}
                onChange={handleDateChange}
                placeholder="Select Date"
                className="min-w-[200px]"
                highlightedDates={Object.keys(logsByDate)}
              />
            </div>
          )}

          {/* Selected Date Summary - only show in byDate mode with selected date */}
          {viewMode === 'byDate' && selectedDate && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon size={16} className="text-blue-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {format(new Date(selectedDate), 'EEEE, MMMM dd, yyyy')}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-purple-500" />
                  <span className="text-lg font-bold text-purple-600">
                    {formatDuration(totalTimeForDate)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Recent View Summary */}
          {viewMode === 'recent' && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-green-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    All recent time logs
                  </span>
                  <span className="text-xs text-gray-500">
                    ({timeLogs.length} total)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Time Logs List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Loading time logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8">
            <Clock size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {viewMode === 'byDate' && selectedDate 
                ? `No time logs found for ${format(new Date(selectedDate), 'MMMM dd, yyyy')}`
                : 'No time logs found for this period'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedLogs.map((log) => {
                const startTime = new Date(log.startTime);
                const endTime = log.endTime ? new Date(log.endTime) : null;
                const duration = endTime ? 
                  (endTime.getTime() - startTime.getTime()) / 1000 : 0;

                return (
                  <div
                    key={log.id}
                    className="p-4 bg-white dark:bg-dark-secondary border border-gray-200 dark:border-gray-600 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {endTime ? (
                          <Square size={16} className="text-red-500" fill="currentColor" />
                        ) : (
                          <Play size={16} className="text-green-500" fill="currentColor" />
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {log.task?.title || 'No task specified'}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-purple-600">
                          {formatDuration(duration)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {endTime ? 'Completed' : 'In Progress'}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <div className="flex items-center gap-4">
                        <span>
                          Started: {format(startTime, 'h:mm a')}
                        </span>
                        {endTime && (
                          <span>
                            Ended: {format(endTime, 'h:mm a')}
                          </span>
                        )}
                      </div>
                    </div>

                    {log.description && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-dark-tertiary p-2 rounded">
                        {log.description}
                      </p>
                    )}

                    {log.task?.project && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Project: {log.task.project.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {(currentPage - 1) * LOGS_PER_PAGE + 1}-{Math.min(currentPage * LOGS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300 px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default ModalViewTimeLogs;