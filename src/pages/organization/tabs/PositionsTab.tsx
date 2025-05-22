import React, { useState, useEffect } from 'react';
import { Plus, Search, Briefcase, X, LayoutGrid, List } from 'lucide-react';
import { Card, CardBody, CardHeader, CardFooter } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Loader from '../../../components/ui/Loader';
import { supabase } from '../../../lib/supabase';
import { useTranslation } from '../../../lib/translations';

interface Position {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface PositionFormData {
  name: string;
  description: string;
}

const initialFormData: PositionFormData = {
  name: '',
  description: '',
};

const PositionsTab: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<PositionFormData>(initialFormData);
  const [editingPosition, setEditingPosition] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const t = useTranslation();

  const fetchPositions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPositions(data || []);
    } catch (error) {
      console.error('Error fetching positions:', error);
      setError('Failed to load positions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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
        throw new Error('Position name is required');
      }

      if (editingPosition) {
        // Update existing position
        const { error } = await supabase
          .from('positions')
          .update({
            name: formData.name,
            description: formData.description || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPosition);

        if (error) throw error;
      } else {
        // Create new position
        const { error } = await supabase
          .from('positions')
          .insert({
            name: formData.name,
            description: formData.description || null,
          });

        if (error) throw error;
      }

      // Reset form and refresh positions
      setFormData(initialFormData);
      setShowForm(false);
      setEditingPosition(null);
      await fetchPositions();
    } catch (error) {
      console.error('Error saving position:', error);
      setError(error instanceof Error ? error.message : 'Failed to save position');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (position: Position) => {
    setFormData({
      name: position.name,
      description: position.description || '',
    });
    setEditingPosition(position.id);
    setShowForm(true);
  };

  const handleDelete = async (positionId: string) => {
    if (!confirm(t('confirmDelete').replace('{item}', 'position'))) {
      return;
    }

    try {
      const { error } = await supabase
        .from('positions')
        .delete()
        .eq('id', positionId);

      if (error) throw error;
      await fetchPositions();
    } catch (error) {
      console.error('Error deleting position:', error);
      setError('Failed to delete position');
    }
  };

  const filteredPositions = positions.filter(position =>
    position.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (position.description && position.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderListView = () => (
    <Card>
      <div className="divide-y divide-gray-200">
        {filteredPositions.map((position) => (
          <div key={position.id} className="p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                  <Briefcase className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{position.name}</h3>
                  {position.description && (
                    <p className="mt-1 text-sm text-gray-500">{position.description}</p>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(position)}
                >
                  {t('edit')}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(position.id)}
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
      {filteredPositions.map((position) => (
        <Card key={position.id}>
          <CardBody>
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-primary-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">{position.name}</h3>
                {position.description && (
                  <p className="mt-1 text-sm text-gray-500">{position.description}</p>
                )}
              </div>
            </div>
          </CardBody>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(position)}
            >
              {t('edit')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDelete(position.id)}
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
        <Loader size="lg" text="Loading positions..." />
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
            placeholder={t('searchPlaceholder').replace('{item}', 'positions')}
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
            setEditingPosition(null);
            setShowForm(true);
          }}
        >
          {t('addPosition')}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit}>
            <CardHeader className="flex flex-row items-center justify-between">
              <h3 className="text-lg font-medium">
                {editingPosition ? t('editPosition') : t('addPosition')}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setEditingPosition(null);
                  setFormData(initialFormData);
                }}
              >
                <X size={18} />
              </Button>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label={t('positionName')}
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('positionDescription')}
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
            </CardBody>
            <CardFooter className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingPosition(null);
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
                {editingPosition ? t('save') : t('addPosition')}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {filteredPositions.length > 0 ? (
        viewMode === 'grid' ? renderGridView() : renderListView()
      ) : (
        <Card>
          <CardBody className="py-12">
            <div className="text-center">
              <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">{t('noPositionsFound')}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search' : 'Get started by adding a position'}
              </p>
              <div className="mt-6">
                <Button 
                  variant="primary" 
                  leftIcon={<Plus size={16} />}
                  onClick={() => {
                    setFormData(initialFormData);
                    setEditingPosition(null);
                    setShowForm(true);
                  }}
                >
                  {t('addPosition')}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default PositionsTab;