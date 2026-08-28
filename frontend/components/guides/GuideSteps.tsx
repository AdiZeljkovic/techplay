import { ARTICLE_PROSE } from "@/lib/prose";

export interface GuideStep {
    title?: string | null;
    description?: string | null;
    image?: string | null;
}

/**
 * The step-by-step section of a guide.
 *
 * The editor has offered this the whole time — a repeater with a title, a
 * rich-text body and a screenshot per step — and until 18.08.2026 there was no
 * column behind it, so every step written was discarded on save. The column
 * exists now; this is the other half.
 *
 * Numbering is real here, not decoration: the whole point of the section is
 * that step three comes after step two, so the ordinal is content and gets the
 * space content gets. It is drawn on a rail down the left so the eye can follow
 * the sequence without reading, which is how anyone actually uses a guide —
 * find the step you are stuck on, not read from the top.
 */
export default function GuideSteps({ steps }: { steps?: GuideStep[] | null }) {
    // A guide with no steps is the normal case, not an empty state to announce.
    const usable = (steps ?? []).filter(
        (step) => (step?.title ?? "").trim() !== "" || (step?.description ?? "").trim() !== "",
    );

    if (usable.length === 0) return null;

    const storage = (process.env.NEXT_PUBLIC_STORAGE_URL ?? "").replace(/\/$/, "");

    return (
        <section className="mt-14" aria-labelledby="guide-steps-heading">
            <h2
                id="guide-steps-heading"
                className="font-display text-white text-[26px] md:text-[30px] font-bold tracking-tight leading-tight pl-4 border-l-4 border-[var(--accent)] mb-2"
            >
                Step by step
            </h2>
            <p className="pl-4 text-white/50 text-[11px] font-bold uppercase tracking-widest mb-8">
                {usable.length} {usable.length === 1 ? "step" : "steps"}
            </p>

            <ol className="relative flex flex-col gap-10 border-l border-white/[0.07] pl-6 md:pl-8 ml-3">
                {usable.map((step, index) => {
                    const image = step.image
                        ? step.image.startsWith("http")
                            ? step.image
                            : `${storage}/${step.image.replace(/^\//, "")}`
                        : null;

                    return (
                        <li key={index} className="relative">
                            {/* The marker sits on the rail, not beside it. */}
                            <span
                                aria-hidden
                                className="absolute -left-[calc(1.5rem+1px)] md:-left-[calc(2rem+1px)] -translate-x-1/2 flex items-center justify-center w-7 h-7 rounded-full bg-[#0A0D12] border border-white/10 font-mono text-[11px] font-bold text-[var(--accent)] tabular-nums"
                            >
                                {index + 1}
                            </span>

                            {step.title && (
                                <h3 className="font-display text-white text-[19px] md:text-[21px] font-bold leading-snug mb-3">
                                    {step.title}
                                </h3>
                            )}

                            {step.description && (
                                <div
                                    className={ARTICLE_PROSE}
                                    dangerouslySetInnerHTML={{ __html: step.description }}
                                />
                            )}

                            {image && (
                                <img
                                    src={image}
                                    alt={step.title ? `${step.title} — screenshot` : `Step ${index + 1}`}
                                    loading="lazy"
                                    className="mt-4 w-full rounded-lg border border-white/[0.07]"
                                />
                            )}
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}

/**
 * The same steps as schema.org `HowToStep`, for the HowTo block the page
 * already emits — where `"step"` has been a hardcoded empty array with a note
 * saying it could be parsed if it were ever structured. It is structured now.
 */
export function stepsForSchema(steps?: GuideStep[] | null, storageUrl?: string) {
    const storage = (storageUrl ?? "").replace(/\/$/, "");

    return (steps ?? [])
        .filter((step) => (step?.title ?? "").trim() !== "" || (step?.description ?? "").trim() !== "")
        .map((step, index) => {
            const image = step.image
                ? step.image.startsWith("http")
                    ? step.image
                    : `${storage}/${step.image.replace(/^\//, "")}`
                : null;

            return {
                "@type": "HowToStep",
                position: index + 1,
                name: step.title || `Step ${index + 1}`,
                text: (step.description ?? "").replace(/<[^>]+>/g, "").trim() || step.title || "",
                ...(image ? { image } : {}),
            };
        });
}
