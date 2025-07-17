// client/src/app/(dashboard)/projects/ModalNewVersion/index.tsx

import Modal from '@/components/Modal';
import React, { useState } from 'react';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (startDate: string, endDate: string) => void;
    isLoading: boolean;
};

const ModalNewVersion = ({ isOpen, onClose, onSubmit, isLoading }: Props) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleSubmit = () => {
        if (startDate && endDate) {
            onSubmit(startDate, endDate);
        }
    };

    const inputStyles = "w-full rounded border border-gray-300 p-2 shadow-sm dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";

    return (
        <Modal isOpen={isOpen} onClose={onClose} name="Start New Version">
            <form
                className='mt-4 space-y-6'
                onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            >
                <p className='text-sm text-gray-600 dark:text-gray-300'>
                    Please provide the start and end dates for the new version of this project.
                </p>
                <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                    <div>
                        <label className="block text-sm font-medium mb-1">Start Date</label>
                        <input 
                            type='date' 
                            className={inputStyles} 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)}
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">End Date</label>
                        <input 
                            type='date' 
                            className={inputStyles} 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)}
                            required 
                        />
                    </div>
                </div>
                <button
                    type='submit'
                    className={`mt-4 flex w-full justify-center rounded-md border-transparent bg-blue-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-600 disabled:opacity-50`}
                    disabled={!startDate || !endDate || isLoading}
                >
                    {isLoading ? 'Creating...' : 'Create New Version'}
                </button>
            </form>
        </Modal>
    );
};

export default ModalNewVersion;