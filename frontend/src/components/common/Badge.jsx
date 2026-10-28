import React from 'react';

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        variants[variant] || variants.default
      } ${className}`}
    >
      {children}
    </span>
  );
};

export const TicketStatusBadge = ({ status }) => {
  const configs = {
    Open: { variant: 'primary', label: 'Open' },
    'In Progress': { variant: 'purple', label: 'In Progress' },
    'Waiting on Customer': { variant: 'warning', label: 'Waiting on Customer' },
    Resolved: { variant: 'success', label: 'Resolved' }
  };

  const config = configs[status] || { variant: 'default', label: status || 'Unknown' };

  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const TicketPriorityBadge = ({ priority }) => {
  const configs = {
    Low: { variant: 'default', label: 'Low', dot: 'bg-slate-400' },
    Medium: { variant: 'primary', label: 'Medium', dot: 'bg-blue-500' },
    High: { variant: 'warning', label: 'High', dot: 'bg-amber-500' },
    Urgent: { variant: 'danger', label: 'Urgent', dot: 'bg-rose-500' }
  };

  const config = configs[priority] || { variant: 'default', label: priority || 'Medium', dot: 'bg-slate-400' };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        config.variant === 'danger'
          ? 'bg-rose-50 text-rose-700 border-rose-200 font-semibold'
          : config.variant === 'warning'
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : config.variant === 'primary'
          ? 'bg-blue-50 text-blue-700 border-blue-200'
          : 'bg-slate-100 text-slate-700 border-slate-200'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  );
};

export const OverdueBadge = () => {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-600 text-white animate-pulse">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      OVERDUE
    </span>
  );
};

