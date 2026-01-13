// src/layout/AppLayout.tsx - FINAL FIX (Remove SidebarProvider)

import { useSidebar } from '../context/SidebarContext';
import { Outlet } from 'react-router';
import AppHeader from './AppHeader';
import Backdrop from './Backdrop';
import ProjectSidebar from './ProjectSidebar';
import GlobalModals from '../components/modals/GlobalModals';

const AppLayout: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
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
        <main className="flex-1 bg-gradient-to-l from-orange-100 to-blue w-full dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="p-4 sm:p-5 md:p-6 lg:p-8 mx-auto max-w-[1920px]">
            <Outlet />
          </div>
        </main>

        {/* Footer (Optional) */}
        <footer className="border-t bg-gradient-to-l from-orange-100 to-blue to-blue border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-4">
          <div className="px-4 sm:px-5 md:px-6 lg:px-8 mx-auto max-w-[1920px]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                © {new Date().getFullYear()} ORA SCRUM. All rights reserved.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <a
                  href="#"
                  className="text-gray-600 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
                >
                  Privacy
                </a>
                <a
                  href="#"
                  className="text-gray-600 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
                >
                  Terms
                </a>
                <a
                  href="#"
                  className="text-gray-600 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
                >
                  Support
                </a>
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

export default AppLayout;
