import Link from 'next/link';
import { Twitter, Youtube, DiscIcon as Discord, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-zinc-50 dark:bg-tp-bg-sec border-t border-zinc-200 dark:border-[#12161E] pt-16 pb-20 transition-colors duration-300">
      <div className="max-w-[1320px] mx-auto px-4 xl:px-0">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
          
          <div className="flex flex-col max-w-sm flex-1">
            <Link href="/" className="font-display font-bold text-[22px] tracking-tight flex items-center mb-4">
              <span className="text-zinc-900 dark:text-white">TECH</span>
              <span className="text-tp-accent">PLAY</span>
              <span className="text-zinc-500 dark:text-slate-400 text-sm ml-[1px] mt-[1px]">.GG</span>
            </Link>
            <p className="text-zinc-500 dark:text-[#A1A1AA] text-[13px] leading-relaxed mb-6 max-w-[280px]">
              Your gaming hub for news, reviews, releases, database and community.
            </p>
            <div className="flex items-center gap-[18px]">
              <Link href="#" className="text-zinc-500 dark:text-[#A1A1AA] hover:text-[#FF5A00] transition-colors"><Twitter className="w-[18px] h-[18px]" /></Link>
              <Link href="#" className="text-zinc-500 dark:text-[#A1A1AA] hover:text-[#FF5A00] transition-colors"><Youtube className="w-[18px] h-[18px]" /></Link>
              <Link href="#" className="text-zinc-500 dark:text-[#A1A1AA] hover:text-[#FF5A00] transition-colors"><Discord className="w-[18px] h-[18px]" /></Link>
              <Link href="#" className="text-zinc-500 dark:text-[#A1A1AA] hover:text-[#FF5A00] transition-colors"><Instagram className="w-[18px] h-[18px]" /></Link>
            </div>
          </div>

          <div className="flex-[2] grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col gap-4">
              <h4 className="font-sans font-bold uppercase tracking-wider text-zinc-900 dark:text-white text-[11px] mb-1">EXPLORE</h4>
              {['News', 'Reviews', 'Games', 'Release Calendar'].map(item => (
                <Link key={item} href="#" className="text-[13px] text-zinc-500 dark:text-[#A1A1AA] hover:text-[#FF5A00] transition-colors">{item}</Link>
              ))}
            </div>
            
            <div className="flex flex-col gap-4">
              <h4 className="font-sans font-bold uppercase tracking-wider text-zinc-900 dark:text-white text-[11px] mb-1">DATABASE</h4>
              {['All Games', 'Platforms', 'Genres', 'Developers'].map(item => (
                <Link key={item} href="#" className="text-[13px] text-zinc-500 dark:text-[#A1A1AA] hover:text-[#FF5A00] transition-colors">{item}</Link>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="font-sans font-bold uppercase tracking-wider text-zinc-900 dark:text-white text-[11px] mb-1">COMMUNITY</h4>
              {['Forum', 'Leaderboard', 'Achievements', 'Groups'].map(item => (
                <Link key={item} href="#" className="text-[13px] text-zinc-500 dark:text-[#A1A1AA] hover:text-[#FF5A00] transition-colors">{item}</Link>
              ))}
            </div>

            <div className="flex flex-col gap-[14px]">
              <h4 className="font-sans font-bold uppercase tracking-wider text-zinc-900 dark:text-white text-[11px] mb-1">SUPPORT</h4>
              {['About Us', 'Contact', 'Privacy Policy', 'Terms of Service'].map(item => (
                <Link key={item} href="#" className="text-[13px] text-zinc-500 dark:text-[#A1A1AA] hover:text-[#FF5A00] transition-colors">{item}</Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="w-full border-t border-zinc-200 dark:border-[#12161E] mt-12 py-3 bg-zinc-100/50 dark:bg-[#0B0E14]/40 transition-colors duration-300">
        <div className="max-w-[1320px] mx-auto px-4 xl:px-0 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-[12px] text-zinc-500 dark:text-[#A1A1AA]">
            © 2026 TechPlay Gaming Portal. All rights reserved.
          </p>
          <p className="text-[12px] text-zinc-500 dark:text-[#A1A1AA]">
            Made by <span className="text-zinc-900 dark:text-white font-medium">Luminor Solutions</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
