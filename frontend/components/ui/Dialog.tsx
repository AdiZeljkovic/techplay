"use client";

import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onOpenChange(false)}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Modal Container to catch clicks */}
                    <div className="relative z-50 pointer-events-none w-full h-full flex items-center justify-center p-4">
                        {/* Inject close handler to children if needed */}
                        {React.Children.map(children, child => {
                            if (React.isValidElement(child)) {
                                // @ts-ignore
                                return React.cloneElement(child, { onClose: () => onOpenChange(false) });
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
            className={`bg-background border border-border rounded-lg shadow-lg max-w-lg w-full pointer-events-auto relative ${className}`}
        >
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
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
