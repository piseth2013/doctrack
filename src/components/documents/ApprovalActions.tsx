import React, { useState } from 'react';
import { Check, X, MessageCircle, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { useTranslation } from '../../lib/translations';

interface ApprovalActionsProps {
  documentId: string;
  currentStatus: string;
  onApprovalAction: (action: 'approved' | 'rejected' | 'needs_changes', comment: string) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
}

const ApprovalActions: React.FC<ApprovalActionsProps> = ({
  documentId,
  currentStatus,
  onApprovalAction,
  isLoading,
  disabled = false,
}) => {
  const t = useTranslation();
  const [selectedAction, setSelectedAction] = useState<'approved' | 'rejected' | 'needs_changes' | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleActionSelect = (action: 'approved' | 'rejected' | 'needs_changes') => {
    setSelectedAction(action);
    setComment('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAction || !comment.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onApprovalAction(selectedAction, comment.trim());
      setSelectedAction(null);
      setComment('');
    } catch (error) {
      console.error('Error submitting approval action:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedAction(null);
    setComment('');
  };

  if (currentStatus !== 'pending' && currentStatus !== 'needs_changes') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-medium text-gray-900">{t('approvalActions')}</h3>
        <p className="text-sm text-gray-600">{t('reviewAndTakeAction')}</p>
      </CardHeader>
      
      <CardBody>
        {!selectedAction ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-700 mb-4">
              {t('chooseActionToTake')}:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                variant="success"
                onClick={() => handleActionSelect('approved')}
                disabled={disabled || isLoading}
                leftIcon={<Check size={16} />}
                className="justify-center"
              >
                {t('approve')}
              </Button>
              
              <Button
                variant="warning"
                onClick={() => handleActionSelect('needs_changes')}
                disabled={disabled || isLoading}
                leftIcon={<AlertCircle size={16} />}
                className="justify-center"
              >
                {t('requestChanges')}
              </Button>
              
              <Button
                variant="danger"
                onClick={() => handleActionSelect('rejected')}
                disabled={disabled || isLoading}
                leftIcon={<X size={16} />}
                className="justify-center"
              >
                {t('reject')}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              {selectedAction === 'approved' && (
                <>
                  <Check className="w-5 h-5 text-success-600" />
                  <span className="font-medium text-success-700">{t('approvingDocument')}</span>
                </>
              )}
              {selectedAction === 'rejected' && (
                <>
                  <X className="w-5 h-5 text-error-600" />
                  <span className="font-medium text-error-700">{t('rejectingDocument')}</span>
                </>
              )}
              {selectedAction === 'needs_changes' && (
                <>
                  <AlertCircle className="w-5 h-5 text-warning-600" />
                  <span className="font-medium text-warning-700">{t('requestingChanges')}</span>
                </>
              )}
            </div>

            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                {t('comment')} <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-3 text-gray-400" size={18} />
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  rows={4}
                  className="block w-full pl-10 pr-3 py-2 rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder={
                    selectedAction === 'approved' 
                      ? t('addApprovalComments')
                      : selectedAction === 'rejected'
                      ? t('explainRejectionReason')
                      : t('specifyChangesNeeded')
                  }
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                variant={
                  selectedAction === 'approved' 
                    ? 'success' 
                    : selectedAction === 'rejected' 
                    ? 'danger' 
                    : 'warning'
                }
                isLoading={isSubmitting}
                disabled={!comment.trim() || isSubmitting}
              >
                {isSubmitting ? t('submitting') : t('confirmAction').replace('{action}', 
                  selectedAction === 'needs_changes' ? t('requestChanges') : 
                  selectedAction === 'approved' ? t('approve') : t('reject')
                )}
              </Button>
            </div>
          </form>
        )}
      </CardBody>
    </Card>
  );
};

export default ApprovalActions;