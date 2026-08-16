'use client';

/**
 * The app-wide surface card: soft surface, hairline border, rounded-lg.
 * `hover` adds the signature gentle lift (2px translate + soft shadow).
 * `padding` picks a preset; pass className to override anything.
 */
const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6 sm:p-8',
};

export default function Card({
  hover = false,
  padding = 'md',
  as: Tag = 'div',
  className = '',
  children,
  ...rest
}) {
  return (
    <Tag
      className={`
        bg-surface border border-line rounded-lg
        ${PADDING[padding]}
        ${hover ? 'transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-lift hover:border-ink-3/40' : ''}
        ${className}
      `}
      {...rest}
    >
      {children}
    </Tag>
  );
}
