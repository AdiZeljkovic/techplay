import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import PlatformHighlights from '@/components/PlatformHighlights';
import LatestNews from '@/components/LatestNews';
import UpcomingReleases from '@/components/UpcomingReleases';
import LatestReviews from '@/components/LatestReviews';
import CommunityForum from '@/components/CommunityForum';
import HardwareLab from '@/components/HardwareLab';
import DiscordWidget from '@/components/DiscordWidget';
import NewsletterCTA from '@/components/NewsletterCTA';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F4F4F5] dark:bg-tp-bg-main flex flex-col pt-0 font-sans text-zinc-900 dark:text-slate-300 transition-colors duration-300">
      <Header />
      
      <HeroSection />
      
      <PlatformHighlights />
      
      <div className="max-w-[1320px] mx-auto px-4 xl:px-0 w-full mb-16 md:mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-[60px]">
          {/* Main Content Layout 1: News + Upcoming */}
          <div className="lg:col-span-2">
            <LatestNews />
          </div>
          <div className="lg:col-span-1 border-t lg:border-t-0 border-zinc-200 dark:border-white/5 lg:pl-4 xl:pl-8 pt-10 lg:pt-0">
            <UpcomingReleases />
          </div>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-4 xl:px-0 w-full mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-[60px]">
          {/* Main Content Layout 2: Reviews + Community */}
          <div className="lg:col-span-2">
            <LatestReviews />
          </div>
          <div className="lg:col-span-1 border-t lg:border-t-0 border-zinc-200 dark:border-white/5 lg:border-l lg:pl-10 xl:pl-[60px] pt-10 lg:pt-0 border-l-zinc-200">
            <CommunityForum />
          </div>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-4 xl:px-0 w-full mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-[60px]">
          {/* Main Content Layout 3: Hardware + Discord */}
          <div className="lg:col-span-2">
            <HardwareLab />
          </div>
          <div className="lg:col-span-1 border-t lg:border-t-0 border-zinc-200 dark:border-white/5 lg:border-l lg:pl-10 xl:pl-[60px] pt-10 lg:pt-0 border-l-zinc-200">
            <DiscordWidget />
          </div>
        </div>
      </div>

      <NewsletterCTA />
      
      <Footer />
    </main>
  );
}
