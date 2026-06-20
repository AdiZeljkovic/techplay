import Link from 'next/link';
import { Gamepad2, User, Trophy, Camera, MessageSquare } from 'lucide-react';
import { forumThreads } from '@/lib/mock-data';

export default function CommunityForum() {
  
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'controller': return <Gamepad2 className="w-[18px] h-[18px]" />;
      case 'user': return <User className="w-[18px] h-[18px]" />;
      case 'trophy': return <Trophy className="w-[18px] h-[18px]" />;
      case 'camera': return <Camera className="w-[18px] h-[18px]" />;
      default: return <MessageSquare className="w-[18px] h-[18px]" />;
    }
  };

  return (
    <aside className="w-full h-full flex flex-col bg-zinc-50/80 dark:bg-[#0B0E14]/80 backdrop-blur-md border border-zinc-200 dark:border-[#161B22] rounded-[24px] p-6 lg:p-8 relative overflow-hidden shadow-sm dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-colors duration-300">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-[10%] w-[50%] h-[1px] bg-gradient-to-r from-transparent via-[#FF5A00]/20 dark:via-[#FF5A00]/40 to-transparent" />
      <div className="absolute -top-[100px] -right-[50px] w-[250px] h-[250px] bg-[#FF5A00]/10 blur-[80px] rounded-full pointer-events-none" />

      <div className="flex items-end justify-between font-sans mb-8 relative z-10">
        <h2 className="text-[17px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider">JOIN THE COMMUNITY</h2>
      </div>

      <div className="flex flex-col w-full px-1 relative z-10 flex-1">
        {forumThreads.map((thread, i) => (
          <div key={i} className={`flex-1 py-[16px] flex flex-col justify-center ${i !== forumThreads.length - 1 ? 'border-b border-zinc-200 dark:border-white/[0.04]' : 'border-b-0'}`}>
            <Link href={`/forum/${thread.slug}`} className="group flex items-center gap-[20px] h-full">
              <div className="w-[36px] h-[36px] rounded-full bg-white dark:bg-[#1A1F26] border border-zinc-200 dark:border-white/5 flex items-center justify-center text-zinc-500 dark:text-[#8B949E] group-hover:text-[#FF5A00] dark:group-hover:text-[#FF5A00] hover:border-[#FF5A00]/30 transition-colors shrink-0">
                {getIcon(thread.icon)}
              </div>
              <div className="flex flex-col justify-center min-w-0 flex-1">
                <h4 className="font-sans font-medium text-[15px] text-zinc-800 dark:text-[#E4E4E5] leading-snug group-hover:text-tp-accent transition-colors mb-[6px] truncate whitespace-nowrap">
                  {thread.title}
                </h4>
                <div className="flex items-center justify-between text-[13px] text-zinc-500 dark:text-[#A1A1AA] w-full">
                  <span>{thread.replies} replies</span>
                  <span className={`${thread.activity === 'active now' ? 'text-zinc-900 dark:text-white' : ''} text-[12px]`}>{thread.activity}</span>
                </div>
              </div>
            </Link>
          </div>
        ))}
        
      </div>
      <Link href="#" className="mt-8 mt-auto shrink-0 bg-[#FF5A00] hover:bg-[#FF6A00] text-white h-[46px] rounded font-bold transition-colors uppercase tracking-[0.08em] text-[12px] flex items-center justify-center shadow-lg shadow-[#FF5A00]/20 relative z-10">
        START A DISCUSSION
      </Link>
    </aside>
  );
}
