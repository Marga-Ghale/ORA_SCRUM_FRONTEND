import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useSidebar } from '../context/SidebarContext';
import { ThemeToggleButton } from '../components/common/ThemeToggleButton';
import NotificationDropdown from '../components/header/NotificationDropdown';
import UserDropdown from '../components/header/UserDropdown';
import { Search, Menu, X, Command } from 'lucide-react';

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          {/* Toggle Button */}
          <button
            onClick={handleToggle}
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all"
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Mobile Logo */}
          <Link to="/" className="flex items-center gap-2.5 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">OS</span>
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white">ORA SCRUM</span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden lg:block ml-4">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search or type command..."
                  className="h-10 w-[280px] xl:w-[420px] rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-10 pr-20 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
                <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                  <Command className="w-3 h-3" />
                  <span>K</span>
                </kbd>
              </div>
            </form>
          </div>
        </div>

        {/* Right Section - Desktop */}
        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggleButton />
          <NotificationDropdown />
          <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
          <UserDropdown />
        </div>

        {/* Right Section - Mobile Menu Toggle */}
        <button
          onClick={toggleApplicationMenu}
          className="flex lg:hidden items-center justify-center w-10 h-10 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          aria-label="Toggle Menu"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="6" cy="12" r="1.5" fill="currentColor" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            <circle cx="18" cy="12" r="1.5" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isApplicationMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg animate-in slide-in-from-top-2 duration-200">
          {/* Mobile Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="h-10 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>
            </form>
          </div>

          {/* Mobile Actions */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
              <ThemeToggleButton />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Notifications
              </span>
              <NotificationDropdown />
            </div>
            <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
              <UserDropdown />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default AppHeader;
