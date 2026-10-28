import React from 'react';
import { Link } from 'react-router-dom';
import { TicketStatusBadge, TicketPriorityBadge, OverdueBadge } from '../common/Badge';
import { User, ChevronRight, Clock } from 'lucide-react';

export const TicketTable = ({ tickets }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th scope="col" className="px-5 py-3.5">Reference</th>
              <th scope="col" className="px-5 py-3.5">Subject & Customer</th>
              <th scope="col" className="px-5 py-3.5">Status</th>
              <th scope="col" className="px-5 py-3.5">Priority</th>
              <th scope="col" className="px-5 py-3.5">Assignee</th>
              <th scope="col" className="px-5 py-3.5">Last Updated</th>
              <th scope="col" className="px-4 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.map((ticket) => (
              <tr
                key={ticket._id}
                className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
              >
                {/* Reference & Overdue */}
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1 items-start">
                    <Link
                      to={`/tickets/${ticket._id}`}
                      className="font-mono text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {ticket.reference}
                    </Link>
                    {ticket.isOverdue && <OverdueBadge />}
                  </div>
                </td>

                {/* Subject & Customer */}
                <td className="px-5 py-4 max-w-xs sm:max-w-md">
                  <Link to={`/tickets/${ticket._id}`} className="block">
                    <p className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {ticket.subject}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {ticket.customerName} <span className="text-slate-400">&bull;</span> {ticket.customerEmail}
                    </p>
                  </Link>
                </td>

                {/* Status */}
                <td className="px-5 py-4 whitespace-nowrap">
                  <TicketStatusBadge status={ticket.status} />
                </td>

                {/* Priority */}
                <td className="px-5 py-4 whitespace-nowrap">
                  <TicketPriorityBadge priority={ticket.priority} />
                </td>

                {/* Assignee */}
                <td className="px-5 py-4 whitespace-nowrap">
                  {ticket.assignedTo ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-semibold">
                        {ticket.assignedTo.name?.charAt(0)}
                      </div>
                      <span className="text-xs font-medium text-slate-700">
                        {ticket.assignedTo.name}
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400 italic">
                      <User className="w-3.5 h-3.5" />
                      Unassigned
                    </span>
                  )}
                </td>

                {/* Last Updated */}
                <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(ticket.updatedAt)}</span>
                  </div>
                </td>

                {/* Action Link */}
                <td className="px-4 py-4 whitespace-nowrap text-right">
                  <Link
                    to={`/tickets/${ticket._id}`}
                    className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TicketTable;

