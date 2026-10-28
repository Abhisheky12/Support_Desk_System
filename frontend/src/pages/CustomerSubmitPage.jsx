import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Send, CheckCircle2, Copy, Check, ArrowRight, LifeBuoy, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export const CustomerSubmitPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    subject: '',
    customerName: '',
    customerEmail: '',
    description: '',
    priority: 'Medium'
  });

  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [copied, setCopied] = useState(false);

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
      const response = await api.post('/public/tickets', formData);
      setSubmissionResult(response.data.data);
      toast.success('Your support ticket has been registered!');
    } catch (err) {
      toast.error(err.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyToken = () => {
    if (!submissionResult) return;
    navigator.clipboard.writeText(submissionResult.accessToken);
    setCopied(true);
    toast.success('Access token copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 mb-3">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Support Portal</h1>
          <p className="text-xs text-slate-500 mt-1">
            Submit your issue to our support engineering team. You will receive a unique tracking reference.
          </p>
        </div>

        {submissionResult ? (
          /* Success Screen */
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Ticket Submitted Successfully!</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Our support team has received your request and is actively investigating. Save your credentials below to securely track status and replies.
              </p>
            </div>

            {/* Ticket Credentials Card */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Ticket Reference
                </span>
                <span className="font-mono text-lg font-bold text-blue-600">
                  {submissionResult.reference}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Private Access Tracking Key
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={submissionResult.accessToken}
                    className="w-full bg-white px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg select-all"
                  />
                  <button
                    onClick={handleCopyToken}
                    className="p-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors flex items-center justify-center shrink-0"
                    title="Copy token"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Keep this access key safe. It is required to view replies and track your ticket securely.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() =>
                  navigate(
                    `/customer/track?reference=${submissionResult.reference}&token=${submissionResult.accessToken}`
                  )
                }
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <span>Track Ticket Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setSubmissionResult(null);
                  setFormData({
                    subject: '',
                    customerName: '',
                    customerEmail: '',
                    description: '',
                    priority: 'Medium'
                  });
                }}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Submit Another Issue
              </button>
            </div>
          </div>
        ) : (
          /* Ticket Submission Form */
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Issue Summary / Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="e.g. Cannot access customer billing dashboard"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="e.g. Michael Scott"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleChange}
                    placeholder="michael@dundermifflin.com"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detailed Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="description"
                  rows={5}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe what occurred, steps to reproduce, or any error messages..."
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Perceived Severity / Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="Low">Low - General inquiry or cosmetic question</option>
                  <option value="Medium">Medium - Normal operational request</option>
                  <option value="High">High - Impaired functionality impacting work</option>
                  <option value="Urgent">Urgent - Complete outage or revenue block</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Submitting ticket...' : 'Submit Support Ticket'}</span>
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Already submitted a ticket?</span>
              <Link
                to="/customer/track"
                className="font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <Search className="w-3.5 h-3.5" />
                Track Ticket Status
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerSubmitPage;

