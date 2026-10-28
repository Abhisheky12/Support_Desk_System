import React from 'react';
import {
  PlusCircle,
  UserCheck,
  RefreshCw,
  Sliders,
  CheckCircle2,
  MessageSquare,
  Shield,
  Clock
} from 'lucide-react';

export const ActivityTimeline = ({ activities }) => {
  const getActionConfig = (action) => {
    switch (action) {
      case 'TICKET_CREATED':
        return { icon: PlusCircle, color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'TICKET_ASSIGNED':
      case 'TICKET_REASSIGNED':
        return { icon: UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' };
      case 'STATUS_CHANGED':
        return { icon: RefreshCw, color: 'text-purple-600', bg: 'bg-purple-50' };
      case 'PRIORITY_CHANGED':
        return { icon: Sliders, color: 'text-amber-600', bg: 'bg-amber-50' };
      case 'PUBLIC_REPLY_ADDED':
        return { icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' };
      case 'INTERNAL_NOTE_ADDED':
        return { icon: Shield, color: 'text-amber-700', bg: 'bg-amber-100' };
      case 'TICKET_RESOLVED':
        return { icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-100' };
      default:
        return { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100' };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-slate-400 italic">
        No audit activity recorded yet.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {activities.map((act) => {
        const config = getActionConfig(act.action);
        const Icon = config.icon;

        return (
          <div key={act._id} className="relative group">
            {/* Timeline node icon */}
            <div
              className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ${config.bg} ${config.color} ring-4 ring-white shadow-xs`}
            >
              <Icon className="w-3 h-3" />
            </div>

            <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200/60 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold text-slate-800">
                  {act.actor?.name || 'System'}
                  {act.actor?.role && (
                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                      ({act.actor.role})
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-slate-400">{formatDate(act.createdAt)}</span>
              </div>

              <p className="text-xs text-slate-600">{act.description}</p>

              {/* Show previous & new values if available */}
              {act.previousValue && act.newValue && typeof act.previousValue === 'string' && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200/60 w-fit">
                  <span className="text-rose-500 line-through">{act.previousValue}</span>
                  <span>&rarr;</span>
                  <span className="text-emerald-600 font-semibold">{act.newValue}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityTimeline;

