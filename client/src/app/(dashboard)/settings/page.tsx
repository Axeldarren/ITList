"use client";

import React, { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import { useAppSelector } from "@/app/redux";
import { selectCurrentUser } from "@/state/authSlice";
import { useGetUserByIdQuery, useUpdateUserMutation, useUploadProfilePictureMutation, useChangePasswordMutation } from "@/state/api";
import toast from "react-hot-toast";
import { Save, Camera, Edit2, Mail, BellOff, Lock, Shield, User, BadgeCheck } from "lucide-react";
import ModalConfirm from "@/components/ModalConfirm";

const SettingItem = ({ label, value, icon }: { label: string; value: string | number | undefined; icon?: React.ReactNode }) => (
    <div>
        <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
            {icon}
            {label}
        </label>
        <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {value || <span className="text-gray-300 dark:text-gray-600 italic font-normal">Not set</span>}
        </div>
    </div>
);

const SettingsInput = ({ label, id, ...props }: { label: string; id: string; } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="space-y-1.5">
        <label htmlFor={id} className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            {label}
        </label>
        <input
            id={id}
            className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm transition-all duration-200 focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 focus:outline-none dark:bg-dark-tertiary/60 dark:border-gray-700 dark:text-white dark:focus:border-blue-500 dark:placeholder:text-gray-500"
            {...props}
        />
    </div>
);

const SectionCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-dark-secondary overflow-hidden ${className}`}>
        {children}
    </div>
);

const SectionHeader = ({ title, description, icon }: { title: string; description?: string; icon?: React.ReactNode }) => (
    <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        {icon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 flex-shrink-0">
                {icon}
            </div>
        )}
        <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
            {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
        </div>
    </div>
);

const Settings = () => {
    const loggedInUser = useAppSelector(selectCurrentUser);
    const userID = loggedInUser?.userId;
    const { data: currentUser, isLoading: userLoading } = useGetUserByIdQuery(userID!, { skip: !userID });

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
            { loading: 'Uploading picture...', success: 'Profile picture updated!', error: 'Upload failed.' }
        );
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        toast.promise(
            updateUser({ userId: currentUser!.userId!, ...profileData, NIK: Number(profileData.NIK) }).unwrap(),
            {
                loading: 'Updating profile...',
                success: () => { setIsEditMode(false); return 'Profile updated successfully!'; },
                error: (err) => err.data?.message || 'Failed to update profile.'
            }
        );
    };

    const doCancel = () => {
        if (currentUser) {
            setProfileData({ username: currentUser.username || '', email: currentUser.email || '', NIK: String(currentUser.NIK || '') });
        }
        setIsEditMode(false);
    };

    const handleCancelEdit = () => {
        const isDirty = currentUser && (
            profileData.username !== (currentUser.username || '') ||
            profileData.email !== (currentUser.email || '') ||
            profileData.NIK !== String(currentUser.NIK || '')
        );
        if (isDirty) setIsCancelConfirmOpen(true);
        else doCancel();
    };

    const getRoleBadge = (role?: string) => {
        const styles: Record<string, string> = {
            ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
            DEVELOPER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            BUSINESS_OWNER: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        };
        return styles[role || ''] || 'bg-gray-100 text-gray-600';
    };

    if (userLoading) {
        return (
            <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
                <div className="animate-pulse h-8 w-36 rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-dark-secondary p-8">
                    <div className="flex gap-10">
                        <div className="animate-pulse h-36 w-36 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                        <div className="flex-1 space-y-4">
                            <div className="animate-pulse h-6 w-40 rounded bg-gray-200 dark:bg-gray-700" />
                            <div className="grid grid-cols-2 gap-4">
                                {[...Array(4)].map((_, i) => <div key={i} className="animate-pulse h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const avatarSrc = currentUser?.profilePictureUrl
        ? (currentUser.profilePictureUrl.startsWith('http')
            ? currentUser.profilePictureUrl
            : `${process.env.NEXT_PUBLIC_API_BASE_URL}${currentUser.profilePictureUrl}`)
        : null;

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
        <div className="min-h-full p-6 lg:p-8 transition-colors duration-300">
            <div className="mx-auto max-w-4xl space-y-6">
                <Header name="Settings" />

                {/* Profile Card */}
                <SectionCard>
                    <SectionHeader
                        title="Profile Details"
                        description="Manage your personal information and account settings"
                        icon={<User size={18} className="text-blue-500" />}
                    />
                    <div className="p-6 md:p-8">
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Avatar */}
                            <div className="flex flex-col items-center gap-4 lg:w-48 flex-shrink-0">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <div className="h-32 w-32 rounded-full overflow-hidden ring-4 ring-white dark:ring-dark-secondary shadow-xl">
                                        {avatarSrc ? (
                                            <img
                                                src={avatarSrc}
                                                alt="Profile"
                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
                                                <span className="text-4xl font-bold text-white">
                                                    {currentUser?.username?.charAt(0).toUpperCase() || '?'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <Camera size={20} className="text-white" />
                                    </div>
                                    {isUploading && (
                                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                                        </div>
                                    )}
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg" />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-tertiary px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-secondary transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    <Camera size={13} />
                                    {isUploading ? 'Uploading...' : 'Change Photo'}
                                </button>
                                <p className="text-[11px] text-center text-gray-400 dark:text-gray-500">JPG or PNG. Max 2MB.</p>
                            </div>

                            {/* Profile Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-bold text-gray-900 dark:text-white">{currentUser?.username}</h3>
                                        {currentUser?.role && (
                                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getRoleBadge(currentUser.role)}`}>
                                                {currentUser.role}
                                            </span>
                                        )}
                                    </div>
                                    {!isEditMode && (
                                        <button
                                            onClick={() => setIsEditMode(true)}
                                            className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-tertiary px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-secondary transition-colors cursor-pointer"
                                        >
                                            <Edit2 size={13} /> Edit
                                        </button>
                                    )}
                                </div>

                                {isEditMode ? (
                                    <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="sm:col-span-2">
                                            <SettingsInput label="Username" id="username" name="username" value={profileData.username} onChange={handleProfileChange} required placeholder="Your display name" />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <SettingsInput label="Email Address" id="email" name="email" type="email" value={profileData.email} onChange={handleProfileChange} required placeholder="you@company.com" />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <SettingsInput label="NIK (Employee ID)" id="nik" name="NIK" value={profileData.NIK} onChange={handleProfileChange} placeholder="Employee identification number" />
                                        </div>
                                        <div className="flex items-center gap-3 pt-2 sm:col-span-2">
                                            <button
                                                type="submit"
                                                disabled={isUpdatingUser}
                                                className="flex items-center gap-2 rounded-xl bg-blue-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-600 transition-all disabled:opacity-50 cursor-pointer"
                                            >
                                                <Save size={15} />
                                                {isUpdatingUser ? 'Saving...' : 'Save Changes'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCancelEdit}
                                                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-tertiary transition-colors cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <SettingItem label="Username" value={currentUser?.username} icon={<User size={11} />} />
                                        <SettingItem label="Email Address" value={currentUser?.email} icon={<Mail size={11} />} />
                                        <SettingItem label="NIK" value={currentUser?.NIK} icon={<BadgeCheck size={11} />} />
                                        <SettingItem label="Account Role" value={currentUser?.role} icon={<Shield size={11} />} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </SectionCard>

                {/* Security Card */}
                <SectionCard>
                    <SectionHeader
                        title="Security & Privacy"
                        description="Manage your password and notification preferences"
                        icon={<Lock size={18} className="text-blue-500" />}
                    />
                    <div className="p-6 md:p-8 space-y-6">
                        <ChangePasswordForm userId={currentUser?.userId || userID || ""} />

                        <div className="h-px bg-gray-100 dark:bg-gray-800" />

                        {/* Email Notifications Toggle */}
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                                    currentUser?.emailNotifications !== false
                                        ? 'bg-blue-50 dark:bg-blue-900/20'
                                        : 'bg-gray-50 dark:bg-dark-tertiary'
                                }`}>
                                    {currentUser?.emailNotifications !== false
                                        ? <Mail size={18} className="text-blue-primary" />
                                        : <BellOff size={18} className="text-gray-400" />
                                    }
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">Email Notifications</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-xs">
                                        Receive mentions, deadlines, and project updates in your inbox.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={isUpdatingUser}
                                onClick={() => {
                                    if (!currentUser?.userId) return;
                                    const newValue = currentUser.emailNotifications === false;
                                    toast.promise(
                                        updateUser({ userId: currentUser.userId, emailNotifications: newValue }).unwrap(),
                                        {
                                            loading: newValue ? 'Enabling...' : 'Disabling...',
                                            success: newValue ? 'Notifications enabled!' : 'Notifications disabled.',
                                            error: 'Update failed.',
                                        }
                                    );
                                }}
                                className={`relative flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500/50 cursor-pointer disabled:opacity-50 ${
                                    currentUser?.emailNotifications !== false
                                        ? 'bg-blue-primary shadow-sm shadow-blue-500/30'
                                        : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                                aria-label="Toggle email notifications"
                            >
                                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-300 ${
                                    currentUser?.emailNotifications !== false ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                            </button>
                        </div>
                    </div>
                </SectionCard>
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
            toast.error("Password must be at least 8 characters.");
            return;
        }
        toast.promise(
            changePassword({ userId, currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }).unwrap(),
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
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Change Password</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Update your password regularly to keep your account secure.</p>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                        className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-black disabled:opacity-50 dark:bg-blue-primary dark:hover:bg-blue-600 cursor-pointer"
                    >
                        <Save size={15} />
                        {isLoading ? 'Updating...' : 'Update Password'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Settings;
