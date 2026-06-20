export default function NewsletterCTA() {
  return (
    <section className="px-4 xl:px-0 max-w-[1320px] mx-auto mt-6 mb-20 w-full relative">
      <div className="bg-zinc-50/80 dark:bg-[#0B0E14]/80 backdrop-blur-md border border-zinc-200 dark:border-[#161B22] rounded-[24px] relative overflow-hidden shadow-sm dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-colors duration-300">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-[20%] w-[40%] h-[1px] bg-gradient-to-r from-transparent via-[#FF5A00]/20 dark:via-[#FF5A00]/40 to-transparent" />
        <div className="absolute -top-[150px] -right-[100px] w-[350px] h-[350px] bg-[#FF5A00]/5 dark:bg-[#FF5A00]/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-[150px] -left-[100px] w-[300px] h-[300px] bg-[#FF5A00]/5 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between py-[46px] px-8 md:px-[60px] gap-8">
          <div className="flex-1 text-center md:text-left">
            <h2 className="font-display text-[26px] font-bold text-zinc-900 dark:text-white uppercase tracking-[0.05em] mb-3 drop-shadow-sm dark:drop-shadow-md">
              STAY IN THE GAME
            </h2>
            <p className="text-zinc-600 dark:text-[#A1A1AA] text-[15px] max-w-md mx-auto md:mx-0 leading-relaxed">
              Get the latest gaming news, reviews and release dates delivered straight to your inbox.
            </p>
          </div>
          
          <form className="w-full md:w-auto flex flex-col sm:flex-row items-center shrink-0 max-w-lg md:max-w-none gap-[1px]">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="w-full sm:w-[320px] bg-white dark:bg-[#05070A] border border-zinc-300 dark:border-[#161B22] border-r-0 rounded-l-[8px] px-5 h-[50px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#71717A] text-[13px] focus:outline-none focus:border-[#FF5A00]/50 transition-colors"
              required
            />
            <button 
              type="submit" 
              className="w-full sm:w-[160px] h-[50px] bg-[#FF5A00] hover:bg-[#FF6A00] text-white px-6 rounded-r-[8px] font-bold uppercase tracking-[0.08em] text-[13px] transition-all shadow-lg flex items-center justify-center shrink-0 border border-[#FF5A00] hover:shadow-[0_0_20px_rgba(255,90,0,0.3)]"
            >
              SUBSCRIBE
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
