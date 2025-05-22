import React, { useEffect, useState } from 'react';
import { Filter, Search, Plus, FileText } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import DocumentCard from '../components/documents/DocumentCard';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Loader from '../components/ui/Loader';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../lib/translations';

interface Document {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  user_id: string;
  profiles: {
    full_name: string;
  };
}

const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || 'all';
  const t = useTranslation();

  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('documents')
          .select(`
            id, 
            title, 
            description, 
            status, 
            created_at, 
            updated_at, 
            user_id,
            profiles (
              full_name
            )
          `)
          .order('created_at', { ascending: false });

        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        setDocuments(data || []);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [statusFilter]);

  const handleStatusFilterChange = (newStatus: string) => {
    setSearchParams({ status: newStatus });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('documents')}</h1>
          <p className="text-gray-600 mt-1">{t('manageSystemUsers')}</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link to="/documents/new">
            <Button variant="primary" leftIcon={<Plus size={16} />}>
              {t('newDocument')}
            </Button>
          </Link>
        </div>
      </div>

      <Card className="mb-6">
        <CardBody className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder={t('searchDocuments')}
                value={searchQuery}
                onChange={handleSearchChange}
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
                <button
                  onClick={() => handleStatusFilterChange('all')}
                  className={`px-3 py-1 text-sm rounded-full ${
                    statusFilter === 'all'
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {t('documents')}
                </button>
                <button
                  onClick={() => handleStatusFilterChange('pending')}
                  className={`px-3 py-1 text-sm rounded-full ${
                    statusFilter === 'pending'
                      ? 'bg-warning-100 text-warning-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {t('pending')}
                </button>
                <button
                  onClick={() => handleStatusFilterChange('approved')}
                  className={`px-3 py-1 text-sm rounded-full ${
                    statusFilter === 'approved'
                      ? 'bg-success-100 text-success-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {t('approved')}
                </button>
                <button
                  onClick={() => handleStatusFilterChange('rejected')}
                  className={`px-3 py-1 text-sm rounded-full ${
                    statusFilter === 'rejected'
                      ? 'bg-error-100 text-error-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {t('rejected')}
                </button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader size="lg" text={t('loading')} />
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
                  <h3 className="mt-3 text-lg font-medium text-gray-900">{t('noDocumentsFound')}</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {statusFilter !== 'all'
                      ? `${t('noDocumentsFound')}. ${t('tryChangingFilter')}`
                      : t('createFirstDocument')}
                  </p>
                  <div className="mt-6">
                    <Link to="/documents/new">
                      <Button variant="primary" leftIcon={<Plus size={16} />}>
                        {t('newDocument')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;