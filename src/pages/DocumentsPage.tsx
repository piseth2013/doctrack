import React, { useEffect, useState } from 'react';
import { Filter, Search, Plus, FileText, RefreshCw } from 'lucide-react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import DocumentCard from '../components/documents/DocumentCard';
import SubmitterDashboard from '../components/documents/SubmitterDashboard';
import ApproverDashboard from '../components/documents/ApproverDashboard';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Loader from '../components/ui/Loader';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthWrapper';
import { useTranslation } from '../lib/translations';

interface Document {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'needs_changes';
  created_at: string;
  updated_at: string;
  user_id: string;
  approver_id: string | null;
  profiles: {
    full_name: string;
  };
}

const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || 'all';
  const view = searchParams.get('view') || 'my-submissions';
  const t = useTranslation();

  // Show success message if redirected from submission
  const [successMessage, setSuccessMessage] = useState<string | null>(
    location.state?.message || null
  );

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    fetchDocuments();
  }, [statusFilter, user]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('documents')
        .select(`
          id, 
          title, 
          description, 
          status, 
          created_at, 
          updated_at, 
          user_id,
          approver_id,
          profiles (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      setDocuments(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusFilterChange = (newStatus: string) => {
    setSearchParams({ status: newStatus, view });
  };

  const handleViewChange = (newView: string) => {
    setSearchParams({ view: newView, status: statusFilter });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleRetry = () => {
    fetchDocuments();
  };

  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ).filter(doc => statusFilter === 'all' || doc.status === statusFilter);

  if (error) {
    return (
      <Card>
        <CardBody className="py-12">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-error-100">
              <FileText className="h-6 w-6 text-error-600" />
            </div>
            <h3 className="mt-3 text-lg font-medium text-gray-900">Error</h3>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <div className="mt-6">
              <Button
                variant="primary"
                onClick={handleRetry}
                leftIcon={<RefreshCw size={16} />}
              >
                Try Again
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div>
      {successMessage && (
        <div className="mb-6 p-4 bg-success-50 border border-success-200 text-success-700 rounded-md">
          {successMessage}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600 mt-1">Manage and track your document submissions and approvals</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link to="/documents/new">
            <Button variant="primary" leftIcon={<Plus size={16} />}>
              Submit New Document
            </Button>
          </Link>
        </div>
      </div>

      {/* View Toggle */}
      <Card className="mb-6">
        <CardBody className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">View:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewChange('my-submissions')}
                  className={`px-3 py-1 text-sm rounded-full ${
                    view === 'my-submissions'
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  My Submissions
                </button>
                <button
                  onClick={() => handleViewChange('for-approval')}
                  className={`px-3 py-1 text-sm rounded-full ${
                    view === 'for-approval'
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  For My Approval
                </button>
                <button
                  onClick={() => handleViewChange('all')}
                  className={`px-3 py-1 text-sm rounded-full ${
                    view === 'all'
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  All Documents
                </button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Render appropriate dashboard based on view */}
      {view === 'my-submissions' && <SubmitterDashboard />}
      {view === 'for-approval' && <ApproverDashboard />}
      
      {view === 'all' && (
        <>
          <Card className="mb-6">
            <CardBody className="p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    leftIcon={<Search size={18} />}
                    fullWidth
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-gray-500 flex items-center">
                    <Filter size={16} className="mr-2" />
                    <span className="text-sm">Status:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleStatusFilterChange('all')}
                      className={`px-3 py-1 text-sm rounded-full ${
                        statusFilter === 'all'
                          ? 'bg-primary-100 text-primary-800'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => handleStatusFilterChange('pending')}
                      className={`px-3 py-1 text-sm rounded-full ${
                        statusFilter === 'pending'
                          ? 'bg-warning-100 text-warning-800'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => handleStatusFilterChange('needs_changes')}
                      className={`px-3 py-1 text-sm rounded-full ${
                        statusFilter === 'needs_changes'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      Needs Changes
                    </button>
                    <button
                      onClick={() => handleStatusFilterChange('approved')}
                      className={`px-3 py-1 text-sm rounded-full ${
                        statusFilter === 'approved'
                          ? 'bg-success-100 text-success-800'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      Approved
                    </button>
                    <button
                      onClick={() => handleStatusFilterChange('rejected')}
                      className={`px-3 py-1 text-sm rounded-full ${
                        statusFilter === 'rejected'
                          ? 'bg-error-100 text-error-800'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      Rejected
                    </button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader size="lg" text="Loading documents..." />
            </div>
          ) : (
            <div>
              {filteredDocuments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDocuments.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      id={doc.id}
                      title={doc.title}
                      description={doc.description}
                      status={doc.status}
                      createdAt={doc.created_at}
                      updatedAt={doc.updated_at}
                      userName={doc.profiles?.full_name || 'Unknown User'}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardBody className="py-12">
                    <div className="text-center">
                      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                        <FileText className="h-6 w-6 text-gray-600" />
                      </div>
                      <h3 className="mt-3 text-lg font-medium text-gray-900">No documents found</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        {statusFilter !== 'all'
                          ? `No documents with status "${statusFilter}" found.`
                          : 'No documents have been submitted yet.'}
                      </p>
                      <div className="mt-6">
                        <Link to="/documents/new">
                          <Button variant="primary" leftIcon={<Plus size={16} />}>
                            Submit First Document
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DocumentsPage;