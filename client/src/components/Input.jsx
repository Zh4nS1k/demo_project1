'use client';

/**
 * Reusable form input: label above in text-secondary, hairline border,
 * accent focus, inline validation in the error color.
 */
export default function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  className = '',
  ...rest
}) {
  return (
    <div className={className || 'mb-4'}>
      <label htmlFor={name} className="block text-xs font-medium uppercase tracking-wide text-ink-2 mb-1.5">
        {label} {required && <span className="text-error" aria-hidden>*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`w-full h-10 px-3.5 rounded-md border bg-surface text-sm text-ink placeholder-ink-3
          transition-colors duration-150
          ${error
            ? 'border-error focus:border-error'
            : 'border-line hover:border-ink-3/50 focus:border-accent'
          } focus:outline-none`}
        {...rest}
      />
      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}
