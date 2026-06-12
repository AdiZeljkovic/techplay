export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-tp-accent/10 rounded-full blur-[140px]" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[40%] h-[40%] bg-tp-accent/5 rounded-full blur-[120px]" />
                <div
                    className="absolute inset-0 opacity-[0.10] dark:opacity-[0.03]"
                    style={{ backgroundImage: 'radial-gradient(1px 1px at 50% 50%, rgba(120,120,130,0.8) 1px, transparent 0)', backgroundSize: '36px 36px' }}
                />
            </div>

            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
