'use client';

import { ComprehensiveWowAnalysis } from '@/types';
import { Shield, Trophy, Skull, Star } from 'lucide-react';
import Image from 'next/image';

interface CharacterHeroProps {
    data: ComprehensiveWowAnalysis;
}

export default function CharacterHero({ data }: CharacterHeroProps) {
    const { character, readiness_score, equipment, mythic_plus, raids } = data;

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
                        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                            {character.name}
                        </h2>
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
