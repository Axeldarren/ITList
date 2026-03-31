"use client";

import React, { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import { useAppSelector } from "@/app/redux";
import { selectCurrentUser } from "@/state/authSlice";
import { useGetUserByIdQuery, useUpdateUserMutation, useUploadProfilePictureMutation, useChangePasswordMutation } from "@/state/api";
import toast from "react-hot-toast";
import { Save, Upload, Edit, Mail, BellOff } from "lucide-react";
import ModalConfirm from "@/components/ModalConfirm";

// Reusable component to display a single setting item
const SettingItem = ({ label, value }: { label: string; value: string | number | undefined }) => (
    <div className="group transition-all duration-300">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
            {label}
        </label>
        <div className="text-base font-medium text-gray-800 dark:text-gray-200">
            {value || <span className="text-gray-300 italic">Not set</span>}
        </div>
    </div>
);

// Reusable input component for premium styling consistency
const SettingsInput = ({ label, id, ...props }: { label: string; id: string; } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="space-y-1.5">
        <label htmlFor={id} className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            {label}
        </label>
        <input
            id={id}
            className="block w-full rounded-xl border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm transition-all duration-300 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 focus:outline-none dark:bg-dark-tertiary/50 dark:border-gray-700 dark:text-white dark:focus:border-blue-500"
            {...props}
        />
    </div>
);

const Settings = () => {
    const loggedInUser = useAppSelector(selectCurrentUser);
    const userID = loggedInUser?.userId;
    const { data: currentUser, isLoading: userLoading } = useGetUserByIdQuery(
        userID!,
        { skip: !userID }
    );
    
    const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();
    const [uploadProfilePicture, { isLoading: isUploading }] = useUploadProfilePictureMutation();
    const [isEditMode, setIsEditMode] = useState(false);
    const [profileData, setProfileData] = useState({ username: '', email: '', NIK: '' });
    const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
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
                    setIsEditMode(false);
                    return 'Profile updated successfully!';
                },
                error: (err) => err.data?.message || 'Failed to update profile.'
            }
        );
    };

    const doCancel = () => {
        if (currentUser) {
            setProfileData({
                username: currentUser.username || '',
                email: currentUser.email || '',
                NIK: String(currentUser.NIK || ''),
            });
        }
        setIsEditMode(false);
    };

    const handleCancelEdit = () => {
        const isDirty = currentUser && (
            profileData.username !== (currentUser.username || '') ||
            profileData.email !== (currentUser.email || '') ||
            profileData.NIK !== String(currentUser.NIK || '')
        );
        if (isDirty) {
            setIsCancelConfirmOpen(true);
        } else {
            doCancel();
        }
    };

    if (userLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-primary"></div>
                <span className="ml-3 text-gray-500 font-medium">Loading settings...</span>
            </div>
        );
    }

    return (
        <>
        <ModalConfirm
            isOpen={isCancelConfirmOpen}
            onClose={() => setIsCancelConfirmOpen(false)}
            onConfirm={() => { setIsCancelConfirmOpen(false); doCancel(); }}
            title="Discard Changes?"
            message="Your unsaved profile edits will be lost."
            confirmLabel="Discard"
        />
        <div className="min-h-full bg-gray-50/30 dark:bg-transparent p-4 md:p-8 transition-colors duration-500">
            <div className="mx-auto max-w-4xl space-y-8">
                <Header name="User Settings" />
                
                {/* Main Settings Card */}
                <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 dark:border-gray-800/50 dark:bg-dark-secondary/60 md:p-10">
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
                        
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center space-y-6 lg:col-span-1">
                            <div className="relative group">
                                <div className="absolute -inset-0.5 animate-tilt rounded-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-30 blur transition duration-1000 group-hover:opacity-100 group-hover:duration-200"></div>
                                
                                <div className="relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-full bg-white dark:bg-dark-tertiary shadow-xl">
                                    {currentUser?.profilePictureUrl ? (
                                        <img
                                            src={
                                                currentUser.profilePictureUrl.startsWith('http')
                                                    ? currentUser.profilePictureUrl
                                                    : `${process.env.NEXT_PUBLIC_API_BASE_URL}${currentUser.profilePictureUrl}`
                                            }
                                            alt="Profile"
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-dark-tertiary">
                                            <span className="text-4xl font-bold text-blue-500/30">
                                                {currentUser?.username?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                                    >
                                        <Upload className="text-white" size={24} />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="text-center">
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
                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-600 hover:shadow-blue-500/40 disabled:opacity-50"
                                >
                                    <Edit size={16} />
                                    {isUploading ? 'Uploading...' : 'Change Photo'}
                                </button>
                                <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                                    JPG or PNG. Max size 2MB.
                                </p>
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="space-y-8 lg:col-span-2">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile Details</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your personal information</p>
                                </div>
                                {!isEditMode && (
                                    <button 
                                        onClick={() => setIsEditMode(true)} 
                                        className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-dark-tertiary dark:text-gray-200 dark:hover:bg-gray-700"
                                    >
                                        <Edit size={16} />
                                        Edit
                                    </button>
                                )}
                            </div>

                            {isEditMode ? (
                                <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <SettingsInput label="Username" id="username" name="username" value={profileData.username} onChange={handleProfileChange} required />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <SettingsInput label="Email Address" id="email" name="email" type="email" value={profileData.email} onChange={handleProfileChange} required />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <SettingsInput label="NIK (ID Number)" id="nik" name="NIK" value={profileData.NIK} onChange={handleProfileChange} />
                                    </div>
                                    <div className="flex items-center gap-3 pt-4 sm:col-span-2">
                                        <button 
                                            type="submit" 
                                            disabled={isUpdatingUser} 
                                            className="inline-flex items-center gap-2 rounded-xl bg-blue-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-600 hover:shadow-blue-500/40 disabled:opacity-50"
                                        >
                                            <Save size={18} />
                                            {isUpdatingUser ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={handleCancelEdit} 
                                            className="rounded-xl px-6 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-tertiary"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2">
                                    <SettingItem label="Username" value={currentUser?.username} />
                                    <SettingItem label="Email Address" value={currentUser?.email} />
                                    <SettingItem label="NIK" value={currentUser?.NIK} />
                                    <SettingItem label="Account Role" value={currentUser?.role} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Security Section */}
                <div className="overflow-hidden rounded-3xl border border-white/40 bg-white/70 shadow-2xl backdrop-blur-xl dark:border-gray-800/50 dark:bg-dark-secondary/60">
                    <div className="border-b border-gray-100 p-6 dark:border-gray-800">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Security & Privacy</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Manage your password and notifications</p>
                    </div>
                    
                    <div className="p-6 md:p-8">
                        <div className="mb-10 rounded-2xl bg-gray-50/50 p-6 dark:bg-dark-tertiary/30">
                            <ChangePasswordForm userId={currentUser?.userId || userID || ""} />
                        </div>

                        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-dark-tertiary/50">
                            <div className="flex items-center gap-4">
                                <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                                    currentUser?.emailNotifications !== false ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-dark-tertiary'
                                }`}>
                                    {currentUser?.emailNotifications !== false ? (
                                        <Mail size={22} className="text-blue-primary" />
                                    ) : (
                                        <BellOff size={22} className="text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">Email Notifications</p>
                                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 max-w-xs">
                                        Mentions, deadlines, and project updates sent to your inbox.
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
                                            success: newValue ? 'Notifications enabled!' : 'Notifications disabled.',
                                            error: 'Update failed.',
                                        }
                                    );
                                }}
                                className={`group relative flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                                    currentUser?.emailNotifications !== false ? 'bg-blue-primary shadow-lg shadow-blue-500/30' : 'bg-gray-300 dark:bg-gray-700'
                                }`}
                            >
                                <span
                                    className={`h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-300 ${
                                        currentUser?.emailNotifications !== false ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

const ChangePasswordForm = ({ userId }: { userId: string }) => {
    const [changePassword, { isLoading }] = useChangePasswordMutation();
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error("New passwords do not match.");
            return;
        }

        if (passwords.newPassword.length < 8) {
            toast.error("New password must be at least 8 characters long.");
            return;
        }

        toast.promise(
            changePassword({
                userId,
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            }).unwrap(),
            {
                loading: 'Updating password...',
                success: () => {
                    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    return 'Password updated successfully!';
                },
                error: (err) => err.data?.message || 'Failed to update password.'
            }
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Password Management</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Update your account password regularly for security</p>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <SettingsInput 
                    label="Current Password" 
                    id="currentPassword" 
                    name="currentPassword" 
                    type="password" 
                    placeholder="••••••••"
                    value={passwords.currentPassword} 
                    onChange={handleChange} 
                    required 
                />
                <SettingsInput 
                    label="New Password" 
                    id="newPassword" 
                    name="newPassword" 
                    type="password" 
                    placeholder="••••••••"
                    value={passwords.newPassword} 
                    onChange={handleChange} 
                    required 
                />
                <SettingsInput 
                    label="Confirm Password" 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    type="password" 
                    placeholder="••••••••"
                    value={passwords.confirmPassword} 
                    onChange={handleChange} 
                    required 
                />
                <div className="sm:col-span-3">
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-black hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 dark:bg-blue-primary dark:shadow-blue-500/20 dark:hover:bg-blue-600"
                    >
                        <Save size={18} />
                        {isLoading ? 'Updating...' : 'Update Password'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Settings;