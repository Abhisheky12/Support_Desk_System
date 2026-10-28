import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchDashboardStats } from '../store/slices/dashboardSlice';
import { fetchAgents } from '../store/slices/agentSlice';
import { setFilters } from '../store/slices/ticketSlice';
import CreateTicketModal from '../components/tickets/CreateTicketModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Users,
  Activity,
  ArrowRight,
  TrendingUp,
  Inbox
} from 'lucide-react';

export const DashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { stats, loading } = useSelector((state) => state.dashboard);
  const { agents } = useSelector((state) => state.agents);
  const { user } = useSelector((state) => state.auth);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchAgents());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchDashboardStats());
  };

  const handleNavigateWithFilter = (filterUpdate) => {
    dispatch(setFilters(filterUpdate));
    navigate('/tickets');
  };

  const statCards = [
    {
      title: 'Total Tickets',
      value: stats.totalTickets,
      icon: Ticket,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      onClick: () => handleNavigateWithFilter({ status: 'all', priority: 'all' })
    },
    {
      title: 'Open Tickets',
      value: stats.openTickets,
      icon: Inbox,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
      onClick: () => handleNavigateWithFilter({ status: 'Open' })
    },
    {
      title: 'In Progress',
      value: stats.inProgressTickets,
      icon: Clock,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      onClick: () => handleNavigateWithFilter({ status: 'In Progress' })
    },
    {
      title: 'Resolved Tickets',
      value: stats.resolvedTickets,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      onClick: () => handleNavigateWithFilter({ status: 'Resolved' })
    },
    {
      title: 'Urgent Priority',
      value: stats.urgentTickets,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      onClick: () => handleNavigateWithFilter({ priority: 'Urgent' })
    },
    {
      title: 'Overdue Tickets (>24h)',
      value: stats.overdueTickets,
      icon: AlertTriangle,
      color: stats.overdueTickets > 0 ? 'text-rose-600' : 'text-slate-600',
      bg: stats.overdueTickets > 0 ? 'bg-rose-50' : 'bg-slate-50',
      border: stats.overdueTickets > 0 ? 'border-rose-200 ring-2 ring-rose-500/10' : 'border-slate-200',
      badge: stats.overdueTickets > 0 ? 'Action Required' : 'Within SLA',
      badgeColor: stats.overdueTickets > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600',
      onClick: () => handleNavigateWithFilter({ status: 'all' })
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Support Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time support operations, service metrics, and agent workloads
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 text-xs font-semibold"
            title="Refresh statistics"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-sm shadow-blue-500/20 flex items-center gap-1.5 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Create Ticket</span>
          </button>
        </div>
      </div>

      {/* 6 Required Statistics Cards */}
      {loading && stats.totalTickets === 0 ? (
        <LoadingSpinner text="Computing database metrics..." />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                onClick={card.onClick}
                className={`p-5 rounded-2xl bg-white border ${card.border} shadow-xs hover:shadow-md transition-all cursor-pointer group`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {card.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  )}
                </div>

                <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-1">
                  {card.value}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium">{card.title}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Two-Column Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Breakdown */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Priority Distribution</h3>
            </div>
            <span className="text-xs text-slate-400">Total: {stats.totalTickets}</span>
          </div>

          <div className="space-y-3.5">
            {[
              { label: 'Urgent', count: stats.breakdown.byPriority.Urgent, color: 'bg-rose-500', bar: 'bg-rose-100' },
              { label: 'High', count: stats.breakdown.byPriority.High, color: 'bg-amber-500', bar: 'bg-amber-100' },
              { label: 'Medium', count: stats.breakdown.byPriority.Medium, color: 'bg-blue-500', bar: 'bg-blue-100' },
              { label: 'Low', count: stats.breakdown.byPriority.Low, color: 'bg-slate-400', bar: 'bg-slate-100' }
            ].map((p) => {
              const percentage = stats.totalTickets > 0 ? Math.round((p.count / stats.totalTickets) * 100) : 0;
              return (
                <div key={p.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700">{p.label}</span>
                    <span className="text-slate-500">{p.count} tickets ({percentage}%)</span>
                  </div>
                  <div className={`w-full h-2 rounded-full ${p.bar} overflow-hidden`}>
                    <div
                      className={`h-full ${p.color} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">Status Workflow Overview</h3>
            </div>
            <span className="text-xs text-slate-400">Pipeline</span>
          </div>

          <div className="space-y-3.5">
            {[
              { label: 'Open', count: stats.openTickets, color: 'bg-blue-500', bar: 'bg-blue-100' },
              { label: 'In Progress', count: stats.inProgressTickets, color: 'bg-purple-500', bar: 'bg-purple-100' },
              { label: 'Waiting on Customer', count: stats.waitingTickets, color: 'bg-amber-500', bar: 'bg-amber-100' },
              { label: 'Resolved', count: stats.resolvedTickets, color: 'bg-emerald-500', bar: 'bg-emerald-100' }
            ].map((s) => {
              const percentage = stats.totalTickets > 0 ? Math.round((s.count / stats.totalTickets) * 100) : 0;
              return (
                <div key={s.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700">{s.label}</span>
                    <span className="text-slate-500">{s.count} tickets ({percentage}%)</span>
                  </div>
                  <div className={`w-full h-2 rounded-full ${s.bar} overflow-hidden`}>
                    <div
                      className={`h-full ${s.color} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Agent Workload Table */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Support Agent Workload (Active Tickets)</h3>
          </div>
          <button
            onClick={() => navigate('/tickets')}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
          >
            <span>View All Tickets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 rounded-lg">
              <tr>
                <th className="px-4 py-2.5">Agent / Member</th>
                <th className="px-4 py-2.5 text-center">Active Load</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.agentWorkload && stats.agentWorkload.length > 0 ? (
                stats.agentWorkload.map((workload, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-semibold">
                        {workload.agentName?.charAt(0)}
                      </div>
                      <span>{workload.agentName}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {workload.activeCount} active
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() =>
                          handleNavigateWithFilter({
                            assignedTo: workload.agentId || 'unassigned'
                          })
                        }
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                      >
                        View tickets
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-xs text-slate-400">
                    No active tickets currently in queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Ticket Modal */}
      <CreateTicketModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        agents={agents}
      />
    </div>
  );
};

export default DashboardPage;
