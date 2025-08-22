import { formatDuration } from 'date-fns';
import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

// LiveTimerDisplay: shows a live-updating timer for a running log
const LiveTimerDisplay = ({ runningLog }: { runningLog: import('@/state/api').TimeLog }) => {
    const [seconds, setSeconds] = useState(() => Math.floor((Date.now() - new Date(runningLog.startTime).getTime()) / 1000));
    useEffect(() => {
        const interval = setInterval(() => {
            setSeconds(Math.floor((Date.now() - new Date(runningLog.startTime).getTime()) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [runningLog.startTime]);
    return (
        <div className="mt-1 flex items-center gap-2 text-xs text-green-700 dark:text-green-300 font-semibold">
            <Clock size={14} className="text-green-500 animate-pulse" />
            Timer running:
            {runningLog.task && runningLog.task.title && (
                <span className="ml-1">Task: <span className="font-bold">{runningLog.task.title}</span></span>
            )}
            {runningLog.maintenanceTask && runningLog.maintenanceTask.title && (
                <span className="ml-1">Maintenance: <span className="font-bold">{runningLog.maintenanceTask.title}</span></span>
            )}
            <span className="ml-2 text-green-900 dark:text-green-200 font-mono">[
                {formatDuration({
                    hours: Math.floor(seconds / 3600),
                    minutes: Math.floor((seconds % 3600) / 60),
                    seconds: seconds % 60,
                })}
            ]</span>
        </div>
    );
};

export default LiveTimerDisplay;