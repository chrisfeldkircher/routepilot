export function Footer() {
  return (
    <footer className="w-full border-t border-[#192540] bg-[#060e20]">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-12 py-10 gap-6 max-w-screen-2xl mx-auto">
        <div className="flex flex-col gap-2">
          <span className="text-lg font-bold text-white font-headline">routePilot</span>
          <p className="font-body text-xs text-slate-500">
            &copy; 2026 routePilot. Open-source under MIT License.
          </p>
        </div>
        <div className="flex gap-8">
          <a
            className="text-slate-500 font-body text-xs hover:text-primary transition-colors"
            href="#"
          >
            Documentation
          </a>
          <a
            className="text-slate-500 font-body text-xs hover:text-primary transition-colors"
            href="#"
          >
            GitHub
          </a>
          <a
            className="text-slate-500 font-body text-xs hover:text-primary transition-colors"
            href="#"
          >
            Twitter
          </a>
          <a
            className="text-slate-500 font-body text-xs hover:text-primary transition-colors"
            href="#"
          >
            Discord
          </a>
          <a
            className="text-slate-500 font-body text-xs hover:text-primary transition-colors"
            href="#"
          >
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
}
