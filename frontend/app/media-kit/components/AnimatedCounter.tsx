"use client";

import { useEffect, useState, useRef } from "react";
import { useInView } from "framer-motion";

interface AnimatedCounterProps {
    value: number;
    duration?: number;
    suffix?: string;
    decimals?: number;
}

export default function AnimatedCounter({
    value,
    duration = 2000,
    suffix = "",
    decimals = 0
}: AnimatedCounterProps) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (!isInView) return;

        let startTime: number | null = null;
        const startValue = 0;
        const endValue = value;

        const animate = (currentTime: number) => {
            if (startTime === null) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out cubic)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentCount = startValue + (endValue - startValue) * easeOut;

            setCount(currentCount);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setCount(endValue);
            }
        };

        requestAnimationFrame(animate);
    }, [isInView, value, duration]);

    const formatNumber = (num: number) => {
        if (decimals > 0) {
            return num.toFixed(decimals);
        }
        return Math.floor(num).toLocaleString();
    };

    return (
        <span ref={ref}>
            {formatNumber(count)}{suffix}
        </span>
    );
}
