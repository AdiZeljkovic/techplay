"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import axios from "@/lib/axios";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Loader2, Save, User, Gamepad2, Cpu, Monitor, Lock, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { AnimatePresence, motion } from "framer-motion";

export default function SettingsClient() {
    const { user, isLoading, logout } = useAuth({ middleware: 'auth' });
    const router = useRouter();

    // DEBUG: Log user object to see if email is present
    console.log('Settings Page - User object:', user);

    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'bio' | 'ids' | 'specs' | 'security'>('bio');
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Form States
    const [bio, setBio] = useState(user?.bio || "");
    const [displayName, setDisplayName] = useState(user?.display_name || "");
    const [gamertags, setGamertags] = useState(user?.gamertags || {});
    const [specs, setSpecs] = useState(user?.pc_specs || {});
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url || null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(user?.cover_image || null);

    // Password State
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

    // Sync state when user loads
    if (user) {
        if (bio === "" && user.bio) setBio(user.bio);
        if (displayName === "" && user.display_name) setDisplayName(user.display_name);
        if (Object.keys(gamertags).length === 0 && user.gamertags) setGamertags(user.gamertags);
        if (Object.keys(specs).length === 0 && user.pc_specs) setSpecs(user.pc_specs);
        // Only set preview if not already set by file selection
        if (!avatarPreview && user.avatar_url) setAvatarPreview(user.avatar_url);
        if (!coverPreview && user.cover_image) setCoverPreview(user.cover_image);
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverFile(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('_method', 'PUT'); // Trick for Laravel to handle PUT with files
            formData.append('bio', bio);
            formData.append('display_name', displayName);

            // Append Gamertags
            Object.keys(gamertags).forEach(key => {
                if (gamertags[key]) formData.append(`gamertags[${key}]`, gamertags[key]);
            });

            // Append Specs
            Object.keys(specs).forEach(key => {
                if (specs[key]) formData.append(`pc_specs[${key}]`, specs[key]);
            });

            if (avatarFile) {
                formData.append('avatar', avatarFile);
            }

            if (coverFile) {
                formData.append('cover_image', coverFile);
            }

            // Using POST to /user/profile with _method: PUT
            await axios.post('/user/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Revalidate SWR cache for profile page if needed
            if (user?.username) {
                mutate(`/users/${user.username}`);
            }
            alert('Settings saved successfully!');
            router.refresh();
        } catch (error: any) {
            console.error("Failed to save settings", error);
            // Show specific error if available
            const msg = error.response?.data?.message || "Failed to save settings.";
            alert(msg);
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async () => {
        setSaving(true);
        try {
            await axios.put('/user/password', {
                current_password: passwords.current,
                new_password: passwords.new,
                new_password_confirmation: passwords.confirm
            });
            // Show Custom Modal instead of Alert
            setShowSuccessModal(true);
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (error: any) {
            console.error("Failed to change password", error);
            const msg = error.response?.data?.message || "Failed to change password.";
            const valErrors = error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join('\n') : '';
            alert(`${msg}\n${valErrors}`);
        } finally {
            setSaving(false);
        }
    };

    if (isLoading || !user) {
        return (
            <div className="min-h-screen pt-24 flex justify-center bg-[var(--bg-primary)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    const renderTabButton = (id: 'bio' | 'ids' | 'specs' | 'security', label: string, icon: any) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors w-full md:w-auto
                ${activeTab === id
                    ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-elevated)]/50'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border)]'
                }`}
        >
            {icon}
            {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pt-24 pb-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">Profile Settings</h1>
                    {activeTab !== 'security' && (
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Changes
                        </Button>
                    )}
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
                    {/* Tabs */}
                    <div className="flex border-b border-[var(--border)] overflow-x-auto">
                        {renderTabButton('bio', 'Basic Info', <User className="w-4 h-4" />)}
                        {renderTabButton('ids', 'Gamertags', <Gamepad2 className="w-4 h-4" />)}
                        {renderTabButton('specs', 'PC Specs', <Cpu className="w-4 h-4" />)}
                        {renderTabButton('security', 'Security', <Lock className="w-4 h-4" />)}
                    </div>

                    <div className="p-6 md:p-8">
                        {activeTab === 'bio' && (
                            <div className="space-y-6 max-w-xl">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                        Username (Unique ID)
                                    </label>
                                    <Input value={user.username} disabled className="opacity-50 cursor-not-allowed bg-[var(--bg-elevated)]" />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="block text-sm font-medium text-[var(--text-secondary)]">
                                            Display Name
                                        </label>
                                        <span className="text-xs text-[var(--text-muted)]">Publicly visible name</span>
                                    </div>
                                    <Input
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder={user.username}
                                        maxLength={50}
                                    />
                                    <p className="text-xs text-[var(--text-muted)] mt-1">If left empty, your username (<b>{user.username}</b>) will be displayed.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                        Email Address
                                    </label>
                                    <Input value={user.email} disabled className="opacity-50 cursor-not-allowed bg-[var(--bg-elevated)]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                        Bio / About Me
                                    </label>
                                    <Textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Tell us about yourself..."
                                        className="h-32"
                                    />
                                    <p className="text-xs text-[var(--text-muted)] mt-1 text-right">
                                        {bio.length}/500 characters
                                    </p>
                                </div>

                                {/* Cover Image Upload */}
                                <div className="pt-4 border-t border-[var(--border)]">
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-4">
                                        Profile Cover Image
                                    </label>
                                    <div className="space-y-3">
                                        <div className="relative aspect-[4/1] rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-elevated)]">
                                            {coverPreview ? (
                                                <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] bg-gradient-to-br from-[var(--bg-secondary)] via-[#001a4d] to-[var(--bg-elevated)]">
                                                    <span className="text-sm">No cover image</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleCoverChange}
                                                className="block w-full text-sm text-[var(--text-muted)]
                                                  file:mr-4 file:py-2 file:px-4
                                                  file:rounded-full file:border-0
                                                  file:text-sm file:font-semibold
                                                  file:bg-[var(--accent)] file:text-black
                                                  hover:file:bg-[var(--accent)]/90
                                                  cursor-pointer"
                                            />
                                            {coverPreview && (
                                                <button
                                                    type="button"
                                                    onClick={() => { setCoverFile(null); setCoverPreview(null); }}
                                                    className="text-xs text-red-400 hover:text-red-300 whitespace-nowrap"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-[var(--text-muted)]">
                                            Recommended: 1920x480px. JPG, PNG or WEBP. Max 5MB.
                                        </p>
                                    </div>
                                </div>

                                {/* Avatar Upload */}
                                <div className="pt-4 border-t border-[var(--border)]">
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-4">
                                        Profile Picture via Upload
                                    </label>
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--border)] bg-[var(--bg-elevated)]">
                                            {avatarPreview ? (
                                                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                                                    <User className="w-8 h-8" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="block w-full text-sm text-[var(--text-muted)]
                                                  file:mr-4 file:py-2 file:px-4
                                                  file:rounded-full file:border-0
                                                  file:text-sm file:font-semibold
                                                  file:bg-[var(--accent)] file:text-black
                                                  hover:file:bg-[var(--accent)]/90
                                                  cursor-pointer"
                                            />
                                            <p className="text-xs text-[var(--text-muted)] mt-2">
                                                JPG, PNG or WEBP. Max 2MB.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ids' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {['Steam', 'Epic', 'PSN', 'Xbox', 'Discord'].map((platform) => {
                                    const key = platform.toLowerCase();

                                    if (platform === 'Discord') {
                                        return (
                                            <div key={key}>
                                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                                    Discord Integration
                                                </label>
                                                {gamertags['discord'] ? (
                                                    <div className="flex items-center gap-3 p-3 bg-[#5865F2]/10 border border-[#5865F2]/30 rounded-lg">
                                                        <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white">
                                                            <svg className="w-5 h-5" viewBox="0 0 127.14 96.36" fill="currentColor">
                                                                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.09,105.09,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.89,105.89,0,0,0,126.6,80.22c.12-23.61-4.38-47.56-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                                                            </svg>
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-sm font-semibold text-[var(--text-primary)]">Connected</div>
                                                            <div className="text-xs text-[var(--text-secondary)]">{gamertags['discord']}</div>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8"
                                                            onClick={() => setGamertags({ ...gamertags, discord: '' })}
                                                        >
                                                            Disconnect
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="w-full hover:bg-[#5865F2]/10 hover:border-[#5865F2] hover:text-[#5865F2] transition-colors"
                                                        onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/discord/redirect`}
                                                    >
                                                        <svg className="w-5 h-5 mr-2" viewBox="0 0 127.14 96.36" fill="currentColor">
                                                            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.09,105.09,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.89,105.89,0,0,0,126.6,80.22c.12-23.61-4.38-47.56-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                                                        </svg>
                                                        Connect Discord Account
                                                    </Button>
                                                )}
                                                <p className="text-xs text-[var(--text-muted)] mt-2">
                                                    Link your account to get special roles in our Discord server!
                                                </p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={key}>
                                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                                {platform} ID
                                            </label>
                                            <Input
                                                value={gamertags[key] || ''}
                                                onChange={(e) => setGamertags({ ...gamertags, [key]: e.target.value })}
                                                placeholder={`Your ${platform} username`}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === 'specs' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2 pb-4 border-b border-[var(--border)] mb-4">
                                    <h3 className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                                        <Cpu className="w-5 h-5 text-[var(--accent)]" /> Core Components
                                    </h3>
                                </div>

                                {['CPU', 'GPU', 'RAM', 'Motherboard', 'Storage', 'Case'].map((item) => {
                                    const key = item.toLowerCase();
                                    return (
                                        <div key={key}>
                                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                                {item}
                                            </label>
                                            <Input
                                                value={specs[key] || ''}
                                                onChange={(e) => setSpecs({ ...specs, [key]: e.target.value })}
                                                placeholder={`e.g. ${item === 'CPU' ? 'Intel i9-13900K' : item === 'GPU' ? 'RTX 4090' : ''}`}
                                            />
                                        </div>
                                    );
                                })}

                                <div className="md:col-span-2 pb-4 border-b border-[var(--border)] mb-4 mt-4">
                                    <h3 className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                                        <Monitor className="w-5 h-5 text-[var(--accent)]" /> Peripherals
                                    </h3>
                                </div>

                                {['Monitor', 'Mouse', 'Keyboard', 'Headphones'].map((item) => {
                                    const key = item.toLowerCase();
                                    return (
                                        <div key={key}>
                                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                                {item}
                                            </label>
                                            <Input
                                                value={specs[key] || ''}
                                                onChange={(e) => setSpecs({ ...specs, [key]: e.target.value })}
                                                placeholder={`e.g. ${item === 'Mouse' ? 'Logitech G Pro X' : ''}`}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="max-w-md mx-auto space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                        Current Password
                                    </label>
                                    <Input
                                        type="password"
                                        value={passwords.current}
                                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                        placeholder="Enter current password"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                        New Password
                                    </label>
                                    <Input
                                        type="password"
                                        value={passwords.new}
                                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                        placeholder="Enter new password"
                                    />
                                    <p className="text-xs text-[var(--text-muted)] mt-1">
                                        Min 8 chars, letters & numbers.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                        Confirm New Password
                                    </label>
                                    <Input
                                        type="password"
                                        value={passwords.confirm}
                                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                        placeholder="Confirm new password"
                                    />
                                </div>
                                <div className="pt-4">
                                    <Button onClick={handlePasswordChange} disabled={saving} className="w-full bg-red-600 hover:bg-red-700">
                                        Change Password
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 max-w-sm w-full shadow-2xl text-center"
                        >
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                                Password Changed
                            </h3>
                            <p className="text-[var(--text-secondary)] mb-6">
                                Password changed successfully. Please log out and log in again for security reasons.
                            </p>
                            <Button
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    logout();
                                }}
                                className="w-full bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-black font-bold"
                            >
                                OK, Log out
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
