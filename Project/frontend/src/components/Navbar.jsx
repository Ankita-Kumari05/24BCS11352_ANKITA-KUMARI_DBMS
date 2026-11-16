import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  User,
  Briefcase,
  FileText,
  PlusCircle,
  List,
  BarChart3,
  ScrollText,
  ShieldCheck,
} from 'lucide-react';

const navLinks = {
  STUDENT: [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/profile', label: 'Profile', icon: User },
    { to: '/student/drives', label: 'Drives', icon: Briefcase },
    { to: '/student/applications', label: 'Applications', icon: FileText },
  ],
  COMPANY: [
    { to: '/company/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/company/post-drive', label: 'Post Drive', icon: PlusCircle },
    { to: '/company/my-drives', label: 'My Drives', icon: List },
  ],
  TPO_ADMIN: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/stats', label: 'Dept Stats', icon: BarChart3 },
    { to: '/admin/audit', label: 'Audit Log', icon: ScrollText },
  ],
};

const roleBadgeColors = {
  STUDENT: 'bg-emerald-100 text-emerald-800',
  COMPANY: 'bg-blue-100 text-blue-800',
  TPO_ADMIN: 'bg-purple-100 text-purple-800',
};

const roleDisplayName = {
  STUDENT: 'Student',
  COMPANY: 'Company',
  TPO_ADMIN: 'Admin',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const links = [...(navLinks[user.role] || [])];
  if (user.role === 'TPO_ADMIN' && user.email === 'admin@gmail.com') {
    links.push({ to: '/admin/manage-admins', label: 'Manage Admins', icon: ShieldCheck });
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-indigo-700 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl">
            <GraduationCap className="h-7 w-7" />
            <span>PlaceMe</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(link.to)
                      ? 'bg-indigo-800 text-white'
                      : 'text-indigo-100 hover:bg-indigo-600 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* User Info & Logout */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                {(user.full_name || user.company_name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="text-sm">
                <p className="text-white font-medium leading-tight">
                  {user.full_name || user.company_name || 'User'}
                </p>
                <span
                  className={`inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    roleBadgeColors[user.role]
                  }`}
                >
                  {roleDisplayName[user.role]}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 p-2 rounded-lg text-indigo-200 hover:bg-indigo-600 hover:text-white transition-all duration-200"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-indigo-200 hover:bg-indigo-600 hover:text-white transition-all"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-indigo-600 bg-indigo-700">
          <div className="px-4 py-3 space-y-1">
            {/* User Info */}
            <div className="flex items-center gap-3 pb-3 border-b border-indigo-600 mb-2">
              <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold">
                {(user.full_name || user.company_name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white font-medium">
                  {user.full_name || user.company_name || 'User'}
                </p>
                <span
                  className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    roleBadgeColors[user.role]
                  }`}
                >
                  {roleDisplayName[user.role]}
                </span>
              </div>
            </div>

            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive(link.to)
                      ? 'bg-indigo-800 text-white'
                      : 'text-indigo-100 hover:bg-indigo-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-200 hover:bg-red-600 hover:text-white transition-all mt-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
