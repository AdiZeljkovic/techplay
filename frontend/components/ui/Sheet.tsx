"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

/**
 * The bottom sheet — how a phone asks a question.
 *
 * A dropdown belongs to a mouse: it opens next to the control, which on a
 * phone means it opens under a thumb and over the thing you were reading. A
 * centred dialog belongs to a desktop, where there is room around it. The
 * sheet comes up from the edge the hand is already at, and it is the shape
 * every filter, sort, share and picker on this site should take below md.
 *
 * What it gets right, in the order these things bite:
 *
 * 1. It reaches from the bottom of the *screen*, not the bottom of `100vh`.
 *    On mobile Safari those are different numbers whenever the address bar is
 *    showing, and a sheet sized in vh hangs its footer below the fold.
 * 2. Its padding clears the home indicator, or the last row of every sheet is
 *    a row nobody can press.
 * 3. Scrolling to the end of its list does not start dragging the page behind
 *    it. That chaining is the single loudest tell that an overlay is a web
 *    page rather than a sheet.
 * 4. The page behind it is locked while it is open, and gets its scroll
 *    position back when it closes — the position is captured rather than
 *    inferred, because `position: fixed` on the body loses it otherwise.
 *
 * Dragging is framer's, not hand-rolled: it is already a dependency, and the
 * velocity check it gives for free is what separates a flick from a scroll.
 */

interface SheetProps {
    open: boolean;
    onClose: () => void;
    /** Shown in the sheet's own header, beside the close button. */
    title?: string;
    /** A row pinned under the content — "Apply", "Clear", a count. */
    footer?: React.ReactNode;
    children: React.ReactNode;
    /**
     * How tall it is allowed to grow. The default leaves the top of the page
     * visible, which is what tells the reader the sheet is a layer over
     * something rather than a new screen.
     */
    maxHeight?: string;
}

export default function Sheet({
    open, onClose, title, footer, children, maxHeight = "85dvh",
}: SheetProps) {
    const scrollY = useRef(0);

    // Escape closes it, the way a dialog does.
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    // Lock the page under it. Pinning the body is the only lock iOS respects,
    // and pinning the body is also what throws the scroll position away, so
    // the position is put back by hand on the way out.
    useEffect(() => {
        if (!open) return;
        scrollY.current = window.scrollY;
        const body = document.body;
        const prev = { position: body.style.position, top: body.style.top, width: body.style.width };
        body.style.position = "fixed";
        body.style.top = `-${scrollY.current}px`;
        body.style.width = "100%";

        return () => {
            body.style.position = prev.position;
            body.style.top = prev.top;
            body.style.width = prev.width;
            window.scrollTo(0, scrollY.current);
        };
    }, [open]);

    if (typeof document === "undefined") return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        key="scrim"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[90] bg-black/65 backdrop-blur-[2px]"
                        aria-hidden
                    />

                    <motion.div
                        key="sheet"
                        role="dialog"
                        aria-modal="true"
                        aria-label={title}
                        data-overlay
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 34, stiffness: 340 }}
                        drag="y"
                        dragElastic={{ top: 0, bottom: 0.35 }}
                        dragConstraints={{ top: 0, bottom: 0 }}
                        // A flick down closes it; a slow short drag springs
                        // back. Distance alone would close the sheet on a
                        // careful drag the reader meant to undo.
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 120 || info.velocity.y > 620) onClose();
                        }}
                        className="fixed inset-x-0 bottom-0 z-[91] flex flex-col rounded-t-[18px] border-t border-x border-[var(--line-strong)] bg-[var(--surface-1)] shadow-[0_-24px_60px_rgba(0,0,0,0.65)]"
                        style={{ maxHeight }}
                    >
                        {/* The handle is the affordance and the drag target:
                            a sheet you can only close with a button is a
                            dialog wearing a sheet's shape. */}
                        <div className="shrink-0 pt-2.5 pb-1 flex justify-center cursor-grab active:cursor-grabbing">
                            <span aria-hidden className="h-1 w-10 rounded-full bg-white/20" />
                        </div>

                        {title && (
                            <div className="shrink-0 flex items-center justify-between gap-3 px-5 pb-3 pt-1">
                                <h2 className="font-display text-[13px] font-black uppercase tracking-[0.12em] text-white">
                                    {title}
                                </h2>
                                <button
                                    onClick={onClose}
                                    aria-label="Close"
                                    className="-mr-2 h-11 w-11 inline-flex items-center justify-center text-white/45 active:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2">
                            {children}
                        </div>

                        <div
                            className="shrink-0 px-5 pt-3"
                            style={{ paddingBottom: "calc(0.875rem + env(safe-area-inset-bottom, 0px))" }}
                        >
                            {footer}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
