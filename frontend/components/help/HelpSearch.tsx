import { Search } from "lucide-react";

/**
 * The search box, as a form.
 *
 * A plain `<form method="get">` pointed at /search — no state, no handler, no
 * JavaScript. It works with scripts blocked, before hydration, and in the
 * reader's browser history, and the results page it lands on is server
 * rendered, so what the reader sees is what a crawler sees.
 *
 * That is not austerity for its own sake. The single loudest question this
 * section exists to answer is "the Create account button does nothing" — and
 * the most common cause of that is a browser that is blocking scripts. A help
 * centre that needs JavaScript to answer it would be a joke at the reader's
 * expense.
 */
export default function HelpSearch({
    defaultValue = "",
    size = "lg",
}: {
    defaultValue?: string;
    /** `lg` on the index, where searching is the page's first offer. */
    size?: "lg" | "sm";
}) {
    const big = size === "lg";

    return (
        <form action="/search" method="get" role="search" className="w-full">
            <label htmlFor="help-q" className="sr-only">
                Search the help centre
            </label>

            <div
                className="flex items-center gap-3 rounded-[var(--radius-panel)] border transition-colors focus-within:border-[color-mix(in_srgb,var(--accent)_55%,transparent)]"
                style={{
                    background: "var(--surface-1)",
                    borderColor: "var(--line-strong)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                    padding: big ? "0 0 0 18px" : "0 0 0 14px",
                }}
            >
                <Search
                    className={big ? "w-5 h-5 shrink-0" : "w-4 h-4 shrink-0"}
                    style={{ color: "var(--ink-low)" }}
                    aria-hidden
                />

                <input
                    id="help-q"
                    type="search"
                    name="q"
                    defaultValue={defaultValue}
                    placeholder={big ? "What has gone wrong?" : "Search help"}
                    autoComplete="off"
                    className={`min-w-0 flex-1 bg-transparent text-[var(--ink-hi)] placeholder:text-[var(--ink-low)] outline-none ${
                        big ? "h-14 text-[16px]" : "h-11 text-[14px]"
                    }`}
                />

                <button
                    type="submit"
                    className={`shrink-0 font-display font-black uppercase tracking-[0.12em] text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors rounded-r-[var(--radius-panel)] ${
                        big ? "h-14 px-6 text-[12px]" : "h-11 px-4 text-[10.5px]"
                    }`}
                >
                    Search
                </button>
            </div>
        </form>
    );
}
