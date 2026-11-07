import { HeartHandshake, ShieldCheck } from 'lucide-react';

/**
 * AccountTypeSelector
 * Visually intuitive, accessible dual-card selector for account role.
 * Features high-contrast borders, tactile feedback, and accessible radio semantics.
 */
export const AccountTypeSelector = ({ value, onChange, error }) => {
  const options = [
    {
      id: 'elderly',
      title: 'Senior / Elderly User',
      badge: 'Voice Companion',
      description:
        'Daily morning wellness check-ins, medicine reminders, and friendly voice conversations in your native language.',
      icon: HeartHandshake,
      accentColor: 'blue',
    },
    {
      id: 'family',
      title: 'Family Member / Caregiver',
      badge: 'Care Circle',
      description:
        'Receive daily check-in summaries, real-time medication confirmations, and urgent wellness alerts for your loved ones.',
      icon: ShieldCheck,
      accentColor: 'teal',
    },
  ];

  return (
    <div className="w-full space-y-2 text-left">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-800">
          I am joining Saanidhya as: <span className="text-rose-500">*</span>
        </label>
        <span className="text-xs text-slate-500 font-medium">Select one</span>
      </div>

      <div
        role="radiogroup"
        aria-label="Account Type"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        {options.map((opt) => {
          const isSelected = value === opt.id;
          const Icon = opt.icon;

          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(opt.id)}
              className={`relative flex flex-col p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer focus:outline-none
                ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
            >
              {/* Top row: Icon, Badge & Radio Checkmark */}
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors
                    ${
                      isSelected
                        ? 'bg-blue-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                >
                  <Icon size={20} strokeWidth={2.2} />
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border
                      ${
                        isSelected
                          ? 'bg-blue-100/80 text-blue-800 border-blue-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                  >
                    {opt.badge}
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center
                      ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-slate-900 text-sm leading-tight mb-1">
                {opt.title}
              </h3>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed">
                {opt.description}
              </p>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-xs font-medium text-rose-600 flex items-center gap-1.5 pt-0.5">
          <span className="inline-block w-1 h-1 rounded-full bg-rose-500" />
          {error}
        </p>
      )}
    </div>
  );
};

export default AccountTypeSelector;
