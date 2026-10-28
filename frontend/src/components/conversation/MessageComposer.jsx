import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addMessage, fetchActivity } from '../../store/slices/ticketSlice';
import { Globe, Shield, Send, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export const MessageComposer = ({ ticketId }) => {
  const dispatch = useDispatch();
  const { messageSending } = useSelector((state) => state.tickets);
  const [content, setContent] = useState('');
  const [type, setType] = useState('public'); // 'public' | 'internal'

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Message content cannot be empty');
      return;
    }

    try {
      const resultAction = await dispatch(
        addMessage({
          ticketId,
          content: content.trim(),
          type
        })
      );

      if (addMessage.fulfilled.match(resultAction)) {
        toast.success(
          type === 'internal'
            ? 'Internal note saved (Visible to staff only)'
            : 'Public reply sent to customer'
        );
        setContent('');
        // Refresh audit trail
        dispatch(fetchActivity(ticketId));
      } else {
        toast.error(resultAction.payload || 'Failed to submit message');
      }
    } catch {
      toast.error('Failed to submit message');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Explicit Selector Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1.5">
        <button
          type="button"
          onClick={() => setType('public')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            type === 'public'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200/80'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Public Reply</span>
          <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">(Sent to customer)</span>
        </button>

        <button
          type="button"
          onClick={() => setType('internal')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            type === 'internal'
              ? 'bg-amber-100 text-amber-900 shadow-sm border border-amber-300'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-amber-700" />
          <span>Internal Note</span>
          <span className="text-[10px] text-amber-800/80 font-normal hidden sm:inline">(Private staff only)</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4">
        {/* Warning banner for internal note vs public */}
        {type === 'internal' ? (
          <div className="mb-3 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs text-amber-800">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>This note will only be visible to support staff and admins. The customer cannot see it.</span>
          </div>
        ) : (
          <div className="mb-3 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-2 text-xs text-blue-800">
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span>This reply will be publicly visible to the customer on their ticket tracking portal.</span>
          </div>
        )}

        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            type === 'internal'
              ? 'Write a private note for other agents or engineering team...'
              : 'Type your response to the customer...'
          }
          className={`w-full p-3 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-all ${
            type === 'internal'
              ? 'border-amber-200 focus:ring-amber-500/20 focus:border-amber-400 bg-amber-50/20'
              : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500 bg-white'
          }`}
        />

        <div className="flex items-center justify-between mt-3">
          <span className="text-[11px] text-slate-400">
            {content.length} characters
          </span>

          <div className="flex items-center gap-2">
            {content && (
              <button
                type="button"
                onClick={() => setContent('')}
                className="text-xs text-slate-400 hover:text-slate-600 px-2.5 py-1.5"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              disabled={messageSending || !content.trim()}
              className={`px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 ${
                type === 'internal'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              {messageSending ? 'Posting...' : type === 'internal' ? 'Add Internal Note' : 'Send Public Reply'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MessageComposer;

