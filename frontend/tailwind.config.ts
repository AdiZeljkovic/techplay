import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        container: {
            center: true,
            padding: "1rem",
            screens: {
                sm: "640px",
                md: "768px",
                lg: "1024px",
                xl: "1280px",
                "2xl": "1320px",
            },
        },
        extend: {
            fontFamily: {
                sans: ["var(--font-main)", "sans-serif"],
                display: ["var(--font-display)", "var(--font-main)", "sans-serif"],
            },
            colors: {
                border: "var(--border)",
                input: "var(--bg-elevated)", // using elevated bg for inputs
                ring: "var(--accent)",
                background: "var(--bg-primary)",
                foreground: "var(--text-primary)",
                primary: {
                    DEFAULT: "var(--accent)",
                    foreground: "#ffffff",
                },
                secondary: {
                    DEFAULT: "var(--bg-elevated)",
                    foreground: "var(--text-primary)",
                },
                destructive: {
                    DEFAULT: "var(--danger)",
                    foreground: "#ffffff",
                },
                muted: {
                    DEFAULT: "var(--bg-secondary)",
                    foreground: "var(--text-muted)",
                },
                accent: {
                    DEFAULT: "var(--accent)",
                    foreground: "#ffffff",
                    hover: "var(--accent-hover)",
                    light: "var(--accent-light)",
                },
                neon: {
                    cyan: "var(--color-neon-cyan)",
                    purple: "var(--color-neon-purple)",
                },
                card: {
                    DEFAULT: "var(--bg-card)",
                    foreground: "var(--text-primary)",
                },
            },
            borderRadius: {
                lg: "0.75rem",
                md: "0.5rem",
                sm: "0.25rem",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                ticker: {
                    "0%": { transform: "translateX(0)" },
                    "100%": { transform: "translateX(-50%)" },
                },
                "spin-slow": {
                    "0%": { filter: "hue-rotate(0deg)" },
                    "100%": { filter: "hue-rotate(360deg)" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                ticker: "ticker 40s linear infinite",
                "spin-slow": "spin-slow 4s linear infinite",
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
};
export default config;
