import type { HTMLAttributes, ReactNode } from 'react';

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
  className?: string;
}

const Table = ({ children, className = '', ...rest }: TableProps) => {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${className}`} {...rest}>
        {children}
      </table>
    </div>
  );
};

interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
  className?: string;
}

const TableHeader = ({
  children,
  className = '',
  ...rest
}: TableHeaderProps) => {
  return (
    <thead className={className} {...rest}>
      {children}
    </thead>
  );
};

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
  className?: string;
}

const TableRow = ({ children, className = '', ...rest }: TableRowProps) => {
  const baseStyles = 'hover:bg-slate-50 transition-colors';
  return (
    <tr className={`${baseStyles} ${className}`} {...rest}>
      {children}
    </tr>
  );
};

interface TableHeadProps extends HTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  className?: string;
}

const TableHead = ({ children, className = '', ...rest }: TableHeadProps) => {
  const baseStyles =
    'bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 text-left';

  return (
    <th className={`${baseStyles} ${className}`} {...rest}>
      {children}
    </th>
  );
};

interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
  className?: string;
}

const TableBody = ({
  children,
  className = '',
  ...rest
}: TableBodyProps) => {
  return (
    <tbody className={className} {...rest}>
      {children}
    </tbody>
  );
};

interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  className?: string;
}

const TableCell = ({ children, className = '', ...rest }: TableCellProps) => {
  const baseStyles =
    'bg-white border-b border-slate-100 text-sm text-slate-700 px-4 py-3';

  return (
    <td className={`${baseStyles} ${className}`} {...rest}>
      {children}
    </td>
  );
};

export {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
};

