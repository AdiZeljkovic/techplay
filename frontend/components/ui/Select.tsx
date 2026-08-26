"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

/**
 * The site's dropdown.
 *
 * Seventeen native `<select>` elements were scattered across thirteen files.
 * A browser draws that list itself, from the operating system, and no amount
 * of CSS reaches inside it — so on a near-black page every one of them opened
 * a white sheet with a blue Windows highlight. `appearance-none` on the
 * trigger only ever hid half the problem: the closed box looked like ours and
 * the open list did not.
 *
 * The look is the one the studios page already had — trigger, chevron, panel,
 * a check on the chosen row. What it did not have, and what a control that
 * replaces `<select>` owes people, is the keyboard: a native select answers
 * arrows, Home, End, Escape, Enter and type-ahead, and losing that is a real
 * cost, not a detail.
 *
 * `name` renders a hidden input, so a plain `<form>` reading FormData still
 * finds the value.
 *
 * The menu is drawn through a portal rather than inside the trigger. An
 * absolutely-positioned panel is clipped by any ancestor that hides its
 * overflow, and `Panel` — the enclosure most of this site's forms are built
 * from — does exactly that: the category picker on the list editor showed two
 * rows and a scrollbar, cut off at the panel's own edge.
 */

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    /** Drawn when the value matches no option — the old `<option value="">` row. */
    placeholder?: string;
    /** Leading mark inside the trigger. */
    icon?: ReactNode;
    ariaLabel?: string;
    /** Submit this control inside a plain form. */
    name?: string;
    disabled?: boolean;
    /** Trigger classes: height, width, type scale — set per call site. */
    className?: string;
    /** Panel classes, for when it should be wider than the trigger. */
    menuClassName?: string;
    /** Which edge the panel hangs from. */
    align?: "start" | "end";
}

export default function Select({
    value,
    onChange,
    options,
    placeholder,
    icon,
    ariaLabel,
    name,
    disabled = false,
    className = "",
    menuClassName = "",
    align = "start",
}: SelectProps) {
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    /** Where the portalled menu sits, in viewport coordinates. */
    const [box, setBox] = useState<{ top: number; left: number; width: number; drop: "down" | "up" } | null>(null);

    const wrapRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    /** Accumulated keystrokes for type-ahead, cleared after a pause. */
    const typed = useRef({ text: "", at: 0 });

    const id = useId();
    const selectedIndex = options.findIndex((o) => o.value === value);
    const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

    const close = useCallback((refocus = true) => {
        setOpen(false);
        if (refocus) triggerRef.current?.focus();
    }, []);

    /* Opening lands on the current choice, not on the first row. */
    const openMenu = useCallback(() => {
        setActive(selectedIndex >= 0 ? selectedIndex : 0);
        setOpen(true);
    }, [selectedIndex]);

    /* A click anywhere else closes it — pointerdown, so it beats the click
       that would otherwise land on whatever is underneath. */
    useEffect(() => {
        if (!open) return;

        const away = (e: PointerEvent) => {
            const t = e.target as Node;
            // The menu lives on document.body now, so containment has to be
            // asked of both halves of the control.
            if (wrapRef.current?.contains(t) || listRef.current?.contains(t)) return;
            setOpen(false);
        };
        document.addEventListener("pointerdown", away);
        return () => document.removeEventListener("pointerdown", away);
    }, [open]);

    /**
     * Measure the trigger and place the menu against it.
     *
     * Layout effect, so the panel is positioned in the same frame it appears —
     * measuring after paint puts it at the top-left corner for one frame first.
     *
     * Scroll is listened for in the capture phase because the page's scroller
     * is often an inner element, not the window, and a menu that stays behind
     * while its trigger moves is worse than one that is clipped.
     */
    useLayoutEffect(() => {
        if (!open) { setBox(null); return; }

        const place = () => {
            const el = triggerRef.current;
            if (!el) return;

            const r = el.getBoundingClientRect();
            const below = window.innerHeight - r.bottom;

            // 280px is the menu's own ceiling. With less room under the trigger
            // than over it, the panel opens upward instead of scrolling inside
            // a sliver.
            const up = below < Math.min(280, r.top);

            setBox({
                top: up ? r.top - 6 : r.bottom + 6,
                left: align === "end" ? r.right : r.left,
                width: r.width,
                drop: up ? "up" : "down",
            });
        };

        place();
        window.addEventListener("scroll", place, true);
        window.addEventListener("resize", place);
        return () => {
            window.removeEventListener("scroll", place, true);
            window.removeEventListener("resize", place);
        };
    }, [open, align]);

    /* Keep the active row in sight when the arrows walk past the fold. */
    useEffect(() => {
        if (!open) return;
        listRef.current
            ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
            ?.scrollIntoView({ block: "nearest" });
    }, [open, active]);

    const step = (from: number, delta: number) => {
        const n = options.length;
        if (n === 0) return 0;

        // Walk past anything unselectable rather than parking on it.
        for (let i = 1; i <= n; i++) {
            const next = (from + delta * i + n * i) % n;
            if (!options[next]?.disabled) return next;
        }
        return from;
    };

    const pick = (index: number) => {
        const option = options[index];
        if (!option || option.disabled) return;

        onChange(option.value);
        close();
    };

    /** Jump to the first option starting with what was typed — a select does this. */
    const typeAhead = (char: string) => {
        const now = Date.now();
        typed.current.text = now - typed.current.at > 600 ? char : typed.current.text + char;
        typed.current.at = now;

        const needle = typed.current.text.toLowerCase();
        const found = options.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(needle));
        if (found >= 0) setActive(found);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        if (!open) {
            if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
                e.preventDefault();
                openMenu();
            }
            return;
        }

        switch (e.key) {
            case "Escape":
                e.preventDefault();
                close();
                break;
            case "Tab":
                // Leaving the control is not choosing — let focus go.
                setOpen(false);
                break;
            case "ArrowDown":
                e.preventDefault();
                setActive((i) => step(i, 1));
                break;
            case "ArrowUp":
                e.preventDefault();
                setActive((i) => step(i, -1));
                break;
            case "Home":
                e.preventDefault();
                setActive(step(-1, 1));
                break;
            case "End":
                e.preventDefault();
                setActive(step(0, -1));
                break;
            case "Enter":
            case " ":
                e.preventDefault();
                pick(active);
                break;
            default:
                if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
                    e.preventDefault();
                    typeAhead(e.key);
                }
        }
    };

    return (
        <div ref={wrapRef} className="relative">
            {name && <input type="hidden" name={name} value={value} />}

            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={open ? `${id}-list` : undefined}
                onClick={() => (open ? close(false) : openMenu())}
                onKeyDown={onKeyDown}
                className={`inline-flex items-center justify-between gap-2 rounded-[8px] bg-white/[0.03] border border-white/[0.09] text-left text-white/80 hover:text-white hover:border-white/20 focus:outline-none focus-visible:border-[color-mix(in_srgb,var(--accent)_55%,transparent)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${className}`}
            >
                <span className="inline-flex items-center gap-2 min-w-0">
                    {icon}
                    <span className={`truncate ${selected ? "" : "text-white/40"}`}>
                        {selected?.label ?? placeholder ?? ""}
                    </span>
                </span>
                <ChevronDown
                    aria-hidden
                    className={`w-3.5 h-3.5 shrink-0 text-white/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open && box && createPortal(
                <div
                    ref={listRef}
                    id={`${id}-list`}
                    role="listbox"
                    aria-label={ariaLabel}
                    aria-activedescendant={`${id}-opt-${active}`}
                    tabIndex={-1}
                    style={{
                        position: "fixed",
                        top: box.drop === "down" ? box.top : undefined,
                        bottom: box.drop === "up" ? window.innerHeight - box.top : undefined,
                        left: align === "end" ? undefined : box.left,
                        right: align === "end" ? window.innerWidth - box.left : undefined,
                        minWidth: box.width,
                    }}
                    className={`z-[60] max-h-[280px] overflow-y-auto rounded-[10px] border border-white/[0.1] bg-[var(--surface-2)] p-1 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.8)] ${menuClassName}`}
                >
                    {options.map((o, i) => {
                        const isSelected = o.value === value;

                        return (
                            <button
                                key={o.value}
                                id={`${id}-opt-${i}`}
                                data-index={i}
                                role="option"
                                aria-selected={isSelected}
                                type="button"
                                disabled={o.disabled}
                                // Pointer, not click: the trigger keeps focus, so
                                // arrows and Escape still work after a mouse pick.
                                onPointerDown={(e) => { e.preventDefault(); pick(i); }}
                                onPointerEnter={() => !o.disabled && setActive(i)}
                                className={`w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-[7px] text-left text-[13px] transition-colors disabled:opacity-35 disabled:cursor-not-allowed ${
                                    i === active && !o.disabled ? "bg-white/[0.07] text-white" : "text-white/75"
                                }`}
                            >
                                <span className="truncate">{o.label}</span>
                                {isSelected && <Check aria-hidden className="w-3.5 h-3.5 shrink-0 text-[var(--accent)]" />}
                            </button>
                        );
                    })}

                    {options.length === 0 && (
                        <p className="px-2.5 py-3 text-[12.5px] text-white/30">Nothing to choose from.</p>
                    )}
                </div>,
                document.body,
            )}
        </div>
    );
}
