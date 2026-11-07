import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import PasswordInput from './PasswordInput';
import { useAuth } from '../../context/useAuth';

/**
 * LoginForm
 * Production-ready login experience connected to FastAPI backend.
 * Handles client validation, backend errors, loading state, and role-based redirects.
 */
export const LoginForm = () => {
  const { login, isLoading, authNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMsg, setForgotPasswordMsg] = useState(null);

  // Validate inputs
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address (e.g., name@domain.com).';
    }

    if (!formData.password) {
      newErrors.password = 'Please enter your password.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setServerError('');
    setIsSubmitting(true);
    try {
      const result = await login(formData);

      if (result?.success && result?.user) {
        // Role-based redirect
        const destination =
          location.state?.from?.pathname ||
          (result.user.accountType === 'family' ? '/family' : '/dashboard');

        navigate(destination, { replace: true });
      }
    } catch (err) {
      setServerError(err.message || 'Unable to sign in. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (
      !forgotPasswordEmail.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotPasswordEmail.trim())
    ) {
      setForgotPasswordMsg({
        type: 'error',
        text: 'Please enter a valid email address.',
      });
      return;
    }

    setForgotPasswordMsg({
      type: 'success',
      text: `If an account exists for ${forgotPasswordEmail}, recovery instructions will be sent.`,
    });
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
                {authNotice?.title || 'Authentication Error'}
              </p>
              <p className="text-xs mt-0.5 text-rose-700">
                {serverError || authNotice?.message}
              </p>
            </div>
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-1.5 text-left">
          <label
            htmlFor="login-email"
            className="block text-sm font-semibold text-slate-800"
          >
            Email Address <span className="text-rose-500">*</span>
          </label>
          <div className="relative rounded-xl shadow-xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail size={18} aria-hidden="true" />
            </div>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="e.g. yourname@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting || isLoading}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
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
            <p
              id="login-email-error"
              className="text-xs font-medium text-rose-600 flex items-center gap-1.5 pt-0.5"
            >
              <span className="inline-block w-1 h-1 rounded-full bg-rose-500" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Password Field */}
        <PasswordInput
          id="login-password"
          name="password"
          label="Password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          disabled={isSubmitting || isLoading}
          autoComplete="current-password"
        />

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              disabled={isSubmitting || isLoading}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
            />
            <span className="text-sm font-medium text-slate-700">Remember me</span>
          </label>

          <button
            type="button"
            onClick={() => {
              setForgotPasswordOpen(!forgotPasswordOpen);
              setForgotPasswordMsg(null);
            }}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors focus:outline-none focus:underline cursor-pointer"
          >
            Forgot password?
          </button>
        </div>

        {/* Forgot Password Inline Drawer/Modal */}
        {forgotPasswordOpen && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Password Recovery
              </span>
              <button
                type="button"
                onClick={() => setForgotPasswordOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Enter your registered email address and we&apos;ll send you recovery instructions.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="yourname@example.com"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleForgotPasswordSubmit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Send Link
              </button>
            </div>
            {forgotPasswordMsg && (
              <p
                className={`text-xs font-medium ${
                  forgotPasswordMsg.type === 'success'
                    ? 'text-emerald-700'
                    : 'text-rose-600'
                }`}
              >
                {forgotPasswordMsg.text}
              </p>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-base shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={19} className="animate-spin" />
              <span>Verifying credentials...</span>
            </>
          ) : (
            <>
              <span>Sign In to Saanidhya</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>

        {/* Link to Sign Up */}
        <div className="pt-4 text-center">
          <p className="text-sm text-slate-600">
            Don&apos;t have an account yet?{' '}
            <Link
              to="/signup"
              className="font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
