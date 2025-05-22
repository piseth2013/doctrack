import React from 'react';
import { Check, X, Clock } from 'lucide-react';
import Button from '../ui/Button';

interface StatusUpdaterProps {
  currentStatus: 'pending' | 'approved' | 'rejected';
  onStatusChange: (newStatus: 'pending' | 'approved' | 'rejected') => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
}

const StatusUpdater: React.FC<StatusUpdaterProps> = ({
  currentStatus,
  onStatusChange,
  isLoading,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button
        variant="success"
        leftIcon={<Check size={16} />}
        onClick={() => onStatusChange('approved')}
        isLoading={isLoading && currentStatus !== 'approved'}
        disabled={disabled || currentStatus === 'approved' || isLoading}
        className={`${currentStatus === 'approved' ? 'opacity-50' : ''}`}
      >
        Approve
      </Button>
      <Button
        variant="danger"
        leftIcon={<X size={16} />}
        onClick={() => onStatusChange('rejected')}
        isLoading={isLoading && currentStatus !== 'rejected'}
        disabled={disabled || currentStatus === 'rejected' || isLoading}
        className={`${currentStatus === 'rejected' ? 'opacity-50' : ''}`}
      >
        Reject
      </Button>
      <Button
        variant="warning"
        leftIcon={<Clock size={16} />}
        onClick={() => onStatusChange('pending')}
        isLoading={isLoading && currentStatus !== 'pending'}
        disabled={disabled || currentStatus === 'pending' || isLoading}
        className={`${currentStatus === 'pending' ? 'opacity-50' : ''}`}
      >
        Set Pending
      </Button>
    </div>
  );
};

export default StatusUpdater;