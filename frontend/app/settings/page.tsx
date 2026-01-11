"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import axios from "@/lib/axios";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { Loader2, Save, User, Gamepad2, Cpu, Monitor, Keyboard, Mouse, Headphones, HardDrive } from "lucide-react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";

export default function SettingsPage() {
    const { user, isLoading } = useAuth({ middleware: 'auth' });
    const router = useRouter();

    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'bio' | 'ids' | 'specs'>('bio');

    // Form States
    const [bio, setBio] = useState(user?.bio || "");
    const [displayName, setDisplayName] = useState(user?.display_name || "");
    const [gamertags, setGamertags] = useState(user?.gamertags || {});
    const [specs, setSpecs] = useState(user?.pc_specs || {});
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url || null);

    // Sync state when user loads
    if (user) {
        if (bio === "" && user.bio) setBio(user.bio);
        if (displayName === "" && user.display_name) setDisplayName(user.display_name);
        if (Object.keys(gamertags).length === 0 && user.gamertags) setGamertags(user.gamertags);
        if (Object.keys(specs).length === 0 && user.pc_specs) setSpecs(user.pc_specs);
        // Only set preview if not already set by file selection
        if (!avatarPreview && user.avatar_url) setAvatarPreview(user.avatar_url);
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
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

    if (isLoading || !user) {
        return (
            <div className="min-h-screen pt-24 flex justify-center bg-[var(--bg-primary)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    const renderTabButton = (id: 'bio' | 'ids' | 'specs', label: string, icon: any) => (
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
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
                    {/* Tabs */}
                    <div className="flex border-b border-[var(--border)] overflow-x-auto">
                        {renderTabButton('bio', 'Basic Info', <User className="w-4 h-4" />)}
                        {renderTabButton('ids', 'Gamertags', <Gamepad2 className="w-4 h-4" />)}
                        {renderTabButton('specs', 'PC Specs', <Cpu className="w-4 h-4" />)}
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
                    </div>
                </div>
            </div>
        </div>
    );
}
