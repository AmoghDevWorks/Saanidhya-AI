import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

/**
 * PasswordInput
 * Accessible password field with high-contrast show/hide toggle,
 * comfortable input heights for seniors, and clear focus states.
 */
export const PasswordInput = ({
  id,
  name = 'password',
  label = 'Password',
  value,
  onChange,
  onBlur,
  placeholder = 'Enter your password',
  error = '',
  required = true,
  autoComplete = 'current-password',
  disabled = false,
  helperText = '',
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const inputId = id || name;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div className="w-full space-y-1.5 text-left">
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-slate-800 tracking-tight"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      </div>

      <div className="relative rounded-xl shadow-xs">
        {/* Leading Lock Icon */}
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Lock size={18} aria-hidden="true" />
        </div>

        {/* Input element */}
        <input
          id={inputId}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`w-full pl-10 pr-12 py-3 text-base text-slate-900 bg-white border rounded-xl transition-all duration-200 outline-none
            placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            ${
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-3 focus:ring-rose-500/20'
                : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15'
            }`}
        />

        {/* Show/Hide Toggle Button */}
        <button
          type="button"
          onClick={togglePasswordVisibility}
          disabled={disabled}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 focus:outline-none focus:text-blue-600 transition-colors cursor-pointer"
        >
          {showPassword ? (
            <EyeOff size={19} className="transition-transform active:scale-95" />
          ) : (
            <Eye size={19} className="transition-transform active:scale-95" />
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <p id={errorId} className="text-xs font-medium text-rose-600 flex items-center gap-1.5 pt-0.5">
          <span className="inline-block w-1 h-1 rounded-full bg-rose-500" aria-hidden="true"></span>
          {error}
        </p>
      )}

      {/* Helper text (when no error) */}
      {!error && helperText && (
        <p id={helperId} className="text-xs text-slate-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default PasswordInput;
