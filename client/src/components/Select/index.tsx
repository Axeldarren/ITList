import React from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  label: string;
  value: string;
}

interface SelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: Option[];
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  loading = false,
  disabled = false,
  isOpen,
  onToggle
}) => {
  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (option: Option) => {
    onChange(option.value);
    onToggle();
  };

  const selectClasses = `relative w-full rounded border p-2 shadow-sm dark:bg-dark-tertiary dark:border-dark-tertiary dark:text-white ${
    disabled ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-800' : 'cursor-pointer bg-white'
  }`;

  return (
    <div className={selectClasses} onClick={onToggle}>
      <div className="flex items-center justify-between">
        <span>{selectedOption?.label || placeholder}</span>
        <ChevronDown size={20} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-md border bg-white shadow-lg dark:border-stroke-dark dark:bg-dark-secondary">
          {loading ? (
            <div className="p-2 text-center text-gray-500">Loading...</div>
          ) : (
            options.map(option => (
              <div
                key={option.value}
                className="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-dark-tertiary"
                onClick={() => handleSelect(option)}
              >
                {option.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Select;