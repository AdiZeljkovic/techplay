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
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            fontFamily: {
                sans: ["var(--font-main)", "sans-serif"],
                display: ["var(--font-main)", "sans-serif"],
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
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
        },
    },
    plugins: [],
};
export default config;
