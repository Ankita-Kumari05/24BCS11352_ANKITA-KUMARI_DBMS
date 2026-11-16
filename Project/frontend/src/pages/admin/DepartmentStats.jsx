import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  BarChart3,
  ArrowLeft,
  GraduationCap,
  TrendingUp,
  IndianRupee,
  Database,
  Sparkles,
} from 'lucide-react';

export default function DepartmentStats() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/department-stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load department statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Querying PostgreSQL View department_placement_stats..." />;

  const overallTotalStudents = stats.reduce(
    (sum, s) => sum + parseInt(s.total_students, 10),
    0
  );
  const overallPlacedStudents = stats.reduce(
    (sum, s) => sum + parseInt(s.placed_count, 10),
    0
  );
  const overallPlacementRate =
    overallTotalStudents > 0
      ? Math.round((overallPlacedStudents / overallTotalStudents) * 100 * 10) / 10
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Overview
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Department Placement Statistics
            </h1>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
              <Database className="h-4 w-4 text-indigo-600" />
              Source: PostgreSQL View{' '}
              <code className="text-xs bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono font-bold">
                department_placement_stats
              </code>
            </p>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-xl text-xs font-semibold text-indigo-800">
            Overall Placement Rate: {overallPlacementRate}%
          </div>
        </div>
      </div>

      {/* Analytics Table */}
      <div className="card overflow-hidden p-0 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
              <tr>
                <th className="py-4 px-6 font-bold">Department / Branch</th>
                <th className="py-4 px-6 font-bold">Total Students</th>
                <th className="py-4 px-6 font-bold">Placed</th>
                <th className="py-4 px-6 font-bold min-w-[200px]">Placement Rate</th>
                <th className="py-4 px-6 font-bold text-right">Avg CTC (LPA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500">
                    <GraduationCap className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700">No Student Records Found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      As students register and enroll into departments, statistical metrics will automatically appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                stats.map((row) => {
                const pct = parseFloat(row.placement_pct) || 0;
                const avgCtc = row.avg_ctc_lpa != null ? `${row.avg_ctc_lpa} LPA` : '—';

                // Color based on performance
                const barColor =
                  pct >= 70
                    ? 'bg-emerald-500'
                    : pct >= 40
                    ? 'bg-amber-500'
                    : 'bg-indigo-500';

                return (
                  <tr key={row.department} className="hover:bg-gray-50/60">
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-900 flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                        {row.department}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-800">
                      {row.total_students}
                    </td>
                    <td className="py-4 px-6 font-bold text-emerald-600">
                      {row.placed_count}
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-gray-600">
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${barColor} transition-all duration-500 rounded-full`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-indigo-700">
                      {avgCtc}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SQL View Architecture Explainer Card */}
      <div className="card bg-gray-50/80 border-dashed border-gray-300">
        <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
          <Database className="h-4 w-4 text-indigo-600" />
          ADMB Concept: Dynamic Database Views
        </h3>
        <p className="text-xs text-gray-600 leading-relaxed font-mono">
          CREATE OR REPLACE VIEW department_placement_stats AS SELECT s.department, COUNT(DISTINCT s.id) AS total_students,
          COUNT(DISTINCT s.id) FILTER (WHERE s.is_placed = TRUE) AS placed_count,
          ROUND(COUNT(DISTINCT s.id) FILTER (WHERE s.is_placed = TRUE) * 100.0 / NULLIF(COUNT(DISTINCT s.id), 0), 2) AS placement_pct,
          ROUND(AVG(pd.ctc_lpa) FILTER (WHERE a.current_status = 'OFFERED'), 2) AS avg_ctc_lpa FROM students s LEFT JOIN applications a ...
        </p>
      </div>
    </div>
  );
}
