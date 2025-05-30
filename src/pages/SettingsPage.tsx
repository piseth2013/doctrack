import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Users, Settings as SettingsIcon, Upload, Plus, Search, X } from 'lucide-react';
import { useTranslation } from '../lib/translations';
import UsersPage from './UsersPage';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { supabase } from '../lib/supabase';

type SettingsSection = 'users' | 'general';

interface Position {
  id: string;
  name: string;
  description: string | null;
}

interface PositionFormData {
  name: string;
  description: string;
}

const initialPositionForm: PositionFormData = {
  name: '',
  description: '',
};

const SettingsPage: React.FC = () => {
  const t = useTranslation();
  const [activeSection, setActiveSection] = useState<SettingsSection>('users');
  const [isUploading, setIsUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Position management state
  const [positions, setPositions] = useState<Position[]>([]);
  const [showPositionForm, setShowPositionForm] = useState(false);
  const [positionFormData, setPositionFormData] = useState<PositionFormData>(initialPositionForm);
  const [editingPositionId, setEditingPositionId] = useState<string | null>(null);
  const [isSubmittingPosition, setIsSubmittingPosition] = useState(false);
  const [positionError, setPositionError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogo();
    fetchPositions();
  }, []);

  const fetchLogo = async () => {
    try {
      const { data, error } = await supabase
        .from('logo_settings')
        .select('logo_url')
        .single();

      if (error) throw error;
      setLogoUrl(data?.logo_url);
    } catch (err) {
      console.error('Error fetching logo:', err);
    }
  };

  const fetchPositions = async () => {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .order('name');

      if (error) throw error;
      setPositions(data || []);
    } catch (err) {
      console.error('Error fetching positions:', err);
      setPositionError('Failed to load positions');
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('File size should be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;

      if (logoUrl) {
        const oldFileName = logoUrl.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('logoUpload')
            .remove([oldFileName]);
        }
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('logoUpload')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logoUpload')
        .getPublicUrl(fileName);

      const { data: settingsData, error: settingsError } = await supabase
        .from('logo_settings')
        .select('id')
        .single();

      if (settingsError) throw settingsError;

      const { error: updateError } = await supabase
        .from('logo_settings')
        .update({ 
          logo_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', settingsData.id);

      if (updateError) throw updateError;

      setLogoUrl(publicUrl);
    } catch (err) {
      console.error('Error uploading logo:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handlePositionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPosition(true);
    setPositionError(null);

    try {
      if (!positionFormData.name.trim()) {
        throw new Error('Position name is required');
      }

      if (editingPositionId) {
        const { error } = await supabase
          .from('positions')
          .update({
            name: positionFormData.name,
            description: positionFormData.description || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPositionId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('positions')
          .insert({
            name: positionFormData.name,
            description: positionFormData.description || null,
          });

        if (error) throw error;
      }

      await fetchPositions();
      setPositionFormData(initialPositionForm);
      setShowPositionForm(false);
      setEditingPositionId(null);
    } catch (err) {
      console.error('Error saving position:', err);
      setPositionError(err instanceof Error ? err.message : 'Failed to save position');
    } finally {
      setIsSubmittingPosition(false);
    }
  };

  const handleEditPosition = (position: Position) => {
    setPositionFormData({
      name: position.name,
      description: position.description || '',
    });
    setEditingPositionId(position.id);
    setShowPositionForm(true);
  };

  const handleDeletePosition = async (positionId: string) => {
    if (!confirm('Are you sure you want to delete this position?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('positions')
        .delete()
        .eq('id', positionId);

      if (error) throw error;
      await fetchPositions();
    } catch (err) {
      console.error('Error deleting position:', err);
      setPositionError('Failed to delete position');
    }
  };

  const menuItems = [
    {
      id: 'users',
      label: t('users'),
      icon: <Users size={20} />,
    },
    {
      id: 'general',
      label: t('general'),
      icon: <SettingsIcon size={20} />,
    },
  ] as const;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('settings')}</h1>
        <p className="text-gray-600 mt-1">{t('manageSystemUsers')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardBody className="p-2">
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeSection === item.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </CardBody>
        </Card>

        <div className="lg:col-span-3">
          {activeSection === 'users' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">{t('users')}</h2>
              </CardHeader>
              <CardBody className="p-0">
                <UsersPage />
              </CardBody>
            </Card>
          )}

          {activeSection === 'general' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-medium text-gray-900">{t('general')}</h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-4">Logo</h3>
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
                          {logoUrl ? (
                            <img 
                              src={logoUrl} 
                              alt="Logo" 
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <Upload size={24} className="text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              disabled={isUploading}
                            />
                            <Button
                              variant="outline"
                              leftIcon={<Upload size={16} />}
                              disabled={isUploading}
                            >
                              {isUploading ? 'Uploading...' : 'Upload Logo'}
                            </Button>
                          </div>
                          <p className="mt-2 text-sm text-gray-500">
                            Recommended size: 512x512px. Max file size: 2MB.
                          </p>
                          {error && (
                            <p className="mt-2 text-sm text-error-600">
                              {error}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Positions</h2>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus size={16} />}
                    onClick={() => {
                      setPositionFormData(initialPositionForm);
                      setEditingPositionId(null);
                      setShowPositionForm(true);
                    }}
                  >
                    Add Position
                  </Button>
                </CardHeader>
                <CardBody>
                  {positionError && (
                    <div className="mb-4 p-4 text-sm text-error-700 bg-error-50 rounded-md">
                      {positionError}
                    </div>
                  )}

                  {showPositionForm && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <form onSubmit={handlePositionSubmit}>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">
                              {editingPositionId ? 'Edit Position' : 'Add Position'}
                            </h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setShowPositionForm(false);
                                setEditingPositionId(null);
                                setPositionFormData(initialPositionForm);
                              }}
                            >
                              <X size={18} />
                            </Button>
                          </div>

                          <Input
                            label="Position Name"
                            name="name"
                            value={positionFormData.name}
                            onChange={(e) => setPositionFormData(prev => ({
                              ...prev,
                              name: e.target.value
                            }))}
                            required
                          />

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <textarea
                              name="description"
                              rows={3}
                              value={positionFormData.description}
                              onChange={(e) => setPositionFormData(prev => ({
                                ...prev,
                                description: e.target.value
                              }))}
                              className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            />
                          </div>

                          <div className="flex justify-end space-x-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowPositionForm(false);
                                setEditingPositionId(null);
                                setPositionFormData(initialPositionForm);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              variant="primary"
                              isLoading={isSubmittingPosition}
                            >
                              {editingPositionId ? 'Save Changes' : 'Add Position'}
                            </Button>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="divide-y divide-gray-200">
                    {positions.map((position) => (
                      <div
                        key={position.id}
                        className="py-4 flex items-center justify-between"
                      >
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {position.name}
                          </h3>
                          {position.description && (
                            <p className="mt-1 text-sm text-gray-500">
                              {position.description}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPosition(position)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeletePosition(position.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}

                    {positions.length === 0 && (
                      <p className="py-4 text-center text-gray-500">
                        No positions found. Add your first position.
                      </p>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;