import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Users,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Filter,
  Sparkles,
  Award,
  History,
} from 'lucide-react';

const STATUS_OPTIONS = [
  'APPLIED',
  'SHORTLISTED',
  'ROUND_1',
  'ROUND_2',
  'OFFERED',
  'REJECTED',
];

export default function ManageApplicants() {
  const { driveId } = useParams();
  const [drive, setDrive] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    fetchDriveAndApplicants();
  }, [driveId]);

  const fetchDriveAndApplicants = async () => {
    try {
      setLoading(true);
      const [driveRes, appsRes] = await Promise.all([
        api.get(`/drives/${driveId}`),
        api.get(`/drives/${driveId}/applicants`),
      ]);
      setDrive(driveRes.data);
      setApplicants(appsRes.data);
    } catch (err) {
      console.error('Failed to load drive applicants:', err);
      setMessage({ type: 'error', text: 'Failed to load applicants for this drive.' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      setUpdatingId(appId);
      setMessage({ type: '', text: '' });

      const res = await api.put(`/applications/${appId}/status`, { status: newStatus });

      // Update state locally
      setApplicants((prev) =>
        prev.map((app) =>
          (app.id === appId || app.application_id === appId)
            ? { ...app, current_status: res.data.current_status, status: res.data.current_status }
            : app
        )
      );

      setMessage({
        type: 'success',
        text: `Applicant status updated to ${newStatus}. Logged to PostgreSQL audit table.`,
      });
    } catch (err) {
      console.error('Status update failed:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to update application status.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredApplicants =
    filterStatus === 'ALL'
      ? applicants
      : applicants.filter((a) => (a.current_status || a.status) === filterStatus);

  if (loading) return <LoadingSpinner message="Fetching candidate submissions..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumb & Title */}
      <div>
        <Link
          to="/company/my-drives"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Drives
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Applicants: {drive?.title || 'Placement Drive'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {drive?.company_name} • CTC: {drive?.ctc_lpa} LPA • {applicants.length} Total Registered
            </p>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field py-1.5 text-sm w-44"
            >
              <option value="ALL">All Statuses ({applicants.length})</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Alert message */}
      {message.text && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <span className="text-sm font-semibold">{message.text}</span>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {filteredApplicants.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-gray-800">No Applicants Found</h3>
            <p className="text-xs text-gray-500 mt-1">
              No candidates currently match this filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Candidate</th>
                  <th className="py-3.5 px-4 font-semibold">Branch</th>
                  <th className="py-3.5 px-4 font-semibold">CGPA</th>
                  <th className="py-3.5 px-4 font-semibold">Backlogs</th>
                  <th className="py-3.5 px-4 font-semibold">Skills</th>
                  <th className="py-3.5 px-4 font-semibold">Current Round</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Advance Round</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApplicants.map((app) => {
                  const appId = app.id || app.application_id;
                  const currentSt = app.current_status || app.status;

                  return (
                    <tr key={appId} className="hover:bg-gray-50/50">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{app.full_name}</div>
                        <div className="text-xs text-gray-400">{app.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded">
                          {app.department}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-800">{app.cgpa}</td>
                      <td className="py-3.5 px-4 text-gray-600">{app.active_backlogs || 0}</td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {app.skills?.slice(0, 3).map((sk, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium"
                            >
                              {sk}
                            </span>
                          ))}
                          {app.skills?.length > 3 && (
                            <span className="text-[10px] text-gray-400">
                              +{app.skills.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={currentSt} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <select
                          value={currentSt}
                          disabled={updatingId === appId}
                          onChange={(e) => handleStatusChange(appId, e.target.value)}
                          className="input-field py-1 px-2.5 text-xs font-semibold w-36 bg-white border-gray-300 cursor-pointer"
                        >
                          {STATUS_OPTIONS.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
