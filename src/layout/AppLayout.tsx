import { SidebarProvider, useSidebar } from '../context/SidebarContext';
import { Outlet } from 'react-router';
import AppHeader from './AppHeader';
import Backdrop from './Backdrop';
import ProjectSidebar from './ProjectSidebar';
import { ProjectProvider } from '../context/ProjectContext';
import GlobalModals from '../components/modals/GlobalModals';

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 
      dark:from-gray-950 dark:via-[#0a0b0d] dark:to-gray-950 
      transition-all duration-300"
    >
      {/* Project Sidebar */}
      <ProjectSidebar />

      {/* Backdrop for mobile */}
      <Backdrop />

      {/* Main Content Area */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? 'lg:ml-[280px]' : 'lg:ml-[72px]'
        } ${isMobileOpen ? 'ml-0' : ''}`}
      >
        {/* Header */}
        <AppHeader />

        {/* Main Content */}
        <main className="flex-1 w-full">
          <div className="p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10 mx-auto max-w-[1920px]">
            {/* Content wrapper with subtle background */}
            <div className="animate-in fade-in-50 duration-500">
              <Outlet />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer
          className="border-t border-gray-200 dark:border-gray-800 
          bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl 
          shadow-[0_-1px_3px_rgba(0,0,0,0.05)] dark:shadow-[0_-1px_3px_rgba(0,0,0,0.3)]
          transition-all duration-300"
        >
          <div className="px-4 sm:px-5 md:px-6 lg:px-8 xl:px-10 mx-auto max-w-[1920px] py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Brand & Copyright */}
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 
                  flex items-center justify-center shadow-lg"
                >
                  <span className="text-white text-xs font-bold">OS</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">ORA SCRUM</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    © {new Date().getFullYear()} All rights reserved.
                  </p>
                </div>
              </div>

              {/* Footer Links */}
              <div className="flex items-center gap-6">
                <a
                  href="#"
                  className="text-sm font-medium text-gray-600 dark:text-gray-400 
                    hover:text-violet-600 dark:hover:text-violet-400 
                    transition-all duration-200 hover:scale-105 active:scale-95
                    relative group"
                >
                  Privacy
                  <span
                    className="absolute bottom-0 left-0 w-0 h-0.5 bg-violet-600 dark:bg-violet-400 
                    group-hover:w-full transition-all duration-300"
                  />
                </a>
                <a
                  href="#"
                  className="text-sm font-medium text-gray-600 dark:text-gray-400 
                    hover:text-violet-600 dark:hover:text-violet-400 
                    transition-all duration-200 hover:scale-105 active:scale-95
                    relative group"
                >
                  Terms
                  <span
                    className="absolute bottom-0 left-0 w-0 h-0.5 bg-violet-600 dark:bg-violet-400 
                    group-hover:w-full transition-all duration-300"
                  />
                </a>
                <a
                  href="#"
                  className="text-sm font-medium text-gray-600 dark:text-gray-400 
                    hover:text-violet-600 dark:hover:text-violet-400 
                    transition-all duration-200 hover:scale-105 active:scale-95
                    relative group"
                >
                  Support
                  <span
                    className="absolute bottom-0 left-0 w-0 h-0.5 bg-violet-600 dark:bg-violet-400 
                    group-hover:w-full transition-all duration-300"
                  />
                </a>
                <a
                  href="#"
                  className="text-sm font-medium text-gray-600 dark:text-gray-400 
                    hover:text-violet-600 dark:hover:text-violet-400 
                    transition-all duration-200 hover:scale-105 active:scale-95
                    relative group"
                >
                  Docs
                  <span
                    className="absolute bottom-0 left-0 w-0 h-0.5 bg-violet-600 dark:bg-violet-400 
                    group-hover:w-full transition-all duration-300"
                  />
                </a>
              </div>

              {/* Version Badge */}
              <div className="hidden md:flex items-center gap-2">
                <span
                  className="px-3 py-1.5 rounded-full text-xs font-semibold
                  bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30
                  text-violet-700 dark:text-violet-300
                  border border-violet-200 dark:border-violet-800
                  shadow-sm"
                >
                  v1.0.0
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Global Modals */}
      <GlobalModals />
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <ProjectProvider>
        <LayoutContent />
      </ProjectProvider>
    </SidebarProvider>
  );
};

export default AppLayout;
