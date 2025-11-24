import { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Route to title mapping
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'แดชบอร์ด';
    if (path.includes('/users')) return 'ผู้ใช้';
    if (path.includes('/teachers')) return 'ผู้สอน';
    if (path.includes('/courses')) return 'คอร์ส';
    if (path.includes('/coupons')) return 'คูปอง';
    return 'แอดมิน';
  };

  const navItems = [
    {
      path: '/admin/dashboard',
      label: 'แดชบอร์ด',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    },
    {
      path: '/admin/users',
      label: 'ผู้ใช้',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    },
    {
      path: '/admin/teachers',
      label: 'ผู้สอน',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    },
    {
      path: '/admin/courses',
      label: 'คอร์ส',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    },
    {
      path: '/admin/coupons',
      label: 'คูปอง',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ];

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'A';

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <h1 className="text-xl font-bold text-brand">Tutor Admin</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-4 py-6">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand/10 text-brand'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={item.icon}
                />
              </svg>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3 rounded-lg px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{user?.name || 'Admin'}</p>
              <p className="truncate text-xs text-slate-500">{user?.email || ''}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
          {/* Mobile Menu Button */}
          <button
            type="button"
            className="flex items-center justify-center p-2 text-slate-600 hover:text-brand lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Page Title */}
          <h1 className="text-lg font-semibold text-slate-900">{getPageTitle()}</h1>

          {/* User Actions */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </header>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 bg-white">
            <nav className="flex flex-col px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand/10 text-brand'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={item.icon}
                    />
                  </svg>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        )}

        {/* Content Container */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
