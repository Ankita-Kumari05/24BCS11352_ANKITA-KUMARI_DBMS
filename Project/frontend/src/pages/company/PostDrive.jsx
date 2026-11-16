import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import {
  Briefcase,
  Calendar,
  IndianRupee,
  MapPin,
  Building2,
  CheckSquare,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';

const DEPARTMENTS = ['CSE', 'ECE', 'ME', 'EE', 'CIVIL', 'IT', 'CHEM'];

export default function PostDrive() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ctcLpa, setCtcLpa] = useState('');
  const [minCgpa, setMinCgpa] = useState('7.00');
  const [maxBacklogs, setMaxBacklogs] = useState('0');
  const [allowedDepartments, setAllowedDepartments] = useState(['CSE', 'IT', 'ECE']);
  const [deadline, setDeadline] = useState('');
  const [driveDate, setDriveDate] = useState('');
  const [location, setLocation] = useState('Campus Auditorium / Online');

  const toggleDepartment = (dept) => {
    setAllowedDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (allowedDepartments.length === 0) {
      setError('Please select at least one eligible department.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title,
        description,
        ctc_lpa: parseFloat(ctcLpa),
        min_cgpa: parseFloat(minCgpa),
        max_backlogs: parseInt(maxBacklogs, 10),
        allowed_departments: allowedDepartments,
        deadline: new Date(deadline).toISOString(),
        drive_date: driveDate || null,
        location,
      };

      await api.post('/drives', payload);
      navigate('/company/my-drives');
    } catch (err) {
      console.error('Failed to post drive:', err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Failed to create placement drive.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Post New Placement Drive</h1>
        <p className="text-gray-500 text-sm mt-1">
          Define placement drive parameters. Criteria are enforced automatically at the PostgreSQL database level.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 mb-6">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Drive Title & Package */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="title" className="label">
              Drive Title / Job Role
            </label>
            <input
              id="title"
              type="text"
              required
              placeholder="e.g. Graduate Software Development Engineer (SDE-1)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="ctc" className="label">
              Annual Package CTC (LPA)
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="ctc"
                type="number"
                step="0.1"
                min="0"
                required
                placeholder="e.g. 14.5"
                value={ctcLpa}
                onChange={(e) => setCtcLpa(e.target.value)}
                className="input-field pl-11"
              />
            </div>
          </div>

          <div>
            <label htmlFor="location" className="label">
              Location / Mode
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="location"
                type="text"
                placeholder="e.g. Bangalore / Hybrid"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input-field pl-11"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="desc" className="label">
            Job Description & Responsibilities
          </label>
          <textarea
            id="desc"
            rows="4"
            placeholder="Describe the role, technology stack, and expectations from candidates..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field"
          />
        </div>

        {/* Eligibility Criteria (Trigger Enforced) */}
        <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 space-y-4">
          <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-indigo-600" />
            PostgreSQL Guard Criteria (Strict PL/pgSQL Check)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="min_cgpa" className="label">
                Minimum CGPA Required
              </label>
              <input
                id="min_cgpa"
                type="number"
                step="0.01"
                min="0"
                max="10"
                required
                value={minCgpa}
                onChange={(e) => setMinCgpa(e.target.value)}
                className="input-field bg-white"
              />
            </div>

            <div>
              <label htmlFor="max_backlogs" className="label">
                Maximum Active Backlogs Allowed
              </label>
              <input
                id="max_backlogs"
                type="number"
                min="0"
                max="10"
                required
                value={maxBacklogs}
                onChange={(e) => setMaxBacklogs(e.target.value)}
                className="input-field bg-white"
              />
            </div>
          </div>

          <div>
            <label className="label">Eligible Departments (GIN Indexed Array)</label>
            <div className="flex flex-wrap gap-2 pt-1">
              {DEPARTMENTS.map((dept) => {
                const isSelected = allowedDepartments.includes(dept);
                return (
                  <button
                    type="button"
                    key={dept}
                    onClick={() => toggleDepartment(dept)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {dept}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Deadlines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="deadline" className="label">
              Application Deadline
            </label>
            <input
              id="deadline"
              type="datetime-local"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="drive_date" className="label">
              Interview / Drive Date (Optional)
            </label>
            <input
              id="drive_date"
              type="date"
              value={driveDate}
              onChange={(e) => setDriveDate(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            {loading ? 'Publishing Drive...' : 'Publish Placement Drive'}
          </button>
        </div>
      </form>
    </div>
  );
}
