import Link from 'next/link';
import { DiscIcon as Discord, Users } from 'lucide-react';

export default function DiscordWidget() {
  return (
    <aside className="w-full h-full flex flex-col bg-zinc-50/80 dark:bg-[#0B0E14]/80 backdrop-blur-md border border-zinc-200 dark:border-[#161B22] rounded-[24px] p-6 lg:p-8 relative overflow-hidden shadow-sm dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-colors duration-300">
      {/* Subtle background glow for Discord color */}
      <div className="absolute top-0 right-[10%] w-[50%] h-[1px] bg-gradient-to-r from-transparent via-[#5865F2]/20 dark:via-[#5865F2]/40 to-transparent" />
      <div className="absolute -top-[100px] -right-[50px] w-[250px] h-[250px] bg-[#5865F2]/5 dark:bg-[#5865F2]/10 blur-[80px] rounded-full pointer-events-none" />

      <div className="flex items-end justify-between font-sans mb-8 relative z-10">
        <h2 className="text-[17px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider">COMMUNITY DISCORD</h2>
      </div>

      <div className="flex flex-col relative z-10 flex-1 px-1">
        
        <div className="flex items-center gap-5 mb-6">
          <div className="w-[54px] h-[54px] rounded-[16px] bg-[#5865F2] flex items-center justify-center shrink-0 shadow-sm dark:shadow-lg dark:shadow-[#5865F2]/20">
             <Discord className="w-8 h-8 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-zinc-900 dark:text-white font-bold text-[18px] leading-tight mb-1">TechPlay.gg</span>
            <span className="text-zinc-500 dark:text-[#8B949E] text-[13px]">Official Discord Server</span>
          </div>
        </div>

        <p className="text-zinc-600 dark:text-[#A1A1AA] text-[14px] leading-relaxed mb-8 flex-1">
          Join the conversation. Chat with the editors, find teammates, and discuss the latest gaming news and rumors in real-time.
        </p>
        
        {/* Stats */}
        <div className="flex flex-col gap-4 mb-2">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-white/[0.04]">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#23a559] shadow-[0_0_8px_rgba(35,165,89,0.2)] dark:shadow-[0_0_8px_rgba(35,165,89,0.5)]" />
              <span className="text-zinc-800 dark:text-[#E4E4E5] text-[14px] font-medium">Online Members</span>
            </div>
            <strong className="text-zinc-900 dark:text-white text-[15px] tracking-wide">1,248</strong>
          </div>
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-white/[0.04]">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-400 dark:bg-[#80848e]" />
              <span className="text-zinc-800 dark:text-[#E4E4E5] text-[14px] font-medium">Total Members</span>
            </div>
            <strong className="text-zinc-900 dark:text-white text-[15px] tracking-wide">15,402</strong>
          </div>
        </div>

      </div>

      <Link href="#" className="mt-8 bg-[#5865F2] hover:bg-[#4752C4] text-white h-[46px] rounded font-bold transition-colors uppercase tracking-[0.08em] text-[12px] flex items-center justify-center shadow-lg shadow-[#5865F2]/20 relative z-10">
        JOIN DISCORD
      </Link>
    </aside>
  );
}
