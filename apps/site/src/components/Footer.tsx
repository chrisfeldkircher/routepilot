import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="w-full border-t border-[#192540] bg-[#060e20]">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-4 sm:px-8 md:px-12 py-8 sm:py-10 gap-6 max-w-screen-2xl mx-auto">
        <div className="flex flex-col gap-2">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-white font-headline">
            <img src="/logo.svg" alt="routePilot" className="h-6 w-auto" />
            routePilot
          </Link>
          <p className="font-body text-xs text-slate-500">
            &copy; 2026 routePilot. Open-source under MIT License.
          </p>
        </div>
        <div className="flex gap-4 sm:gap-8">
          <Link
            to="/docs"
            className="text-slate-500 font-body text-xs hover:text-primary transition-colors"
          >
            Documentation
          </Link>
          <a
            className="text-slate-500 font-body text-xs hover:text-primary transition-colors"
            href="https://github.com/chrisfeldkircher/routepilot"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
