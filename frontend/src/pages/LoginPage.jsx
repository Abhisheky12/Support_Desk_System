import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, clearAuthError } from '../store/slices/authSlice';
import { LifeBuoy, ArrowRight, Shield, User, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
      toast.success(`Welcome back, ${result.payload.user.name}!`);
      navigate('/dashboard');
    }
  };

  const fillDemo = (demoEmail, demoPass) => {
    dispatch(clearAuthError());
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">
            Support<span className="text-blue-600">Desk</span>
          </span>
        </div>
        <h2 className="text-center text-xl font-bold tracking-tight text-slate-900">
          Staff Portal Sign In
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Sign in to manage support tickets, assignments, and service performance
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@supportdesk.com"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Signing in...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Demo Logins */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              Quick 1-Click Demo Accounts
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin@supportdesk.com', 'admin123')}
                className="p-2.5 bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200 rounded-xl text-left text-xs transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="font-semibold text-purple-900">Demo Admin (Sarah Connor)</p>
                    <p className="text-[10px] text-purple-700">admin@supportdesk.com &bull; admin123</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-purple-600 bg-white px-2 py-0.5 rounded-full border border-purple-200">
                  Full Access
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('agent1@supportdesk.com', 'agent123')}
                className="p-2.5 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 rounded-xl text-left text-xs transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-900">Demo Agent 1 (Alex Rivera)</p>
                    <p className="text-[10px] text-blue-700">agent1@supportdesk.com &bull; agent123</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-blue-600 bg-white px-2 py-0.5 rounded-full border border-blue-200">
                  Agent
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('agent2@supportdesk.com', 'agent123')}
                className="p-2.5 bg-slate-100/70 hover:bg-slate-200/70 border border-slate-200 rounded-xl text-left text-xs transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-600" />
                  <div>
                    <p className="font-semibold text-slate-900">Demo Agent 2 (Morgan Chen)</p>
                    <p className="text-[10px] text-slate-600">agent2@supportdesk.com &bull; agent123</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  Agent
                </span>
              </button>
            </div>
          </div>

          {/* Customer Portal Link */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Are you a customer needing assistance?{' '}
              <Link to="/customer/submit" className="font-semibold text-blue-600 hover:underline">
                Submit a ticket
              </Link>{' '}
              or{' '}
              <Link to="/customer/track" className="font-semibold text-blue-600 hover:underline">
                Track status
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

