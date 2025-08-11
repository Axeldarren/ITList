import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface MonthPickerProps {
  value: string; // Date in YYYY-MM format
  onChange: (month: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MonthPicker: React.FC<MonthPickerProps> = ({
  value,
  onChange,
  placeholder = "Select month",
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(() => {
    return value ? new Date(`${value}-01`).getFullYear() : new Date().getFullYear();
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const selectedDate = value ? parseISO(`${value}-01`) : null;

  const handleMonthClick = (monthIndex: number) => {
    const monthString = format(new Date(currentYear, monthIndex, 1), 'yyyy-MM');
    onChange(monthString);
    setIsOpen(false);
  };

  const goToPreviousYear = () => {
    setCurrentYear(prev => prev - 1);
  };

  const goToNextYear = () => {
    setCurrentYear(prev => prev + 1);
  };

  const goToCurrentMonth = () => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    onChange(currentMonth);
    setIsOpen(false);
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
          {selectedDate ? format(selectedDate, 'MMMM yyyy') : placeholder}
        </span>
        <ChevronRight 
          size={16} 
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} 
        />
      </button>

      {/* Month Picker Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-dark-secondary border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-4 w-80">
          {/* Year Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={goToPreviousYear}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentYear}
            </h3>
            
            <button
              type="button"
              onClick={goToNextYear}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Months Grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {months.map((month, index) => {
              const isSelected = selectedDate && 
                selectedDate.getFullYear() === currentYear && 
                selectedDate.getMonth() === index;
              
              const isCurrentMonth = 
                new Date().getFullYear() === currentYear && 
                new Date().getMonth() === index;

              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => handleMonthClick(index)}
                  className={`
                    p-3 text-sm rounded-md transition-colors relative
                    ${isSelected 
                      ? 'bg-blue-500 text-white font-semibold hover:bg-blue-600' 
                      : isCurrentMonth
                        ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800'
                        : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
                    }
                    cursor-pointer
                  `}
                >
                  {month}
                  {isCurrentMonth && !isSelected && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Current Month Button */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={goToCurrentMonth}
              className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Current Month
            </button>
          </div>
        </div>
      )}

      {/* Overlay to close picker when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default MonthPicker;
