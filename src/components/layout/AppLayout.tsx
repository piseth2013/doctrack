import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { 
  FileText, 
  Settings, 
  LayoutDashboard, 
  PlusCircle, 
  LogOut, 
  Menu, 
  X
} from 'lucide-react';
import { useAuth } from '../auth/AuthWrapper';
import Avatar from '../ui/Avatar';
import { twMerge } from 'tailwind-merge';
import LanguageToggle from './LanguageToggle';
import { useTranslation } from '../../lib/translations';
import { supabase } from '../../lib/supabase';

const AppLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const location = useLocation();
  const t = useTranslation();

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const { data, error } = await supabase
          .from('logo_settings')
          .select('logo_url')
          .single();

        if (error) throw error;
        setLogoUrl(data?.logo_url);
      } catch (err) {
        console.error('Error fetching logo:', err);
      }
    };

    fetchLogo();
  }, []);

  const navItems = [
    {
      name: t('dashboard'),
      icon: <LayoutDashboard size={20} />,
      path: '/dashboard',
      exact: true
    },
    {
      name: t('documents'),
      icon: <FileText size={20} />,
      path: '/documents',
      exact: true
    },
    {
      name: t('newDocument'),
      icon: <PlusCircle size={20} />,
      path: '/documents/new',
      exact: true
    },
    {
      name: t('settings'),
      icon: <Settings size={20} />,
      path: '/settings',
      exact: true
    },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const isPathActive = (path: string, exact: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow bg-primary-800 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex flex-col items-center w-full">
              {logoUrl ? (
                <div className="w-[512px] h-[512px] max-w-full max-h-32 flex items-center justify-center">
                  <img 
                    src={logoUrl} 
                    alt="Company Logo" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <h1 className="text-white text-2xl font-bold">DocTrack</h1>
              )}
            </div>
          </div>
          <div className="mt-5 flex-1 flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    twMerge(
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                      isPathActive(item.path, item.exact)
                        ? 'bg-primary-900 text-white'
                        : 'text-primary-100 hover:bg-primary-700'
                    )
                  }
                >
                  <div className="mr-3 flex-shrink-0">{item.icon}</div>
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="px-4 mt-6">
            <LanguageToggle />
            <div className="flex items-center mt-4">
              <div className="flex-shrink-0">
                <Avatar
                  name={user?.email || ''}
                  size="md"
                  className="bg-primary-700"
                />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user?.email}</p>
                <button
                  onClick={handleSignOut}
                  className="text-xs font-medium text-primary-200 group flex items-center mt-1 hover:text-white"
                >
                  <LogOut size={14} className="mr-1" />
                  {t('signOut')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-10 bg-white shadow-sm">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center">
            {logoUrl ? (
              <div className="w-[512px] h-[512px] max-w-32 max-h-8 flex items-center justify-center">
                <img 
                  src={logoUrl} 
                  alt="Company Logo" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <h1 className="text-primary-800 text-xl font-bold">DocTrack</h1>
            )}
          </div>
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-primary-800 pt-14">
          <nav className="px-4 py-2 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  twMerge(
                    'group flex items-center px-2 py-3 text-base font-medium rounded-md',
                    isPathActive(item.path, item.exact)
                      ? 'bg-primary-900 text-white'
                      : 'text-primary-100 hover:bg-primary-700'
                  )
                }
              >
                <div className="mr-4 flex-shrink-0">{item.icon}</div>
                {item.name}
              </NavLink>
            ))}
            <div className="pt-4 mt-4 border-t border-primary-700">
              <LanguageToggle />
              <div className="flex items-center px-2 mt-4">
                <Avatar
                  name={user?.email || ''}
                  size="md"
                  className="bg-primary-700"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{user?.email}</p>
                  <button
                    onClick={handleSignOut}
                    className="text-xs font-medium text-primary-200 group flex items-center mt-1 hover:text-white"
                  >
                    <LogOut size={14} className="mr-1" />
                    {t('signOut')}
                  </button>
                </div>
              </div>
            </div>
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;