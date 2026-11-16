import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Users,
  Building2,
  Briefcase,
  Award,
  TrendingUp,
  ScrollText,
  BarChart3,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  Crown,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = user?.email === 'admin@gmail.com';

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/overview');
      setMetrics(res.data);
    } catch (err) {
      console.error('Failed to load admin overview:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Calculating institutional placement metrics..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-indigo-900 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-purple-500/40 text-purple-100 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                Training & Placement Office (TPO)
              </span>
              {isSuperAdmin && (
                <span className="bg-amber-400 text-amber-950 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Crown className="h-3.5 w-3.5" /> Super Admin
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold">Placement Analytics & Control</h1>
            <p className="text-purple-100 mt-1">
              Advanced DBMS monitoring view aggregating institutional performance and security audit trails.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin/stats"
              className="bg-white text-indigo-800 hover:bg-purple-50 font-semibold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 text-sm"
            >
              <BarChart3 className="h-4 w-4" />
              Department Stats
            </Link>
            <Link
              to="/admin/audit"
              className="bg-purple-500/30 hover:bg-purple-500/50 text-white font-semibold px-5 py-2.5 rounded-xl border border-white/20 transition-all flex items-center gap-2 text-sm"
            >
              <ScrollText className="h-4 w-4" />
              Audit Trail
            </Link>
            {isSuperAdmin && (
              <Link
                to="/admin/manage-admins"
                className="bg-amber-400 text-amber-950 hover:bg-amber-300 font-bold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 text-sm"
              >
                <UserPlus className="h-4 w-4" />
                Manage Admins
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Enrolled Students</p>
            <p className="text-2xl font-bold text-gray-900">{metrics?.total_students || 0}</p>
            <p className="text-xs text-gray-400">Across all engineering depts</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Students Placed</p>
            <p className="text-2xl font-bold text-emerald-600">{metrics?.placed_students || 0}</p>
            <p className="text-xs text-emerald-600 font-semibold">
              {metrics?.placement_rate || 0}% Placement Rate
            </p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Partner Companies</p>
            <p className="text-2xl font-bold text-gray-900">{metrics?.total_companies || 0}</p>
            <p className="text-xs text-gray-400">{metrics?.total_drives || 0} active drives posted</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Job Offers Granted</p>
            <p className="text-2xl font-bold text-purple-600">{metrics?.total_offers || 0}</p>
            <p className="text-xs text-gray-400">From {metrics?.total_applications || 0} total applications</p>
          </div>
        </div>
      </div>

      {/* Database Highlights Cards */}
      <div className={`grid grid-cols-1 ${isSuperAdmin ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
        <Link
          to="/admin/stats"
          className="card hover:shadow-xl transition-all border-l-4 border-l-indigo-600 group"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl w-fit">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                Department Stats View
              </h3>
              <p className="text-sm text-gray-600">
                Live aggregated analytics calculated directly by PostgreSQL view{' '}
                <code className="text-xs bg-gray-100 px-1 py-0.5 rounded font-mono text-indigo-700">
                  department_placement_stats
                </code>
                . Inspect per-branch placement percentages and average packages.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link
          to="/admin/audit"
          className="card hover:shadow-xl transition-all border-l-4 border-l-purple-600 group"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl w-fit">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                Immutable Status Audit Trail
              </h3>
              <p className="text-sm text-gray-600">
                Audited event records populated automatically by PL/pgSQL trigger{' '}
                <code className="text-xs bg-gray-100 px-1 py-0.5 rounded font-mono text-purple-700">
                  trg_log_status_change
                </code>
                . Tracks state transitions from APPLIED to OFFERED.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        {isSuperAdmin && (
          <Link
            to="/admin/manage-admins"
            className="card hover:shadow-xl transition-all border-l-4 border-l-amber-500 group"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl w-fit">
                  <UserPlus className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                  Administrator Management
                </h3>
                <p className="text-sm text-gray-600">
                  Exclusive to <span className="font-semibold text-gray-800">admin@gmail.com</span>: Create, provision, and manage access for additional TPO administrator accounts.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
