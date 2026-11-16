import { useState, useEffect } from 'react';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Briefcase,
  Calendar,
  IndianRupee,
  MapPin,
  Search,
  CheckCircle,
  AlertCircle,
  Building2,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export default function EligibleDrives() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [applyingId, setApplyingId] = useState(null);
  const [triggerError, setTriggerError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students/eligible-drives');
      setDrives(res.data);
    } catch (err) {
      console.error('Failed to fetch eligible drives:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (driveId) => {
    setTriggerError(null);
    setSuccessMsg(null);
    setApplyingId(driveId);

    try {
      await api.post('/applications', { drive_id: driveId });
      setSuccessMsg(`Application submitted successfully!`);
      // Refresh drives to update application status
      fetchDrives();
    } catch (err) {
      console.error('Application failed:', err);
      // Cleanly catch PostgreSQL trigger rejection
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Application rejected by eligibility guard.';
      setTriggerError(errorMsg);
    } finally {
      setApplyingId(null);
    }
  };

  const filteredDrives = drives.filter(
    (d) =>
      d.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner message="Checking placement eligibility against drives..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eligible Placement Drives</h1>
          <p className="text-gray-500 text-sm mt-1">
            Drives matching your academic criteria (filtered in PostgreSQL).
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search company or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-9 py-2 text-sm"
          />
        </div>
      </div>

      {/* SQL Trigger Error Banner */}
      {triggerError && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-start gap-3 shadow-sm animate-pulse">
          <ShieldAlert className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-red-900 uppercase tracking-wide">
              Eligibility Guard Rejection (Database Trigger Exception)
            </h3>
            <p className="text-sm text-red-700 mt-0.5">{triggerError}</p>
          </div>
          <button
            onClick={() => setTriggerError(null)}
            className="text-red-400 hover:text-red-700 text-sm font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Success Banner */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-800">
          <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600" />
          <span className="text-sm font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Drives Grid */}
      {filteredDrives.length === 0 ? (
        <div className="card text-center py-12">
          <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800">No Eligible Drives Found</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            Either all deadlines have passed or your department/CGPA criteria do not currently match active drives. Check your profile to ensure your academic details are up-to-date.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrives.map((drive) => {
            const isApplied = drive.has_applied;
            const deadlineDate = new Date(drive.deadline);
            const isExpired = new Date() > deadlineDate;

            return (
              <div
                key={drive.id}
                className="card flex flex-col justify-between hover:shadow-xl transition-all duration-200 border-t-4 border-t-indigo-600"
              >
                <div>
                  {/* Top info */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-lg">
                        {drive.company_name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 leading-tight">
                          {drive.company_name}
                        </h3>
                        <p className="text-xs text-gray-400">{drive.industry || 'Technology'}</p>
                      </div>
                    </div>

                    {isApplied && (
                      <StatusBadge status={drive.user_application_status || 'APPLIED'} />
                    )}
                  </div>

                  <h4 className="text-lg font-semibold text-gray-800 mb-2">{drive.title}</h4>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {drive.description || 'Exciting career opportunity for eligible graduating engineers.'}
                  </p>

                  {/* Highlights */}
                  <div className="space-y-2 text-xs text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
                        Package (CTC):
                      </span>
                      <span className="font-bold text-emerald-700 text-sm">
                        {drive.ctc_lpa} LPA
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                        Deadline:
                      </span>
                      <span className="font-medium text-gray-800">
                        {deadlineDate.toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <MapPin className="h-3.5 w-3.5 text-red-500" />
                        Location:
                      </span>
                      <span className="font-medium text-gray-800">
                        {drive.location || 'On-Campus'}
                      </span>
                    </div>
                  </div>

                  {/* Allowed Departments */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 mb-1.5">
                      Eligible Branches:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {drive.allowed_departments?.map((dept, i) => (
                        <span
                          key={i}
                          className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium"
                        >
                          {dept}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="pt-4 border-t border-gray-100">
                  {isApplied ? (
                    <button
                      disabled
                      className="w-full py-2.5 px-4 rounded-lg bg-gray-100 text-gray-500 text-sm font-semibold cursor-not-allowed"
                    >
                      Already Applied
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApply(drive.id)}
                      disabled={applyingId === drive.id || isExpired}
                      className="w-full btn-primary py-2.5 text-sm flex items-center justify-center gap-2"
                    >
                      {applyingId === drive.id ? (
                        'Validating eligibility...'
                      ) : isExpired ? (
                        'Application Closed'
                      ) : (
                        'Apply Now'
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
