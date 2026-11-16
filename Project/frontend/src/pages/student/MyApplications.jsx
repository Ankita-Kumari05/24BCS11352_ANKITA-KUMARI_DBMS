import { useState, useEffect } from 'react';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  FileText,
  Building2,
  Calendar,
  IndianRupee,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';

const STAGES = ['APPLIED', 'SHORTLISTED', 'ROUND_1', 'ROUND_2', 'OFFERED'];

function ApplicationTimeline({ currentStatus }) {
  if (currentStatus === 'REJECTED') {
    return (
      <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
        <XCircle className="h-4 w-4" />
        Application not selected
      </div>
    );
  }

  const currentIndex = STAGES.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {STAGES.map((stage, idx) => {
        const isPassed = idx <= currentIndex;
        const isCurrent = idx === currentIndex;

        return (
          <div key={stage} className="flex items-center">
            <div
              className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full transition-all ${
                isCurrent
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                  : isPassed
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {isPassed ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              <span className="hidden md:inline">
                {stage.replace('_', ' ')}
              </span>
            </div>
            {idx < STAGES.length - 1 && (
              <div
                className={`h-0.5 w-2 sm:w-4 ${
                  idx < currentIndex ? 'bg-emerald-400' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students/my-applications');
      setApplications(res.data);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your applications..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
        <p className="text-gray-500 text-sm mt-1">
          Track the live recruitment round status for each placement drive you applied to.
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800">No Applications Submitted</h3>
          <p className="text-sm text-gray-500 mt-1">
            Check the Eligible Drives tab to apply for open campus drives.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const status = app.current_status || app.status;

            return (
              <div
                key={app.id || app.application_id}
                className="card hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Drive & Company details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-indigo-50 text-indigo-700 rounded-lg flex items-center justify-center font-bold">
                        {app.company_name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{app.title}</h3>
                        <p className="text-xs text-gray-500">{app.company_name}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                      <span className="flex items-center gap-1 font-semibold text-emerald-700">
                        <IndianRupee className="h-3.5 w-3.5" />
                        {app.ctc_lpa} LPA
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        Applied: {new Date(app.applied_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {app.location || 'On-Campus'}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Status & Timeline */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <ApplicationTimeline currentStatus={status} />
                    <StatusBadge status={status} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
