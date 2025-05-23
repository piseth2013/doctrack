import React, { useState, useCallback } from 'react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Users, Settings as SettingsIcon, Building2, Upload, X } from 'lucide-react';
import { useTranslation } from '../lib/translations';
import UsersPage from './UsersPage';
import OrganizationPage from './organization/OrganizationPage';
import Button from '../components/ui/Button';
import { uploadLogo } from '../lib/uploadLogo';

type SettingsSection = 'users' | 'general' | 'organization';

const SettingsPage: React.FC = () => {
  const t = useTranslation();
  const [activeSection, setActiveSection] = useState<SettingsSection>('users');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);

  const handleLogoUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const { url } = await uploadLogo(file);
      setUploadedLogo(url);
    } catch (err) {
      setError('Failed to upload logo. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const menuItems = [
    {
      id: 'users',
      label: t('users'),
      icon: <Users size={20} />,
    },
    {
      id: 'organization',
      label: t('organization'),
      icon: <Building2 size={20} />,
    },
    {
      id: 'general',
      label: t('general'),
      icon: <SettingsIcon size={20} />,
    },
  ] as const;

  const renderGeneralSettings = () => (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-medium text-gray-900">{t('general')}</h2>
      </CardHeader>
      <CardBody>
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-4">Logo Settings</h3>
            <div className="space-y-4">
              {uploadedLogo && (
                <div className="relative w-48 h-48 border rounded-lg overflow-hidden">
                  <img 
                    src={uploadedLogo} 
                    alt="Uploaded logo" 
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={() => setUploadedLogo(null)}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                  >
                    <X size={16} className="text-gray-600" />
                  </button>
                </div>
              )}
              
              <div>
                <label className="block">
                  <Button
                    variant="outline"
                    className="relative"
                    leftIcon={<Upload size={16} />}
                    isLoading={isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Upload Logo'}
                    <input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleLogoUpload}
                      accept="image/*"
                      disabled={isUploading}
                    />
                  </Button>
                </label>
                <p className="mt-2 text-sm text-gray-500">
                  Recommended: Square image, max 2MB
                </p>
                {error && (
                  <p className="mt-2 text-sm text-error-600">{error}</p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <p className="text-gray-500">{t('comingSoon')}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );

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

          {activeSection === 'organization' && (
            <OrganizationPage />
          )}

          {activeSection === 'general' && renderGeneralSettings()}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;