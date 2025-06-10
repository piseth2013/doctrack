import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, User, FileText, MessageSquare, Send } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { DocumentUploader } from './DocumentUploader';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthWrapper';
import { useTranslation } from '../../lib/translations';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string | null;
}

interface DocumentSubmissionFormProps {
  onSubmit?: () => void;
}

const DocumentSubmissionForm: React.FC<DocumentSubmissionFormProps> = ({ onSubmit }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const t = useTranslation();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    note_to_approver: '',
    approver_id: '',
  });
  
  const [files, setFiles] = useState<File[]>([]);
  const [approvers, setApprovers] = useState<Profile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchApprovers();
  }, []);

  const fetchApprovers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, department')
        .neq('id', user?.id) // Exclude current user
        .order('full_name');

      if (error) throw error;
      setApprovers(data || []);
    } catch (err) {
      console.error('Error fetching approvers:', err);
      setError(t('failedToLoadApprovers'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const sanitizeFileName = (fileName: string): string => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const extension = fileName.split('.').pop() || '';
    const baseName = fileName
      .split('.')
      .slice(0, -1)
      .join('.')
      .replace(/[^a-zA-Z0-9\-._]/g, '_');
    
    return `${baseName}_${timestamp}_${randomSuffix}.${extension}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError(t('documentTitleRequired'));
      return;
    }
    
    if (!formData.approver_id) {
      setError(t('pleaseSelectApprover'));
      return;
    }
    
    if (files.length === 0) {
      setError(t('pleaseUploadAtLeastOneFile'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (!user) throw new Error('No user found');

      // Create the document
      const { data: document, error: documentError } = await supabase
        .from('documents')
        .insert({
          title: formData.title,
          description: formData.description,
          note_to_approver: formData.note_to_approver,
          approver_id: formData.approver_id,
          user_id: user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (documentError) throw documentError;
      if (!document) throw new Error('Failed to create document');

      // Upload files
      for (const file of files) {
        const safeFileName = sanitizeFileName(file.name);
        const filePath = `documents/${document.id}/${safeFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('document-files')
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`${t('failedToUpload')} ${file.name}: ${uploadError.message}`);
        }

        // Create document_files record
        const { error: fileRecordError } = await supabase
          .from('document_files')
          .insert({
            document_id: document.id,
            file_path: filePath,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
          });

        if (fileRecordError) {
          throw new Error(`${t('failedToCreateFileRecord')}: ${fileRecordError.message}`);
        }
      }

      // Show success message and redirect
      if (onSubmit) {
        onSubmit();
      } else {
        navigate(`/documents/${document.id}`, {
          state: { message: t('documentSubmittedSuccessfully') }
        });
      }
    } catch (err) {
      console.error('Error submitting document:', err);
      setError(err instanceof Error ? err.message : t('failedToSubmitDocument'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <FileText className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{t('submitDocumentForApproval')}</h2>
            <p className="text-sm text-gray-600">{t('uploadAndSubmitDocument')}</p>
          </div>
        </div>
      </CardHeader>

      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Input
                label={t('title')}
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder={t('enterDocumentTitle')}
                leftIcon={<FileText size={18} />}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                {t('description')}
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="block w-full rounded-md p-4 shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500 sm:text-sm mb-4"
                placeholder={t('describeDocumentPurpose')}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="approver_id" className="block text-sm font-medium text-gray-700 mb-1">
                {t('selectApprover')} <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  id="approver_id"
                  name="approver_id"
                  value={formData.approver_id}
                  onChange={handleInputChange}
                  required
                  className="block w-full pl-10 pr-3 py-2 rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">{t('chooseApprover')}</option>
                  {approvers.map((approver) => (
                    <option key={approver.id} value={approver.id}>
                      {approver.full_name} ({approver.email})
                      {approver.role === 'admin' && ` - ${t('administrator')}`}
                      {approver.department && ` - ${approver.department}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="note_to_approver" className="block text-sm font-medium text-gray-700 mb-2">
                {t('noteToApprover')}
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 text-gray-400" size={18} />
                <textarea
                  id="note_to_approver"
                  name="note_to_approver"
                  rows={3}
                  value={formData.note_to_approver}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-2 rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500 sm:text-sm mb-4"
                  placeholder={t('addSpecialInstructions')}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('files')} <span className="text-error-500">*</span>
              </label>
              <DocumentUploader
                onFilesSelected={setFiles}
                maxFiles={5}
                maxSize={10 * 1024 * 1024} // 10MB
                acceptedFileTypes={['.pdf', '.doc', '.docx']}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/documents')}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isSubmitting || files.length === 0}
              leftIcon={<Send size={16} />}
            >
              {isSubmitting ? t('submitting') : t('submitForApproval')}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
};

export default DocumentSubmissionForm;