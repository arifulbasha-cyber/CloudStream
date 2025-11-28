import React from 'react';

interface MobileNavProps {
  currentView: 'files' | 'history' | 'favorites';
  onChangeView: (view: 'files' | 'history' | 'favorites') => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ currentView, onChangeView }) => {
  const navItems = [
    { id: 'files', label: 'Local', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.06l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 0 0 1.061 1.06l8.69-8.69Z" />
            <path d="M12 5.432 2.15 15.28a.75.75 0 1 0 1.06 1.061L12 7.553l8.79 8.79a.75.75 0 1 0 1.06-1.06L12 5.432Z" />
        </svg>
    )},
    { id: 'history', label: 'Analyze', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 0 1 8.25-8.25.75.75 0 0 1 .75.75v6.75H18a.75.75 0 0 1 .75.75 8.25 8.25 0 0 1-16.5 0Z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M12.75 3a.75.75 0 0 1 .75-.75 8.25 8.25 0 0 1 8.25 8.25.75.75 0 0 1-.75.75h-7.5a.75.75 0 0 1-.75-.75V3Z" clipRule="evenodd" />
        </svg>
    )},
    { id: 'favorites', label: 'Network', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v.693a5.25 5.25 0 0 1 3.132 1.247l.675-.675a.75.75 0 0 1 1.06 1.06l-.675.675a5.25 5.25 0 0 1 1.247 3.132h.693a.75.75 0 0 1 0 1.5h-.693a5.25 5.25 0 0 1-1.247 3.132l.675.675a.75.75 0 0 1-1.06 1.06l-.675-.675a5.25 5.25 0 0 1-3.132 1.247v.693a.75.75 0 0 1-1.5 0v-.693a5.25 5.25 0 0 1-3.132-1.247l-.675.675a.75.75 0 0 1-1.06-1.06l.675-.675a5.25 5.25 0 0 1-1.247-3.132H3.75a.75.75 0 0 1 0-1.5h.693a5.25 5.25 0 0 1 1.247-3.132l-.675-.675a.75.75 0 0 1 1.06-1.06l.675.675A5.25 5.25 0 0 1 11.25 3.693V3a.75.75 0 0 1 .75-.75Zm0 3.75a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5ZM12 7.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" clipRule="evenodd" />
        </svg>
    )},
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#263238] border-t border-slate-700 z-40 pb-safe">
      <div className="flex justify-around items-center h-14">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id as any)}
            className={`flex flex-col items-center justify-center w-full h-full ${
              currentView === item.id
                ? 'text-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileNav;