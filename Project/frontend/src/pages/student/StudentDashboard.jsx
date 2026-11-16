import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  BookOpen,
  Award,
  FileText,
  Briefcase,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [profileRes, appsRes, drivesRes] = await Promise.all([
        api.get('/students/profile'),
        api.get('/students/my-applications'),
        api.get('/students/eligible-drives'),
      ]);

      setProfile(profileRes.data);
      setApplications(appsRes.data);
      setEligibleCount(drivesRes.data.length);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Could not load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your dashboard..." />;

  const offersCount = applications.filter(
    (a) => a.current_status === 'OFFERED' || a.status === 'OFFERED'
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-500/40 text-indigo-100 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                Student Portal
              </span>
              {profile?.is_placed && (
                <span className="bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Placed
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold">
              Welcome, {profile?.full_name || user?.full_name}!
            </h1>
            <p className="text-indigo-100 mt-1">
              Department of {profile?.department || 'Engineering'} • CGPA: {profile?.cgpa || '0.00'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/student/drives"
              className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 text-sm"
            >
              <Briefcase className="h-4 w-4" />
              Browse Drives ({eligibleCount})
            </Link>
            <Link
              to="/student/profile"
              className="bg-indigo-500/30 hover:bg-indigo-500/50 text-white font-semibold px-5 py-2.5 rounded-xl border border-white/20 transition-all flex items-center gap-2 text-sm"
            >
              Update Profile
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Academic CGPA</p>
            <p className="text-2xl font-bold text-gray-900">{profile?.cgpa || '0.00'}</p>
            <p className="text-xs text-gray-400">{profile?.active_backlogs || 0} active backlog(s)</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Applications</p>
            <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
            <p className="text-xs text-gray-400">Total submitted</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Job Offers</p>
            <p className="text-2xl font-bold text-emerald-600">{offersCount}</p>
            <p className="text-xs text-gray-400">{profile?.is_placed ? 'Offer Accepted' : 'In Selection'}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Eligible Drives</p>
            <p className="text-2xl font-bold text-purple-600">{eligibleCount}</p>
            <p className="text-xs text-gray-400">Matching criteria</p>
          </div>
        </div>
      </div>

      {/* Skills & Recent Applications Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Skills & Info */}
        <div className="card space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            Verified Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile?.skills && profile.skills.length > 0 ? (
              profile.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-semibold"
                >
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-sm text-gray-400">No skills added yet.</p>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Department:</span>
              <span className="font-semibold text-gray-800">{profile?.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Registered Email:</span>
              <span className="font-semibold text-gray-800">{profile?.email}</span>
            </div>
          </div>
        </div>

        {/* Right: Recent Applications */}
        <div className="card lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Recent Applications</h2>
            <Link
              to="/student/applications"
              className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Briefcase className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>You have not applied to any drives yet.</p>
              <Link to="/student/drives" className="btn-primary inline-block mt-4 text-sm">
                Explore Available Drives
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Company</th>
                    <th className="py-3 px-4 font-semibold">Drive Title</th>
                    <th className="py-3 px-4 font-semibold">Package</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Applied</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {applications.slice(0, 5).map((app) => (
                    <tr key={app.id || app.application_id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-medium text-gray-900">{app.company_name}</td>
                      <td className="py-3 px-4 text-gray-700">{app.title}</td>
                      <td className="py-3 px-4 font-semibold text-indigo-600">{app.ctc_lpa} LPA</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={app.current_status || app.status} />
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {new Date(app.applied_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
