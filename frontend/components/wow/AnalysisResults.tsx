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
    const badges = {
        gear: data.equipment?.item_level ? `${data.equipment.item_level}` : undefined,
        mythic: data.mythic_plus?.score ? `${data.mythic_plus.score}` : undefined,
        raids: data.raids?.summary || undefined,
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
                    {activeTab === 'overview' && <OverviewTab data={data} />}
                    {activeTab === 'gear' && <EquipmentView equipment={data.equipment} />}
                    {activeTab === 'mythic' && <MythicPlusStats mythicPlus={data.mythic_plus} />}
                    {activeTab === 'raids' && <RaidProgress raids={data.raids} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
