import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createTicket, fetchTickets } from '../../store/slices/ticketSlice';
import { fetchDashboardStats } from '../../store/slices/dashboardSlice';
import Modal from '../common/Modal';
import { Send, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export const CreateTicketModal = ({ isOpen, onClose, agents }) => {
  const dispatch = useDispatch();
  const { filters } = useSelector((state) => state.tickets);

  const [formData, setFormData] = useState({
    subject: '',
    customerName: '',
    customerEmail: '',
    description: '',
    priority: 'Medium',
    status: 'Open',
    assignedTo: ''
  });

  const [createdInfo, setCreatedInfo] = useState(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.customerName.trim() || !formData.customerEmail.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (!payload.assignedTo) delete payload.assignedTo;

      const resultAction = await dispatch(createTicket(payload));
      if (createTicket.fulfilled.match(resultAction)) {
        toast.success('Ticket created successfully!');
        setCreatedInfo(resultAction.payload);
        // Refresh ticket list and dashboard stats
        dispatch(fetchTickets(filters));
        dispatch(fetchDashboardStats());
      } else {
        toast.error(resultAction.payload || 'Failed to create ticket');
      }
    } catch {
      toast.error('Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyToken = () => {
    if (!createdInfo) return;
    navigator.clipboard.writeText(createdInfo.accessToken);
    setCopied(true);
    toast.success('Tracking token copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setCreatedInfo(null);
    setFormData({
      subject: '',
      customerName: '',
      customerEmail: '',
      description: '',
      priority: 'Medium',
      status: 'Open',
      assignedTo: ''
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={createdInfo ? "Ticket Created" : "Create New Support Ticket"}>
      {createdInfo ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
            <p className="font-semibold text-base mb-1">Ticket Reference: {createdInfo.data.reference}</p>
            <p className="text-xs text-emerald-700">
              The ticket was registered and an audit event logged. Give the customer their tracking token below so they can view public updates securely.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Customer Secure Access Token
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={createdInfo.accessToken}
                className="w-full bg-white px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg select-all"
              />
              <button
                onClick={handleCopyToken}
                className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors flex items-center justify-center shrink-0"
                title="Copy token"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="e.g. Inability to export analytics CSV"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                placeholder="Jane Doe"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                placeholder="jane@example.com"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide a detailed description of the customer issue..."
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Agent</label>
              <select
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Leave Unassigned</option>
                {agents &&
                  agents.map((agent) => (
                    <option key={agent._id} value={agent._id}>
                      {agent.name} ({agent.role})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default CreateTicketModal;

