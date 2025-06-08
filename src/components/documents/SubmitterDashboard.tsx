import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, FileText, User, Calendar, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import StatusBadge from '../ui/StatusBadge';
import Loader from '../ui/Loader';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthWrapper';
import { useTranslation } from '../../lib/translations';
import { format } from 'date-fns';

interface SubmittedDocument {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'needs_changes';
  note_to_approver: string | null;
  approver_comment: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approver: {
    full_name: string;
    email: string;
  } | null;
  document_files: Array<{
    id: string;
    file_name: string;
    file_type: string;
    file_size: number;
  }>;
}

const SubmitterDashboard: React.FC = () => {
  const { user } = useAuth();
  const t = useTranslation();
  const [documents, setDocuments] = useState<SubmittedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchSubmittedDocuments();
  }, [user]);

  const fetchSubmittedDocuments = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          title,
          description,
          status,
          note_to_approver,
          approver_comment,
          created_at,
          updated_at,
          approved_at,
          approver:profiles!documents_approver_id_fkey (
            full_name,
            email
          ),
          document_files (
            id,
            file_name,
            file_type,
            file_size
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error('Error fetching submitted documents:', err);
      setError(t('failedToLoadSubmittedDocuments'));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusCount = (status: string) => {
    if (status === 'all') return documents.length;
    return documents.filter(doc => doc.status === status).length;
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (doc.approver?.full_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const canResubmit = (document: SubmittedDocument) => {
    return document.status === 'needs_changes';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="lg" text={t('loadingSubmittedDocuments')} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('mySubmissions')}</h1>
          <p className="text-gray-600 mt-1">{t('trackSubmittedDocuments')}</p>
        </div>
        <Link to="/documents/new">
          <Button variant="primary" leftIcon={<Plus size={16} />}>
            {t('submitNewDocument')}
          </Button>
        </Link>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white">
          <CardBody className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-white/20">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-white/80 text-sm">{t('totalSubmitted')}</p>
              <h3 className="text-2xl font-bold">{getStatusCount('all')}</h3>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-warning-500 to-warning-700 text-white">
          <CardBody className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-white/20">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-white/80 text-sm">{t('pending')}</p>
              <h3 className="text-2xl font-bold">{getStatusCount('pending')}</h3>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-success-500 to-success-700 text-white">
          <CardBody className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-white/20">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-white/80 text-sm">{t('approved')}</p>
              <h3 className="text-2xl font-bold">{getStatusCount('approved')}</h3>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-700 text-white">
          <CardBody className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-white/20">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-white/80 text-sm">{t('needsChanges')}</p>
              <h3 className="text-2xl font-bold">{getStatusCount('needs_changes')}</h3>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder={t('searchYourDocuments')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
                fullWidth
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="text-gray-500 flex items-center">
                <Filter size={16} className="mr-2" />
                <span className="text-sm">{t('status')}:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: t('all'), count: getStatusCount('all') },
                  { key: 'pending', label: t('pending'), count: getStatusCount('pending') },
                  { key: 'needs_changes', label: t('needsChanges'), count: getStatusCount('needs_changes') },
                  { key: 'approved', label: t('approved'), count: getStatusCount('approved') },
                  { key: 'rejected', label: t('rejected'), count: getStatusCount('rejected') },
                ].map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(key)}
                    className={`px-3 py-1 text-sm rounded-full flex items-center gap-1 ${
                      statusFilter === key
                        ? 'bg-primary-100 text-primary-800'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {label} ({count})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Documents List */}
      {error && (
        <Card className="bg-error-50 border-error-200">
          <CardBody className="text-error-700">
            {error}
          </CardBody>
        </Card>
      )}

      {filteredDocuments.length > 0 ? (
        <div className="space-y-4">
          {filteredDocuments.map((document) => (
            <Card key={document.id} hoverable>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-primary-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {document.title}
                          </h3>
                          <StatusBadge status={document.status as any} />
                        </div>
                        
                        {document.description && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {document.description}
                          </p>
                        )}
                        
                        {document.approver_comment && (
                          <div className={`border rounded-md p-3 mb-3 ${
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
                                <p className={`text-sm font-medium ${
                                  document.status === 'approved' 
                                    ? 'text-success-800' 
                                    : document.status === 'rejected'
                                    ? 'text-error-800'
                                    : 'text-warning-800'
                                }`}>
                                  {t('approverComment')}:
                                </p>
                                <p className={`text-sm ${
                                  document.status === 'approved' 
                                    ? 'text-success-700' 
                                    : document.status === 'rejected'
                                    ? 'text-error-700'
                                    : 'text-warning-700'
                                }`}>
                                  {document.approver_comment}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          {document.approver && (
                            <div className="flex items-center">
                              <User size={14} className="mr-1" />
                              <span>{t('approver')}: {document.approver.full_name}</span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-1" />
                            <span>{t('submitted')}: {format(new Date(document.created_at), 'MMM d, yyyy')}</span>
                          </div>
                          {document.approved_at && (
                            <div className="flex items-center">
                              <Calendar size={14} className="mr-1" />
                              <span>{t('reviewed')}: {format(new Date(document.approved_at), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <FileText size={14} className="mr-1" />
                            <span>{document.document_files?.length || 0} {t('files')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 ml-4 flex gap-2">
                    <Link to={`/documents/${document.id}`}>
                      <Button variant="outline" size="sm">
                        {t('viewDetails')}
                      </Button>
                    </Link>
                    {canResubmit(document) && (
                      <Link to={`/documents/new?resubmit=${document.id}`}>
                        <Button variant="primary" size="sm">
                          {t('resubmit')}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardBody className="py-12">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                <FileText className="h-6 w-6 text-gray-600" />
              </div>
              <h3 className="mt-3 text-lg font-medium text-gray-900">{t('noDocumentsFound')}</h3>
              <p className="mt-2 text-sm text-gray-500">
                {statusFilter !== 'all'
                  ? t('noDocumentsWithStatus').replace('{status}', statusFilter)
                  : t('noDocumentsSubmittedYet')}
              </p>
              <div className="mt-6">
                <Link to="/documents/new">
                  <Button variant="primary" leftIcon={<Plus size={16} />}>
                    {t('submitFirstDocument')}
                  </Button>
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default SubmitterDashboard;