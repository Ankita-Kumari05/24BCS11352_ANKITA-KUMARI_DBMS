import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Building2,
  Briefcase,
  Users,
  Award,
  PlusCircle,
  ArrowRight,
  Calendar,
  CheckCircle,
} from 'lucide-react';

export default function CompanyDashboard() {
  const { user } = useAuth();
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/drives/company/my-drives');
      setDrives(res.data);
    } catch (err) {
      console.error('Failed to load company drives:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading company dashboard..." />;

  const totalApplicants = drives.reduce(
    (sum, d) => sum + (parseInt(d.applicant_count, 10) || 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="bg-blue-500/40 text-blue-100 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              Corporate Recruitment Portal
            </span>
            <h1 className="text-3xl font-bold mt-2">
              Welcome, {user?.full_name || 'Partner Company'}!
            </h1>
            <p className="text-blue-100 mt-1">
              Manage on-campus placement drives and applicant evaluation workflows.
            </p>
          </div>
          <Link
            to="/company/post-drive"
            className="bg-white text-indigo-700 hover:bg-blue-50 font-semibold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 text-sm self-start md:self-auto"
          >
            <PlusCircle className="h-4 w-4" />
            Create Placement Drive
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active Drives</p>
            <p className="text-2xl font-bold text-gray-900">{drives.length}</p>
            <p className="text-xs text-gray-400">Total campus postings</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Applicants</p>
            <p className="text-2xl font-bold text-gray-900">{totalApplicants}</p>
            <p className="text-xs text-gray-400">Student submissions</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Hiring Pipeline</p>
            <p className="text-2xl font-bold text-emerald-600">Multi-Round</p>
            <p className="text-xs text-gray-400">Audited PL/pgSQL updates</p>
          </div>
        </div>
      </div>

      {/* My Drives Section */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Your Placement Drives</h2>
          <Link
            to="/company/my-drives"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
          >
            Manage all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {drives.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Briefcase className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>You haven't posted any placement drives yet.</p>
            <Link to="/company/post-drive" className="btn-primary inline-block mt-4 text-sm">
              Create Your First Drive
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Drive Title</th>
                  <th className="py-3 px-4 font-semibold">Package (CTC)</th>
                  <th className="py-3 px-4 font-semibold">Deadline</th>
                  <th className="py-3 px-4 font-semibold">Applicants</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {drives.slice(0, 5).map((drive) => (
                  <tr key={drive.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-medium text-gray-900">{drive.title}</td>
                    <td className="py-3 px-4 font-semibold text-indigo-600">{drive.ctc_lpa} LPA</td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(drive.deadline).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800">
                      {drive.applicant_count || 0}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/company/applicants/${drive.id}`}
                        className="btn-secondary py-1 px-3 text-xs"
                      >
                        Review Applicants
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
