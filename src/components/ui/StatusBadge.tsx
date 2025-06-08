import React from 'react';
import { twMerge } from 'tailwind-merge';
import { useTranslation } from '../../lib/translations';

type StatusType = 'pending' | 'approved' | 'rejected' | 'needs_changes' | 'draft';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const t = useTranslation();

  const statusConfig = {
    pending: {
      bg: 'bg-warning-50',
      text: 'text-warning-700',
      label: t('pending'),
    },
    approved: {
      bg: 'bg-success-50',
      text: 'text-success-700',
      label: t('approved'),
    },
    rejected: {
      bg: 'bg-error-50',
      text: 'text-error-700',
      label: t('rejected'),
    },
    needs_changes: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      label: 'Needs Changes',
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