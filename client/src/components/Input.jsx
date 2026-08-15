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
      <label htmlFor={name} className="block text-sm font-medium text-neutral-800 mb-1">
        {label} {required && <span className="text-rust-700">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-4 py-2.5 rounded-lg border bg-white text-neutral-900 placeholder-stone-400
          focus:outline-none focus:ring-2 transition-all
          ${
            error
              ? 'border-rust-300 focus:ring-rust-300'
              : 'border-stone-300 focus:ring-coffee-500'
          }`}
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-rust-700">{error}</p>}
    </div>
  );
}
