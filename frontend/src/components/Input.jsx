'use client';

/**
 * Reusable form input with label and error display.
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
  ...rest
}) {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-amber-900 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-4 py-2.5 rounded-lg border bg-white text-gray-900 placeholder-gray-400
          focus:outline-none focus:ring-2 transition-all
          ${
            error
              ? 'border-red-400 focus:ring-red-300'
              : 'border-amber-200 focus:ring-amber-400'
          }`}
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
