import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAgents, createAgent, updateAgent } from '../store/slices/agentSlice';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Users, Plus, Shield, Check, X, UserPlus, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const AgentManagementPage = () => {
  const dispatch = useDispatch();
  const { agents, loading, submitting } = useSelector((state) => state.agents);
  const { user } = useSelector((state) => state.auth);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'agent'
  });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      dispatch(fetchAgents());
    }
  }, [dispatch, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <Shield className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          Agent management is only accessible to administrator accounts.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast.error('All fields are required');
      return;
    }

    const res = await dispatch(createAgent(formData));
    if (createAgent.fulfilled.match(res)) {
      toast.success('Agent created successfully');
      setIsAddOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'agent' });
      dispatch(fetchAgents());
    } else {
      toast.error(res.payload || 'Failed to create agent');
    }
  };

  const handleToggleActive = async (agent) => {
    if (agent._id === user._id) {
      toast.error('You cannot deactivate your own admin account');
      return;
    }

    const newActiveState = !agent.isActive;
    const res = await dispatch(updateAgent({ id: agent._id, updates: { isActive: newActiveState } }));
    if (updateAgent.fulfilled.match(res)) {
      toast.success(`Agent ${agent.name} ${newActiveState ? 'activated' : 'deactivated'}`);
      dispatch(fetchAgents());
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Agent Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, monitor workloads, and manage support staff access
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-sm shadow-blue-500/20 flex items-center justify-center gap-1.5 text-xs font-semibold"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Agent</span>
        </button>
      </div>

      {loading && agents.length === 0 ? (
        <LoadingSpinner text="Loading support team..." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Agent Name</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5 text-center">Active Load</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agents.map((agent) => (
                  <tr key={agent._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                        {agent.name?.charAt(0)}
                      </div>
                      <div>
                        <span>{agent.name}</span>
                        {agent._id === user._id && (
                          <span className="ml-2 text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-xs font-mono text-slate-600">
                      {agent.email}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          agent.role === 'admin'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {agent.role === 'admin' && <Shield className="w-3 h-3" />}
                        {agent.role}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {agent.activeTickets || 0} active
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                          agent.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {agent.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      {agent._id !== user._id && (
                        <button
                          onClick={() => handleToggleActive(agent)}
                          className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                            agent.isActive
                              ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                              : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                          }`}
                        >
                          {agent.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Agent Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create New Support Agent"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. John Miller"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="agent@supportdesk.com"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Initial Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="At least 6 characters"
              required
              minLength={6}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="agent">Support Agent</option>
              <option value="admin">Administrator (Full Access)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'Creating...' : 'Create Agent'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AgentManagementPage;
