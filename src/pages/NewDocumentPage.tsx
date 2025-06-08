import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import DocumentSubmissionForm from '../components/documents/DocumentSubmissionForm';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../lib/translations';

export default function NewDocumentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resubmitId = searchParams.get('resubmit');
  const [originalDocument, setOriginalDocument] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(!!resubmitId);
  const t = useTranslation();

  useEffect(() => {
    if (resubmitId) {
      fetchOriginalDocument();
    }
  }, [resubmitId]);

  const fetchOriginalDocument = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', resubmitId)
        .single();

      if (error) throw error;
      setOriginalDocument(data);
    } catch (error) {
      console.error('Error fetching original document:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmissionComplete = () => {
    // Navigate back to submitter dashboard after successful submission
    navigate('/documents', { 
      state: { 
        message: resubmitId 
          ? t('documentResubmittedSuccessfully') 
          : t('documentSubmittedSuccessfully') 
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          leftIcon={<ArrowLeft size={16} />}
          onClick={() => navigate('/documents')}
        >
          {t('backToDocuments')}
        </Button>
      </div>

      {resubmitId && originalDocument && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-sm font-medium text-blue-800 mb-1">
            {t('resubmittingDocument')}
          </h3>
          <p className="text-sm text-blue-700">
            {t('resubmittingDocumentDescription').replace('{title}', originalDocument.title)}
          </p>
        </div>
      )}

      <DocumentSubmissionForm onSubmit={handleSubmissionComplete} />
    </div>
  );
}