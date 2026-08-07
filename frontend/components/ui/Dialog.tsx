"use client";

import React, { ReactNode, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
    const panelRef = useRef<HTMLDivElement>(null);

    // Escape, a scroll lock, and focus that stays inside — none of which this
    // primitive had, so a keyboard user could open a dialog and not close it,
    // and Tab walked straight out into the page behind.
    useEffect(() => {
        if (!open) return;

        const previouslyFocused = document.activeElement as HTMLElement | null;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onOpenChange(false);
                return;
            }
            if (e.key !== 'Tab' || !panelRef.current) return;

            const focusable = panelRef.current.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
            );
            if (!focusable.length) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', onKeyDown);
        const focusTimer = setTimeout(() => {
            panelRef.current?.querySelector<HTMLElement>(
                'input, textarea, button:not([disabled])'
            )?.focus();
        }, 50);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            clearTimeout(focusTimer);
            document.body.style.overflow = previousOverflow;
            previouslyFocused?.focus?.();
        };
    }, [open, onOpenChange]);

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onOpenChange(false)}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Modal Container to catch clicks */}
                    <div ref={panelRef} className="relative z-50 pointer-events-none w-full h-full flex items-center justify-center p-4">
                        {/* Inject close handler to children if needed */}
                        {React.Children.map(children, child => {
                            if (React.isValidElement(child)) {
                                return React.cloneElement(
                                    child as React.ReactElement<{ onClose?: () => void }>,
                                    { onClose: () => onOpenChange(false) }
                                );
                            }
                            return child;
                        })}
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
}

// DialogContent
interface DialogContentProps {
    children: ReactNode;
    className?: string;
    onClose?: () => void; // Injected
}

export function DialogContent({ children, className = "", onClose }: DialogContentProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={`bg-[var(--surface-2)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-lg max-w-lg w-full pointer-events-auto relative ${className}`}
        >
            {onClose && (
                <button
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] disabled:pointer-events-none"
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>
            )}
            {children}
        </motion.div>
    );
}

// DialogHeader
export function DialogHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
    return (
        <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
            {children}
        </div>
    );
}

// DialogTitle
export function DialogTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
    return (
        <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
            {children}
        </h3>
    );
}

// DialogFooter
export function DialogFooter({ children, className = "" }: { children: ReactNode; className?: string }) {
    return (
        <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-0 ${className}`}>
            {children}
        </div>
    );
}
