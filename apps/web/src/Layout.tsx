import { useState, useRef, useEffect, useMemo } from 'react';
import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth';
import { useTheme } from './theme';
import { applicationsApi, companiesApi, eventsApi } from './api';

// Generate a consistent random color based on email
function getAvatarColor(email: string): string {
  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
  ];
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getAvatarLetter(email: string): string {
  // Get the first letter of the email (before @)
  const username = email.split('@')[0];
  return username.charAt(0).toUpperCase();
}

const NAV_ITEMS = [
  { path: '/applications/list', label: 'List' },
  { path: '/applications/board', label: 'Board' },
  { path: '/calendar', label: 'Calendar' },
  { path: '/analytics/sankey', label: 'Analytics' },
  { path: '/companies', label: 'Companies' },
  { path: '/job-boards', label: 'Job Boards' },
];

// Icons
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
  </svg>
);

const CogIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
  </svg>
);

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.061l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.061 1.06l1.06 1.06z" />
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.967.75.75 0 011.067.853A8.5 8.5 0 116.647 1.921a.75.75 0 01.808.083z" clipRule="evenodd" />
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clipRule="evenodd" />
  </svg>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M9.661 2.237a.531.531 0 01.678 0 11.947 11.947 0 007.078 2.749.5.5 0 01.479.425c.069.52.104 1.05.104 1.59 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 01-.332 0C5.26 16.564 2 12.163 2 7c0-.538.035-1.069.104-1.589a.5.5 0 01.48-.425 11.947 11.947 0 007.077-2.75z" clipRule="evenodd" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
    <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
  </svg>
);

const FireIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M13.5 4.938a7 7 0 11-9.006 1.737c.202-.257.59-.218.793.039.278.352.594.672.943.954.332.269.786-.049.786-.49V6.5a.75.75 0 011.5 0v.667c0 .441.454.759.786.49.349-.282.665-.602.943-.954.203-.257.59-.296.793-.039A7.001 7.001 0 0113.5 4.938zM10 15a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
  </svg>
);

export function Layout() {
  const { user, logout, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Memoize avatar color so it stays consistent during session
  const avatarColor = useMemo(() => user ? getAvatarColor(user.email) : 'bg-gray-500', [user?.email]);
  const avatarLetter = useMemo(() => user ? getAvatarLetter(user.email) : '?', [user?.email]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
  };

  const handleMenuClick = (path: string) => {
    setDropdownOpen(false);
    navigate(path);
  };

  const handleExportData = async () => {
    setDropdownOpen(false);
    try {
      // Fetch all data in parallel
      const [applicationsRes, companiesRes, eventsRes] = await Promise.all([
        applicationsApi.list({ limit: 10000 }),
        companiesApi.list({ limit: 10000 }),
        eventsApi.list({}),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        user: { email: user?.email, role: user?.role },
        applications: applicationsRes.items.map((app) => ({
          id: app.id,
          company: app.company?.name || null,
          companyId: app.company?.id || null,
          jobTitle: app.jobTitle,
          jobReqUrl: app.jobReqUrl,
          currentState: app.currentState,
          workLocation: app.workLocation,
          tags: app.tags,
          appliedAt: app.appliedAt,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
        })),
        companies: companiesRes.items.map((c) => ({
          id: c.id,
          name: c.name,
          website: c.website,
          notesMd: c.notesMd,
          star: c.star,
          revisit: c.revisit,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
        events: eventsRes.items.map((e) => ({
          id: e.id,
          title: e.title,
          type: e.type,
          scheduledAt: e.scheduledAt,
          notesMd: e.notesMd,
          companyId: e.companyId,
          applicationId: e.applicationId,
          createdAt: e.createdAt,
        })),
      };

      // Create and trigger download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().split('T')[0];
      a.download = `worksearch-export-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Check console for details.');
    }
  };

  const handleCheckHot = async () => {
    setDropdownOpen(false);
    try {
      const result = await applicationsApi.cleanHot();
      if (result.cleaned > 0) {
        alert(`Cleaned ${result.cleaned} stale hot item${result.cleaned !== 1 ? 's' : ''} (older than 1 month).`);
      } else {
        alert('No stale hot items found. All hot items are still fresh!');
      }
    } catch (err) {
      console.error('Check hot failed:', err);
      alert('Check hot failed. Check console for details.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white">
                <img src="/cat.png" alt="WorkSearch" className="w-8 h-8" />
                <span className="hidden sm:inline">WorkSearch</span>
              </Link>
              <div className="flex gap-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            
            {/* Avatar Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-sm hover:ring-2 hover:ring-offset-2 hover:ring-offset-gray-800 hover:ring-white transition-all`}
                title={user.email}
              >
                {avatarLetter}
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1 z-50">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-gray-700">
                    <p className="text-sm font-medium text-white truncate">
                      {user.email}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">
                      {user.role}
                    </p>
                  </div>
                  
                  {/* Menu items */}
                  <div className="py-1">
                    <button
                      onClick={() => handleMenuClick('/profile')}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                    >
                      <UserIcon />
                      Profile
                    </button>
                    <button
                      onClick={() => handleMenuClick('/settings')}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                    >
                      <CogIcon />
                      Settings
                    </button>
                    <button
                      onClick={() => handleMenuClick('/events/new')}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                    >
                      <CalendarIcon />
                      New Event
                    </button>
                    <button
                      onClick={handleExportData}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                    >
                      <DownloadIcon />
                      Export Data
                    </button>
                    <button
                      onClick={handleCheckHot}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                    >
                      <FireIcon />
                      Check Hot
                    </button>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        setThemeModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                    >
                      {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
                      Display Mode
                      <span className="ml-auto text-xs text-gray-500 capitalize">{theme}</span>
                    </button>
                  </div>
                  
                  {/* Admin section */}
                  {user.role === 'admin' && (
                    <>
                      <div className="border-t border-gray-700 my-1" />
                      <div className="py-1">
                        <button
                          onClick={() => handleMenuClick('/admin/users')}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
                        >
                          <ShieldIcon />
                          Admin: Users
                        </button>
                      </div>
                    </>
                  )}
                  
                  {/* Logout */}
                  <div className="border-t border-gray-700 my-1" />
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                    >
                      <LogoutIcon />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Theme Modal */}
      {themeModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setThemeModalOpen(false)}>
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">Display Mode</h2>
            <p className="text-gray-400 text-sm mb-4">
              Light mode support coming soon. Currently dark mode only.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setTheme('light')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                  theme === 'light'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <SunIcon />
                  <span className="text-white">Light Mode</span>
                </div>
                {theme === 'light' && <span className="text-blue-400">✓</span>}
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MoonIcon />
                  <span className="text-white">Dark Mode</span>
                </div>
                {theme === 'dark' && <span className="text-blue-400">✓</span>}
              </button>
            </div>
            <button
              onClick={() => setThemeModalOpen(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
