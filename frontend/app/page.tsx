"use client";

import { Article } from "@/types";
import { Zap, Gamepad2, Cpu } from "lucide-react";
import HeroCarousel from "@/components/home/HeroCarousel";
import HomeSidebar from "@/components/sidebar/HomeSidebar";
import ContentSection from "@/components/home/ContentSection";
import { useHome } from "@/hooks/useApi";

export default function Home() {
  const { hero: heroArticles, news: latestNews, reviews: latestReviews, tech: hardwareLab, isLoading } = useHome();



  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">

      {/* Immersive Hero Carousel */}
      <HeroCarousel articles={heroArticles} />

      {/* Main Content */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Main Column (8 cols) */}
          <div className="lg:col-span-8 space-y-16">

            {/* 1. LATEST NEWS */}
            <ContentSection
              title="Latest News"
              icon={Zap}
              articles={latestNews}
              viewAllLink="/news"
            />

            {/* 2. LATEST REVIEWS */}
            <ContentSection
              title="Latest Reviews"
              icon={Gamepad2}
              articles={latestReviews}
              viewAllLink="/reviews"
            />

            {/* 3. HARDWARE LAB */}
            <ContentSection
              title="Hardware Lab"
              icon={Cpu}
              articles={hardwareLab}
              viewAllLink="/hardware"
              color="#06b6d4" // Custom accent for hardware
            />

          </div>

          {/* Sidebar (4 cols) */}
          <HomeSidebar />

        </div>
      </section>
    </div>
  );
}
