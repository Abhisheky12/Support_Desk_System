import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTicketById,
  updateTicket,
  assignTicket,
  fetchMessages,
  fetchActivity,
  clearCurrentTicket
} from '../store/slices/ticketSlice';
import { fetchAgents } from '../store/slices/agentSlice';
import { fetchDashboardStats } from '../store/slices/dashboardSlice';
import MessageTimeline from '../components/conversation/MessageTimeline';
import MessageComposer from '../components/conversation/MessageComposer';
import ActivityTimeline from '../components/activity/ActivityTimeline';
import { TicketStatusBadge, TicketPriorityBadge, OverdueBadge } from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Clock,
  Shield,
  CheckCircle,
  AlertTriangle,
  History,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

export const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentTicket, messages, activity, detailLoading } = useSelector((state) => state.tickets);
  const { agents } = useSelector((state) => state.agents);
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('conversation'); // 'conversation' | 'activity'
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [updatingAssignee, setUpdatingAssignee] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (id) {
      dispatch(fetchTicketById(id));
      dispatch(fetchMessages(id));
      dispatch(fetchActivity(id));
    }
    dispatch(fetchAgents());

    return () => {
      dispatch(clearCurrentTicket());
    };
  }, [dispatch, id]);

  const handleStatusChange = async (newStatus) => {
    if (!currentTicket || newStatus === currentTicket.status) return;
    setUpdatingStatus(true);
    try {
      const res = await dispatch(updateTicket({ id: currentTicket._id, updates: { status: newStatus } }));
      if (updateTicket.fulfilled.match(res)) {
        toast.success(`Status updated to '${newStatus}'`);
        dispatch(fetchActivity(currentTicket._id));
        dispatch(fetchDashboardStats());
      } else {
        toast.error(res.payload || 'Failed to update status');
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    if (!currentTicket || newPriority === currentTicket.priority) return;
    setUpdatingPriority(true);
    try {
      const res = await dispatch(updateTicket({ id: currentTicket._id, updates: { priority: newPriority } }));
      if (updateTicket.fulfilled.match(res)) {
        toast.success(`Priority updated to '${newPriority}'`);
        dispatch(fetchActivity(currentTicket._id));
        dispatch(fetchDashboardStats());
      } else {
        toast.error(res.payload || 'Failed to update priority');
      }
    } finally {
      setUpdatingPriority(false);
    }
  };

  const handleAssigneeChange = async (newAgentId) => {
    if (!currentTicket) return;
    if (!isAdmin) {
      toast.error('Only administrators can reassign tickets');
      return;
    }

    setUpdatingAssignee(true);
    try {
      const res = await dispatch(assignTicket({ id: currentTicket._id, agentId: newAgentId }));
      if (assignTicket.fulfilled.match(res)) {
        toast.success('Assignment updated successfully');
        dispatch(fetchActivity(currentTicket._id));
        dispatch(fetchDashboardStats());
      } else {
        toast.error(res.payload || 'Failed to assign ticket');
      }
    } finally {
      setUpdatingAssignee(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (detailLoading || !currentTicket) {
    return <LoadingSpinner text="Loading ticket details..." className="py-20" />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button
          onClick={() => navigate('/tickets')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tickets</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">
            {currentTicket.reference}
          </span>
          {currentTicket.isOverdue && <OverdueBadge />}
        </div>
      </div>

      {/* Overdue Warning Alert Banner */}
      {currentTicket.isOverdue && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-sm mb-0.5">SLA Breach: Ticket is Overdue</p>
            <p className="text-rose-700">
              This ticket was created over 24 hours ago and has not been resolved. It requires immediate action. Marking it 'Resolved' will remove the overdue flag.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Details (Left 8 cols) & Sidebar Controls (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Ticket Content & Timeline */}
        <div className="lg:col-span-8 space-y-6">
          {/* Ticket Header & Description */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TicketStatusBadge status={currentTicket.status} />
                <TicketPriorityBadge priority={currentTicket.priority} />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
                {currentTicket.subject}
              </h1>
            </div>

            {/* Customer Details Box */}
            <div className="flex flex-wrap items-center gap-4 py-3 px-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 font-medium text-slate-900">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>{currentTicket.customerName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono text-slate-600">{currentTicket.customerEmail}</span>
              </div>
            </div>

            {/* Issue Description */}
            <div className="pt-2">
              <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Issue Description
              </h4>
              <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {currentTicket.description}
              </div>
            </div>
          </div>

          {/* Conversation & Activity Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('conversation')}
                  className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'conversation'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Conversation ({messages.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('activity')}
                  className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'activity'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>Audit History ({activity.length})</span>
                </button>
              </div>
            </div>

            {/* Tab content */}
            {activeTab === 'conversation' ? (
              <div className="space-y-6">
                <MessageTimeline messages={messages} />
                <MessageComposer ticketId={currentTicket._id} />
              </div>
            ) : (
              <ActivityTimeline activities={activity} />
            )}
          </div>
        </div>

        {/* Right Column: Ticket Controls & Metadata */}
        <div className="lg:col-span-4 space-y-6">
          {/* Controls Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Ticket Operations
            </h3>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Update Status
              </label>
              <select
                value={currentTicket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updatingStatus}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Waiting on Customer">Waiting on Customer</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {/* Priority Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Update Priority
              </label>
              <select
                value={currentTicket.priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
                disabled={updatingPriority}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            {/* Agent Assignee Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Assigned Agent
                </label>
                {!isAdmin && (
                  <span className="text-[10px] text-slate-400 italic">Admin only</span>
                )}
              </div>
              <select
                value={currentTicket.assignedTo?._id || 'unassigned'}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                disabled={!isAdmin || updatingAssignee}
                className={`w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                  !isAdmin ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''
                }`}
              >
                <option value="unassigned">Unassigned</option>
                {agents &&
                  agents.map((agent) => (
                    <option key={agent._id} value={agent._id}>
                      {agent.name} ({agent.role})
                    </option>
                  ))}
              </select>
            </div>

            {/* Quick Resolve Button */}
            {currentTicket.status !== 'Resolved' && (
              <button
                onClick={() => handleStatusChange('Resolved')}
                disabled={updatingStatus}
                className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5 mt-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark Ticket as Resolved</span>
              </button>
            )}
          </div>

          {/* Metadata Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5 text-xs text-slate-600">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Timestamps & Metadata
            </h3>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Created:
              </span>
              <span className="font-medium text-slate-700">{formatDate(currentTicket.createdAt)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Updated:
              </span>
              <span className="font-medium text-slate-700">{formatDate(currentTicket.updatedAt)}</span>
            </div>

            {currentTicket.resolvedAt && (
              <div className="flex items-center justify-between">
                <span className="text-emerald-600 flex items-center gap-1.5 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Resolved:
                </span>
                <span className="font-medium text-emerald-700">{formatDate(currentTicket.resolvedAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailPage;
