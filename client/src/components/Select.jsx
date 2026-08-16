'use client';

/**
 * Shared select styling — single-line, hairline border, accent focus.
 * Same visual grammar as Input.jsx so forms read as one system.
 */
export default function Select({ label, name, value, onChange, children, className = '', ...rest }) {
  const select = (
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      className={`w-full h-10 px-3 rounded-md border border-line bg-surface text-sm text-ink
        transition-colors duration-150
        hover:border-ink-3/50 focus:border-accent focus:outline-none
        ${className}`}
      {...rest}
    >
      {children}
    </select>
  );

  if (!label) return select;

  return (
    <label htmlFor={name} className="flex flex-col gap-1.5 min-w-0">
      <span className="text-xs font-medium uppercase tracking-wide text-ink-2">{label}</span>
      {select}
    </label>
  );
}
