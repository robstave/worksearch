import { NavLink, Outlet } from 'react-router-dom';

export function ResourcesLayout() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-4">Resources</h1>
      <nav aria-label="Resources" className="flex gap-2 border-b border-gray-700 pb-4 mb-6">
        {[
          { to: '/job-boards', label: 'Job Boards' },
          { to: '/resources/resumes', label: 'Resumes' },
          { to: '/resources/notes', label: 'Notes' },
        ].map((tab) => <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive
              ? 'bg-gray-700 text-white'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }`}
        >
          {tab.label}
        </NavLink>)}
      </nav>
      <Outlet />
    </div>
  );
}
