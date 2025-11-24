import type { InputHTMLAttributes } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'checked' | 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

const Checkbox = ({
  checked = false,
  onCheckedChange,
  className = '',
  ...rest
}: CheckboxProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onCheckedChange) {
      onCheckedChange(e.target.checked);
    }
  };

  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={handleChange}
      className={`w-4 h-4 rounded border-slate-300 bg-white text-brand focus:ring-2 focus:ring-brand focus:ring-offset-2 ${className}`}
      {...rest}
    />
  );
};

export { Checkbox };
export default Checkbox;

