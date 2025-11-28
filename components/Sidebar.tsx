import React from 'react';
import { User } from '../types';

interface SidebarProps {
  user: User;
  currentView: 'files' | 'history' | 'favorites';
  onChangeView: (view: 'files' | 'history' | 'favorites') => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, currentView, onChangeView, onLogout }) => {
  const navItems = [
    { id: 'files', label: 'Local (Drive)', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
      </svg>
    )},
    { id: 'history', label: 'Analyze', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
      </svg>
    )},
    { id: 'favorites', label: 'Network', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    )},
  ];

  const initial = user.name ? user.name.charAt(0) : '?';
  const displayName = user.name || 'User';

  return (
    <aside className="w-full md:w-64 bg-[#263238] border-r border-slate-700 flex flex-col h-full hidden md:flex">
      <div className="p-6 flex items-center space-x-3 bg-[#263238]">
        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold">
            CX
        </div>
        <span className="text-xl font-bold tracking-tight text-white">Explorer</span>
      </div>

      <nav className="flex-1 px-2 space-y-1 mt-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id as any)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded transition-all duration-200 ${
              currentView === item.id
                ? 'bg-blue-600/20 text-blue-400 font-medium'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Profile Section */}
      <div className="px-6 py-6 border-t border-slate-700/50 bg-[#263238]">
        <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white border border-slate-600">
                {initial}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{displayName}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
        </div>
        <button 
            onClick={onLogout}
            className="w-full py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
        >
            Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;