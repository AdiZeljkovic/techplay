export interface RoadmapFeature {
  id: string;
  title: string;
  description: string;
  details: string[];
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  status: 'completed' | 'in_progress' | 'planned';
  icon: string;
  color: string;
}

export const ROADMAP_2026: RoadmapFeature[] = [
  // Q1 2026 - Foundation
  {
    id: 'backlog-tracker',
    title: 'Backlog & Collection Tracker',
    description: 'Track your gaming backlog and manage your collection with ease',
    details: [
      'Personal game library with custom shelves',
      'Backlog priority management and organization',
      'Playtime tracking and detailed statistics',
      'Collection value estimation and insights',
      'Wishlist with price alerts from retailers'
    ],
    quarter: 'Q1',
    status: 'in_progress',
    icon: 'LibraryBig',
    color: '#10B981'
  },
  {
    id: 'custom-lists',
    title: 'Custom User Lists',
    description: 'Create and share personalized game collections with the community',
    details: [
      'Create themed game collections (Best RPGs, Co-op Games, etc.)',
      'Share your lists publicly with other gamers',
      'Follow and discover lists from other users',
      'Collaborative lists with friends',
      'Import/export functionality for easy backup'
    ],
    quarter: 'Q1',
    status: 'planned',
    icon: 'List',
    color: '#3B82F6'
  },
  {
    id: 'user-reviews-2',
    title: 'User Reviews 2.0',
    description: 'Enhanced review system with advanced ratings and community interaction',
    details: [
      'Multi-dimensional ratings (gameplay, graphics, story, sound)',
      'Review voting and helpfulness ranking system',
      'Threaded comment discussions on reviews',
      'Verified purchase badges for authenticity',
      'Review milestones and contributor achievements'
    ],
    quarter: 'Q1',
    status: 'planned',
    icon: 'Star',
    color: '#F59E0B'
  },

  // Q2 2026 - Engagement & Rewards
  {
    id: 'bounty-system',
    title: 'Bounty System',
    description: 'Earn points and reputation for quality contributions to the community',
    details: [
      'Earn points for reviews, guides, comments, and helpful content',
      'Reputation levels and ranking system',
      'Special bounties for high-quality contributions',
      'Community and monthly leaderboards',
      'Redeem your points in the Loyalty Store'
    ],
    quarter: 'Q2',
    status: 'planned',
    icon: 'Coins',
    color: '#8B5CF6'
  },
  {
    id: 'loyalty-store',
    title: 'Loyalty Store',
    description: 'Redeem your earned points for exclusive rewards and perks',
    details: [
      'Exclusive digital badges and profile customizations',
      'Early access to new features and beta tests',
      'Premium profile themes and custom avatars',
      'Ad-free browsing experience options',
      'Physical merchandise and gaming gear (future)'
    ],
    quarter: 'Q2',
    status: 'planned',
    icon: 'ShoppingBag',
    color: '#EF4444'
  },

  // Q3 2026 - Tools & Commerce
  {
    id: 'rig-builder',
    title: 'RIG Builder with Amazon',
    description: 'Build and optimize your dream gaming PC with our smart configurator',
    details: [
      'Component compatibility checker and validation',
      'Real-time performance benchmarks and comparisons',
      'Price tracking across multiple retailers',
      'Direct Amazon affiliate purchase links',
      'Save, share, and compare your builds with others'
    ],
    quarter: 'Q3',
    status: 'planned',
    icon: 'Cpu',
    color: '#F97316'
  },
  {
    id: 'ai-recommendations',
    title: 'AI Recommendation Engine: Professor Buffy',
    description: 'Meet Professor Buffy, your AI-powered game discovery assistant',
    details: [
      'Personalized game recommendations based on your taste',
      'Interactive AI chatbot for game discovery',
      'Analysis of your playstyle and gaming preferences',
      'Detailed explanations for every recommendation',
      'Continuous learning from your feedback and ratings'
    ],
    quarter: 'Q3',
    status: 'planned',
    icon: 'Brain',
    color: '#06B6D4'
  },

  // Q4 2026 - Awards & Mobile
  {
    id: 'community-awards',
    title: 'Community Awards',
    description: 'Vote for the best games of the year in our annual community awards',
    details: [
      'Annual TechPlay Community Awards ceremony',
      'User-driven nominations across multiple categories',
      'Live voting and real-time results tracking',
      'Detailed statistics and voting insights',
      'Winner showcases with special badges and features'
    ],
    quarter: 'Q4',
    status: 'planned',
    icon: 'Trophy',
    color: '#EC4899'
  },
  {
    id: 'mobile-app',
    title: 'Mobile App',
    description: 'Take TechPlay with you - native iOS and Android applications',
    details: [
      'Native mobile experience optimized for touch',
      'Push notifications for breaking news and deals',
      'Offline reading mode for articles and reviews',
      'Quick access to your game library and lists',
      'Mobile-optimized interface for reviews and guides'
    ],
    quarter: 'Q4',
    status: 'planned',
    icon: 'Smartphone',
    color: '#14B8A6'
  }
];

export const QUARTERS = [
  {
    id: 'Q1' as const,
    label: 'Q1 2026',
    months: 'Jan - Mar',
    description: 'Foundation'
  },
  {
    id: 'Q2' as const,
    label: 'Q2 2026',
    months: 'Apr - Jun',
    description: 'Engagement & Rewards'
  },
  {
    id: 'Q3' as const,
    label: 'Q3 2026',
    months: 'Jul - Sep',
    description: 'Tools & Commerce'
  },
  {
    id: 'Q4' as const,
    label: 'Q4 2026',
    months: 'Oct - Dec',
    description: 'Awards & Mobile'
  }
];
