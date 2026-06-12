"use client";

import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    if (!mounted) return <div className="w-9 h-9" />;

    return (
        <button
            onClick={toggleTheme}
            className="hidden xl:flex items-center justify-center w-9 h-9 rounded-lg text-zinc-600 dark:text-slate-300 hover:text-tp-accent dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
            aria-label="Toggle dark mode"
        >
            {theme === "dark"
                ? <Sun className="w-[18px] h-[18px]" />
                : <Moon className="w-[18px] h-[18px]" />
            }
        </button>
    );
}
