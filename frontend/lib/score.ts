/**
 * Review-score verdict bands — the editorial voice of TechPlay Reviews.
 * Colors come from the --score-* tokens declared in globals.css.
 */
export interface ScoreMeta {
    color: string;
    label: string;
    glow: string;
}

export function getScoreMeta(score: number): ScoreMeta {
    const band = (token: string, label: string): ScoreMeta => ({
        color: `var(--score-${token})`,
        label,
        glow: `color-mix(in srgb, var(--score-${token}) 45%, transparent)`,
    });

    if (score >= 9) return band("masterpiece", "MASTERPIECE");
    if (score >= 8) return band("great", "GREAT");
    if (score >= 7) return band("good", "GOOD");
    if (score >= 6) return band("fair", "FAIR");
    return band("poor", "POOR");
}
