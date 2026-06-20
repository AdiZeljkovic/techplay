import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, MessageSquare, Bookmark, Share2, ThumbsUp, ChevronRight, Search, Play, Calendar } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { articles, hardwareArticles, reviews } from '@/lib/mock-data';

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Combine all possible articles
  const allContent = [...articles, ...hardwareArticles, ...reviews];

  // Try to find the article in mock data (fallback to mock static if not found)
  const foundArticle = allContent.find(a => a.slug === slug);
  
  const article = {
    title: foundArticle?.title || "PlayStation 5 Pro officially announced – everything we know",
    category: ('category' in (foundArticle || {}) ? (foundArticle as any).category : "NEWS"),
    excerpt: ('excerpt' in (foundArticle || {}) ? (foundArticle as any).excerpt : "Sony has finally revealed the next step in console gaming with the PlayStation 5 Pro. Here's everything confirmed so far about specs, price and release date."),
    image: foundArticle?.image || "https://picsum.photos/seed/ps5pro/1200/800",
    author: ('author' in (foundArticle || {}) ? (foundArticle as any).author : undefined) || "Marko Jovanović",
    publishedAt: ('publishedAt' in (foundArticle || {}) ? (foundArticle as any).publishedAt : "2 HOURS AGO"),
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] dark:bg-[#05070A] text-zinc-800 dark:text-[#E4E4E5] font-sans selection:bg-[#FF5A00] selection:text-white flex flex-col transition-colors duration-300">
      <Header />

      <main className="flex-1 w-full max-w-[1500px] mx-auto px-4 xl:px-8 pt-[140px] pb-8 flex gap-8">
        
        {/* Left Sticky Sidebar (Socials) */}
        <aside className="hidden lg:flex flex-col gap-6 sticky top-[140px] shrink-0 h-[max-content]">
          <Link href="/" className="w-12 h-12 rounded-full border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-500 dark:text-[#A1A1AA] hover:text-tp-accent dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          
          <div className="flex flex-col gap-2 mt-8">
            <button className="flex flex-col items-center gap-1 group">
              <div className="w-12 h-12 rounded-full border border-zinc-200 dark:border-white/10 flex items-center justify-center text-[#FF5A00] bg-[#FF5A00]/10 group-hover:bg-[#FF5A00]/20 transition-colors">
                <ThumbsUp className="w-5 h-5 fill-current" />
              </div>
              <span className="text-[11px] font-medium text-zinc-500 dark:text-[#A1A1AA]">128</span>
            </button>
            <button className="flex flex-col items-center gap-1 group mt-2">
              <div className="w-12 h-12 rounded-full border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-500 dark:text-[#A1A1AA] group-hover:text-tp-accent dark:group-hover:text-white group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium text-zinc-500 dark:text-[#A1A1AA]">56</span>
            </button>
            <button className="flex flex-col items-center gap-1 group mt-2">
              <div className="w-12 h-12 rounded-full border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-500 dark:text-[#A1A1AA] group-hover:text-tp-accent dark:group-hover:text-white group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors">
                <Bookmark className="w-5 h-5" />
              </div>
            </button>
            <button className="flex flex-col items-center gap-1 group mt-2">
              <div className="w-12 h-12 rounded-full border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-500 dark:text-[#A1A1AA] group-hover:text-tp-accent dark:group-hover:text-white group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors">
                <Share2 className="w-5 h-5" />
              </div>
            </button>
          </div>
        </aside>

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-[12px] text-zinc-500 dark:text-[#A1A1AA] mb-6 mt-1">
            <Link href="/" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/" className="hover:text-zinc-900 dark:hover:text-white transition-colors">News</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-zinc-900 dark:text-[#E4E4E5] truncate">{article.title}</span>
          </div>

          <div className="flex flex-col xl:flex-row gap-8">
            {/* Main Content Area */}
            <div className="flex-1 min-w-0 flex flex-col">

              {/* Hero Banner */}
              <div className="relative w-full rounded-[24px] flex flex-col overflow-hidden mb-12 bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] shadow-sm dark:shadow-none h-[580px]">
                <div className="relative w-full flex-1 flex flex-col justify-center min-h-0">
                  <div className="absolute inset-0">
                <Image 
                  src={article.image} 
                  alt={article.title} 
                  fill 
                  className="object-cover object-right opacity-90 dark:opacity-80" 
                  referrerPolicy="no-referrer"
                />
                {/* Gradients to fade out the image towards the left and bottom */}
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 dark:from-[#05070A] dark:via-[#05070A]/95 to-transparent w-[85%]" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 dark:from-[#05070A] dark:via-[#05070A]/60 to-transparent opacity-90 dark:opacity-80" />
              </div>
              
              <div className="relative z-10 flex flex-col justify-center p-8 md:p-12 w-full md:w-[70%]">
                <div className="bg-[#FF5A00] text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded inline-flex w-max mb-5 leading-none shadow-sm shadow-[#FF5A00]/20">
                  {article.category}
                </div>
                <div className="flex gap-4 mb-4 items-start">
                  <div className="w-[4px] h-[34px] md:h-[48px] bg-[#FF5A00] shrink-0 mt-2" />
                  <h1 className="font-display text-[32px] md:text-[48px] font-bold text-zinc-900 dark:text-white leading-[1.1] drop-shadow-sm dark:drop-shadow-lg">
                    {article.title}
                  </h1>
                </div>
                <p className="text-[15px] md:text-[18px] text-zinc-600 dark:text-[#A1A1AA] leading-relaxed mb-8 max-w-xl">
                  {article.excerpt}
                </p>
                
                <div className="flex items-center gap-3">
                  <div className="w-[46px] h-[46px] rounded-full overflow-hidden border border-zinc-200 dark:border-white/10 shrink-0 shadow-sm">
                    <Image src="https://picsum.photos/seed/marko/100/100" alt={article.author} width={46} height={46} className="object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-zinc-800 dark:text-[#E4E4E5] font-medium text-[14px]">By <span className="font-bold">{article.author}</span></span>
                    <div className="flex items-center gap-2 text-zinc-500 dark:text-[#71717A] text-[11px] font-bold uppercase tracking-widest mt-1">
                      <span>{article.publishedAt}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-[#3F3F46]" />
                      <span>5 MIN READ</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Socials / Info Bar beneath hero */}
            <div className="relative z-20 flex flex-col md:flex-row md:items-center justify-between border-t border-zinc-200 dark:border-white/[0.05] bg-zinc-50 dark:bg-[#0A0D12] px-8 md:px-12 py-4 gap-4">
              <div className="flex items-center flex-wrap gap-3">
                <span className="text-zinc-500 dark:text-[#71717A] text-[11px] font-bold uppercase tracking-widest mr-2">PLATFORMS:</span>
                <span className="bg-transparent border border-zinc-200 dark:border-white/10 px-4 py-1.5 rounded-full text-zinc-700 dark:text-white text-[11px] font-bold uppercase tracking-wider">PS5</span>
                <span className="bg-transparent border border-zinc-200 dark:border-white/10 px-4 py-1.5 rounded-full text-zinc-700 dark:text-white text-[11px] font-bold uppercase tracking-wider">PS5 PRO</span>
                <span className="bg-transparent border border-zinc-200 dark:border-white/10 px-4 py-1.5 rounded-full text-zinc-700 dark:text-white text-[11px] font-bold uppercase tracking-wider">SONY</span>
              </div>
              <div className="flex items-center gap-5">
                <span className="text-zinc-500 dark:text-[#71717A] text-[11px] font-bold uppercase tracking-widest">SHARE:</span>
                <div className="flex items-center gap-4 text-zinc-600 dark:text-[#E4E4E5]">
                  <button className="hover:text-[#FF5A00] transition-colors">
                    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7.5v4H10V22h4v-8.5z" /></svg>
                  </button>
                  <button className="hover:text-[#FF5A00] transition-colors">
                    <svg viewBox="0 0 24 24" className="w-[16px] h-[16px]" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </button>
                  <button className="hover:text-[#FF5A00] transition-colors">
                    <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.505 1.19-.85 2.822-1.408 4.618-1.493l.892-4.088c.088-.389.467-.626.852-.533l2.922.613a1.25 1.25 0 0 1 1.238-1.006z"/></svg>
                  </button>
                  <button className="hover:text-[#FF5A00] transition-colors">
                    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                  </button>
                  <button className="hover:text-[#FF5A00] transition-colors ml-2">
                    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-12">
            
            {/* Table of Contents */}
            <div className="w-full lg:w-[240px] shrink-0">
              <div className="sticky top-8 bg-white/80 dark:bg-[#0B0E14]/80 backdrop-blur-md rounded-[16px] border border-zinc-200 dark:border-[#161B22] p-6 shadow-sm dark:shadow-xl">
                <h3 className="font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-[12px] mb-6">ON THIS PAGE</h3>
                <nav className="flex flex-col gap-5">
                  <a href="#" className="flex items-center gap-3 group">
                    <span className="text-[#FF5A00] font-bold text-[12px]">01</span>
                    <span className="text-[#FF5A00] text-[13px] font-medium leading-none">Official reveal</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 group">
                    <span className="text-zinc-400 dark:text-[#3F3F46] font-bold text-[12px] group-hover:text-zinc-600 dark:group-hover:text-[#A1A1AA] transition-colors">02</span>
                    <span className="text-zinc-500 dark:text-[#A1A1AA] group-hover:text-zinc-800 dark:group-hover:text-[#E4E4E5] text-[13px] font-medium leading-none transition-colors">Key specifications</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 group">
                    <span className="text-zinc-400 dark:text-[#3F3F46] font-bold text-[12px] group-hover:text-zinc-600 dark:group-hover:text-[#A1A1AA] transition-colors">03</span>
                    <span className="text-zinc-500 dark:text-[#A1A1AA] group-hover:text-zinc-800 dark:group-hover:text-[#E4E4E5] text-[13px] font-medium leading-none transition-colors">Performance upgrades</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 group">
                    <span className="text-zinc-400 dark:text-[#3F3F46] font-bold text-[12px] group-hover:text-zinc-600 dark:group-hover:text-[#A1A1AA] transition-colors">04</span>
                    <span className="text-zinc-500 dark:text-[#A1A1AA] group-hover:text-zinc-800 dark:group-hover:text-[#E4E4E5] text-[13px] font-medium leading-none transition-colors">Price & release date</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 group">
                    <span className="text-zinc-400 dark:text-[#3F3F46] font-bold text-[12px] group-hover:text-zinc-600 dark:group-hover:text-[#A1A1AA] transition-colors">05</span>
                    <span className="text-zinc-500 dark:text-[#A1A1AA] group-hover:text-zinc-800 dark:group-hover:text-[#E4E4E5] text-[13px] font-medium leading-none transition-colors">Games enhanced</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 group">
                    <span className="text-zinc-400 dark:text-[#3F3F46] font-bold text-[12px] group-hover:text-zinc-600 dark:group-hover:text-[#A1A1AA] transition-colors">06</span>
                    <span className="text-zinc-500 dark:text-[#A1A1AA] group-hover:text-zinc-800 dark:group-hover:text-[#E4E4E5] text-[13px] font-medium leading-none transition-colors">Our thoughts</span>
                  </a>
                </nav>
              </div>
            </div>

            {/* Article Content */}
            <article className="flex-1 min-w-0 prose dark:prose-invert prose-p:text-zinc-600 dark:prose-p:text-[#A1A1AA] prose-p:leading-[1.8] prose-p:text-[16px] prose-headings:text-zinc-900 dark:prose-headings:text-white prose-headings:font-display prose-a:text-[#FF5A00] max-w-none">
              
              {/* Highlight Intro Quote */}
              <div className="bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] border-l-[4px] border-l-[#FF5A00] p-6 md:p-8 rounded-r-[16px] rounded-l-[4px] mb-10 shadow-sm dark:shadow-lg">
                <p className="!text-[22px] md:!text-[26px] font-display italic font-medium text-zinc-900 dark:!text-white !leading-snug !mt-0 !mb-0">
                  "Summer Game Fest 2026 delivered major reveals including Final Fantasy VII Revelation, Resident Evil Veronica, Guild Wars 3, and more."
                </p>
              </div>

              <h2 className="text-[28px] md:text-[32px] font-bold mb-6 tracking-tight text-zinc-900 dark:text-white">OFFICIAL REVEAL</h2>
              
              <p className="mb-6">
                After months of leaks and rumors, Sony has officially pulled the curtain off the <strong className="text-zinc-900 dark:text-white">PlayStation 5 Pro</strong>. The new console promises a massive leap in performance, ray tracing, and AI-powered upscaling with <em className="text-zinc-900 dark:text-white">PlayStation Spectral Super Resolution</em>.
              </p>
              
              <p className="mb-10">
                The PS5 Pro will deliver better frame rates, higher resolutions, and a more stable experience across your favorite games.
              </p>

              <div className="w-full aspect-video rounded-[16px] overflow-hidden mb-10 border border-zinc-200 dark:border-[#161B22] relative group cursor-pointer shadow-sm">
                <Image src="https://picsum.photos/seed/ps5proconsole/1200/800" alt="PS5 Pro Console" fill className="object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
              </div>
              
              <h3 className="text-[22px] md:text-[24px] font-bold mb-4 tracking-tight text-zinc-900 dark:text-white">Key specifications</h3>
              <p className="mb-6">
                Under the hood, the PlayStation 5 Pro features an upgraded GPU with 67% more Compute Units than the current PS5 console and 28% faster memory. Overall, this enables up to 45% faster rendering for gameplay, making the experience much smoother.
              </p>
              <ul className="list-disc pl-5 mb-8 text-zinc-600 dark:text-[#A1A1AA] marker:text-[#FF5A00]">
                <li className="mb-2">Upgraded GPU for up to 45% faster rendering</li>
                <li className="mb-2">Advanced Ray Tracing (up to 2x-3x speeds)</li>
                <li className="mb-2">PlayStation Spectral Super Resolution (PSSR)</li>
                <li className="mb-2">2TB SSD Storage pre-installed</li>
              </ul>
              
            </article>

          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="hidden xl:flex flex-col gap-10 w-[340px] shrink-0">
          
          {/* Related Articles */}
          <div className="bg-white/80 dark:bg-[#0B0E14]/80 backdrop-blur-md rounded-[20px] border border-zinc-200 dark:border-[#161B22] p-6 shadow-sm dark:shadow-xl flex flex-col h-[580px] mb-2">
            <div className="flex items-center gap-3 mb-6 shrink-0">
              <span className="w-1.5 h-4 bg-[#FF5A00] rounded-sm" />
              <h2 className="text-[14px] font-bold text-zinc-900 dark:text-white uppercase tracking-widest">RELATED ARTICLES</h2>
            </div>
            
            <div className="flex flex-col gap-[22px] flex-1 overflow-hidden">
              {articles.slice(1, 5).map((item, i) => (
                <Link key={i} href="#" className="flex gap-4 group">
                  <div className="w-[110px] h-[72px] rounded-[10px] overflow-hidden shrink-0 border border-zinc-200 dark:border-white/5 relative">
                    <Image src={item.image} alt={item.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[#FF5A00] text-[10px] font-bold uppercase tracking-widest mb-1.5 leading-none">{item.category}</span>
                    <h3 className="text-zinc-800 dark:text-white text-[13px] font-bold leading-[1.3] group-hover:text-[#FF5A00] dark:group-hover:text-[#FF5A00] transition-colors line-clamp-2 mb-1">{item.title}</h3>
                    <span className="text-zinc-500 dark:text-[#71717A] text-[10px] font-medium tracking-wide uppercase">{item.publishedAt}</span>
                  </div>
                </Link>
              ))}
            </div>
            
            <Link href="#" className="text-zinc-500 dark:text-[#A1A1AA] hover:text-[#FF5A00] dark:hover:text-[#FF5A00] transition-colors text-[11px] font-bold uppercase tracking-widest flex items-center justify-end gap-1.5 group mt-auto pt-6 border-t border-zinc-200 dark:border-white/[0.05] shrink-0">
              VIEW ALL NEWS <span className="group-hover:translate-x-1 transition-transform font-bold text-[14px] leading-none mb-[2px]">→</span>
            </Link>
          </div>

          {/* Trending Now */}
          <div className="bg-white/80 dark:bg-[#0B0E14]/80 backdrop-blur-md rounded-[20px] border border-zinc-200 dark:border-[#161B22] p-6 shadow-sm dark:shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-[20%] w-[40%] h-[1px] bg-gradient-to-r from-transparent via-[#FF5A00]/40 to-transparent" />
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-4 bg-[#FF5A00] rounded-sm" />
                <h2 className="text-[14px] font-bold text-zinc-900 dark:text-white uppercase tracking-widest">TRENDING NOW</h2>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#FF5A00]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>

            <div className="flex flex-col gap-1">
              {[
                { title: 'GTA VI Trailer 2 breaks records', views: '12K views' },
                { title: 'Elden Ring: Nightreign review', views: '9.5/10' },
                { title: 'Nintendo Switch 2 hands-on', views: '8K views' },
                { title: 'Best PC games of 2025 so far', views: '6.2K views' },
                { title: 'How to build the ultimate PC', views: '5K views' },
              ].map((item, i) => (
                <Link key={i} href="#" className="flex gap-4 items-center group p-2 hover:bg-zinc-50 dark:hover:bg-white/5 rounded-[8px] transition-colors">
                  <span className="text-[#FF5A00] font-display font-bold text-[24px] leading-none mb-1 opacity-80 min-w-[32px]">0{i + 1}</span>
                  <div className="flex flex-col">
                    <h3 className="text-zinc-800 dark:text-[#E4E4E5] text-[13px] font-medium leading-tight group-hover:text-zinc-900 dark:group-hover:text-white mb-1 line-clamp-1">{item.title}</h3>
                    <span className="text-zinc-500 dark:text-[#71717A] text-[11px]">{item.views}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Upcoming Releases Mini */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-4 bg-[#FF5A00] rounded-sm" />
                <h2 className="text-[14px] font-bold text-zinc-900 dark:text-white uppercase tracking-widest">UPCOMING RELEASES</h2>
              </div>
              <Link href="#" className="text-zinc-500 dark:text-[#A1A1AA] hover:text-[#FF5A00] dark:hover:text-[#FF5A00] transition-colors text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 group">
                VIEW CALENDAR <span className="group-hover:translate-x-1 transition-transform font-bold text-[14px] leading-none mb-[1px]">→</span>
              </Link>
            </div>

            <div className="flex flex-col gap-4">
              {[
                { m: 'JUN', d: '05', title: 'Doom: The Dark Ages', p: 'PC, PS5, XSX', img: 'https://picsum.photos/seed/doom2/100/100' },
                { m: 'JUN', d: '10', title: 'Fable', p: 'PC, XSX', img: 'https://picsum.photos/seed/fable2/100/100' },
              ].map((game, i) => (
                <Link key={i} href="#" className="flex items-center gap-4 group">
                  <div className="flex flex-col items-center justify-center shrink-0 w-[42px]">
                    <span className="text-[#FF5A00] text-[10px] font-bold tracking-widest uppercase mb-0.5">{game.m}</span>
                    <span className="text-zinc-900 dark:text-white text-[20px] font-display font-bold leading-none">{game.d}</span>
                  </div>
                  <div className="w-[42px] h-[42px] rounded border border-zinc-200 dark:border-white/10 shrink-0 relative overflow-hidden">
                    <Image src={game.img} alt={game.title} fill className="object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-zinc-900 dark:text-white text-[13px] font-bold group-hover:text-[#FF5A00] dark:group-hover:text-[#FF5A00] transition-colors line-clamp-1">{game.title}</h3>
                    <span className="text-zinc-500 dark:text-[#A1A1AA] text-[11px] mt-0.5">{game.p}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

            </aside>

          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
