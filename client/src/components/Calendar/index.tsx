import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, parseISO } from 'date-fns';

interface CalendarProps {
  value: string; // Date in YYYY-MM-DD format
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  highlightedDates?: string[]; // Array of dates to highlight
  disabledDates?: string[]; // Array of dates to disable
}

const Calendar: React.FC<CalendarProps> = ({
  value,
  onChange,
  placeholder = "Select date",
  className = "",
  disabled = false,
  highlightedDates = [],
  disabledDates = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    return value ? parseISO(value) : new Date();
  });

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    
    // Get all days in the current month
    const monthDays = eachDayOfInterval({ start, end });
    
    // Add padding days for the start of the week
    const startDay = start.getDay();
    const paddingDays = [];
    for (let i = 0; i < startDay; i++) {
      paddingDays.push(null);
    }
    
    return [...paddingDays, ...monthDays];
  }, [currentMonth]);

  const selectedDate = value ? parseISO(value) : null;

  const handleDateClick = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    if (!disabledDates.includes(dateString)) {
      onChange(dateString);
      setIsOpen(false);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const isDateDisabled = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return disabledDates.includes(dateString);
  };

  const isDateHighlighted = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return highlightedDates.includes(dateString);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center justify-between w-full px-3 py-2 text-left
          border border-gray-300 dark:border-gray-600 rounded-md
          bg-white dark:bg-dark-tertiary text-gray-900 dark:text-white
          hover:border-gray-400 dark:hover:border-gray-500
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        `}
      >
        <span className="flex items-center gap-2">
          <CalendarIcon size={16} className="text-gray-400" />
          {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : placeholder}
        </span>
        <ChevronRight 
          size={16} 
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} 
        />
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-dark-secondary border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-4 w-80">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 p-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              if (!date) {
                return <div key={index} className="p-2" />;
              }

              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const isCurrentMonth = isSameMonth(date, currentMonth);
              const isTodayDate = isToday(date);
              const isDisabled = isDateDisabled(date);
              const isHighlighted = isDateHighlighted(date);

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => handleDateClick(date)}
                  disabled={isDisabled}
                  className={`
                    p-2 text-sm rounded-md transition-colors relative
                    ${isCurrentMonth 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-gray-400 dark:text-gray-500'
                    }
                    ${isSelected 
                      ? 'bg-blue-500 text-white font-semibold hover:bg-blue-600' 
                      : isHighlighted
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                        : isTodayDate
                          ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                    }
                    ${isDisabled 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'cursor-pointer'
                    }
                  `}
                >
                  {format(date, 'd')}
                  {isTodayDate && !isSelected && (
                    <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Today Button */}
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={() => {
                const today = format(new Date(), 'yyyy-MM-dd');
                if (!disabledDates.includes(today)) {
                  onChange(today);
                  setIsOpen(false);
                }
              }}
              className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Today
            </button>
          </div>
        </div>
      )}

      {/* Overlay to close calendar when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default Calendar;
