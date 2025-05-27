import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Users, Settings as SettingsIcon, Building2, Upload } from 'lucide-react';
import { useTranslation } from '../lib/translations';
import UsersPage from './UsersPage';
import OrganizationPage from './organization/OrganizationPage';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabase';

type SettingsSection = 'users' | 'general' | 'organization';

const SettingsPage: React.FC = () => {
  const t = useTranslation();
  const [activeSection, setActiveSection] = useState<SettingsSection>('users');
  const [isUploading, setIsUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogo();
  }, []);

  const fetchLogo = async () => {
    try {
      const { data, error } = await supabase
        .from('logo_settings')
        .select('logo_url')
        .limit(1)
        .single();

      if (error) throw error;
      setLogoUrl(data?.logo_url);
    } catch (err) {
      console.error('Error fetching logo:', err);
      // Don't show the error to the user as it's not critical
      setLogoUrl(null);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset error state
    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size should be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;

      // Delete old logo if exists
      if (logoUrl) {
        const oldFileName = logoUrl.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('logoUpload')
            .remove([oldFileName]);
        }
      }

      // Upload new logo
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('logoUpload')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('logoUpload')
        .getPublicUrl(fileName);

      // Get logo settings record or create if doesn't exist
      let { data: settingsData, error: settingsError } = await supabase
        .from('logo_settings')
        .select('id')
        .limit(1)
        .single();

      if (settingsError) {
        // If no record exists, create one
        const { data: newSettings, error: createError } = await supabase
          .from('logo_settings')
          .insert([{}])
          .select('id')
          .single();
          
        if (createError) throw createError;
        settingsData = newSettings;
      }

      // Update logo settings
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
      // Reset file input
      event.target.value = '';
    }
  };

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