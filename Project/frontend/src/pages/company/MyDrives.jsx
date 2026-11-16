import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Briefcase,
  Calendar,
  IndianRupee,
  Users,
  PlusCircle,
  Eye,
  CheckCircle,
  Clock,
} from 'lucide-react';

export default function MyDrives() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const res = await api.get('/drives/company/my-drives');
      setDrives(res.data);
    } catch (err) {
      console.error('Failed to load drives:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your placement drives..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Placement Drives</h1>
          <p className="text-gray-500 text-sm mt-1">
            Review drive metrics, eligibility criteria, and candidate applications.
          </p>
        </div>
        <Link
          to="/company/post-drive"
          className="btn-primary flex items-center gap-2 self-start sm:self-auto text-sm"
        >
          <PlusCircle className="h-4 w-4" />
          Post New Drive
        </Link>
      </div>

      {drives.length === 0 ? (
        <div className="card text-center py-12">
          <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800">No Drives Posted Yet</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            Get started by posting an on-campus recruitment drive with your company's hiring requirements.
          </p>
          <Link to="/company/post-drive" className="btn-primary inline-block mt-4 text-sm">
            Post Drive Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drives.map((drive) => {
            const deadline = new Date(drive.deadline);
            const isClosed = new Date() > deadline;

            return (
              <div
                key={drive.id}
                className="card flex flex-col justify-between hover:shadow-xl transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        isClosed
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isClosed ? 'Closed' : 'Active'}
                    </span>
                    <span className="text-xs text-gray-400">ID #{drive.id}</span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2">{drive.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {drive.description || 'No description provided.'}
                  </p>

                  <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-xs text-gray-600 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Package (CTC):</span>
                      <span className="font-bold text-emerald-700 text-sm">
                        {drive.ctc_lpa} LPA
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Criteria:</span>
                      <span className="font-semibold text-gray-800">
                        Min CGPA {drive.min_cgpa} • Max {drive.max_backlogs} Backlogs
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Deadline:</span>
                      <span className="font-medium text-gray-800">
                        {deadline.toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Total Applicants:</span>
                      <span className="font-bold text-indigo-700 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {drive.applicant_count || 0}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-500 font-medium mb-1">Eligible Branches:</p>
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

                <div className="pt-4 border-t border-gray-100">
                  <Link
                    to={`/company/applicants/${drive.id}`}
                    className="btn-primary w-full text-center flex items-center justify-center gap-2 text-sm"
                  >
                    <Users className="h-4 w-4" />
                    Manage Applicants ({drive.applicant_count || 0})
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
