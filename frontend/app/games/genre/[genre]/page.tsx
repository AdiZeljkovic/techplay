import type { Metadata } from "next";
import HubPage from "@/app/games/_hub/HubPage";
import { getApiUrl } from "@/lib/api";

export const revalidate = 86400;
export const dynamicParams = true;

const GENRE_META: Record<string, { title: string; description: string }> = {
    "action":      { title: "Best Action Games",      description: "Explore the best action games of all time. Fast-paced combat, thrilling gameplay and non-stop excitement." },
    "rpg":         { title: "Best RPG Games",          description: "Discover top-rated role-playing games. Epic stories, deep character progression and vast open worlds." },
    "adventure":   { title: "Best Adventure Games",    description: "Explore the greatest adventure games. Story-driven experiences, exploration and puzzle-solving." },
    "strategy":    { title: "Best Strategy Games",     description: "Top strategy games that challenge your mind. From real-time to turn-based, conquer and build empires." },
    "shooter":     { title: "Best Shooter Games",      description: "The best FPS and TPS games ever made. Intense gunplay, competitive multiplayer and tactical combat." },
    "puzzle":      { title: "Best Puzzle Games",       description: "Brain-teasing puzzle games for all skill levels. Logic, creativity and satisfying problem solving." },
    "sports":      { title: "Best Sports Games",       description: "Top sports games across all genres. Football, basketball, racing and more." },
    "racing":      { title: "Best Racing Games",       description: "The fastest racing games on the planet. Arcade fun to realistic simulation." },
    "fighting":    { title: "Best Fighting Games",     description: "Top fighting games with intense one-on-one combat. Master combos and beat the competition." },
    "platformer":  { title: "Best Platformer Games",   description: "Classic and modern platformer games. Jump, run and explore colourful worlds." },
    "simulation":  { title: "Best Simulation Games",   description: "Realistic simulation games for every interest. Life sims, city builders and more." },
    "indie":       { title: "Best Indie Games",        description: "Hidden gems and celebrated indie titles. Creative, unique and unforgettable gaming experiences." },
    "casual":      { title: "Best Casual Games",       description: "Easy-to-pick-up casual games for everyone. Relax and have fun without steep learning curves." },
    "horror":      { title: "Best Horror Games",       description: "Scariest horror games that will keep you on edge. Survival horror, psychological thrills and more." },
};

function getMeta(genre: string) {
    const key = genre.toLowerCase().replace(/-/g, " ");
    return GENRE_META[key] ?? {
        title:       `Best ${genre.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Games`,
        description: `Explore the best ${genre.replace(/-/g, " ")} games. Browse top-rated titles, ratings and reviews on TechPlay.`,
    };
}

export async function generateMetadata({ params }: { params: Promise<{ genre: string }> }): Promise<Metadata> {
    const { genre } = await params;
    const meta = getMeta(genre);
    return {
        title:       `${meta.title} — TechPlay`,
        description: meta.description,
        alternates:  { canonical: `https://techplay.gg/games/genre/${genre}` },
        openGraph: {
            title:       `${meta.title} — TechPlay`,
            description: meta.description,
            url:         `https://techplay.gg/games/genre/${genre}`,
        },
    };
}

export default async function GenreHubPage({ params }: { params: Promise<{ genre: string }> }) {
    const { genre } = await params;
    const meta = getMeta(genre);
    const initialData = await fetch(`${getApiUrl()}/games/hub/genre/${genre}?page=1&sort=rating`, { next: { revalidate: 600 } })
        .then((r) => r.ok ? r.json() : null).catch(() => null);
    return <HubPage type="genre" value={genre} title={meta.title} description={meta.description} initialData={initialData} />;
}
