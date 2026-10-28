import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { LayoutDashboard, Ticket, Users, Send, Search, LifeBuoy } from 'lucide-react';

export const Sidebar = () => {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';

  const staffNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Tickets', path: '/tickets', icon: Ticket },
    ...(isAdmin ? [{ label: 'Agent Management', path: '/agents', icon: Users }] : [])
  ];

  const customerNavItems = [
    { label: 'Submit Ticket', path: '/customer/submit', icon: Send },
    { label: 'Track Ticket', path: '/customer/track', icon: Search }
  ];

  const getNavLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm shadow-blue-500/5'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Support Operations
          </p>
          <nav className="space-y-1">
            {staffNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.path} to={item.path} className={getNavLinkClass}>
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Customer Portal
          </p>
          <nav className="space-y-1">
            {customerNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.path} to={item.path} className={getNavLinkClass}>
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Helpful info box */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
        <div className="flex items-center gap-2 mb-1.5 font-semibold text-slate-800">
          <LifeBuoy className="w-4 h-4 text-blue-600" />
          <span>Support Desk SLA</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Tickets older than 24h are marked overdue until resolved.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;

