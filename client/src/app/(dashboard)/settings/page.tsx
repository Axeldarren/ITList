"use client";

import React, { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import { useAppSelector } from "@/app/redux";
import { selectCurrentUser } from "@/state/authSlice";
import { useGetUserByIdQuery, useUpdateUserMutation, useUploadProfilePictureMutation } from "@/state/api";
import toast from "react-hot-toast";
import { Save, Upload, Edit, Mail, BellOff } from "lucide-react";
import Image from "next/image";

// Reusable component to display a single setting item
const SettingItem = ({ label, value }: { label: string; value: string | number | undefined }) => (
    <div>
        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
            {label}
        </label>
        <div className="mt-1 text-base text-gray-900 dark:text-white">
            {value || '-'}
        </div>
    </div>
);

// Reusable input component for styling consistency
const SettingsInput = ({ label, id, ...props }: { label: string; id: string; } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
        </label>
        <input
            id={id}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-dark-tertiary dark:border-dark-tertiary dark:text-white"
            {...props}
        />
    </div>
);

const Settings = () => {
    const loggedInUser = useAppSelector(selectCurrentUser);
    const userID = loggedInUser?.userId; // Use userId from the auth state
    const { data: currentUser, isLoading: userLoading } = useGetUserByIdQuery(
        userID!,
        { skip: !userID }
    );
    
    const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();
    const [uploadProfilePicture, { isLoading: isUploading }] = useUploadProfilePictureMutation();

    // --- NEW: State to toggle between view and edit modes ---
    const [isEditMode, setIsEditMode] = useState(false);
    
    const [profileData, setProfileData] = useState({ username: '', email: '', NIK: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (currentUser) {
            setProfileData({
                username: currentUser.username || '',
                email: currentUser.email || '',
                NIK: String(currentUser.NIK || ''),
            });
        }
    }, [currentUser]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUser) return;

        toast.promise(
            uploadProfilePicture({ userId: currentUser.userId!, file }).unwrap(),
            {
                loading: 'Uploading picture...',
                success: 'Profile picture updated!',
                error: 'Upload failed.',
            }
        );
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        toast.promise(
            updateUser({ userId: currentUser!.userId!, ...profileData, NIK: Number(profileData.NIK) }).unwrap(),
            {
                loading: 'Updating profile...',
                success: () => {
                    setIsEditMode(false); // Switch back to view mode on success
                    return 'Profile updated successfully!';
                },
                error: (err) => err.data?.message || 'Failed to update profile.'
            }
        );
    };

    const handleCancelEdit = () => {
        // Reset form data to the original state and exit edit mode
        if (currentUser) {
             setProfileData({
                username: currentUser.username || '',
                email: currentUser.email || '',
                NIK: String(currentUser.NIK || ''),
            });
        }
        setIsEditMode(false);
    };

    if (userLoading) {
        return <div className="p-8">Loading settings...</div>;
    }

    return (
        <div className="p-8">
            <Header name="User Settings" />
            <div className="mt-6 grid grid-cols-1 gap-x-16 gap-y-10 lg:grid-cols-3">
                
                <div className="lg:col-span-1">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Picture</h2>
                    <div className="mt-4 flex flex-col items-center gap-4">
                        {currentUser?.profilePictureUrl ? (
                            <Image
                                src={
                                    currentUser.profilePictureUrl.startsWith('http')
                                        ? currentUser.profilePictureUrl
                                        : `${process.env.NEXT_PUBLIC_API_BASE_URL}${currentUser.profilePictureUrl}`
                                }
                                alt="Profile Picture"
                                width={128}
                                height={128}
                                className="h-32 w-32 rounded-full object-cover ring-2 ring-offset-2 ring-blue-primary dark:ring-offset-dark-secondary"
                            />
                        ) : (
                            <div className="h-32 w-32 rounded-full bg-gray-200 dark:bg-dark-tertiary flex items-center justify-center ring-2 ring-offset-2 ring-blue-primary dark:ring-offset-dark-secondary">
                                <span className="text-gray-500">No Image</span>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/png, image/jpeg"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="inline-flex items-center gap-2 justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm border border-gray-300 hover:bg-gray-50 dark:bg-dark-tertiary dark:text-white dark:border-dark-tertiary dark:hover:bg-gray-700"
                        >
                            <Upload size={16} />
                            {isUploading ? 'Uploading...' : 'Change Picture'}
                        </button>
                    </div>
                </div>

                <div className="space-y-6 lg:col-span-2">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h2>
                        {!isEditMode && (
                            <button onClick={() => setIsEditMode(true)} className="inline-flex items-center gap-2 rounded-md px-3 py-1 text-sm font-medium text-blue-primary hover:bg-blue-500/10">
                                <Edit size={16} />
                                Edit
                            </button>
                        )}
                    </div>

                    {isEditMode ? (
                        <form onSubmit={handleProfileSubmit} className="space-y-4">
                            <SettingsInput label="Username" id="username" name="username" value={profileData.username} onChange={handleProfileChange} required />
                            <SettingsInput label="Email Address" id="email" name="email" type="email" value={profileData.email} onChange={handleProfileChange} required />
                            <SettingsInput label="NIK" id="nik" name="NIK" value={profileData.NIK} onChange={handleProfileChange} />
                            <div className="flex items-center gap-4">
                                <button type="submit" disabled={isUpdatingUser} className="inline-flex items-center gap-2 justify-center rounded-md bg-blue-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-600 disabled:opacity-50">
                                    <Save size={16} />
                                    {isUpdatingUser ? 'Saving...' : 'Save Profile'}
                                </button>
                                <button type="button" onClick={handleCancelEdit} className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-tertiary">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <SettingItem label="Username" value={currentUser?.username} />
                            <SettingItem label="Email Address" value={currentUser?.email} />
                            <SettingItem label="NIK" value={currentUser?.NIK} />
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Email Notifications ─── */}
            <div className="mt-10">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Email Notifications</h2>
                <div className="rounded-lg bg-white dark:bg-dark-secondary border border-gray-200 dark:border-dark-tertiary p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {currentUser?.emailNotifications !== false ? (
                            <Mail size={20} className="text-blue-500" />
                        ) : (
                            <BellOff size={20} className="text-gray-400" />
                        )}
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Receive email notifications
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Get notified about mentions, task deadlines, and project updates via email.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        disabled={isUpdatingUser}
                        onClick={() => {
                            if (!currentUser?.userId) return;
                            const newValue = currentUser.emailNotifications === false ? true : false;
                            toast.promise(
                                updateUser({ userId: currentUser.userId, emailNotifications: newValue }).unwrap(),
                                {
                                    loading: newValue ? 'Enabling...' : 'Disabling...',
                                    success: newValue ? 'Email notifications enabled!' : 'Email notifications disabled.',
                                    error: 'Failed to update preference.',
                                }
                            );
                        }}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-dark-secondary ${
                            currentUser?.emailNotifications !== false ? 'bg-blue-500' : 'bg-gray-300 dark:bg-dark-tertiary'
                        }`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                currentUser?.emailNotifications !== false ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;