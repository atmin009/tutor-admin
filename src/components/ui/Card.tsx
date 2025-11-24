import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

const Card = ({ children, className = '', ...rest }: CardProps) => {
  const baseStyles =
    'bg-white rounded-xl shadow-sm border border-slate-100 p-6';

  return (
    <div className={`${baseStyles} ${className}`} {...rest}>
      {children}
    </div>
  );
};

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

const CardHeader = ({
  children,
  className = '',
  ...rest
}: CardHeaderProps) => {
  return (
    <div className={`mb-4 ${className}`} {...rest}>
      {children}
    </div>
  );
};

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  className?: string;
}

const CardTitle = ({ children, className = '', ...rest }: CardTitleProps) => {
  return (
    <h3 className={`text-lg font-semibold text-slate-900 ${className}`} {...rest}>
      {children}
    </h3>
  );
};

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
  className?: string;
}

const CardDescription = ({
  children,
  className = '',
  ...rest
}: CardDescriptionProps) => {
  return (
    <p className={`text-sm text-slate-500 mt-1 ${className}`} {...rest}>
      {children}
    </p>
  );
};

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

const CardContent = ({
  children,
  className = '',
  ...rest
}: CardContentProps) => {
  return (
    <div className={className} {...rest}>
      {children}
    </div>
  );
};

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

const CardFooter = ({
  children,
  className = '',
  ...rest
}: CardFooterProps) => {
  return (
    <div className={`mt-4 pt-4 border-t border-slate-100 ${className}`} {...rest}>
      {children}
    </div>
  );
};

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };

