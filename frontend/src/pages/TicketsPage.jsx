import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTickets, setFilters, resetFilters } from '../store/slices/ticketSlice';
import { fetchAgents } from '../store/slices/agentSlice';
import TicketFilters from '../components/tickets/TicketFilters';
import TicketTable from '../components/tickets/TicketTable';
import CreateTicketModal from '../components/tickets/CreateTicketModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { Plus, ChevronLeft, ChevronRight, Ticket } from 'lucide-react';

export const TicketsPage = () => {
  const dispatch = useDispatch();
  const { tickets, pagination, filters, loading } = useSelector((state) => state.tickets);
  const { agents } = useSelector((state) => state.agents);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Fetch tickets whenever filters change
  useEffect(() => {
    dispatch(fetchTickets(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    dispatch(fetchAgents());
  }, [dispatch]);

  const handleFilterChange = (newFilters) => {
    dispatch(setFilters(newFilters));
  };

  const handleResetFilters = () => {
    dispatch(resetFilters());
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      dispatch(setFilters({ page: newPage }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Support Tickets</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage customer issues, track SLA compliance, and assign to agents
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-sm shadow-blue-500/20 flex items-center justify-center gap-1.5 text-xs font-semibold self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <TicketFilters
        filters={filters}
        agents={agents}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Main Table / Loading / Empty */}
      {loading ? (
        <LoadingSpinner text="Loading tickets..." />
      ) : tickets && tickets.length > 0 ? (
        <div className="space-y-4">
          <TicketTable tickets={tickets} />

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-3">
            <p className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-700">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-semibold text-slate-700">{pagination.total}</span> tickets
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg">
                Page {pagination.page} of {pagination.pages || 1}
              </span>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Ticket}
          title="No tickets found"
          description={
            filters.search || filters.status !== 'all' || filters.priority !== 'all'
              ? 'No tickets match the selected filters or search terms. Try clearing your filters.'
              : 'There are currently no tickets in the system.'
          }
          action={
            filters.search || filters.status !== 'all' || filters.priority !== 'all' ? (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Reset All Filters
              </button>
            ) : (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Create First Ticket
              </button>
            )
          }
        />
      )}

      {/* Modal for creating a ticket */}
      <CreateTicketModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        agents={agents}
      />
    </div>
  );
};

export default TicketsPage;
