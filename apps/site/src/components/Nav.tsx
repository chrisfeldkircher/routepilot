export function Nav() {
  return (
    <nav className="w-full top-0 sticky z-50 bg-[#060e20]">
      <div className="flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold tracking-tighter text-white font-headline">
            routePilot
          </span>
          <div className="hidden md:flex gap-6 items-center">
            <a
              className="text-slate-400 font-medium font-headline text-sm tracking-tight hover:text-white transition-colors duration-200"
              href="#"
            >
              Docs
            </a>
            <a
              className="text-slate-400 font-medium font-headline text-sm tracking-tight hover:text-white transition-colors duration-200"
              href="#"
            >
              Runtime
            </a>
            <a
              className="text-slate-400 font-medium font-headline text-sm tracking-tight hover:text-white transition-colors duration-200"
              href="#"
            >
              Gallery
            </a>
            <a
              className="text-slate-400 font-medium font-headline text-sm tracking-tight hover:text-white transition-colors duration-200"
              href="#"
            >
              CLI
            </a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="material-symbols-outlined text-slate-400 hover:text-white transition-colors"
            aria-label="Open terminal"
          >
            terminal
          </button>
          <button
            type="button"
            className="bg-gradient-to-br from-primary to-primary-dim text-on-primary-fixed px-5 py-2 rounded-md font-headline font-bold text-sm hover:opacity-90 transition-all scale-95 active:opacity-80"
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}
