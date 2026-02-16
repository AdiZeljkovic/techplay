'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ComprehensiveWowAnalysis, WowTabId } from '@/types';
import CharacterHero from './CharacterHero';
import TabNavigation from './TabNavigation';
import OverviewTab from './OverviewTab';
import EquipmentView from './EquipmentView';
import MythicPlusStats from './MythicPlusStats';
import RaidProgress from './RaidProgress';
import PvPStats from './PvPStats';

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface AnalysisResultsProps {
    data: ComprehensiveWowAnalysis & {
        id?: number;
    };
}

export default function AnalysisResults({ data }: AnalysisResultsProps) {
    const [activeTab, setActiveTab] = useState<WowTabId>('overview');

    // Calculate tab badges
    const pvpHighest = Math.max(
        data.pvp?.arena_2v2 || 0,
        data.pvp?.arena_3v3 || 0,
        data.pvp?.rbg_rating || 0
    );

    const badges = {
        gear: data.equipment?.item_level ? `${data.equipment.item_level}` : undefined,
        mythic: data.mythic_plus?.score ? `${data.mythic_plus.score}` : undefined,
        raids: data.raids?.summary || undefined,
        pvp: pvpHighest > 0 ? `${pvpHighest}` : undefined,
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Character Hero Section */}
            <CharacterHero data={data} />

            {/* Tab Navigation */}
            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} badges={badges} />

            {/* Tab Content with animations */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={fadeInUp}
                >
                    {activeTab === 'overview' && (
                        <OverviewTab
                            data={{
                                readiness_score: data.readiness_score,
                                ai_advice: data.ai_advice,
                                missing_essentials: data.missing_essentials,
                                equipment: data.equipment,
                                mythic_plus: data.mythic_plus,
                                raids: data.raids,
                                reputations: data.reputations,
                            }}
                        />
                    )}
                    {activeTab === 'gear' && <EquipmentView equipment={data.equipment} />}
                    {activeTab === 'mythic' && <MythicPlusStats mythicPlus={data.mythic_plus} />}
                    {activeTab === 'raids' && <RaidProgress raids={data.raids} />}
                    {activeTab === 'pvp' && <PvPStats pvp={data.pvp} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
