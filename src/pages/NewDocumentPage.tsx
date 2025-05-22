import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ArrowLeft } from 'lucide-react';
import { Card, CardBody, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import DocumentUploader from '../components/documents/DocumentUploader';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthWrapper';
import { useTranslation } from '../lib/translations';

interface FileWithPreview extends File {
  preview?: string;
}

const NewDocumentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const t = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (files.length === 0) {
      setError('At least one document file is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // 1. Create document record with auto-generated UUID
      const documentId = crypto.randomUUID();
      const { data: document, error: documentError } = await supabase
        .from('documents')
        .insert({
          id: documentId,
          title,
          description: description || null,
          status: 'pending',
          user_id: user?.id,
        })
        .select('*')
        .single();

      if (documentError || !document) {
        throw new Error(documentError?.message || 'Failed to create document');
      }

      // 2. Upload files to Storage
      const filePromises = files.map(async (file) => {
        const filePath = `documents/${documentId}/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('document-files')
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        // 3. Create file record
        const { error: fileRecordError } = await supabase
          .from('document_files')
          .insert({
            document_id: documentId,
            file_path: filePath,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
          });

        if (fileRecordError) {
          throw new Error(`Failed to record file ${file.name}: ${fileRecordError.message}`);
        }
      });

      await Promise.all(filePromises);
      
      // Success - navigate to document page
      navigate(`/documents/${documentId}`);
    } catch (error) {
      console.error('Error creating document:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          leftIcon={<ArrowLeft size={16} />}
          onClick={() => navigate('/documents')}
          className="text-gray-600 hover:text-gray-900"
        >
          {t('backToDocuments')}
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('uploadNewDocument')}</h1>
        <p className="mt-2 text-gray-600">{t('newDocument')}</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">{t('documentInformation')}</h2>
          </CardHeader>

          <CardBody className="space-y-6">
            {error && (
              <div className="bg-error-50 text-error-700 p-4 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <Input
                label={t('documentTitle')}
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('documentTitle')}
                required
                fullWidth
                className="bg-white"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                {t('description')}
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white"
                placeholder={t('description')}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('documentFiles')}
              </label>
              <DocumentUploader onFilesSelected={setFiles} />
            </div>
          </CardBody>

          <CardFooter className="flex justify-end bg-gray-50">
            <Button
              type="submit"
              variant="primary"
              leftIcon={<Upload size={16} />}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {t('uploadNewDocument')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default NewDocumentPage;