import React, { useState, useCallback } from 'react';
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
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, or GIF)');
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
      setCurrentLogo(url);
    } catch (err) {
      setError('Failed to upload logo. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const menuItems = [
    {
      id: 'general',
      label: t('general'),
      icon: <SettingsIcon size={20} />,
    },
    {
      id: 'organization',
      label: t('organization'),
      icon: <Building2 size={20} />,
    },
    {
      id: 'users',
      label: t('users'),
      icon: <Users size={20} />,
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
                    <h3 className="text-base font-medium text-gray-900 mb-4">System Logo</h3>
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {currentLogo ? (
                          <img
                            src={currentLogo}
                            alt="Current logo"
                            className="w-24 h-24 object-contain rounded-lg border border-gray-200"
                          />
                        ) : (
                          <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
                            <Upload className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="mt-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id="logo-upload"
                          />
                          <label htmlFor="logo-upload">
                            <Button
                              type="button"
                              variant="outline"
                              className="mr-2"
                              isLoading={isUploading}
                            >
                              {currentLogo ? 'Change Logo' : 'Upload Logo'}
                            </Button>
                          </label>
                          {currentLogo && (
                            <Button
                              type="button"
                              variant="danger"
                              onClick={() => setCurrentLogo(null)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                          Recommended size: 512x512 pixels. Maximum file size: 2MB.
                          Supported formats: JPEG, PNG, GIF
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
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;