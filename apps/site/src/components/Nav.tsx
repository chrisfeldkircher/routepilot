import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_LINK = 'text-slate-400 font-medium font-headline text-sm tracking-tight hover:text-white transition-colors duration-200 cursor-pointer';
const NAV_LINK_ACTIVE = 'text-white font-medium font-headline text-sm tracking-tight transition-colors duration-200';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const isLanding = pathname === '/';
  const isDocs = pathname === '/docs';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className={`w-full top-0 sticky z-50 transition-all duration-300 ${scrolled ? 'bg-[#060e20]/80 backdrop-blur-lg shadow-lg shadow-black/20 border-b border-outline-variant/10' : 'bg-[#060e20]'}`}>
      <div className="flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tighter text-white font-headline">
            <img src="/logo.svg" alt="routePilot" className="h-7 w-auto" />
            routePilot
          </Link>
          <div className="hidden md:flex gap-6 items-center">
            <Link to="/docs" className={isDocs ? NAV_LINK_ACTIVE : NAV_LINK}>
              Docs
            </Link>
            {isLanding && (
              <>
                <a className={NAV_LINK} onClick={() => scrollTo('choose-your-story')}>
                  Runtime
                </a>
                <a className={NAV_LINK} onClick={() => scrollTo('stack')}>
                  Stack
                </a>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isLanding && (
            <button
              type="button"
              className="material-symbols-outlined text-slate-400 hover:text-white transition-colors"
              aria-label="Open terminal"
              onClick={() => scrollTo('choose-your-story')}
            >
              terminal
            </button>
          )}
          {isLanding ? (
            <button
              type="button"
              className="bg-gradient-to-br from-primary to-primary-dim text-on-primary-fixed px-5 py-2 rounded-md font-headline font-bold text-sm hover:opacity-90 transition-all scale-95 active:opacity-80"
              onClick={() => scrollTo('install')}
            >
              Get Started
            </button>
          ) : (
            <Link
              to="/"
              className="bg-gradient-to-br from-primary to-primary-dim text-on-primary-fixed px-5 py-2 rounded-md font-headline font-bold text-sm hover:opacity-90 transition-all scale-95 active:opacity-80"
            >
              Home
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
