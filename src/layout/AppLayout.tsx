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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <ProjectSidebar />
      <Backdrop />
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? 'lg:ml-[260px]' : 'lg:ml-[60px]'
        } ${isMobileOpen ? 'ml-0' : ''}`}
      >
        <AppHeader />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <Outlet />
        </div>
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
