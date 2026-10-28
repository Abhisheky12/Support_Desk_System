import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { logoutUser } from '../../store/slices/authSlice';
import { LifeBuoy, LogOut, User, ExternalLink, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Signed out successfully');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to={isAuthenticated ? '/dashboard' : '/login'} className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 tracking-tight">Support<span className="text-blue-600">Desk</span></span>
                <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 uppercase tracking-wider border border-blue-100">
                  Operations
                </span>
              </div>
            </Link>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Quick customer portal jump */}
            <div className="hidden md:flex items-center gap-2 border-r border-slate-200 pr-3 mr-1">
              <Link
                to="/customer/submit"
                className="text-xs font-medium text-slate-600 hover:text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1"
              >
                Customer Submit
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </Link>
              <Link
                to="/customer/track"
                className="text-xs font-medium text-slate-600 hover:text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1"
              >
                Track Ticket
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </Link>
            </div>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 pl-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-slate-900 leading-tight">{user.name}</p>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider ${
                      user.role === 'admin' ? 'text-purple-600 font-semibold' : 'text-slate-500'
                    }`}>
                      {user.role === 'admin' && <Shield className="w-2.5 h-2.5" />}
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                Staff Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

