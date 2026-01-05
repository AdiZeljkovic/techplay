"use client";

import { cn } from "@/lib/utils";
import { forwardRef, ReactNode } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface CardProps extends Omit<HTMLMotionProps<"div">, "children"> {
    children?: ReactNode;
    hover?: boolean;
    padding?: "none" | "sm" | "md" | "lg";
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, children, hover = true, padding = "md", ...props }, ref) => {
        const paddingStyles = {
            none: "",
            sm: "p-4",
            md: "p-6",
            lg: "p-8",
        };

        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={hover ? { y: -4, boxShadow: "var(--shadow-lg)" } : undefined}
                transition={{ duration: 0.3 }}
                className={cn(
                    "bg-[var(--bg-card)] border border-[var(--border)] rounded-xl transition-all duration-300",
                    paddingStyles[padding],
                    hover && "cursor-pointer",
                    className
                )}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);

Card.displayName = "Card";

export { Card };
