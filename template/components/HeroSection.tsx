import Image from 'next/image';
import Link from 'next/link';
import { Flame, Rocket, Library } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative pt-[140px] lg:pt-[150px] pb-[80px] transition-colors duration-300">
      <div className="max-w-[1320px] mx-auto px-4 xl:px-0">
        <div className="relative border-zinc-200 dark:border-white/5 bg-white dark:bg-[#05070A] rounded-xl overflow-hidden flex flex-col lg:flex-row min-h-[560px] border shadow-sm dark:shadow-none transition-colors duration-300">
          
          {/* Main Background Image - Covers left portion completely */}
          <div className="absolute inset-0 z-0">
            <Image 
              src="https://picsum.photos/seed/erdtree5/1600/900" 
              alt="Elden Ring" 
              fill 
              className="object-cover opacity-90 dark:opacity-100"
              referrerPolicy="no-referrer"
            />
            {/* Gradients to mask the image and blend it purely into the left-text, right-panels, and bottom */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 dark:from-[#05070A] dark:via-[#05070A]/90 to-transparent w-[60%]" />
            <div className="absolute inset-0 bg-gradient-to-l from-white via-white/95 dark:from-[#05070A] dark:via-[#05070A]/95 to-transparent w-[50%] right-0 left-auto" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 dark:from-[#05070A] dark:via-[#05070A]/20 to-transparent opacity-90 dark:opacity-80" />
          </div>

          {/* Left Content (Featured Article) */}
          <div className="relative z-10 w-full lg:w-[65%] p-8 lg:p-[40px] xl:p-[60px] flex flex-col justify-end pt-24 min-h-[560px]">
            
            <span className="text-[#FF5A00] font-bold tracking-[0.15em] text-[10px] uppercase mb-3 drop-shadow-sm">
              FEATURED REVIEW
            </span>
            
            <h1 className="font-display text-[56px] lg:text-[76px] font-black text-zinc-900 dark:text-white uppercase leading-[0.85] tracking-tight mb-2 drop-shadow-sm dark:drop-shadow-lg">
              ELDEN RING
            </h1>
            
            <h2 className="font-display text-[28px] lg:text-[36px] font-black text-[#FF5A00] uppercase tracking-tight leading-none mb-6 drop-shadow-sm dark:drop-shadow-lg">
              SHADOW OF THE ERDTREE
            </h2>
            
            <p className="text-[15px] text-zinc-700 dark:text-[#E4E4E5] max-w-[380px] leading-relaxed mb-8 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] dark:drop-shadow-md">
              FromSoftware delivers once again.<br />A breathtaking expansion that raises<br />the bar for RPGs.
            </p>
            
            <div className="flex flex-wrap items-center gap-7">
              {/* Author & Date */}
              <div className="flex items-center gap-4">
                <div className="w-[46px] h-[46px] rounded-full overflow-hidden border-2 border-zinc-200 dark:border-white/10 relative shadow-sm dark:shadow-lg">
                  <Image src="https://picsum.photos/seed/author5/100/100" alt="Author" fill className="object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex flex-col">
                  <span className="text-zinc-900 dark:text-white font-bold text-[14px] leading-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:drop-shadow-none">Armin Mehic</span>
                  <span className="text-zinc-600 dark:text-[#A1A1AA] text-[10px] font-bold uppercase tracking-widest mt-1">Oct 02, 2025</span>
                </div>
              </div>
              
              <div className="w-px h-10 bg-zinc-300 dark:bg-white/10 hidden sm:block mx-1" />

              {/* Action Button */}
              <Link href="#" className="bg-[#FF5A00] hover:bg-[#FF6A00] text-white px-8 h-[46px] rounded font-bold transition-colors uppercase tracking-[0.08em] text-[12px] flex items-center justify-center shadow-lg shadow-[#FF5A00]/20">
                READ REVIEW
              </Link>
            </div>

            {/* Slider Indicators - Moved to the right side */}
            <div className="absolute right-8 lg:right-10 bottom-8 lg:bottom-[40px] xl:bottom-[60px] flex gap-[8px] items-center">
              <button className="w-8 h-[3px] bg-[#FF5A00] transition-all rounded-sm" aria-label="Slide 1" />
              <button className="w-8 h-[3px] bg-zinc-300 hover:bg-zinc-400 dark:bg-white/20 dark:hover:bg-white/40 transition-all rounded-sm" aria-label="Slide 2" />
              <button className="w-8 h-[3px] bg-zinc-300 hover:bg-zinc-400 dark:bg-white/20 dark:hover:bg-white/40 transition-all rounded-sm" aria-label="Slide 3" />
              <button className="w-8 h-[3px] bg-zinc-300 hover:bg-zinc-400 dark:bg-white/20 dark:hover:bg-white/40 transition-all rounded-sm" aria-label="Slide 4" />
            </div>

          </div>

          {/* Right Content Panels */}
          <div className="relative z-10 w-full lg:w-[380px] xl:w-[420px] h-full lg:absolute right-0 top-0 bottom-0 flex flex-col border-l border-zinc-200 dark:border-transparent">
            
            {/* Panel 1 - Upcoming Release */}
            <div className="relative flex-1 border-b border-zinc-200 dark:border-white/[0.05] flex flex-col justify-center p-8 overflow-hidden group cursor-pointer lg:min-h-[186px] hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
              <div className="absolute right-8 top-8 w-[46px] h-[46px] rounded-[12px] bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#FF5A00]/10 group-hover:border-[#FF5A00]/30 transition-all duration-300 shadow-sm dark:shadow-lg group-hover:shadow-[0_0_20px_rgba(255,90,0,0.2)]">
                <Rocket className="w-5 h-5 text-zinc-500 dark:text-[#A1A1AA] group-hover:text-[#FF5A00] transition-colors" strokeWidth={1.5} />
              </div>
              <div className="relative z-20 pr-[60px] mt-2">
                <span className="text-zinc-500 dark:text-[#A1A1AA] text-[10px] font-bold uppercase tracking-widest mb-2 block">UPCOMING RELEASE</span>
                <h3 className="font-display text-[22px] font-bold text-zinc-900 dark:text-white leading-tight mb-2 group-hover:text-[#FF5A00] transition-colors">
                  Ghost of Yōtei
                </h3>
                <span className="text-[#FF5A00] text-[11px] font-bold tracking-widest uppercase">02 OCT 2025</span>
              </div>
            </div>

            {/* Panel 2 - Trending Discussion */}
            <div className="relative flex-1 border-b border-zinc-200 dark:border-white/[0.05] flex flex-col justify-center p-8 overflow-hidden group cursor-pointer lg:min-h-[186px] hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
              <div className="absolute right-8 top-8 w-[46px] h-[46px] rounded-[12px] bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#FF5A00]/10 group-hover:border-[#FF5A00]/30 transition-all duration-300 shadow-sm dark:shadow-lg group-hover:shadow-[0_0_20px_rgba(255,90,0,0.2)]">
                <Flame className="w-5 h-5 text-zinc-500 dark:text-[#A1A1AA] group-hover:text-[#FF5A00] transition-colors" strokeWidth={1.5} />
              </div>
              <div className="relative z-20 pr-[60px] mt-2">
                <span className="text-zinc-500 dark:text-[#A1A1AA] text-[10px] font-bold uppercase tracking-widest mb-2 block">TRENDING DISCUSSION</span>
                <h3 className="font-display text-[20px] font-bold text-zinc-900 dark:text-white leading-snug mb-3 group-hover:text-[#FF5A00] transition-colors">
                  Which game are you most excited for in 2025?
                </h3>
                <span className="text-[#FF5A00] text-[11px] font-bold tracking-widest uppercase">128 REPLIES</span>
              </div>
            </div>

            {/* Panel 3 - Gaming Database */}
            <div className="relative flex-1 flex flex-col justify-center p-8 overflow-hidden group cursor-pointer lg:min-h-[186px] hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
              <div className="absolute right-8 top-8 w-[46px] h-[46px] rounded-[12px] bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#FF5A00]/10 group-hover:border-[#FF5A00]/30 transition-all duration-300 shadow-sm dark:shadow-lg group-hover:shadow-[0_0_20px_rgba(255,90,0,0.2)]">
                <Library className="w-5 h-5 text-zinc-500 dark:text-[#A1A1AA] group-hover:text-[#FF5A00] transition-colors" strokeWidth={1.5} />
              </div>
              <div className="relative z-20 pr-[60px] mt-2">
                <span className="text-zinc-500 dark:text-[#A1A1AA] text-[10px] font-bold uppercase tracking-widest mb-2 block">GAMING DATABASE</span>
                <h3 className="font-display text-[20px] font-bold text-zinc-900 dark:text-white leading-snug mb-3 group-hover:text-[#FF5A00] transition-colors">
                  Explore over 50,000 game titles
                </h3>
                <span className="text-[#FF5A00] text-[11px] font-bold tracking-widest uppercase">UPDATED DAILY</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
