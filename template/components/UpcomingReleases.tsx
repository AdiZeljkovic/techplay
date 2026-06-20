import Link from 'next/link';
import Image from 'next/image';
import { releases } from '@/lib/mock-data';

export default function UpcomingReleases() {
  return (
    <aside className="w-full h-full flex flex-col bg-zinc-50/80 dark:bg-[#0B0E14]/80 backdrop-blur-md border border-zinc-200 dark:border-[#161B22] rounded-[24px] p-6 lg:p-8 relative overflow-hidden shadow-sm dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-colors duration-300">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-[10%] w-[50%] h-[1px] bg-gradient-to-r from-transparent via-[#FF5A00]/20 dark:via-[#FF5A00]/40 to-transparent" />
      <div className="absolute -top-[100px] -right-[50px] w-[250px] h-[250px] bg-[#FF5A00]/10 blur-[80px] rounded-full pointer-events-none" />

      <div className="flex items-end justify-between font-sans mb-8 relative z-10">
        <h2 className="text-[17px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider">UPCOMING RELEASES</h2>
      </div>

      <div className="flex flex-col px-1">
        {releases.map((release, i) => {
          const [month, day] = release.date.split(' ');
          
          return (
            <Link key={i} href={`/game/${release.slug}`} className={`group flex items-center gap-[22px] py-[16px] ${i !== releases.length - 1 ? 'border-b border-zinc-200 dark:border-white/[0.04]' : 'border-b-0'}`}>
              <div className="flex flex-col items-center justify-center w-[36px] shrink-0 text-center">
                <span className="text-tp-accent text-[12px] font-bold uppercase tracking-widest leading-none mb-1">{month}</span>
                <span className="font-display text-[22px] font-medium text-zinc-900 dark:text-white leading-none">{day}</span>
              </div>
              
              <div className="relative w-[54px] h-[54px] overflow-hidden rounded-[8px] opacity-90 group-hover:opacity-100 shrink-0 border border-zinc-200 dark:border-white/5">
                <Image src={`https://picsum.photos/seed/${release.slug}a/100/100`} alt={release.title} fill className="object-cover" referrerPolicy="no-referrer" />
              </div>

              <div className="flex flex-col min-w-0 pr-2 pt-[2px]">
                <h4 className="font-sans font-medium text-[15px] text-zinc-800 dark:text-[#E4E4E5] truncate group-hover:text-tp-accent transition-colors leading-[1.2] mb-2">
                  {release.title}
                </h4>
                <div className="text-[11px] text-zinc-500 dark:text-[#8B949E] font-bold tracking-widest uppercase flex gap-[8px]">
                  {release.platforms.split(' ').map((p, idx) => (
                    <span key={idx}>{p}</span>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <Link href="#" className="mt-8 bg-[#FF5A00] hover:bg-[#FF6A00] text-white h-[46px] rounded font-bold transition-colors uppercase tracking-[0.08em] text-[12px] flex items-center justify-center shadow-lg shadow-[#FF5A00]/20 relative z-10">
        VIEW FULL CALENDAR
      </Link>
    </aside>
  );
}
