import { useSidebar } from '../context/SidebarContext';

const Backdrop: React.FC = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  if (!isMobileOpen) return null;

  return (
    <div
      onClick={toggleMobileSidebar}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
      aria-label="Close sidebar"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
          toggleMobileSidebar();
        }
      }}
    />
  );
};

export default Backdrop;
