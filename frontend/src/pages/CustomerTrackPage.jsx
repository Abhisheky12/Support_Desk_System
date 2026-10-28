import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { TicketStatusBadge, TicketPriorityBadge } from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  Search,
  Key,
  Calendar,
  Clock,
  User,
  Send,
  MessageSquare,
  AlertCircle,
  LifeBuoy
} from 'lucide-react';
import toast from 'react-hot-toast';

export const CustomerTrackPage = () => {
  const [searchParams] = useSearchParams();

  const [reference, setReference] = useState(searchParams.get('reference') || '');
  const [token, setToken] = useState(searchParams.get('token') || '');

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);

  // Auto-fetch if query params provided
  useEffect(() => {
    const refParam = searchParams.get('reference');
    const tokenParam = searchParams.get('token');
    if (refParam && tokenParam) {
      handleFetchTicket(refParam, tokenParam);
    }
  }, [searchParams]);

  const handleFetchTicket = async (refVal = reference, tokVal = token) => {
    if (!refVal.trim() || !tokVal.trim()) {
      toast.error('Both Ticket Reference and Access Token are required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const ticketRes = await api.get(`/public/tickets/${refVal.trim().toUpperCase()}`, {
        params: { token: tokVal.trim() }
      });
      setTicket(ticketRes.data.data);

      const messagesRes = await api.get(`/public/tickets/${refVal.trim().toUpperCase()}/messages`, {
        params: { token: tokVal.trim() }
      });
      setMessages(messagesRes.data.data);
    } catch (err) {
      setError(err.message || 'Ticket not found or invalid token');
      setTicket(null);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }

    setReplying(true);
    try {
      await api.post(
        `/public/tickets/${ticket.reference}/messages`,
        { content: replyContent.trim(), token },
        { params: { token } }
      );
      toast.success('Your reply has been sent to our support team');
      setReplyContent('');

      // Refresh messages & ticket status
      handleFetchTicket(ticket.reference, token);
    } catch (err) {
      toast.error(err.message || 'Failed to submit reply');
    } finally {
      setReplying(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 mb-2">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Track Support Ticket</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Check live status updates, review engineering responses, and post replies
          </p>
        </div>

        {/* Verification Form */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFetchTicket();
            }}
            className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
          >
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ticket Reference
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value.toUpperCase())}
                  placeholder="e.g. TCK-100801"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Private Access Token
              </label>
              <div className="relative">
                <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste access key..."
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="sm:col-span-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 h-[34px] disabled:opacity-50"
              >
                <span>{loading ? 'Verifying...' : 'Look Up'}</span>
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Ticket Details View */}
        {loading ? (
          <LoadingSpinner text="Retrieving secure ticket details..." />
        ) : ticket ? (
          <div className="space-y-6">
            {/* Header info card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                    {ticket.reference}
                  </span>
                  <TicketStatusBadge status={ticket.status} />
                  <TicketPriorityBadge priority={ticket.priority} />
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Updated: {formatDate(ticket.updatedAt)}</span>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">{ticket.subject}</h2>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {ticket.description}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Assigned Representative: <strong className="text-slate-800">{ticket.assignedAgentName}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Submitted on: {formatDate(ticket.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Conversation Thread: ONLY Public Replies */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>Support Updates & Replies</span>
              </h3>

              {messages.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-slate-200">
                  No replies posted yet. Our support agents will respond shortly.
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((m, idx) => {
                    const isCustomer = m.senderRole === 'customer';
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border ${
                          isCustomer
                            ? 'bg-blue-50/50 border-blue-200 ml-4'
                            : 'bg-white border-slate-200 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold text-slate-900">
                            {m.senderName} {isCustomer ? '(You)' : '(Support)'}
                          </span>
                          <span className="text-[11px] text-slate-400">{formatDate(m.createdAt)}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {m.content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Customer reply box */}
              {ticket.status !== 'Resolved' ? (
                <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-100 space-y-3">
                  <label className="block text-xs font-semibold text-slate-700">
                    Add a Response to Support
                  </label>
                  <textarea
                    rows={3}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Provide additional details or respond to support questions..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={replying || !replyContent.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{replying ? 'Sending...' : 'Send Reply'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium text-center">
                  This ticket has been marked as Resolved. If you have a new issue, please submit a new ticket.
                </div>
              )}
            </div>
          </div>
        ) : null}

        <div className="text-center pt-2">
          <Link to="/customer/submit" className="text-xs text-blue-600 hover:underline">
            Need to open a new ticket instead?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerTrackPage;
