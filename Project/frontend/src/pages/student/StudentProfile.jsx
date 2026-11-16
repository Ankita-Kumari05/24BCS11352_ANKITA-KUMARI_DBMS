import { useState, useEffect } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  User,
  BookOpen,
  Award,
  Sparkles,
  Link as LinkIcon,
  Save,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

const DEPARTMENTS = ['CSE', 'ECE', 'ME', 'EE', 'CIVIL', 'IT', 'CHEM'];

export default function StudentProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [department, setDepartment] = useState('CSE');
  const [cgpa, setCgpa] = useState('');
  const [activeBacklogs, setActiveBacklogs] = useState('0');
  const [skills, setSkills] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students/profile');
      const data = res.data;
      setUserData(data);
      setDepartment(data.department || 'CSE');
      setCgpa(data.cgpa != null ? data.cgpa.toString() : '');
      setActiveBacklogs(data.active_backlogs != null ? data.active_backlogs.toString() : '0');
      setSkills(Array.isArray(data.skills) ? data.skills.join(', ') : '');
      setResumeUrl(data.resume_url || '');
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setMessage({ type: 'error', text: 'Failed to load profile data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const numCgpa = parseFloat(cgpa);
    if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
      setMessage({ type: 'error', text: 'CGPA must be between 0.00 and 10.00' });
      return;
    }

    const numBacklogs = parseInt(activeBacklogs, 10);
    if (isNaN(numBacklogs) || numBacklogs < 0) {
      setMessage({ type: 'error', text: 'Backlogs cannot be negative' });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        department,
        cgpa: numCgpa,
        active_backlogs: numBacklogs,
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        resume_url: resumeUrl,
      };

      await api.put('/students/profile', payload);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      console.error('Update profile error:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to update profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading profile..." />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Student Profile</h1>
        <p className="text-gray-500 text-sm mt-1">
          Keep your academic and skill information updated for placement drive eligibility.
        </p>
      </div>

      {message.text && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl mb-6 border ${
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
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <div className="card">
        {/* User Static Info */}
        <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
          <div className="h-16 w-16 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center font-bold text-2xl">
            {userData?.full_name?.charAt(0) || 'S'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{userData?.full_name}</h2>
            <p className="text-sm text-gray-500">{userData?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-medium">
                Student ID #{userData?.student_id}
              </span>
              {userData?.is_placed && (
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-medium">
                  Placed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="dept" className="label">
                Department / Branch
              </label>
              <select
                id="dept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="input-field"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept} - Department
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="cgpa" className="label">
                Current CGPA (0.00 - 10.00)
              </label>
              <input
                id="cgpa"
                type="number"
                step="0.01"
                min="0"
                max="10"
                required
                value={cgpa}
                onChange={(e) => setCgpa(e.target.value)}
                placeholder="e.g. 8.50"
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="backlogs" className="label">
                Active Backlogs
              </label>
              <input
                id="backlogs"
                type="number"
                min="0"
                required
                value={activeBacklogs}
                onChange={(e) => setActiveBacklogs(e.target.value)}
                placeholder="0"
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="resume" className="label">
                Resume URL / Portfolio Link
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="resume"
                  type="url"
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="input-field pl-11"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="skills" className="label">
              Skills (comma-separated)
            </label>
            <div className="relative">
              <Sparkles className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                id="skills"
                rows="3"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="Python, PostgreSQL, React, Docker, Machine Learning"
                className="input-field pl-11"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              GIN indexed in database for rapid eligibility and skill-matching queries.
            </p>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving changes...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
