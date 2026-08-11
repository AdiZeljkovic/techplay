import { Rocket } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import RoadmapIntro from "@/components/roadmap/RoadmapIntro";
import RoadmapTimeline from "@/components/roadmap/RoadmapTimeline";
import RoadmapFeatures from "@/components/roadmap/RoadmapFeatures";
import RoadmapCTA from "@/components/roadmap/RoadmapCTA";

/** Roadmap 2026 — server-rendered end to end; none of its four sections react to anything. */
export default function RoadmapClient() {
    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            <PageHero
                title="Roadmap 2026"
                description="Shaping the future of gaming & tech"
                iconNode={<Rocket className="w-6 h-6 text-[var(--accent)]" strokeWidth={1.75} />}
            />

            <div className="py-10 md:py-14 space-y-10 md:space-y-14">
                <RoadmapIntro />
                <RoadmapTimeline />
                <RoadmapFeatures />
                <RoadmapCTA />
            </div>
        </main>
    );
}
