import React, { useState } from 'react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Users, Settings as SettingsIcon, Building2, Upload } from 'lucide-react';
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset messages
    setError(null);
    setSuccessMessage(null);
    setIsUploading(true);

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('File size should be less than 2MB');
      }

      const { url } = await uploadLogo(file);
      setSuccessMessage('Logo uploaded successfully');
      
      // You might want to store the URL in your site settings or update the UI
      console.log('Logo URL:', url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setIsUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

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

          {activeSection === 'general' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">{t('general')}</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-4">Logo Settings</h3>
                    <div className="max-w-xl">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Logo
                      </label>
                      <div className="mt-1 flex items-center">
                        <Button
                          variant="outline"
                          className="relative"
                          leftIcon={<Upload size={16} />}
                          isLoading={isUploading}
                        >
                          {isUploading ? 'Uploading...' : 'Choose File'}
                          <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleLogoUpload}
                            accept="image/*"
                            disabled={isUploading}
                          />
                        </Button>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Recommended size: 200x50 pixels. Max file size: 2MB.
                        Supported formats: PNG, JPG, GIF
                      </p>
                      {error && (
                        <p className="mt-2 text-sm text-error-600">{error}</p>
                      )}
                      {successMessage && (
                        <p className="mt-2 text-sm text-success-600">{successMessage}</p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <p className="text-gray-500">{t('comingSoon')}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;