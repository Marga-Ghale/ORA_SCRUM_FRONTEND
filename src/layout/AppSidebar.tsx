import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
} from '../icons';
import { useSidebar } from '../context/SidebarContext';
import SidebarWidget from './SidebarWidget';
import { ChevronRight } from 'lucide-react';

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: 'Dashboard',
    subItems: [{ name: 'Ecommerce', path: '/', pro: false }],
  },
  {
    icon: <CalenderIcon />,
    name: 'Tasks',
    path: '/calendar',
  },
  {
    icon: <UserCircleIcon />,
    name: 'User Profile',
    path: '/profile',
  },
  {
    name: 'Forms',
    icon: <ListIcon />,
    subItems: [{ name: 'Form Elements', path: '/form-elements', pro: false }],
  },
  {
    name: 'Tables',
    icon: <TableIcon />,
    subItems: [{ name: 'Basic Tables', path: '/basic-tables', pro: false }],
  },
  {
    name: 'Pages',
    icon: <PageIcon />,
    subItems: [
      { name: 'Blank Page', path: '/blank', pro: false },
      { name: '404 Error', path: '/error-404', pro: false },
    ],
  },
];

const othersItems: NavItem[] = [
  {
    icon: <PieChartIcon />,
    name: 'Charts',
    subItems: [
      { name: 'Line Chart', path: '/line-chart', pro: false },
      { name: 'Bar Chart', path: '/bar-chart', pro: false },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: 'UI Elements',
    subItems: [
      { name: 'Alerts', path: '/alerts', pro: false },
      { name: 'Avatar', path: '/avatars', pro: false },
      { name: 'Badge', path: '/badge', pro: false },
      { name: 'Buttons', path: '/buttons', pro: false },
      { name: 'Images', path: '/images', pro: false },
      { name: 'Videos', path: '/videos', pro: false },
    ],
  },
  {
    icon: <PlugInIcon />,
    name: 'Authentication',
    subItems: [
      { name: 'Sign In', path: '/signin', pro: false },
      { name: 'Sign Up', path: '/signup', pro: false },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: 'main' | 'others';
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

  useEffect(() => {
    let submenuMatched = false;
    ['main', 'others'].forEach((menuType) => {
      const items = menuType === 'main' ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as 'main' | 'others',
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: 'main' | 'others') => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (prevOpenSubmenu && prevOpenSubmenu.type === menuType && prevOpenSubmenu.index === index) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const isSubmenuOpen = (index: number, menuType: 'main' | 'others') => {
    return openSubmenu?.type === menuType && openSubmenu?.index === index;
  };

  const renderMenuItems = (items: NavItem[], menuType: 'main' | 'others') => (
    <ul className="flex flex-col gap-1.5">
      {items.map((nav, index) => {
        const hasSubmenu = !!nav.subItems;
        const submenuOpen = isSubmenuOpen(index, menuType);
        const isItemActive = nav.path && isActive(nav.path);

        return (
          <li key={nav.name}>
            {hasSubmenu ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  submenuOpen
                    ? 'bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                } ${!isExpanded && !isHovered ? 'lg:justify-center lg:px-2' : ''}`}
              >
                <span
                  className={`flex items-center justify-center w-5 h-5 transition-colors ${
                    submenuOpen
                      ? 'text-brand-600 dark:text-brand-400'
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <>
                    <span className="flex-1 text-left">{nav.name}</span>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform duration-200 ${
                        submenuOpen ? 'rotate-90' : ''
                      }`}
                    />
                  </>
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  to={nav.path}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isItemActive
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  } ${!isExpanded && !isHovered ? 'lg:justify-center lg:px-2' : ''}`}
                >
                  <span
                    className={`flex items-center justify-center w-5 h-5 transition-colors ${
                      isItemActive
                        ? 'text-white'
                        : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'
                    }`}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="flex-1">{nav.name}</span>
                  )}
                </Link>
              )
            )}

            {hasSubmenu && (isExpanded || isHovered || isMobileOpen) && (
              <div
                ref={(el) => {
                  subMenuRefs.current[`${menuType}-${index}`] = el;
                }}
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  height: submenuOpen ? `${subMenuHeight[`${menuType}-${index}`]}px` : '0px',
                }}
              >
                <ul className="mt-1.5 ml-8 space-y-1">
                  {nav.subItems!.map((subItem) => {
                    const isSubItemActive = isActive(subItem.path);
                    return (
                      <li key={subItem.name}>
                        <Link
                          to={subItem.path}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            isSubItemActive
                              ? 'bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                          }`}
                        >
                          <span>{subItem.name}</span>
                          <span className="flex items-center gap-1">
                            {subItem.new && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400">
                                new
                              </span>
                            )}
                            {subItem.pro && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400">
                                pro
                              </span>
                            )}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsHovered(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 transition-all duration-300 ease-in-out shadow-xl lg:shadow-none ${
          isExpanded || isMobileOpen ? 'w-[280px]' : isHovered ? 'w-[280px]' : 'w-[72px]'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        onMouseEnter={() => !isExpanded && !isMobileOpen && setIsHovered(true)}
        onMouseLeave={() => !isExpanded && setIsHovered(false)}
      >
        {/* Logo */}
        <div
          className={`h-16 flex items-center border-b border-gray-200 dark:border-gray-800 ${
            !isExpanded && !isHovered ? 'lg:justify-center px-4' : 'justify-start px-5'
          }`}
        >
          <Link to="/" className="flex items-center gap-3">
            {isExpanded || isHovered || isMobileOpen ? (
              <>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <span className="text-white font-bold text-sm">OS</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-base text-gray-900 dark:text-white leading-tight">
                    ORA SCRUM
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                    Project Management
                  </span>
                </div>
              </>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">OS</span>
              </div>
            )}
          </Link>
        </div>

        {/* Scrollable Content */}
        <div className="flex flex-col h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar px-3 py-4">
          <nav className="flex-1 space-y-6">
            {/* Main Menu */}
            <div>
              <h2
                className={`mb-3 text-[10px] font-bold uppercase tracking-wider flex items-center ${
                  !isExpanded && !isHovered ? 'lg:justify-center' : 'justify-start px-3'
                } ${
                  isExpanded || isHovered || isMobileOpen
                    ? 'text-gray-500 dark:text-gray-400'
                    : 'text-gray-400 dark:text-gray-600'
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  'Menu'
                ) : (
                  <HorizontaLDots className="w-5 h-5" />
                )}
              </h2>
              {renderMenuItems(navItems, 'main')}
            </div>

            {/* Others Menu */}
            <div>
              <h2
                className={`mb-3 text-[10px] font-bold uppercase tracking-wider flex items-center ${
                  !isExpanded && !isHovered ? 'lg:justify-center' : 'justify-start px-3'
                } ${
                  isExpanded || isHovered || isMobileOpen
                    ? 'text-gray-500 dark:text-gray-400'
                    : 'text-gray-400 dark:text-gray-600'
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  'Others'
                ) : (
                  <HorizontaLDots className="w-5 h-5" />
                )}
              </h2>
              {renderMenuItems(othersItems, 'others')}
            </div>
          </nav>

          {/* Widget */}
          {(isExpanded || isHovered || isMobileOpen) && (
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
              <SidebarWidget />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
