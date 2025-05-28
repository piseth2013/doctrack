import React, { useEffect, useState } from 'react';
import { LayoutDashboard, FileText, Users, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import Loader from '../components/ui/Loader';
import { useTranslation } from '../lib/translations';

interface DocumentCounts {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface RecentDocument {
  id: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const DashboardPage: React.FC = () => {
  const [documentCounts, setDocumentCounts] = useState<DocumentCounts>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslation();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get document counts using a more efficient query with count
        const { data: countData, error: countError } = await supabase
          .from('documents')
          .select('status', { count: 'exact' });

        if (countError) {
          console.error('Error fetching document counts:', countError);
          throw new Error('Failed to fetch document counts');
        }

        const counts = {
          total: countData?.length || 0,
          pending: countData?.filter(doc => doc.status === 'pending').length || 0,
          approved: countData?.filter(doc => doc.status === 'approved').length || 0,
          rejected: countData?.filter(doc => doc.status === 'rejected').length || 0,
        };

        // Get recent documents with pagination
        const { data: recentDocs, error: recentError } = await supabase
          .from('documents')
          .select('id, title, status, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentError) {
          console.error('Error fetching recent documents:', recentError);
          throw new Error('Failed to fetch recent documents');
        }

        // Get user count with optimized query
        const { count: userCountData, error: userError } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true });

        if (userError) {
          console.error('Error fetching user count:', userError);
          throw new Error('Failed to fetch user count');
        }

        setDocumentCounts(counts);
        setRecentDocuments(recentDocs || []);
        setUserCount(userCountData || 0);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center py-20">
        <Loader size="lg" text="Loading dashboard data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-error-100 flex items-center justify-center text-error-600 mb-4">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Dashboard</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard')}</h1>
        <p className="text-gray-600 mt-1">{t('overview')}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary-500 to-primary-700 text-white">
          <CardBody className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-white/20">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-white/80 text-sm">{t('totalDocuments')}</p>
              <h3 className="text-2xl font-bold">{documentCounts.total}</h3>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-warning-500 to-warning-700 text-white">
          <CardBody className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-white/20">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-white/80 text-sm">{t('pending')}</p>
              <h3 className="text-2xl font-bold">{documentCounts.pending}</h3>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-success-500 to-success-700 text-white">
          <CardBody className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-white/20">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-white/80 text-sm">{t('approved')}</p>
              <h3 className="text-2xl font-bold">{documentCounts.approved}</h3>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-error-500 to-error-700 text-white">
          <CardBody className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-white/20">
              <XCircle size={24} />
            </div>
            <div>
              <p className="text-white/80 text-sm">{t('rejected')}</p>
              <h3 className="text-2xl font-bold">{documentCounts.rejected}</h3>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">{t('recentDocuments')}</h2>
              <Link 
                to="/documents" 
                className="text-sm text-primary-600 hover:text-primary-800"
              >
                {t('documents')}
              </Link>
            </CardHeader>
            <div className="divide-y divide-gray-200">
              {recentDocuments.length > 0 ? (
                recentDocuments.map((doc) => (
                  <Link key={doc.id} to={`/documents/${doc.id}`}>
                    <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 mr-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                              <FileText size={20} />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">{doc.title}</h3>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={doc.status} />
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="px-6 py-8 text-center text-gray-500">
                  <p>{t('noDocumentsFound')}</p>
                  <Link 
                    to="/documents/new" 
                    className="inline-block mt-2 text-sm text-primary-600 hover:text-primary-800"
                  >
                    {t('createFirstDocument')}
                  </Link>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">{t('quickLinks')}</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <Link 
                  to="/documents/new"
                  className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 mr-3">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{t('uploadNewDocument')}</h3>
                    <p className="text-xs text-gray-500">{t('newDocument')}</p>
                  </div>
                </Link>
                
                <Link 
                  to="/documents?status=pending"
                  className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-warning-100 flex items-center justify-center text-warning-700 mr-3">
                    <Clock size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{t('pendingDocuments')}</h3>
                    <p className="text-xs text-gray-500">{t('pending')}</p>
                  </div>
                </Link>
                
                <Link 
                  to="/users"
                  className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-700 mr-3">
                    <Users size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{t('manageUsers')}</h3>
                    <p className="text-xs text-gray-500">{t('users')}</p>
                  </div>
                </Link>
              </div>
            </CardBody>
          </Card>

          <Card className="mt-5">
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">{t('systemStats')}</h2>
            </CardHeader>
            <CardBody>
              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 mr-3">
                    <Users size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{t('totalUsers')}</h3>
                  </div>
                </div>
                <span className="text-xl font-bold text-gray-900">{userCount}</span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;