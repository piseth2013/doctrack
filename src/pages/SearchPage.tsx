import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, FileText, Eye, X, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import StatusBadge from '../components/ui/StatusBadge';
import Loader from '../components/ui/Loader';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthWrapper';
import { useTranslation } from '../lib/translations';

interface SearchFilters {
  title: string;
  description: string;
  dateFrom: string;
  dateTo: string;
  status: string;
  submitter: string;
}

interface SearchResult {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'needs_changes';
  created_at: string;
  updated_at: string;
  document_date: string;
  user_id: string;
  approver_id: string | null;
  submitter: {
    full_name: string;
    email: string;
  };
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

const ITEMS_PER_PAGE = 10;

const SearchPage: React.FC = () => {
  const { user } = useAuth();
  const t = useTranslation();
  
  const [filters, setFilters] = useState<SearchFilters>({
    title: '',
    description: '',
    dateFrom: '',
    dateTo: '',
    status: '',
    submitter: '',
  });
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  
  const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedResults = results.slice(startIndex, endIndex);

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      title: '',
      description: '',
      dateFrom: '',
      dateTo: '',
      status: '',
      submitter: '',
    });
    setResults([]);
    setHasSearched(false);
    setCurrentPage(1);
    setTotalResults(0);
  };

  const buildSearchQuery = () => {
    let query = supabase
      .from('documents')
      .select(`
        id,
        title,
        description,
        status,
        created_at,
        updated_at,
        document_date,
        user_id,
        approver_id,
        submitter:profiles!documents_user_id_fkey (
          full_name,
          email
        ),
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
      `);

    // Apply filters
    if (filters.title.trim()) {
      query = query.ilike('title', `%${filters.title.trim()}%`);
    }

    if (filters.description.trim()) {
      query = query.ilike('description', `%${filters.description.trim()}%`);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', `${filters.dateFrom}T00:00:00.000Z`);
    }

    if (filters.dateTo) {
      query = query.lte('created_at', `${filters.dateTo}T23:59:59.999Z`);
    }

    return query.order('created_at', { ascending: false });
  };

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setCurrentPage(1);

    try {
      const query = buildSearchQuery();
      const { data, error: searchError } = await query;

      if (searchError) throw searchError;

      let filteredResults = data || [];

      // Client-side filtering for submitter name (since we can't easily do this in the query)
      if (filters.submitter.trim()) {
        filteredResults = filteredResults.filter(doc =>
          doc.submitter?.full_name.toLowerCase().includes(filters.submitter.toLowerCase()) ||
          doc.submitter?.email.toLowerCase().includes(filters.submitter.toLowerCase())
        );
      }

      setResults(filteredResults);
      setTotalResults(filteredResults.length);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : t('failedToFetchDocuments'));
      setResults([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const renderCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {paginatedResults.map((document) => (
        <Card key={document.id} hoverable className="h-full">
          <CardBody>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                  {document.title}
                </h3>
                <StatusBadge status={document.status as any} className="mb-2" />
              </div>
              <div className="ml-3">
                <Link to={`/documents/${document.id}`}>
                  <Button variant="outline" size="sm" leftIcon={<Eye size={14} />}>
                    {t('view')}
                  </Button>
                </Link>
              </div>
            </div>
            
            {document.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                {document.description}
              </p>
            )}
            
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center">
                <FileText size={14} className="mr-2" />
                <span>{t('submittedBy')}: {document.submitter?.full_name}</span>
              </div>
              <div className="flex items-center">
                <Calendar size={14} className="mr-2" />
                <span>{t('date')}: {format(new Date(document.created_at), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center">
                <FileText size={14} className="mr-2" />
                <span>{document.document_files?.length || 0} {t('files')}</span>
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );

  const renderTableView = () => (
    <Card>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('document')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('submitter')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('date')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('files')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedResults.map((document) => (
              <tr key={document.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 line-clamp-1">
                      {document.title}
                    </div>
                    {document.description && (
                      <div className="text-sm text-gray-500 line-clamp-2 mt-1">
                        {document.description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={document.status as any} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div>{document.submitter?.full_name}</div>
                  <div className="text-gray-500">{document.submitter?.email}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {format(new Date(document.created_at), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {document.document_files?.length || 0}
                </td>
                <td className="px-6 py-4">
                  <Link to={`/documents/${document.id}`}>
                    <Button variant="outline" size="sm" leftIcon={<Eye size={14} />}>
                      {t('view')}
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          {t('showing')} {startIndex + 1} {t('to')} {Math.min(endIndex, totalResults)} {t('of')} {totalResults} {t('results')}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            leftIcon={<ChevronLeft size={16} />}
          >
            {t('previous')}
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    currentPage === pageNum
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            rightIcon={<ChevronRight size={16} />}
          >
            {t('next')}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('searchDocuments')}</h1>
          <p className="text-gray-600 mt-1">{t('findDocumentsAdvancedFilters')}</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter size={16} />}
          >
            {showFilters ? t('hideFilters') : t('showFilters')}
          </Button>
          <div className="flex items-center bg-white border border-gray-300 rounded-md p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2 py-1 text-sm rounded ${
                viewMode === 'cards'
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('cards')}
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2 py-1 text-sm rounded ${
                viewMode === 'table'
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('table')}
            </button>
          </div>
        </div>
      </div>

      {/* Search Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">{t('searchFilters')}</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                leftIcon={<X size={16} />}
              >
                {t('clearAll')}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <Input
                label={t('title')}
                placeholder={t('searchByDocumentTitle')}
                value={filters.title}
                onChange={(e) => handleFilterChange('title', e.target.value)}
                leftIcon={<Search size={18} />}
              />
              
              <Input
                label={t('description')}
                placeholder={t('searchByDescription')}
                value={filters.description}
                onChange={(e) => handleFilterChange('description', e.target.value)}
                leftIcon={<FileText size={18} />}
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('status')}
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">{t('allStatuses')}</option>
                  <option value="pending">{t('pending')}</option>
                  <option value="approved">{t('approved')}</option>
                  <option value="rejected">{t('rejected')}</option>
                  <option value="needs_changes">{t('needsChanges')}</option>
                </select>
              </div>
              
              <Input
                label={t('dateFrom')}
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                leftIcon={<Calendar size={18} />}
              />
              
              <Input
                label={t('dateTo')}
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                leftIcon={<Calendar size={18} />}
              />
              
              <Input
                label={t('submitter')}
                placeholder={t('searchBySubmitterName')}
                value={filters.submitter}
                onChange={(e) => handleFilterChange('submitter', e.target.value)}
                leftIcon={<Search size={18} />}
              />
            </div>
            
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={handleSearch}
                isLoading={isLoading}
                leftIcon={<Search size={16} />}
              >
                {t('searchDocumentsButton')}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="bg-error-50 border-error-200">
          <CardBody className="flex items-center justify-between">
            <div className="text-error-700">{error}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSearch}
              leftIcon={<RefreshCw size={16} />}
            >
              {t('retry')}
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader size="lg" text={t('searchingDocuments')} />
        </div>
      )}

      {/* Results */}
      {!isLoading && hasSearched && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              {t('searchResults')} ({totalResults} {t('found')})
            </h2>
          </div>

          {results.length > 0 ? (
            <>
              {viewMode === 'cards' ? renderCardView() : renderTableView()}
              {renderPagination()}
            </>
          ) : (
            <Card>
              <CardBody className="py-12">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                    <Search className="h-6 w-6 text-gray-600" />
                  </div>
                  <h3 className="mt-3 text-lg font-medium text-gray-900">{t('noDocumentsFound')}</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {t('tryAdjustingSearchFilters')}
                  </p>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* Initial State */}
      {!hasSearched && !isLoading && (
        <Card>
          <CardBody className="py-12">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100">
                <Search className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="mt-3 text-lg font-medium text-gray-900">{t('readyToSearch')}</h3>
              <p className="mt-2 text-sm text-gray-500">
                {t('useFiltersAboveToSearch')}
              </p>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default SearchPage;