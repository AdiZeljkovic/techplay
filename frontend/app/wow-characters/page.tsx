'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { UserWowCharacter } from '@/types';
import { Shield, Sword, Star, Trash2, TrendingUp, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyCharactersPage() {
    const router = useRouter();
    const [characters, setCharacters] = useState<UserWowCharacter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check if user is authenticated
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        fetchCharacters();
    }, [router]);

    const fetchCharacters = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await axios.get('/user/wow-characters');
            setCharacters(data.data || []);
        } catch (err: any) {
            console.error('Failed to fetch characters', err);
            if (err.response?.status === 401) {
                router.push('/login');
            } else {
                setError('Failed to load characters. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const setMainCharacter = async (id: number) => {
        try {
            await axios.post(`/user/wow-characters/${id}/set-main`);
            fetchCharacters(); // Refresh list
        } catch (err) {
            console.error('Failed to set main character', err);
            toast.error('Failed to set main character. Please try again.');
        }
    };

    const removeCharacter = async (id: number, charName: string) => {
        if (!confirm(`Remove ${charName} from your account?`)) return;

        try {
            await axios.delete(`/user/wow-characters/${id}`);
            fetchCharacters(); // Refresh list
        } catch (err) {
            console.error('Failed to remove character', err);
            toast.error('Failed to remove character. Please try again.');
        }
    };

    const analyzeCharacter = (char: UserWowCharacter) => {
        router.push(`/wow-analyzer?character=${char.character_name}&realm=${char.realm_slug}&region=${char.region}`);
    };

    const getClassColor = (className: string | null): string => {
        const colors: Record<string, string> = {
            'Death Knight': '#C41F3B',
            'Demon Hunter': '#A330C9',
            'Druid': '#FF7D0A',
            'Evoker': '#33937F',
            'Hunter': '#ABD473',
            'Mage': '#69CCF0',
            'Monk': '#00FF96',
            'Paladin': '#F58CBA',
            'Priest': '#FFFFFF',
            'Rogue': '#FFF569',
            'Shaman': '#0070DE',
            'Warlock': '#9482C9',
            'Warrior': '#C79C6E',
        };
        return colors[className || ''] || 'var(--text-primary)';
    };

    if (loading) {
        return (
            <div className="max-w-[1320px] mx-auto px-4 xl:px-0 py-20">
                <div className="flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-[var(--text-secondary)]">Loading characters...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-[1320px] mx-auto px-4 xl:px-0 py-20">
                <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-500">{error}</p>
                    <button
                        onClick={fetchCharacters}
                        className="mt-4 px-6 py-2 bg-[var(--accent)] text-white rounded-xl hover:opacity-90 transition-opacity"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1320px] mx-auto px-4 xl:px-0 py-20">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2 flex items-center gap-3">
                    <Shield className="w-10 h-10 text-[var(--accent)]" />
                    My WoW Characters
                </h1>
                <p className="text-[var(--text-secondary)]">
                    Manage your linked World of Warcraft characters
                </p>
            </div>

            {characters.length === 0 ? (
                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-12 rounded-3xl text-center">
                    <Sword className="w-20 h-20 text-[var(--text-secondary)] mx-auto mb-6 opacity-50" />
                    <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
                        No Characters Linked Yet
                    </h3>
                    <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
                        Login with Battle.net to automatically sync all your World of Warcraft characters to your account!
                    </p>
                    <button
                        onClick={() => {
                            const region = 'eu'; // Or let user select
                            window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/battlenet/redirect?region=${region}`;
                        }}
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold transition-colors inline-flex items-center gap-3"
                    >
                        <Shield className="w-5 h-5" />
                        Login with Battle.net
                    </button>
                </div>
            ) : (
                <>
                    {/* Characters Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {characters.map((char) => (
                            <div
                                key={char.id}
                                className={`bg-[var(--bg-card)] border rounded-3xl p-6 hover:border-[var(--accent)] transition-all ${
                                    char.is_main ? 'border-[var(--accent)] shadow-lg shadow-[var(--accent)]/20' : 'border-[var(--border)]'
                                }`}
                            >
                                {/* Main Badge */}
                                {char.is_main && (
                                    <div className="flex items-center gap-2 mb-3">
                                        <Star className="w-4 h-4 text-[var(--accent)] fill-[var(--accent)]" />
                                        <span className="text-xs px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-semibold uppercase">
                                            Main Character
                                        </span>
                                    </div>
                                )}

                                {/* Character Info */}
                                <div className="flex items-start gap-4 mb-4">
                                    {char.avatar_url && (
                                        <img
                                            src={char.avatar_url}
                                            alt={char.character_name}
                                            className="w-16 h-16 rounded-xl border-2"
                                            style={{ borderColor: getClassColor(char.character_class) }}
                                        />
                                    )}
                                    <div className="flex-1">
                                        <h3
                                            className="text-xl font-bold mb-1"
                                            style={{ color: getClassColor(char.character_class) }}
                                        >
                                            {char.character_name}
                                        </h3>
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            {char.character_class || 'Unknown'} • Level {char.level}
                                        </p>
                                        <p className="text-xs text-[var(--text-secondary)]">
                                            {char.realm_slug} ({char.region.toUpperCase()})
                                        </p>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="mb-4 p-3 bg-[var(--bg-secondary)] rounded-xl">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-[var(--text-secondary)]">Item Level:</span>
                                        <span className="font-bold text-[var(--text-primary)]">
                                            {char.item_level || 'Unknown'}
                                        </span>
                                    </div>
                                    {char.last_analyzed_at && (
                                        <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-[var(--border)]">
                                            <span className="text-[var(--text-secondary)]">Last Analyzed:</span>
                                            <span className="text-[var(--text-secondary)]">
                                                {new Date(char.last_analyzed_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => analyzeCharacter(char)}
                                        className="flex-1 px-4 py-2 bg-[var(--accent)] text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold flex items-center justify-center gap-2"
                                    >
                                        <TrendingUp className="w-4 h-4" />
                                        Analyze
                                    </button>
                                    {!char.is_main && (
                                        <button
                                            onClick={() => setMainCharacter(char.id)}
                                            className="px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-xl hover:bg-[var(--border)] transition-colors text-sm font-semibold"
                                        >
                                            Set as Main
                                        </button>
                                    )}
                                    <button
                                        onClick={() => removeCharacter(char.id, char.character_name)}
                                        className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors"
                                        title="Remove character"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tips */}
                    <div className="bg-tp-accent/5 border border-tp-accent/20 p-6 rounded-3xl">
                        <h4 className="text-sm font-semibold text-tp-accent uppercase mb-3">Quick Tips</h4>
                        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                            <li>• Click "Analyze" to run a fresh Midnight readiness analysis for any character</li>
                            <li>• Set your most-played character as "Main" for easy identification</li>
                            <li>• Characters are automatically synced when you login with Battle.net</li>
                            <li>• Re-login with Battle.net to sync newly created characters</li>
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
}
