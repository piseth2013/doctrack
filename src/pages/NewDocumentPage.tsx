import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { DocumentUploader } from '../components/documents/DocumentUploader';
import { useTranslation } from '../lib/translations';

export default function NewDocumentPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslation();

  const sanitizeFileName = (fileName: string): string => {
    // Generate a random suffix to ensure uniqueness
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    
    // Get the file extension
    const extension = fileName.split('.').pop() || '';
    
    // Create a base name by replacing non-alphanumeric characters with underscores
    const baseName = fileName
      .split('.')
      .slice(0, -1)
      .join('.')
      .replace(/[^a-zA-Z0-9\-._]/g, '_');
    
    // Combine with timestamp and random suffix to ensure uniqueness
    return `${baseName}_${timestamp}_${randomSuffix}.${extension}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Create the document
      const { data: document, error: documentError } = await supabase
        .from('documents')
        .insert({
          title,
          description,
          user_id: user.id,
        })
        .select()
        .single();

      if (documentError) throw documentError;
      if (!document) throw new Error('Failed to create document');

      // Upload each file
      for (const file of files) {
        // Sanitize the filename to ensure it's compatible with Supabase storage
        const safeFileName = sanitizeFileName(file.name);
        const filePath = `documents/${document.id}/${safeFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('document-files')
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        // Create document_files record
        const { error: fileRecordError } = await supabase
          .from('document_files')
          .insert({
            document_id: document.id,
            file_path: filePath,
            file_name: file.name, // Store the original filename in the database
            file_type: file.type,
            file_size: file.size,
          });

        if (fileRecordError) {
          throw new Error(`Failed to create file record: ${fileRecordError.message}`);
        }
      }

      // Navigate to the document detail page
      navigate(`/documents/${document.id}`);
    } catch (err) {
      setError(`Error creating document:\n\n${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{t('newDocument')}</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            {t('title')}
          </label>
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            {t('description')}
          </label>
          <textarea
            id="description"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t('files')}
          </label>
          <DocumentUploader
            onFilesSelected={setFiles}
            maxFiles={5}
            maxSize={5 * 1024 * 1024} // 5MB
            acceptedFileTypes={['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx']}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <pre className="whitespace-pre-wrap text-sm">{error}</pre>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/documents')}
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || files.length === 0}
          >
            {isSubmitting ? t('creating') : t('create')}
          </Button>
        </div>
      </form>
    </div>
  );
}