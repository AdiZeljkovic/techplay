/**
 * Review-score verdict bands — the editorial voice of TechPlay Reviews.
 * Colors come from the --score-* tokens declared in globals.css.
 */
export interface ScoreMeta {
    color: string;
    label: string;
    glow: string;
    /**
     * What to write on top of `color` when it is used as a solid fill.
     *
     * Not always white: `good` is a light green and `fair` a yellow, and white
     * on either is unreadable. Ink on the light bands, white on the dark ones.
     */
    ink: string;
}

export function getScoreMeta(score: number): ScoreMeta {
    const band = (token: string, label: string, ink: string): ScoreMeta => ({
        color: `var(--score-${token})`,
        label,
        glow: `color-mix(in srgb, var(--score-${token}) 45%, transparent)`,
        ink,
    });

    const WHITE = "#ffffff";
    const INK = "#0b0b0c";

    if (score >= 9) return band("masterpiece", "MASTERPIECE", WHITE);
    if (score >= 8) return band("great", "GREAT", WHITE);
    if (score >= 7) return band("good", "GOOD", INK);
    if (score >= 6) return band("fair", "FAIR", INK);
    return band("poor", "POOR", WHITE);
}
