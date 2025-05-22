import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  User, 
  Download, 
  Eye, 
  Trash2,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardBody, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import StatusUpdater from '../components/documents/StatusUpdater';
import Loader from '../components/ui/Loader';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthWrapper';

interface DocumentFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

interface Document {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  user_id: string;
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
  document_files?: DocumentFile[];
}

const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [document, setDocument] = useState<Document | null>(null);
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        // Fetch document with author information
        const { data: documentData, error: documentError } = await supabase
          .from('documents')
          .select(`
            id, 
            title, 
            description, 
            status, 
            user_id, 
            created_at, 
            updated_at,
            profiles (
              full_name,
              email
            )
          `)
          .eq('id', id)
          .single();

        if (documentError) {
          throw documentError;
        }

        // Fetch document files
        const { data: filesData, error: filesError } = await supabase
          .from('document_files')
          .select('*')
          .eq('document_id', id)
          .order('created_at', { ascending: false });

        if (filesError) {
          throw filesError;
        }

        setDocument(documentData);
        setFiles(filesData || []);
      } catch (error) {
        console.error('Error fetching document:', error);
        setError('Failed to load document details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  const handleStatusChange = async (newStatus: 'pending' | 'approved' | 'rejected') => {
    if (!document || !id) return;

    setIsUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('documents')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Update local state
      setDocument({
        ...document,
        status: newStatus,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating document status:', error);
      setError('Failed to update document status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!document || !id) return;

    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      // Delete document files from storage
      for (const file of files) {
        await supabase.storage
          .from('document-files')
          .remove([file.file_path]);
      }

      // Delete document files records
      await supabase
        .from('document_files')
        .delete()
        .eq('document_id', id);

      // Delete document record
      await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      // Navigate back to documents list
      navigate('/documents');
    } catch (error) {
      console.error('Error deleting document:', error);
      setError('Failed to delete document');
      setIsLoading(false);
    }
  };

  const getFileUrl = async (filePath: string) => {
    const { data } = await supabase.storage
      .from('document-files')
      .createSignedUrl(filePath, 60); // 60 seconds expiry

    return data?.signedUrl;
  };

  const handleDownloadFile = async (file: DocumentFile) => {
    try {
      const url = await getFileUrl(file.file_path);
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Failed to download file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="lg" text="Loading document details..." />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <div className="text-error-600 mb-4">
          <FileText size={48} className="mx-auto" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Document Not Found</h1>
        <p className="text-gray-600 mb-6">{error || 'The requested document could not be found'}</p>
        <Button variant="primary" onClick={() => navigate('/documents')}>
          Back to Documents
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Button
          variant="ghost"
          leftIcon={<ArrowLeft size={16} />}
          onClick={() => navigate('/documents')}
        >
          Back to Documents
        </Button>
      </div>

      {error && (
        <div className="bg-error-50 text-error-700 p-4 rounded-md text-sm mb-6">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
          <div className="flex items-center mt-2">
            <StatusBadge status={document.status} />
            <span className="mx-2 text-gray-400">•</span>
            <span className="text-sm text-gray-600">
              Last updated: {format(new Date(document.updated_at), 'MMM d, yyyy h:mm a')}
            </span>
          </div>
        </div>
        <StatusUpdater
          currentStatus={document.status}
          onStatusChange={handleStatusChange}
          isLoading={isUpdatingStatus}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Document Details</h2>
            </CardHeader>
            <CardBody>
              {document.description ? (
                <p className="text-gray-700 whitespace-pre-line">{document.description}</p>
              ) : (
                <p className="text-gray-500 italic">No description provided</p>
              )}

              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="text-base font-medium text-gray-900 mb-4">Document Files</h3>
                {files.length > 0 ? (
                  <div className="space-y-3">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 flex items-center justify-center bg-primary-100 rounded-md text-primary-700 mr-3">
                            <FileText size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800 truncate max-w-xs">
                              {file.file_name}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatFileSize(file.file_size)} • Uploaded {format(new Date(file.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Eye size={14} />}
                            onClick={() => handleDownloadFile(file)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Download size={14} />}
                            onClick={() => handleDownloadFile(file)}
                          >
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No files attached to this document</p>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Document Information</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created by</h3>
                  <div className="mt-1 flex items-center">
                    <User size={16} className="text-gray-400 mr-2" />
                    <span className="text-gray-900">{document.profiles?.full_name || 'Unknown User'}</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500 ml-6">
                    {document.profiles?.email}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created on</h3>
                  <div className="mt-1 flex items-center">
                    <Calendar size={16} className="text-gray-400 mr-2" />
                    <span className="text-gray-900">
                      {format(new Date(document.created_at), 'MMMM d, yyyy')}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500 ml-6">
                    {format(new Date(document.created_at), 'h:mm a')}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last updated</h3>
                  <div className="mt-1 flex items-center">
                    <Calendar size={16} className="text-gray-400 mr-2" />
                    <span className="text-gray-900">
                      {format(new Date(document.updated_at), 'MMMM d, yyyy')}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500 ml-6">
                    {format(new Date(document.updated_at), 'h:mm a')}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Document ID</h3>
                  <div className="mt-1 flex items-center">
                    <span className="text-xs font-mono bg-gray-100 p-1 rounded text-gray-600 w-full truncate">
                      {document.id}
                    </span>
                  </div>
                </div>
              </div>
            </CardBody>
            <CardFooter className="flex justify-center">
              <Button
                variant="danger"
                leftIcon={<Trash2 size={16} />}
                onClick={handleDeleteDocument}
              >
                Delete Document
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetailPage;