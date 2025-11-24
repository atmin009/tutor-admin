import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error = false, ...rest }, ref) => {
    const baseStyles =
      'w-full rounded-lg bg-white border px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition';

    const borderStyles = error
      ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500'
      : 'border-slate-200 focus:ring-brand focus:border-brand';

    const classes = `${baseStyles} ${borderStyles} ${className}`;

    return <input ref={ref} className={classes} {...rest} />;
  }
);

Input.displayName = 'Input';

export { Input };
export default Input;

