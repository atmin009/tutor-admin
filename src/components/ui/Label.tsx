import type { LabelHTMLAttributes, ReactNode } from 'react';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
  className?: string;
  required?: boolean;
}

const Label = ({
  children,
  className = '',
  required = false,
  ...rest
}: LabelProps) => {
  const baseStyles = 'text-xs font-medium text-slate-600 mb-1 block';

  return (
    <label className={`${baseStyles} ${className}`} {...rest}>
      {children}
      {required && <span className="text-rose-500 ml-1">*</span>}
    </label>
  );
};

export { Label };
export default Label;

