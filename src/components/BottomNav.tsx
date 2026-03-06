import { Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Clock, Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { getActiveMatchId } from '@/lib/matchStore';

export default function BottomNav() {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const activeMatch = getActiveMatchId();

  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/create', icon: PlusCircle, label: 'New Match' },
    { to: '/history', icon: Clock, label: 'History' },
  ];

  // If there's an active match, add a live link
  if (activeMatch) {
    links.splice(2, 0, {
      to: `/score/${activeMatch}`,
      icon: () => (
        <span className="relative flex h-5 w-5 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cricket-red opacity-40" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-cricket-red" />
        </span>
      ),
      label: 'Live',
    } as any);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1">
        {links.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || (to !== '/' && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors ${
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </div>
    </nav>
  );
}
