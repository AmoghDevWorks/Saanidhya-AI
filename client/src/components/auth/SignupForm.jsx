import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import PasswordInput from './PasswordInput';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import AccountTypeSelector from './AccountTypeSelector';
import { useAuth } from '../../context/useAuth';

/**
 * SignupForm
 * Production-ready registration connected to FastAPI backend.
 * Handles client validation, role selection, backend duplicate checks, and role redirects.
 */
export const SignupForm = () => {
  const { signup, isLoading, authNotice } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    accountType: 'elderly', // default to elderly
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Please enter your full name.';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.accountType) {
      newErrors.accountType = 'Please select an account type.';
    }

    if (!formData.password) {
      newErrors.password = 'Please create a password.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms of Service & Privacy Policy.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (serverError) setServerError('');
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleAccountTypeChange = (type) => {
    setFormData((prev) => ({ ...prev, accountType: type }));
    if (errors.accountType) {
      setErrors((prev) => ({ ...prev, accountType: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setServerError('');
    setIsSubmitting(true);
    try {
      const result = await signup({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        accountType: formData.accountType,
        termsAccepted: formData.agreeToTerms,
      });

      if (result?.success && result?.user) {
        // Redirect to role-appropriate home
        const destination =
          result.user.accountType === 'family' ? '/family' : '/dashboard';
        navigate(destination, { replace: true });
      }
    } catch (err) {
      setServerError(err.message || 'Unable to complete registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Backend Error Alert */}
        {(serverError || (authNotice && authNotice.type === 'error')) && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5 text-left">
            <AlertCircle size={18} className="text-rose-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-rose-900 text-xs">
                {authNotice?.title || 'Registration Error'}
              </p>
              <p className="text-xs mt-0.5 text-rose-700">
                {serverError || authNotice?.message}
              </p>
            </div>
          </div>
        )}

        {/* Account Type Selector (Visually Intuitive Dual Cards) */}
        <AccountTypeSelector
          value={formData.accountType}
          onChange={handleAccountTypeChange}
          error={errors.accountType}
        />

        {/* Full Name */}
        <div className="space-y-1.5 text-left">
          <label htmlFor="signup-name" className="block text-sm font-semibold text-slate-800">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative rounded-xl shadow-xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User size={18} aria-hidden="true" />
            </div>
            <input
              id="signup-name"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="e.g. Ramesh Kumar or Ananya Rao"
              value={formData.fullName}
              onChange={handleChange}
              disabled={isSubmitting || isLoading}
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? 'signup-name-error' : undefined}
              className={`w-full pl-10 pr-4 py-3 text-base text-slate-900 bg-white border rounded-xl transition-all duration-200 outline-none
                placeholder:text-slate-400 disabled:bg-slate-50
                ${
                  errors.fullName
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-3 focus:ring-rose-500/20'
                    : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15'
                }`}
            />
          </div>
          {errors.fullName && (
            <p id="signup-name-error" className="text-xs font-medium text-rose-600 flex items-center gap-1.5 pt-0.5">
              <span className="inline-block w-1 h-1 rounded-full bg-rose-500" />
              {errors.fullName}
            </p>
          )}
        </div>

        {/* Email Address */}
        <div className="space-y-1.5 text-left">
          <label htmlFor="signup-email" className="block text-sm font-semibold text-slate-800">
            Email Address <span className="text-rose-500">*</span>
          </label>
          <div className="relative rounded-xl shadow-xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail size={18} aria-hidden="true" />
            </div>
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="e.g. yourname@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting || isLoading}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'signup-email-error' : undefined}
              className={`w-full pl-10 pr-4 py-3 text-base text-slate-900 bg-white border rounded-xl transition-all duration-200 outline-none
                placeholder:text-slate-400 disabled:bg-slate-50
                ${
                  errors.email
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-3 focus:ring-rose-500/20'
                    : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15'
                }`}
            />
          </div>
          {errors.email && (
            <p id="signup-email-error" className="text-xs font-medium text-rose-600 flex items-center gap-1.5 pt-0.5">
              <span className="inline-block w-1 h-1 rounded-full bg-rose-500" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <PasswordInput
            id="signup-password"
            name="password"
            label="Password"
            placeholder="Create a strong password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            disabled={isSubmitting || isLoading}
            autoComplete="new-password"
          />
          {/* Password Strength Indicator */}
          <PasswordStrengthIndicator password={formData.password} />
        </div>

        {/* Confirm Password */}
        <PasswordInput
          id="signup-confirm-password"
          name="confirmPassword"
          label="Confirm Password"
          placeholder="Re-enter your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          disabled={isSubmitting || isLoading}
          autoComplete="new-password"
        />

        {/* Terms and Privacy Consent */}
        <div className="pt-1 text-left">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              disabled={isSubmitting || isLoading}
              className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
            />
            <span className="text-xs text-slate-600 leading-normal">
              I agree to the{' '}
              <a
                href="#terms"
                onClick={(e) => {
                  e.preventDefault();
                  alert(
                    'Saanidhya AI Terms: Data and voice recordings are processed with user consent to support daily caregiving. Wellness insights are supportive indicators, not medical diagnoses.'
                  );
                }}
                className="font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="#privacy"
                onClick={(e) => {
                  e.preventDefault();
                  alert(
                    'Saanidhya AI Privacy: Your family health records and voice conversations are encrypted and never shared with third parties.'
                  );
                }}
                className="font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Privacy Policy
              </a>
              .
            </span>
          </label>
          {errors.agreeToTerms && (
            <p className="text-xs font-medium text-rose-600 flex items-center gap-1.5 pt-1.5">
              <span className="inline-block w-1 h-1 rounded-full bg-rose-500" />
              {errors.agreeToTerms}
            </p>
          )}
        </div>

        {/* Create Account Button */}
        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-base shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={19} className="animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>

        {/* Link to Login */}
        <div className="pt-3 text-center">
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              Sign in instead
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default SignupForm;
