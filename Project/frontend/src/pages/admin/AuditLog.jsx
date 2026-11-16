import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  ScrollText,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
  History,
  Clock,
  User,
} from 'lucide-react';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appIdFilter, setAppIdFilter] = useState('');

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async (appId = '') => {
    try {
      setLoading(true);
      const url = appId ? `/analytics/audit-log?application_id=${appId}` : '/analytics/audit-log';
      const res = await api.get(url);
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchAuditLogs(appIdFilter);
  };

  const handleClear = () => {
    setAppIdFilter('');
    fetchAuditLogs('');
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Application Audit Trail</h1>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Immutable audit log table{' '}
              <code className="text-xs bg-gray-100 px-1 py-0.5 rounded font-mono text-purple-700">
                application_status_audit
              </code>{' '}
              populated by PL/pgSQL trigger.
            </p>
          </div>

          {/* Filter by Application ID */}
          <form onSubmit={handleFilterSubmit} className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Filter by App ID..."
              value={appIdFilter}
              onChange={(e) => setAppIdFilter(e.target.value)}
              className="input-field py-1.5 px-3 text-sm w-44"
            />
            <button type="submit" className="btn-primary py-1.5 px-3 text-xs">
              Filter
            </button>
            {appIdFilter && (
              <button
                type="button"
                onClick={handleClear}
                className="btn-secondary py-1.5 px-3 text-xs"
              >
                Clear
              </button>
            )}
          </form>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Querying PostgreSQL audit log records..." />
      ) : logs.length === 0 ? (
        <div className="card text-center py-12">
          <History className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-gray-800">No Status Changes Logged Yet</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            When recruiters advance candidates through selection rounds (e.g. SHORTLISTED → ROUND_1 → OFFERED), the PL/pgSQL trigger automatically captures state changes here.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Audit ID</th>
                  <th className="py-3.5 px-4 font-semibold">Candidate</th>
                  <th className="py-3.5 px-4 font-semibold">Company & Drive</th>
                  <th className="py-3.5 px-4 font-semibold">Previous Status</th>
                  <th className="py-3.5 px-4 font-semibold">New Status</th>
                  <th className="py-3.5 px-4 font-semibold">Changed By</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/60">
                    <td className="py-3.5 px-4 font-mono text-xs text-gray-500">
                      #{log.id} (App #{log.application_id})
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">{log.student_name}</div>
                      <div className="text-xs text-gray-400">
                        {log.department} • CGPA {log.cgpa}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-gray-800">{log.company_name}</div>
                      <div className="text-xs text-gray-500">{log.drive_title}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {log.previous_status ? (
                        <StatusBadge status={log.previous_status} />
                      ) : (
                        <span className="text-xs text-gray-400 italic">Initial</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={log.new_status} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-gray-600">
                      {log.changed_by || 'system'}
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-gray-500 whitespace-nowrap">
                      {new Date(log.changed_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
