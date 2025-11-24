import type { HTMLAttributes, ReactNode } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'outline';
  children: ReactNode;
  className?: string;
}

const Badge = ({
  variant = 'default',
  children,
  className = '',
  ...rest
}: BadgeProps) => {
  const baseStyles =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';

  const variants = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-700',
    danger: 'bg-rose-100 text-rose-700',
    warning: 'bg-amber-100 text-amber-800',
    outline: 'border border-slate-300 text-slate-700 bg-white',
  };

  const classes = `${baseStyles} ${variants[variant]} ${className}`;

  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
};

export default Badge;

