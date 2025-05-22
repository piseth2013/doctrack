import React, { useState, useEffect } from 'react';
import { Plus, Search, Building2, X, LayoutGrid, List } from 'lucide-react';
import { Card, CardBody, CardHeader, CardFooter } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Loader from '../../../components/ui/Loader';
import { supabase } from '../../../lib/supabase';
import { useTranslation } from '../../../lib/translations';

interface Office {
  id: string;
  name: string;
  location: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

interface OfficeFormData {
  name: string;
  location: string;
  phone: string;
  email: string;
}

const initialFormData: OfficeFormData = {
  name: '',
  location: '',
  phone: '',
  email: '',
};

const OfficesTab: React.FC = () => {
  const [offices, setOffices] = useState<Office[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<OfficeFormData>(initialFormData);
  const [editingOffice, setEditingOffice] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const t = useTranslation();

  const fetchOffices = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('offices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffices(data || []);
    } catch (error) {
      console.error('Error fetching offices:', error);
      setError('Failed to load offices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffices();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (!formData.name.trim()) {
        throw new Error('Office name is required');
      }

      if (editingOffice) {
        // Update existing office
        const { error } = await supabase
          .from('offices')
          .update({
            name: formData.name,
            location: formData.location || null,
            phone: formData.phone || null,
            email: formData.email || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingOffice);

        if (error) throw error;
      } else {
        // Create new office
        const { error } = await supabase
          .from('offices')
          .insert({
            name: formData.name,
            location: formData.location || null,
            phone: formData.phone || null,
            email: formData.email || null,
          });

        if (error) throw error;
      }

      // Reset form and refresh offices
      setFormData(initialFormData);
      setShowForm(false);
      setEditingOffice(null);
      await fetchOffices();
    } catch (error) {
      console.error('Error saving office:', error);
      setError(error instanceof Error ? error.message : 'Failed to save office');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (office: Office) => {
    setFormData({
      name: office.name,
      location: office.location || '',
      phone: office.phone || '',
      email: office.email || '',
    });
    setEditingOffice(office.id);
    setShowForm(true);
  };

  const handleDelete = async (officeId: string) => {
    if (!confirm(t('confirmDelete').replace('{item}', 'office'))) {
      return;
    }

    try {
      const { error } = await supabase
        .from('offices')
        .delete()
        .eq('id', officeId);

      if (error) throw error;
      await fetchOffices();
    } catch (error) {
      console.error('Error deleting office:', error);
      setError('Failed to delete office');
    }
  };

  const filteredOffices = offices.filter(office =>
    office.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (office.location && office.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderListView = () => (
    <Card>
      <div className="divide-y divide-gray-200">
        {filteredOffices.map((office) => (
          <div key={office.id} className="p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                  <Building2 className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{office.name}</h3>
                  {office.location && (
                    <p className="mt-1 text-sm text-gray-500">{office.location}</p>
                  )}
                  {office.phone && (
                    <p className="mt-1 text-sm text-gray-500">{office.phone}</p>
                  )}
                  {office.email && (
                    <p className="mt-1 text-sm text-gray-500">{office.email}</p>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(office)}
                >
                  {t('edit')}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(office.id)}
                >
                  {t('delete')}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredOffices.map((office) => (
        <Card key={office.id}>
          <CardBody>
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">{office.name}</h3>
                {office.location && (
                  <p className="mt-1 text-sm text-gray-500">{office.location}</p>
                )}
                {office.phone && (
                  <p className="mt-1 text-sm text-gray-500">{office.phone}</p>
                )}
                {office.email && (
                  <p className="mt-1 text-sm text-gray-500">{office.email}</p>
                )}
              </div>
            </div>
          </CardBody>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(office)}
            >
              {t('edit')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDelete(office.id)}
            >
              {t('delete')}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="lg" text="Loading offices..." />
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 text-sm text-error-700 bg-error-50 rounded-md">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex-1 flex items-center gap-4">
          <Input
            placeholder={t('searchPlaceholder').replace('{item}', 'offices')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={18} />}
          />
          <div className="flex items-center bg-white border border-gray-300 rounded-md p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${
                viewMode === 'grid'
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${
                viewMode === 'list'
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
        <Button 
          variant="primary" 
          leftIcon={<Plus size={16} />}
          onClick={() => {
            setFormData(initialFormData);
            setEditingOffice(null);
            setShowForm(true);
          }}
        >
          {t('addOffice')}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit}>
            <CardHeader className="flex flex-row items-center justify-between">
              <h3 className="text-lg font-medium">
                {editingOffice ? t('editOffice') : t('addOffice')}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setEditingOffice(null);
                  setFormData(initialFormData);
                }}
              >
                <X size={18} />
              </Button>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label={t('officeName')}
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              <Input
                label={t('officeLocation')}
                name="location"
                value={formData.location}
                onChange={handleInputChange}
              />
              <Input
                label={t('officePhone')}
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                type="tel"
              />
              <Input
                label={t('officeEmail')}
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                type="email"
              />
            </CardBody>
            <CardFooter className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingOffice(null);
                  setFormData(initialFormData);
                }}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
              >
                {editingOffice ? t('save') : t('addOffice')}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {filteredOffices.length > 0 ? (
        viewMode === 'grid' ? renderGridView() : renderListView()
      ) : (
        <Card>
          <CardBody className="py-12">
            <div className="text-center">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">{t('noOfficesFound')}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search' : 'Get started by adding an office'}
              </p>
              <div className="mt-6">
                <Button 
                  variant="primary" 
                  leftIcon={<Plus size={16} />}
                  onClick={() => {
                    setFormData(initialFormData);
                    setEditingOffice(null);
                    setShowForm(true);
                  }}
                >
                  {t('addOffice')}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default OfficesTab;