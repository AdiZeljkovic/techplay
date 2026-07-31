import { cn } from "@/lib/utils";
import type { ElementType, ReactNode } from "react";

/** Page-width wrapper — the one 1320px container (see .container-page). */
export default function Container({
    as: Tag = "div",
    className,
    children,
}: {
    as?: ElementType;
    className?: string;
    children: ReactNode;
}) {
    return <Tag className={cn("container-page", className)}>{children}</Tag>;
}
