'use client';

import { ComprehensiveWowAnalysis } from '@/types';
import { Shield, Trophy, Skull, Star, RefreshCw, Share2, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface CharacterHeroProps {
    data: ComprehensiveWowAnalysis;
    onRefresh?: () => void;
}

export default function CharacterHero({ data, onRefresh }: CharacterHeroProps) {
    const { character, readiness_score, equipment, mythic_plus, raids } = data;
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleShare = async () => {
        const shareUrl = window.location.href;
        const shareText = `Check out my ${character.name} on TechPlay WoW Analyzer! Midnight Readiness: ${readiness_score}%`;

        if (navigator.share) {
            try {
                await navigator.share({ title: shareText, url: shareUrl });
                toast.success('Shared successfully!');
            } catch (err) {
                // User cancelled share
            }
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(shareUrl);
            toast.success('Profile link copied to clipboard!');
        }
    };

    const handleRefresh = async () => {
        if (!onRefresh) return;
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
    };

    const openArmory = () => {
        const region = character.faction ? 'eu' : 'us'; // This should come from data
        const armoryUrl = `https://worldofwarcraft.blizzard.com/en-${region}/character/${region}/${character.name?.toLowerCase()}/${character.name}`;
        window.open(armoryUrl, '_blank');
    };

    const metrics = [
        {
            icon: Shield,
            label: 'Item Level',
            value: equipment?.item_level || 0,
            suffix: 'iLvL',
            color: 'text-blue-500',
        },
        {
            icon: Trophy,
            label: 'M+ Score',
            value: mythic_plus?.score || 0,
            suffix: 'Rio',
            color: 'text-purple-500',
        },
        {
            icon: Skull,
            label: 'Raid',
            value: raids?.summary || '0/0',
            suffix: '',
            color: 'text-[var(--accent)]',
        },
        {
            icon: Star,
            label: 'Midnight',
            value: readiness_score,
            suffix: '%',
            color: 'text-green-500',
        },
    ];

    const getFactionColor = (faction: string): string => {
        if (faction.toLowerCase() === 'alliance') return 'text-blue-500';
        if (faction.toLowerCase() === 'horde') return 'text-red-500';
        return 'text-[var(--text-primary)]';
    };

    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl overflow-hidden">
            {/* Header with character info */}
            <div className="p-8 border-b border-[var(--border)]">
                <div className="flex items-start gap-6">
                    {/* Character Portrait */}
                    {character.portrait_url && (
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-[var(--accent)] shrink-0">
                            <Image
                                src={character.portrait_url}
                                alt={character.name}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                    )}

                    {/* Character Details */}
                    <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 mb-2">
                            <h2 className="text-3xl font-bold text-[var(--text-primary)]">
                                {character.name}
                            </h2>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleShare}
                                    className="p-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors group"
                                    title="Share profile"
                                >
                                    <Share2 className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--accent)]" />
                                </button>

                                {onRefresh && (
                                    <button
                                        onClick={handleRefresh}
                                        disabled={isRefreshing}
                                        className="p-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors group disabled:opacity-50"
                                        title="Refresh data"
                                    >
                                        <RefreshCw className={`w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--accent)] ${isRefreshing ? 'animate-spin' : ''}`} />
                                    </button>
                                )}

                                <button
                                    onClick={openArmory}
                                    className="px-4 py-2 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 transition-colors flex items-center gap-2"
                                    title="View on Armory"
                                >
                                    <span className="text-sm font-semibold text-[var(--accent)]">Armory</span>
                                    <ExternalLink className="w-4 h-4 text-[var(--accent)]" />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-[var(--text-secondary)]">
                            <span className="font-semibold">
                                Level <span className="text-[var(--text-primary)]">{character.level}</span>
                            </span>
                            <span className="text-[var(--border)]">•</span>
                            <span className="font-semibold text-[var(--text-primary)]">
                                {character.class}
                            </span>
                            <span className="text-[var(--border)]">•</span>
                            <span className="font-semibold text-[var(--text-primary)]">
                                {character.race}
                            </span>
                            <span className="text-[var(--border)]">•</span>
                            <span className={`font-semibold ${getFactionColor(character.faction)}`}>
                                {character.faction}
                            </span>
                            <span className="text-[var(--border)]">•</span>
                            <span>
                                {character.achievement_points.toLocaleString()} achievement points
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4-Metric Snapshot */}
            <div className="grid grid-cols-2 md:grid-cols-4">
                {metrics.map((metric, index) => (
                    <div
                        key={index}
                        className={`p-6 text-center ${
                            index < metrics.length - 1 ? 'border-r border-[var(--border)]' : ''
                        } ${index < 2 ? 'border-b md:border-b-0' : ''} border-[var(--border)]`}
                    >
                        <div className="flex justify-center mb-3">
                            <metric.icon className={`w-6 h-6 ${metric.color}`} />
                        </div>
                        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2">
                            {metric.label}
                        </p>
                        <p className={`text-2xl font-bold ${metric.color}`}>
                            {metric.value}
                            {metric.suffix && (
                                <span className="text-sm ml-1 text-[var(--text-secondary)]">
                                    {metric.suffix}
                                </span>
                            )}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
