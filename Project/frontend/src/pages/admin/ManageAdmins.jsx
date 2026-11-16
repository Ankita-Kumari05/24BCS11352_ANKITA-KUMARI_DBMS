import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  Mail,
  Lock,
  User,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  ShieldAlert,
  Crown,
} from 'lucide-react';

export default function ManageAdmins() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isSuperAdmin = user?.email === 'admin@gmail.com';

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAdmins();
    } else {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/admins');
      setAdmins(res.data);
    } catch (err) {
      console.error('Failed to load admins:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to fetch administrator accounts.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!fullName || !email || !password) {
      setMessage({ type: 'error', text: 'All fields are required.' });
      return;
    }

    try {
      setCreating(true);
      const res = await api.post('/auth/create-admin', {
        full_name: fullName,
        email,
        password,
      });

      setMessage({
        type: 'success',
        text: `Administrator "${res.data.admin.full_name}" (${res.data.admin.email}) created successfully!`,
      });

      // Reset form
      setFullName('');
      setEmail('');
      setPassword('');

      fetchAdmins();
    } catch (err) {
      console.error('Failed to create admin:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to create new administrator.',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAdmin = async (id, adminEmail) => {
    if (!window.confirm(`Are you sure you want to remove administrator ${adminEmail}?`)) {
      return;
    }

    try {
      setDeletingId(id);
      setMessage({ type: '', text: '' });

      await api.delete(`/auth/admins/${id}`);
      setMessage({
        type: 'success',
        text: `Administrator ${adminEmail} removed successfully.`,
      });
      fetchAdmins();
    } catch (err) {
      console.error('Failed to delete admin:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to remove administrator.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="card text-center py-12 border-red-200 bg-red-50/50">
          <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-900">Access Restricted</h2>
          <p className="text-sm text-red-700 mt-2 max-w-md mx-auto">
            Only the primary predefined administrator (<strong>admin@gmail.com</strong>) has authority to create and manage other administrator accounts.
          </p>
          <Link to="/admin/dashboard" className="btn-primary inline-block mt-6 text-sm">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (loading) return <LoadingSpinner message="Loading administrator directory..." />;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full uppercase flex items-center gap-1.5">
                <Crown className="h-3.5 w-3.5 text-purple-600" />
                Super Admin Control
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Administrator Management</h1>
            <p className="text-gray-500 text-sm mt-1">
              Exclusively authorized for <strong>admin@gmail.com</strong> to provision and manage other TPO administrators.
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {message.text && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
          )}
          <span className="text-sm font-semibold">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create New Admin Form (Left Column) */}
        <div className="card shadow-lg lg:col-span-1 border-t-4 border-t-indigo-600 h-fit">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <UserPlus className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Create New Admin</h2>
          </div>

          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div>
              <label className="label">Full Legal Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. R. K. Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field pl-11 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="label">Official Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="officer@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-11 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="label">Temporary / Initial Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="Min 4 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-11 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm mt-2"
            >
              <ShieldCheck className="h-4 w-4" />
              {creating ? 'Creating Admin...' : 'Authorize New Admin'}
            </button>
          </form>
        </div>

        {/* Existing Admins List (Right Column) */}
        <div className="card shadow-lg lg:col-span-2 overflow-hidden p-0 border-t-4 border-t-purple-600">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-bold text-gray-900">
                Registered Administrators ({admins.length})
              </h2>
            </div>
            <span className="text-xs text-gray-400">Total accounts with TPO_ADMIN privileges</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-5 font-semibold">Administrator</th>
                  <th className="py-3.5 px-5 font-semibold">Email</th>
                  <th className="py-3.5 px-5 font-semibold">Access Level</th>
                  <th className="py-3.5 px-5 font-semibold">Created Date</th>
                  <th className="py-3.5 px-5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {admins.map((adm) => {
                  const isPrimary = adm.email === 'admin@gmail.com';

                  return (
                    <tr key={adm.id} className="hover:bg-gray-50/50">
                      <td className="py-3.5 px-5 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {isPrimary && (
                            <Crown className="h-4 w-4 text-amber-500 flex-shrink-0" title="Primary Super Admin" />
                          )}
                          <span>{adm.full_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-gray-600 font-mono text-xs">{adm.email}</td>
                      <td className="py-3.5 px-5">
                        {isPrimary ? (
                          <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                            Primary Super Admin
                          </span>
                        ) : (
                          <span className="bg-indigo-100 text-indigo-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                            TPO Admin
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-500">
                        {new Date(adm.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {isPrimary ? (
                          <span className="text-xs text-gray-400 italic">Protected</span>
                        ) : (
                          <button
                            onClick={() => handleDeleteAdmin(adm.id, adm.email)}
                            disabled={deletingId === adm.id}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Remove Administrator"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
