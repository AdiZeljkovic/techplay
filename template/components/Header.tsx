'use client';
import Link from 'next/link';
import { Search, Menu, Facebook, Twitter, Instagram, Youtube, Disc } from 'lucide-react';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col drop-shadow-2xl">
      {/* Top Bar */}
      <div className="bg-zinc-100 dark:bg-[#020305] hidden md:block">
        <div className="max-w-[1320px] mx-auto px-4 xl:px-0 h-[34px] flex items-center justify-between">
          <div className="flex items-center gap-6">
            {['About Us', 'Impressum', 'Contact', 'Marketing'].map((item) => (
              <Link key={item} href="#" className="text-[10px] uppercase font-bold text-zinc-500 dark:text-slate-400 hover:text-tp-accent dark:hover:text-white transition-colors tracking-widest">
                {item}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-4 text-zinc-500 dark:text-slate-400">
            <Link href="#" className="hover:text-tp-accent transition-colors" aria-label="Facebook">
              <Facebook className="w-3.5 h-3.5" />
            </Link>
            <Link href="#" className="hover:text-tp-accent transition-colors" aria-label="Twitter">
              <Twitter className="w-3.5 h-3.5" />
            </Link>
            <Link href="#" className="hover:text-tp-accent transition-colors" aria-label="Instagram">
              <Instagram className="w-3.5 h-3.5" />
            </Link>
            <Link href="#" className="hover:text-tp-accent transition-colors" aria-label="YouTube">
              <Youtube className="w-3.5 h-3.5" />
            </Link>
            <Link href="#" className="hover:text-tp-accent transition-colors" aria-label="Discord">
              <Disc className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="w-full bg-white/95 dark:bg-gradient-to-b dark:from-[#0F141D]/98 dark:to-[#05070A]/98 backdrop-blur-md border-b-[3px] border-tp-accent relative z-10 shadow-sm dark:shadow-none">
        <div className="max-w-[1320px] mx-auto px-4 xl:px-0 h-[72px] w-full flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="font-display font-bold text-[22px] tracking-tight flex items-center">
            <span className="text-zinc-900 dark:text-white">TECH</span>
            <span className="text-tp-accent">PLAY</span>
            <span className="text-zinc-500 dark:text-slate-400 text-sm ml-[1px] mt-[1px]">.GG</span>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-7">
            {['News', 'Reviews', 'Games', 'Calendar', 'Database', 'Forum', 'Tech', 'Videos'].map((item) => (
              <Link 
                key={item} 
                href="#" 
                className="text-[11px] font-bold text-zinc-600 dark:text-slate-300 hover:text-tp-accent dark:hover:text-white transition-colors uppercase tracking-[0.06em]"
              >
                {item}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <ThemeToggle />
          <button className="text-zinc-600 dark:text-slate-300 hover:text-tp-accent dark:hover:text-white transition-colors" aria-label="Search">
            <Search className="w-[18px] h-[18px]" />
          </button>
          
          <Link href="#" className="hidden sm:inline-flex items-center justify-center bg-tp-accent hover:bg-tp-accent-hover text-white px-6 py-2 rounded-sm font-semibold transition-colors uppercase text-[11px] tracking-widest leading-none h-[34px]">
            SIGN IN
          </Link>
          
          <button 
            className="lg:hidden text-zinc-600 dark:text-slate-300 hover:text-tp-accent dark:hover:text-white transition-colors" 
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
      </div>

      {isOpen && (
        <div className="lg:hidden bg-white/95 dark:bg-[#05070A]/95 backdrop-blur-md border-b-[3px] border-tp-accent absolute top-full w-full left-0 z-0">
          <nav className="flex flex-col px-4 py-4">
            {['News', 'Reviews', 'Games', 'Calendar', 'Database', 'Forum', 'Tech', 'Videos'].map((item) => (
              <Link 
                key={item} 
                href="#" 
                className="text-[11px] font-bold text-zinc-600 dark:text-slate-300 py-3 border-b border-zinc-200 dark:border-white/5 hover:text-tp-accent dark:hover:text-white transition-colors uppercase tracking-wider"
                onClick={() => setIsOpen(false)}
              >
                {item}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
