"use client";

import PageHero from "@/components/ui/PageHero";
import RoadmapIntro from "@/components/roadmap/RoadmapIntro";
import RoadmapTimeline from "@/components/roadmap/RoadmapTimeline";
import RoadmapFeatures from "@/components/roadmap/RoadmapFeatures";
import RoadmapCTA from "@/components/roadmap/RoadmapCTA";
import { Rocket } from "lucide-react";

export default function RoadmapPage() {
    return (
        <div className="min-h-screen">
            <PageHero
                title="Roadmap 2026"
                description="Shaping the future of gaming & tech"
                icon={Rocket}
            />

            <RoadmapIntro />
            <RoadmapTimeline />
            <RoadmapFeatures />
            <RoadmapCTA />
        </div>
    );
}
