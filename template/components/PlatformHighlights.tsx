import Link from 'next/link';
import { Gamepad2, CalendarDays, MessageSquare, Star } from 'lucide-react';

export default function PlatformHighlights() {
  return (
    <section className="px-4 xl:px-0 max-w-[1320px] mx-auto mb-[80px]">
      <div className="bg-white dark:bg-[#05070A] rounded-[16px] border border-zinc-200 dark:border-[#FF5A00]/40 shadow-sm dark:shadow-[0_0_30px_rgba(255,90,0,0.05)] p-8 lg:p-10 relative overflow-hidden transition-colors duration-300">
        {/* Subtle orange glow */}
        <div className="absolute top-0 left-[20%] w-[60%] h-[1px] bg-gradient-to-r from-transparent via-[#FF5A00]/20 dark:via-[#FF5A00]/50 to-transparent" />
        <div className="absolute -top-[150px] -left-[100px] w-[400px] h-[400px] bg-[#FF5A00]/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="mb-10 relative z-10">
          <span className="text-[#FF5A00] font-bold tracking-[0.15em] text-[11px] uppercase mb-3 block">
            EXPLORE TECHPLAY.GG
          </span>
          <h2 className="font-display text-[28px] lg:text-[34px] font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">
            One platform for everything gaming
          </h2>
          <p className="text-zinc-600 dark:text-[#A1A1AA] text-[15px]">
            Discover games, track releases, join the community, and read trusted reviews.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6 relative z-10">
          
          {/* Card 1 */}
          <div className="bg-zinc-50 dark:bg-[#0B0E14] rounded-[16px] border border-zinc-200 dark:border-[#161B22] hover:border-[#FF5A00]/30 transition-all duration-300 p-6 lg:p-7 flex flex-col group shadow-sm dark:shadow-lg">
            <div className="w-[62px] h-[62px] mx-auto rounded-full border border-[#FF5A00] bg-[#FF5A00]/5 flex items-center justify-center mb-8 group-hover:shadow-[0_0_15px_rgba(255,90,0,0.2)] transition-all">
              <div className="w-[48px] h-[48px] rounded-full bg-white dark:bg-[#1A1F26] flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)] border border-zinc-100 dark:border-none">
                <Gamepad2 className="w-[22px] h-[22px] text-[#FF5A00]" strokeWidth={2} />
              </div>
            </div>
            <div className="flex flex-col flex-1 text-center mb-8">
              <h3 className="text-zinc-900 dark:text-white font-bold text-[15px] mb-3 font-sans uppercase tracking-widest leading-tight">GAME DATABASE</h3>
              <p className="text-zinc-500 dark:text-[#8B949E] text-[14px] leading-relaxed">
                Explore over 1,000,000 games. Search, filter, discover.
              </p>
            </div>
            <Link href="#" className="mt-auto bg-[#FF5A00] hover:bg-[#FF6A00] text-white h-[46px] rounded font-bold transition-colors uppercase tracking-[0.08em] text-[12px] flex items-center justify-center shadow-lg shadow-[#FF5A00]/20">
              1M+ GAMES
            </Link>
          </div>

          {/* Card 2 */}
          <div className="bg-zinc-50 dark:bg-[#0B0E14] rounded-[16px] border border-zinc-200 dark:border-[#161B22] hover:border-[#FF5A00]/30 transition-all duration-300 p-6 lg:p-7 flex flex-col group shadow-sm dark:shadow-lg">
            <div className="w-[62px] h-[62px] mx-auto rounded-full border border-[#FF5A00] bg-[#FF5A00]/5 flex items-center justify-center mb-8 group-hover:shadow-[0_0_15px_rgba(255,90,0,0.2)] transition-all">
              <div className="w-[48px] h-[48px] rounded-full bg-white dark:bg-[#1A1F26] flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)] border border-zinc-100 dark:border-none">
                <CalendarDays className="w-[22px] h-[22px] text-[#FF5A00]" strokeWidth={2} />
              </div>
            </div>
            <div className="flex flex-col flex-1 text-center mb-8">
              <h3 className="text-zinc-900 dark:text-white font-bold text-[15px] mb-3 font-sans uppercase tracking-widest leading-tight">RELEASE CALENDAR</h3>
              <p className="text-zinc-500 dark:text-[#8B949E] text-[14px] leading-relaxed">
                Track upcoming games. Never miss a release.
              </p>
            </div>
            <Link href="#" className="mt-auto bg-[#FF5A00] hover:bg-[#FF6A00] text-white h-[46px] rounded font-bold transition-colors uppercase tracking-[0.08em] text-[12px] flex items-center justify-center shadow-lg shadow-[#FF5A00]/20">
              UPDATED DAILY
            </Link>
          </div>

          {/* Card 3 */}
          <div className="bg-zinc-50 dark:bg-[#0B0E14] rounded-[16px] border border-zinc-200 dark:border-[#161B22] hover:border-[#FF5A00]/30 transition-all duration-300 p-6 lg:p-7 flex flex-col group shadow-sm dark:shadow-lg">
            <div className="w-[62px] h-[62px] mx-auto rounded-full border border-[#FF5A00] bg-[#FF5A00]/5 flex items-center justify-center mb-8 group-hover:shadow-[0_0_15px_rgba(255,90,0,0.2)] transition-all">
              <div className="w-[48px] h-[48px] rounded-full bg-white dark:bg-[#1A1F26] flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)] border border-zinc-100 dark:border-none">
                <MessageSquare className="w-[22px] h-[22px] text-[#FF5A00]" strokeWidth={2} />
              </div>
            </div>
            <div className="flex flex-col flex-1 text-center mb-8">
              <h3 className="text-zinc-900 dark:text-white font-bold text-[15px] mb-3 font-sans uppercase tracking-widest leading-tight">COMMUNITY FORUM</h3>
              <p className="text-zinc-500 dark:text-[#8B949E] text-[14px] leading-relaxed">
                Join the conversation. Share, help, connect.
              </p>
            </div>
            <Link href="#" className="mt-auto bg-[#FF5A00] hover:bg-[#FF6A00] text-white h-[46px] rounded font-bold transition-colors uppercase tracking-[0.08em] text-[12px] flex items-center justify-center shadow-lg shadow-[#FF5A00]/20">
              COMMUNITY HUB
            </Link>
          </div>

          {/* Card 4 */}
          <div className="bg-zinc-50 dark:bg-[#0B0E14] rounded-[16px] border border-zinc-200 dark:border-[#161B22] hover:border-[#FF5A00]/30 transition-all duration-300 p-6 lg:p-7 flex flex-col group shadow-sm dark:shadow-lg">
            <div className="w-[62px] h-[62px] mx-auto rounded-full border border-[#FF5A00] bg-[#FF5A00]/5 flex items-center justify-center mb-8 group-hover:shadow-[0_0_15px_rgba(255,90,0,0.2)] transition-all">
              <div className="w-[48px] h-[48px] rounded-full bg-white dark:bg-[#1A1F26] flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)] border border-zinc-100 dark:border-none">
                <Star className="w-[22px] h-[22px] text-[#FF5A00]" strokeWidth={2} />
              </div>
            </div>
            <div className="flex flex-col flex-1 text-center mb-8">
              <h3 className="text-zinc-900 dark:text-white font-bold text-[15px] mb-3 font-sans uppercase tracking-widest leading-tight">REVIEWS & SCORES</h3>
              <p className="text-zinc-500 dark:text-[#8B949E] text-[14px] leading-relaxed">
                Honest reviews.<br/>Helpful scores.
              </p>
            </div>
            <Link href="#" className="mt-auto bg-[#FF5A00] hover:bg-[#FF6A00] text-white h-[46px] rounded font-bold transition-colors uppercase tracking-[0.08em] text-[12px] flex items-center justify-center shadow-lg shadow-[#FF5A00]/20">
              EDITORIAL REVIEWS
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
