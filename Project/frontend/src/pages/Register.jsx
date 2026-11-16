import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Building2,
  User,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Globe,
  BookOpen,
  Hash,
  Sparkles,
} from 'lucide-react';

const DEPARTMENTS = ['CSE', 'ECE', 'ME', 'EE', 'CIVIL', 'IT', 'CHEM'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Student fields
  const [department, setDepartment] = useState('CSE');
  const [cgpa, setCgpa] = useState('');
  const [activeBacklogs, setActiveBacklogs] = useState('0');
  const [skills, setSkills] = useState('');

  // Company fields
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const roleMapping = {
      student: 'STUDENT',
      company: 'COMPANY',
    };

    const payload = {
      email,
      password,
      full_name: fullName,
      role: roleMapping[role],
    };

    if (role === 'student') {
      payload.department = department;
      payload.cgpa = parseFloat(cgpa);
      payload.active_backlogs = parseInt(activeBacklogs, 10);
      payload.skills = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (role === 'company') {
      payload.company_name = companyName;
      payload.industry = industry;
      payload.website = website;
    }

    try {
      await register(payload);
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-indigo-600 text-white mb-4 shadow-lg shadow-indigo-200">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 mt-1 text-sm">Join the Placement Management System</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step >= s
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`w-12 h-1 rounded-full transition-all ${
                    step > s ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="card shadow-xl">
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200 mb-6">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200 mb-6">
              <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-700">{success}</p>
            </div>
          )}

          {/* Step 1: Role Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose your role:</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setRole('student');
                    setStep(2);
                  }}
                  className={`flex flex-col items-center gap-2.5 p-6 rounded-xl border-2 transition-all hover:border-indigo-500 hover:bg-indigo-50/50 ${
                    role === 'student'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="h-14 w-14 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <GraduationCap className="h-7 w-7 text-emerald-600" />
                  </div>
                  <span className="font-bold text-gray-900">Student</span>
                  <span className="text-xs text-gray-500 text-center">
                    Register profile & apply for placements
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole('company');
                    setStep(2);
                  }}
                  className={`flex flex-col items-center gap-2.5 p-6 rounded-xl border-2 transition-all hover:border-indigo-500 hover:bg-indigo-50/50 ${
                    role === 'company'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="h-14 w-14 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Building2 className="h-7 w-7 text-blue-600" />
                  </div>
                  <span className="font-bold text-gray-900">Company</span>
                  <span className="text-xs text-gray-500 text-center">
                    Post placement drives & hire candidates
                  </span>
                </button>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center text-xs text-gray-500 border border-gray-100">
                🔒 Administrator accounts are restricted and managed exclusively by the primary administrator (<span className="font-semibold text-gray-700">admin@gmail.com</span>).
              </div>
            </div>
          )}

          {/* Step 2: Common Account Fields */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900">Account Credentials</h2>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-full uppercase">
                  Role: {role}
                </span>
              </div>

              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-field pl-11"
                    placeholder="Enter full legal name"
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-11"
                    placeholder="name@institution.edu"
                  />
                </div>
              </div>

              <div>
                <label className="label">Secure Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-11"
                    placeholder="Minimum 6 characters"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!fullName || !email || !password) {
                      setError('Please fill in all required fields.');
                      return;
                    }
                    if (password.length < 6) {
                      setError('Password must be at least 6 characters.');
                      return;
                    }
                    setError('');
                    setStep(3);
                  }}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Role-specific Fields */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {role === 'student' ? 'Academic Profile' : 'Company Profile'}
              </h2>

              {role === 'student' && (
                <>
                  <div>
                    <label className="label">Department / Branch</label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="input-field pl-11"
                      >
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Current CGPA (0 - 10)</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          required
                          value={cgpa}
                          onChange={(e) => setCgpa(e.target.value)}
                          className="input-field pl-11"
                          placeholder="8.50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="label">Active Backlogs</label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        required
                        value={activeBacklogs}
                        onChange={(e) => setActiveBacklogs(e.target.value)}
                        className="input-field"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Skills (comma-separated)</label>
                    <div className="relative">
                      <Sparkles className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                        className="input-field pl-11"
                        placeholder="e.g. Java, Python, PostgreSQL, React"
                      />
                    </div>
                  </div>
                </>
              )}

              {role === 'company' && (
                <>
                  <div>
                    <label className="label">Organization / Company Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="input-field pl-11"
                        placeholder="e.g. Google, Microsoft, Infosys"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Industry Domain</label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="input-field"
                      placeholder="e.g. Information Technology, Cloud Computing"
                    />
                  </div>

                  <div>
                    <label className="label">Corporate Website</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="input-field pl-11"
                        placeholder="https://company.com"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {loading ? 'Creating Account...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
