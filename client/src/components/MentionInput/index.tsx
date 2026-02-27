"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useGetUsersQuery, User } from "@/state/api";
import Image from "next/image";

type MentionInputProps = {
    value: string;
    onChange: (value: string) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    rows?: number;
    className?: string;
    disabled?: boolean;
};

const MentionInput = ({
    value,
    onChange,
    onKeyDown,
    placeholder = "Type a comment...",
    rows = 2,
    className = "",
    disabled = false,
}: MentionInputProps) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { data: allUsers = [] } = useGetUsersQuery();

    // Filter users based on mention query
    const filteredUsers = allUsers
        .filter(
            (u: User) =>
                u.userId && u.username?.toLowerCase().includes(mentionQuery.toLowerCase())
        )
        .slice(0, 8); // Limit to 8 suggestions

    // Detect @ trigger while typing
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const newValue = e.target.value;
            const cursorPos = e.target.selectionStart;
            onChange(newValue);

            // Find the @ character before cursor
            const textBeforeCursor = newValue.slice(0, cursorPos);
            const lastAtIndex = textBeforeCursor.lastIndexOf("@");

            if (lastAtIndex !== -1) {
                const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
                // Only show dropdown if no space in the mention query (typing a username)
                if (!/\s/.test(textAfterAt)) {
                    setMentionQuery(textAfterAt);
                    setMentionStartPos(lastAtIndex);
                    setShowDropdown(true);
                    setSelectedIndex(0);
                    return;
                }
            }

            setShowDropdown(false);
            setMentionStartPos(null);
        },
        [onChange]
    );

    // Handle keyboard navigation in dropdown
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (showDropdown && filteredUsers.length > 0) {
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                        prev < filteredUsers.length - 1 ? prev + 1 : 0
                    );
                    return;
                }
                if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                        prev > 0 ? prev - 1 : filteredUsers.length - 1
                    );
                    return;
                }
                if (e.key === "Enter" || e.key === "Tab") {
                    e.preventDefault();
                    selectUser(filteredUsers[selectedIndex]);
                    return;
                }
                if (e.key === "Escape") {
                    e.preventDefault();
                    setShowDropdown(false);
                    return;
                }
            }

            // Forward to parent handler
            onKeyDown?.(e);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [showDropdown, filteredUsers, selectedIndex, onKeyDown]
    );

    const selectUser = (user: User) => {
        if (mentionStartPos === null || !textareaRef.current) return;

        const before = value.slice(0, mentionStartPos);
        const cursorPos = textareaRef.current.selectionStart;
        const after = value.slice(cursorPos);

        const newValue = `${before}@${user.username} ${after}`;
        onChange(newValue);

        setShowDropdown(false);
        setMentionStartPos(null);
        setMentionQuery("");

        // Restore focus and set cursor after the inserted mention
        setTimeout(() => {
            if (textareaRef.current) {
                const newCursorPos = mentionStartPos + user.username.length + 2; // @username + space
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                textareaRef.current &&
                !textareaRef.current.contains(e.target as Node)
            ) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Scroll selected item into view
    useEffect(() => {
        if (showDropdown && dropdownRef.current) {
            const selectedItem = dropdownRef.current.children[selectedIndex] as HTMLElement;
            selectedItem?.scrollIntoView({ block: "nearest" });
        }
    }, [selectedIndex, showDropdown]);

    const defaultClassName =
        "w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-tertiary bg-gray-50 dark:bg-dark-tertiary text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-shadow";

    return (
        <div className="relative">
            <textarea
                ref={textareaRef}
                className={className || defaultClassName}
                placeholder={placeholder}
                rows={rows}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                disabled={disabled}
            />

            {/* Mention Dropdown */}
            {showDropdown && filteredUsers.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute left-0 bottom-full mb-1 w-64 max-h-48 overflow-y-auto rounded-lg shadow-xl ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-dark-secondary z-50"
                >
                    {filteredUsers.map((user, index) => (
                        <button
                            key={user.userId}
                            onClick={(e) => {
                                e.preventDefault();
                                selectUser(user);
                            }}
                            className={`
                                w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors
                                ${index === selectedIndex
                                    ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                                }
                            `}
                        >
                            {user.profilePictureUrl ? (
                                <Image
                                    src={`/${user.profilePictureUrl}`}
                                    alt={user.username}
                                    width={24}
                                    height={24}
                                    className="rounded-full object-cover flex-shrink-0"
                                />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
                                    {user.username?.charAt(0)?.toUpperCase() || "?"}
                                </div>
                            )}
                            <span className="truncate font-medium">{user.username}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MentionInput;
