import { Check, X } from 'lucide-react';

/**
 * Calculates password strength score (0 to 4)
 */
const calculatePasswordStrength = (password = '') => {
  if (!password) {
    return { score: 0, label: 'None', checks: { length: false, mixedCase: false, number: false, special: false } };
  }

  const checks = {
    length: password.length >= 8,
    mixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  let label = 'Weak';
  if (score >= 4) label = 'Strong';
  else if (score >= 3) label = 'Good';
  else if (score >= 2) label = 'Fair';

  return { score, label, checks };
};

export const PasswordStrengthIndicator = ({ password = '' }) => {
  if (!password) return null;

  const { score, label, checks } = calculatePasswordStrength(password);

  const getBarColor = (index) => {
    if (index >= score) return 'bg-slate-200';
    if (score <= 1) return 'bg-rose-500';
    if (score === 2) return 'bg-amber-500';
    if (score === 3) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  const getLabelColor = () => {
    if (score <= 1) return 'text-rose-600';
    if (score === 2) return 'text-amber-600';
    if (score === 3) return 'text-blue-600';
    return 'text-emerald-600';
  };

  return (
    <div className="space-y-2 pt-1 text-left">
      {/* Strength Bar */}
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-slate-500">Password strength:</span>
        <span className={`font-semibold ${getLabelColor()}`}>{label}</span>
      </div>

      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`h-full rounded-full transition-colors duration-300 ${getBarColor(index)}`}
          />
        ))}
      </div>

      {/* Helpful Checklist */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[11px] text-slate-500">
        <div className={`flex items-center gap-1.5 ${checks.length ? 'text-emerald-700 font-medium' : ''}`}>
          {checks.length ? <Check size={12} className="text-emerald-600" /> : <X size={12} className="text-slate-300" />}
          8+ characters
        </div>
        <div className={`flex items-center gap-1.5 ${checks.mixedCase ? 'text-emerald-700 font-medium' : ''}`}>
          {checks.mixedCase ? <Check size={12} className="text-emerald-600" /> : <X size={12} className="text-slate-300" />}
          Upper & lower case
        </div>
        <div className={`flex items-center gap-1.5 ${checks.number ? 'text-emerald-700 font-medium' : ''}`}>
          {checks.number ? <Check size={12} className="text-emerald-600" /> : <X size={12} className="text-slate-300" />}
          At least one number
        </div>
        <div className={`flex items-center gap-1.5 ${checks.special ? 'text-emerald-700 font-medium' : ''}`}>
          {checks.special ? <Check size={12} className="text-emerald-600" /> : <X size={12} className="text-slate-300" />}
          Special character (@, #, $)
        </div>
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
