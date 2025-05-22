import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className, hoverable = false }) => {
  return (
    <div 
      className={twMerge(
        'bg-white rounded-lg shadow-md overflow-hidden',
        hoverable ? 'transition-all duration-200 hover:shadow-lg' : '',
        className
      )}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => {
  return (
    <div className={twMerge('px-6 py-4 border-b border-gray-200', className)}>
      {children}
    </div>
  );
};

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

const CardBody: React.FC<CardBodyProps> = ({ children, className }) => {
  return (
    <div className={twMerge('px-6 py-4', className)}>
      {children}
    </div>
  );
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => {
  return (
    <div className={twMerge('px-6 py-4 border-t border-gray-200', className)}>
      {children}
    </div>
  );
};

export { Card, CardHeader, CardBody, CardFooter };