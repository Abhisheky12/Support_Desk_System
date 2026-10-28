import React from 'react';
import { Shield, User, Globe, MessageSquare } from 'lucide-react';

export const MessageTimeline = ({ messages }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!messages || messages.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 text-xs italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <MessageSquare className="w-5 h-5 mx-auto mb-1.5 opacity-50" />
        No messages or notes in this ticket conversation yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((msg) => {
        const isInternal = msg.type === 'internal';
        const isCustomer = msg.senderRole === 'customer';

        return (
          <div
            key={msg._id}
            className={`rounded-xl p-4 transition-all border ${
              isInternal
                ? 'bg-amber-50/60 border-amber-300/80 shadow-sm'
                : isCustomer
                ? 'bg-slate-50 border-slate-200'
                : 'bg-white border-blue-100 shadow-sm'
            }`}
          >
            {/* Header: Author & Type Badge */}
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100/80">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    isInternal
                      ? 'bg-amber-200 text-amber-900'
                      : isCustomer
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {isInternal ? (
                    <Shield className="w-3.5 h-3.5" />
                  ) : isCustomer ? (
                    <User className="w-3.5 h-3.5" />
                  ) : (
                    msg.senderName?.charAt(0) || 'S'
                  )}
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-900">
                    {msg.senderName}
                  </span>
                  <span className="text-[11px] text-slate-400 ml-1.5">
                    ({msg.senderRole})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Visual Distinction Badge */}
                {isInternal ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                    <Shield className="w-3 h-3" />
                    Internal Note (Private)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    <Globe className="w-3 h-3" />
                    Public Reply
                  </span>
                )}
                <span className="text-[11px] text-slate-400">{formatDate(msg.createdAt)}</span>
              </div>
            </div>

            {/* Content */}
            <div className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed pl-1">
              {msg.content}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageTimeline;

