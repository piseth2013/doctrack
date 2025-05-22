import React from 'react';
import { twMerge } from 'tailwind-merge';

type StatusType = 'pending' | 'approved' | 'rejected' | 'draft';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const statusConfig = {
    pending: {
      bg: 'bg-warning-50',
      text: 'text-warning-700',
      label: 'Pending',
    },
    approved: {
      bg: 'bg-success-50',
      text: 'text-success-700',
      label: 'Approved',
    },
    rejected: {
      bg: 'bg-error-50',
      text: 'text-error-700',
      label: 'Rejected',
    },
    draft: {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      label: 'Draft',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={twMerge(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.bg,
        config.text,
        className
      )}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;