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
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardBody, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import ApprovalActions from '../components/documents/ApprovalActions';
import Loader from '../components/ui/Loader';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthWrapper';
import { useTranslation } from '../lib/translations';

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
  status: 'pending' | 'approved' | 'rejected' | 'needs_changes';
  user_id: string;
  approver_id: string | null;
  note_to_approver: string | null;
  approver_comment: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
  document_date: string;
  submitter: {
    full_name: string;
    email: string;
  };
  approver: {
    full_name: string;
    email: string;
  } | null;
  approved_by_user: {
    full_name: string;
    email: string;
  } | null;
  document_files?: DocumentFile[];
}

const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const t = useTranslation();
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
        // Fetch document with all related information
        const { data: documentData, error: documentError } = await supabase
          .from('documents')
          .select(`
            id, 
            title, 
            description, 
            status, 
            user_id,
            approver_id,
            note_to_approver,
            approver_comment,
            created_at, 
            updated_at,
            approved_at,
            approved_by,
            document_date,
            submitter:profiles!documents_user_id_fkey (
              full_name,
              email
            ),
            approver:profiles!documents_approver_id_fkey (
              full_name,
              email
            ),
            approved_by_user:profiles!documents_approved_by_fkey (
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

  const handleApprovalAction = async (action: 'approved' | 'rejected' | 'needs_changes', comment: string) => {
    if (!document || !id || !user) return;

    setIsUpdatingStatus(true);
    try {
      const updateData: any = {
        status: action,
        approver_comment: comment,
        updated_at: new Date().toISOString(),
        approved_by: user.id,
      };

      if (action === 'approved') {
        updateData.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Update local state
      setDocument({
        ...document,
        status: action,
        approver_comment: comment,
        updated_at: new Date().toISOString(),
        approved_at: action === 'approved' ? new Date().toISOString() : document.approved_at,
        approved_by: user.id,
        approved_by_user: {
          full_name: user.email || 'Unknown',
          email: user.email || '',
        },
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-warning-600" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-error-600" />;
      case 'needs_changes':
        return <AlertCircle className="w-5 h-5 text-warning-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const isApprover = user && document && user.id === document.approver_id;
  const isSubmitter = user && document && user.id === document.user_id;
  const canDelete = isSubmitter || (user && document && user.id === document.user_id);

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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Document not found</h1>
        <p className="text-gray-600 mb-6">{error || 'The requested document could not be found.'}</p>
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

      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {getStatusIcon(document.status)}
            <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge status={document.status as any} />
            <span className="text-sm text-gray-600">
              Last updated: {format(new Date(document.updated_at), 'MMM d, yyyy h:mm a')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Document Information */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Document Information</h2>
            </CardHeader>
            <CardBody>
              {document.description ? (
                <p className="text-gray-700 whitespace-pre-line mb-6">{document.description}</p>
              ) : (
                <p className="text-gray-500 italic mb-6">No description provided</p>
              )}

              {document.note_to_approver && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">Note to Approver:</h3>
                  <p className="text-sm text-blue-700">{document.note_to_approver}</p>
                </div>
              )}

              {document.approver_comment && (
                <div className={`border rounded-md p-4 mb-6 ${
                  document.status === 'approved' 
                    ? 'bg-success-50 border-success-200' 
                    : document.status === 'rejected'
                    ? 'bg-error-50 border-error-200'
                    : 'bg-warning-50 border-warning-200'
                }`}>
                  <div className="flex items-start gap-2">
                    <MessageSquare size={16} className={`mt-0.5 ${
                      document.status === 'approved' 
                        ? 'text-success-600' 
                        : document.status === 'rejected'
                        ? 'text-error-600'
                        : 'text-warning-600'
                    }`} />
                    <div>
                      <h3 className={`text-sm font-medium mb-1 ${
                        document.status === 'approved' 
                          ? 'text-success-800' 
                          : document.status === 'rejected'
                          ? 'text-error-800'
                          : 'text-warning-800'
                      }`}>
                        Approver Comment:
                      </h3>
                      <p className={`text-sm ${
                        document.status === 'approved' 
                          ? 'text-success-700' 
                          : document.status === 'rejected'
                          ? 'text-error-700'
                          : 'text-warning-700'
                      }`}>
                        {document.approver_comment}
                      </p>
                      {document.approved_by_user && (
                        <p className={`text-xs mt-1 ${
                          document.status === 'approved' 
                            ? 'text-success-600' 
                            : document.status === 'rejected'
                            ? 'text-error-600'
                            : 'text-warning-600'
                        }`}>
                          — {document.approved_by_user.full_name}
                          {document.approved_at && ` on ${format(new Date(document.approved_at), 'MMM d, yyyy')}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-6">
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
                  <p className="text-gray-500 italic">No files attached</p>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Approval Actions for Approvers */}
          {isApprover && (
            <ApprovalActions
              documentId={document.id}
              currentStatus={document.status}
              onApprovalAction={handleApprovalAction}
              isLoading={isUpdatingStatus}
            />
          )}
        </div>

        <div className="space-y-6">
          {/* Document Metadata */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Document Details</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Submitted By</h3>
                  <div className="mt-1 flex items-center">
                    <User size={16} className="text-gray-400 mr-2" />
                    <span className="text-gray-900">{document.submitter?.full_name || 'Unknown User'}</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500 ml-6">
                    {document.submitter?.email}
                  </div>
                </div>

                {document.approver && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Assigned Approver</h3>
                    <div className="mt-1 flex items-center">
                      <User size={16} className="text-gray-400 mr-2" />
                      <span className="text-gray-900">{document.approver.full_name}</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-500 ml-6">
                      {document.approver.email}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Submitted On</h3>
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
                  <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
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
            {canDelete && (
              <CardFooter className="flex justify-center">
                <Button
                  variant="danger"
                  leftIcon={<Trash2 size={16} />}
                  onClick={handleDeleteDocument}
                >
                  Delete Document
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetailPage;